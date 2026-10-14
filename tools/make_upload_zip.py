"""Build one zip to upload to a Console Managed Agent (or any sandbox) for producing an episode.

usage: python -I tools/make_upload_zip.py <NN> [out.zip]
  NN   episode number, e.g. 05. Reads Videos/<NN *>/ and remotion/public/ep<NN>/assets/.

The zip mirrors the channel folder ("Bits in Motion/...") so every relative path in the project still works:
  remotion/         code, docs (playbook, Ep03 reference), tools, public (hero renders; no audio), audio_build (scripts, sfx kit, Ep03 mixer)
  remotion/inputs/epNN/  Codex's timeline (cross-check) and the asset prompt list, when present
  Videos/<NN …>/    script_voiceover.txt, script_editorial.md, Transcription/fullvoiceover.srt, Voiceover/fullvoiceover.mp3
  Motion Brand/stage_a_files/sound/music_candidates/  only the licensed music files the Ep03 mixer uses
Excluded: node_modules, out, renders, mixes, the intro voice, other episodes' audio.
"""
import glob
import json
import os
import sys
import zipfile

REMOTION = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHANNEL = os.path.dirname(REMOTION)
SKIP_DIRS = {'node_modules', 'out', '__pycache__', '.git', 'mix', 'mixes', 'work', 'test', '.remotion'}
SKIP_EXT = {'.mp4', '.mov', '.webm', '.pyc'}


def add_tree(z, src, arc, allow_audio=False, only_audio=False):
    n = 0
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        rel_root = os.path.relpath(root, src)
        if rel_root.replace('\\', '/').startswith('public/audio'):
            continue
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SKIP_EXT:
                continue
            if ext in ('.wav', '.mp3') and not allow_audio:
                continue
            if only_audio and ext not in ('.wav', '.mp3'):
                continue
            p = os.path.join(root, f)
            z.write(p, os.path.join(arc, os.path.relpath(p, src)).replace('\\', '/'))
            n += 1
    return n


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    nn = sys.argv[1].zfill(2)
    vids = glob.glob(os.path.join(CHANNEL, 'Videos', nn + ' *'))
    if not vids:
        sys.exit(f'no Videos/{nn} * folder')
    vid = vids[0]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(CHANNEL, 'Claude Work', f'Episode {nn} upload', f'BitsInMotion_ep{nn}_upload.zip')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    root = 'Bits in Motion'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        count = 0
        for f in ['package.json', 'package-lock.json', 'remotion.config.ts', '.gitignore'] + [os.path.basename(p) for p in glob.glob(os.path.join(REMOTION, 'tsconfig*.json'))]:
            p = os.path.join(REMOTION, f)
            if os.path.exists(p):
                z.write(p, f'{root}/remotion/{f}')
                count += 1
        for d in ['src', 'tools', 'docs', 'public', 'inputs']:
            if os.path.isdir(os.path.join(REMOTION, d)):
                count += add_tree(z, os.path.join(REMOTION, d), f'{root}/remotion/{d}')
        # audio_build: scripts and docs everywhere, plus the licence-checked style6 kit and the Ep03 palette (sound sources the mixer reuses)
        ab = os.path.join(REMOTION, 'audio_build')
        count += add_tree(z, ab, f'{root}/remotion/audio_build')
        for kit in ['sfx/style6', 'ep03/palette']:
            if os.path.isdir(os.path.join(ab, kit)):
                count += add_tree(z, os.path.join(ab, kit), f'{root}/remotion/audio_build/{kit}', allow_audio=True, only_audio=True)
        # Codex's timeline and the asset prompt list for this episode (read-only references)
        codex_tl = os.path.join(CHANNEL, 'Codex Work', 'remotion', 'public', 'episodes', nn, 'timeline.json')
        if os.path.exists(codex_tl):
            z.write(codex_tl, f'{root}/remotion/inputs/ep{nn}/codex_timeline.json')
        prompts = glob.glob(os.path.join(CHANNEL, 'Codex Work', 'Asset Prompt Library - 8 Topics - Final', nn + ' *', 'PROMPTS.md'))
        if prompts:
            z.write(prompts[0], f'{root}/remotion/inputs/ep{nn}/ASSET_PROMPTS.md')
        # episode inputs, including the locked voice
        vname = os.path.basename(vid)
        for rel in ['script_voiceover.txt', 'script_editorial.md', 'Transcription/fullvoiceover.srt', 'Voiceover/fullvoiceover.mp3']:
            p = os.path.join(vid, rel)
            if not os.path.exists(p):
                sys.exit(f'missing {p}')
            z.write(p, f'{root}/Videos/{vname}/{rel}')
            count += 1
        # the licensed music the mixer uses
        plan = json.load(open(os.path.join(ab, 'ep03', 'music_plan.json'), encoding='utf-8'))
        music = sorted(set(m for m in json.dumps(plan).replace('\\\\', '/').split('"') if m.lower().endswith('.mp3')))
        for m in music:
            p = m.replace('F:/YouTube Channels/Bits in Motion', CHANNEL)
            if os.path.exists(p):
                z.write(p, f'{root}/' + os.path.relpath(p, CHANNEL).replace('\\', '/'))
                count += 1
    assets = glob.glob(os.path.join(REMOTION, 'public', f'ep{nn}', 'assets', '*.png'))
    print(f'{out}\n{count} files, {os.path.getsize(out) / 1e6:.0f} MB; ep{nn} hero renders included: {len(assets)}')


if __name__ == '__main__':
    main()
