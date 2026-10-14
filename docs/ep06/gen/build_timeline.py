"""Build public/ep06/timeline.json from the owner's word-level SRT and the spoken script.

    python3 -I docs/ep06/gen/build_timeline.py

Only the single-word cues (one word wrapped in <u>...</u>) are used. Paragraphs come from
inputs/ep06/script_voiceover.txt (blank-line separated) and are matched word by word
(difflib alignment on normalised tokens). frame = round(ms * 30 / 1000).
"""
import difflib, json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FPS = 30
DURATION = 567.432  # seconds, the locked voice file (owner's PC)
TOTAL = math.ceil(DURATION * FPS)  # 17,023
VOICE = "F:/YouTube Channels/Bits in Motion/Videos/06 Why Deleting a File Doesn't Erase It/Voiceover/fullvoiceover.mp3"

def ms(t):
    h, m, rest = t.split(':'); s, milli = rest.split(',')
    return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(milli)

def norm(w):
    return re.sub(r"[^a-z0-9]+", '', w.lower().replace('’', "'"))

srt = (ROOT / 'inputs/ep06/fullvoiceover.srt').read_text(encoding='utf-8-sig')
words = []
for block in re.split(r'\n\s*\n', srt.strip()):
    lines = block.strip().splitlines()
    if len(lines) < 3:
        continue
    m = re.search(r'<u>(.*?)</u>', ' '.join(lines[2:]))
    if not m:
        continue  # cumulative sentence cue
    a, b = [x.strip() for x in lines[1].split('-->')]
    sentence = re.sub(r'</?u>', '', ' '.join(lines[2:]))
    words.append({'cue': lines[0].strip(), 'text': m.group(1).strip(), 'sentence': sentence,
                  'start_ms': ms(a), 'end_ms': ms(b)})

paras = [p.strip() for p in re.split(r'\n\s*\n', (ROOT / 'inputs/ep06/script_voiceover.txt').read_text(encoding='utf-8').strip())]
script_tokens = []  # (para index, normalised token)
for i, p in enumerate(paras):
    for t in p.split():
        if norm(t):
            script_tokens.append((i, norm(t)))

srt_norm = [norm(w['text']) for w in words]
sm = difflib.SequenceMatcher(a=[t for _, t in script_tokens], b=srt_norm, autojunk=False)
a2b = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        a2b[blk.a + k] = blk.b + k
matched = len(a2b)
# a paragraph starts at the SRT word aligned to its first matched script word, stepped back over unmatched leading words
starts = []
for pi in range(len(paras)):
    idx = [k for k, (q, _) in enumerate(script_tokens) if q == pi]
    hit = next((k for k in idx if k in a2b), None)
    if hit is None:
        sys.exit(f'paragraph P{pi + 1:02d} has no aligned word')
    starts.append(0 if pi == 0 else max(a2b[hit] - (hit - idx[0]), starts[-1] + 1))

out_paras = []
for pi, p in enumerate(paras):
    a, b = starts[pi], (starts[pi + 1] if pi + 1 < len(paras) else len(words))
    ws = []
    for k in range(a, b):
        w = words[k]
        ws.append({'id': f'SRT{w["cue"]}', 'source_cue_id': w['cue'], 'text': w['text'], 'sentence': w['sentence'],
                   'start_ms': w['start_ms'], 'end_ms': w['end_ms'],
                   'start_frame': round(w['start_ms'] * FPS / 1000), 'end_frame': round(w['end_ms'] * FPS / 1000)})
    out_paras.append({'id': f'P{pi + 1:02d}', 'text': p, 'start': ws[0]['start_frame'] if pi else 0,
                      'lastWordEnd': ws[-1]['end_frame'], 'first_word_id': ws[0]['id'], 'last_word_id': ws[-1]['id'], 'words': ws})
for pi, p in enumerate(out_paras):
    p['end'] = out_paras[pi + 1]['start'] if pi + 1 < len(out_paras) else TOTAL

tl = {'fps': FPS, 'duration': DURATION, 'durationInFrames': TOTAL, 'audio': VOICE, 'paragraphs': out_paras}
(ROOT / 'public/ep06').mkdir(parents=True, exist_ok=True)
(ROOT / 'public/ep06/timeline.json').write_text(json.dumps(tl, indent=1, ensure_ascii=False), encoding='utf-8')
print(f'{len(words)} word cues, {len(script_tokens)} script tokens, {matched} aligned ({matched / len(script_tokens):.1%}); '
      f'{len(paras)} paragraphs; last word ends f{out_paras[-1]["lastWordEnd"]}; TOTAL {TOTAL}')
for p in out_paras:
    print(p['id'], p['start'], p['lastWordEnd'], p['end'], len(p['words']), '|', ' '.join(w['text'] for w in p['words'][:5]), '…', ' '.join(w['text'] for w in p['words'][-3:]))
