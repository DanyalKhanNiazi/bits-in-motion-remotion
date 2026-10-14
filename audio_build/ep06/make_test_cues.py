"""Writes TEMPORARY cue files for testing the Episode 06 build_mix.py (nothing is written into src/; test/ is gitignored).

  python -I make_test_cues.py            -> test/test_cues.json   (whoosh at every paragraph start + one of each other kind at story moments)
                                            test/stress_cues.json (dense clusters, bad entries, out-of-range frames: exercises the rules)
Then:  python -I build_mix.py --cues test/test_cues.json
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REMOTION = os.path.dirname(os.path.dirname(HERE))
TL = json.load(open(os.path.join(REMOTION, "public", "ep06", "timeline.json"), encoding="utf-8"))
PAR = TL["paragraphs"]


def norm(s):
    return re.sub(r"[^a-z0-9']+", " ", s.lower().replace("’", "'")).strip()


def find(pn, phrase, nth=1, end=False):
    """Frame of the first word (or of the last word's end) of the nth occurrence of phrase in paragraph pn (1-based)."""
    want = norm(phrase).split()
    ws = [(norm(w["text"]), w["start_frame"], w["end_frame"]) for w in PAR[pn - 1]["words"] if norm(w["text"])]
    hit = 0
    for i in range(len(ws) - len(want) + 1):
        if all(ws[i + j][0].replace(" ", "") == want[j] for j in range(len(want))):
            hit += 1
            if hit == nth:
                return ws[i + len(want) - 1][2] if end else ws[i][1]
    raise ValueError("phrase %r (occurrence %d) not found in P%02d" % (phrase, nth, pn))      # strict: a typo must not silently become a paragraph-start cue


def main():
    os.makedirs(os.path.join(HERE, "test"), exist_ok=True)
    cues = [{"frame": p["start"], "kind": "whoosh", "strength": 0.6} for p in PAR]
    for w in ["so", "is", "it", "gone"]:                                                             # P02: "So, is it gone?"
        cues.append({"frame": find(2, w), "kind": "tick", "strength": 0.7})
    cues.append({"frame": find(2, "gone", end=True), "kind": "tick", "strength": 0.7})
    cues += [
        {"frame": find(1, "still"), "kind": "riser", "strength": 0.8},
        {"frame": find(1, "bin"), "kind": "crate", "strength": 0.9},
        {"frame": find(1, "gone"), "kind": "impact", "strength": 0.9},
        {"frame": find(2, "certainly"), "kind": "sting", "strength": 0.8},
        {"frame": find(21, "cypher"), "kind": "type", "strength": 0.5},                                  # the SRT spells the spoken "cipher" as "Cypher"
        {"frame": find(6, "master"), "kind": "dial", "strength": 0.8},
        {"frame": find(11, "flash"), "kind": "pop", "strength": 0.6},
        {"frame": find(12, "trim"), "kind": "pop", "strength": 0.6},
        {"frame": PAR[7]["start"] + 12, "kind": "rewind", "strength": 0.7},
        {"frame": find(8, "recovered"), "kind": "rewind", "strength": 0.7},
        {"frame": find(15, "twist"), "kind": "sting", "strength": 0.9},
        {"frame": find(13, "gone", 1), "kind": "swell", "strength": 0.8},
        {"frame": find(13, "nothing"), "kind": "impact", "strength": 0.9},
        {"frame": find(20, "scrambled"), "kind": "glitch", "strength": 0.6},
        {"frame": find(22, "erase", 1), "kind": "sting", "strength": 0.7},
        {"frame": find(22, "boxes", 1), "kind": "crate", "strength": 0.8},
    ]
    cues.sort(key=lambda c: c["frame"])
    json.dump(cues, open(os.path.join(HERE, "test", "test_cues.json"), "w"), indent=0)
    print("test_cues.json:", len(cues), "cues")
    # stress set: clusters (more than 3 within 100 ms), invalid entries, boundary frames
    st = [{"frame": 300, "kind": "tick", "strength": 0.2}, {"frame": 301, "kind": "pop", "strength": 0.9}, {"frame": 302, "kind": "tick", "strength": 0.5},
          {"frame": 303, "kind": "whoosh", "strength": 1.0}, {"frame": 304, "kind": "impact", "strength": 0.3},
          {"frame": 3, "kind": "riser", "strength": 1.0}, {"frame": 0, "kind": "whoosh", "strength": 0.5},
          {"frame": 17022, "kind": "impact", "strength": 1.0}, {"frame": 17023, "kind": "tick", "strength": 1.0},
          {"frame": 500, "kind": "banana", "strength": 1.0}, {"frame": "x", "kind": "tick"}, {"frame": 700, "kind": "tick"},
          {"frame": 1000, "kind": "swell", "strength": 2.0}, {"frame": 1000.5, "kind": "dial", "strength": -1}]
    st += [{"frame": 735, "kind": "impact", "strength": 1.0}, {"frame": 7098, "kind": "crate", "strength": 1.0}, {"frame": 16277, "kind": "sting", "strength": 1.0}]   # inside the film's ~0.5 s paragraph pauses (P01/P02, P10/P11, P21/P22)
    for k in ("whoosh", "tick", "pop", "impact", "riser", "swell", "dial", "crate", "sting", "glitch", "rewind", "type"):
        for j in range(5):
            st.append({"frame": 2000 + 90 * j + (k == "type") * 7 + len(k) * 11, "kind": k, "strength": 0.2 + 0.2 * j})
    json.dump(st, open(os.path.join(HERE, "test", "stress_cues.json"), "w"), indent=0)
    print("stress_cues.json:", len(st), "entries")


if __name__ == "__main__":
    main()
