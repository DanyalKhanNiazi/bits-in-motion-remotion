"""Write docs/ep06/TRANSCRIPT.md (word@absoluteFrame, grouped by section and paragraph) from public/ep06/timeline.json.

    python3 -I docs/ep06/gen/build_transcript.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SECTIONS = [('S1', [1, 2]), ('S2', [3, 4, 5]), ('S3', [6, 7]), ('S4', [8, 9]), ('S5', [10, 11, 12]),
            ('S6', [13, 14]), ('S7', [15, 16, 17]), ('S8', [18, 19, 20]), ('S9', [21, 22])]  # = src/ep06/sections.ts
FIX = {'cypher': 'cipher'}  # SRT homophones: write the intended word on screen
tl = json.loads((ROOT / 'public/ep06/timeline.json').read_text(encoding='utf-8'))
P = tl['paragraphs']
out = ['# Episode 06 spoken transcript with ABSOLUTE frames (30 fps)', '',
       'Each word is `word@startFrame`. This is what the recording actually says; it is the truth for on-screen text and sync.',
       f'Total: {tl["durationInFrames"]} frames ({tl["duration"]} s). SRT homophone fixed here: "cypher" → **cipher** (P21). '
       'The SRT writes "2011" and "16" as digits; the voice says "two thousand eleven" and "sixteen".', '']
for sid, ps in SECTIONS:
    a = P[ps[0] - 1]['start']; b = P[ps[-1] - 1]['end']
    out += [f'## Section {sid}  frames {a}-{b - 1}  ({a / 30:.1f}-{b / 30:.1f} s)']
    for n in ps:
        p = P[n - 1]
        out.append(f'### {p["id"]}  frames {p["start"]}-{p["end"]}  ({p["start"] / 30:.1f}-{p["end"] / 30:.1f} s)')
        out.append(' '.join(f'{FIX.get(w["text"].lower().strip(".,"), w["text"])}@{w["start_frame"]}' for w in p['words']))
        out.append('')
(ROOT / 'docs/ep06/TRANSCRIPT.md').write_text('\n'.join(out), encoding='utf-8')
print('wrote docs/ep06/TRANSCRIPT.md', sum(len(p['words']) for p in P), 'words')
