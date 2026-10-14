"""Writes TEMPORARY cue files for testing build_mix.py (nothing is written into src/).

  python -I make_test_cues.py            -> test/test_cues.json   (whoosh at every paragraph start + one of each other kind at story moments)
                                            test/stress_cues.json (dense clusters, bad entries, out-of-range frames: exercises the rules)
Then:  python -I build_mix.py --cues test/test_cues.json
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REMOTION = os.path.dirname(os.path.dirname(HERE))
TL = json.load(open(os.path.join(REMOTION, "public", "ep03", "timeline.json"), encoding="utf-8"))
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
    return PAR[pn - 1]["start"]


def main():
    os.makedirs(os.path.join(HERE, "test"), exist_ok=True)
    cues = [{"frame": p["start"], "kind": "whoosh", "strength": 0.6} for p in PAR]
    q = ["why", "do", "ai", "answers", "arrive", "one", "piece", "at", "a", "time"]
    for w in q:
        cues.append({"frame": find(2, w), "kind": "tick", "strength": 0.7})
    cues.append({"frame": find(2, "time", end=True), "kind": "tick", "strength": 0.7})            # the "?" tile
    cues += [
        {"frame": find(1, "almost", 1), "kind": "riser", "strength": 0.8},
        {"frame": find(1, "gigabytes", 1), "kind": "crate", "strength": 0.9},
        {"frame": find(1, "gigabytes", 2), "kind": "impact", "strength": 0.9},
        {"frame": find(1, "piece", 3), "kind": "impact", "strength": 1.0},
        {"frame": find(1, "typing"), "kind": "type", "strength": 0.5},
        {"frame": find(2, "half"), "kind": "dial", "strength": 0.8},
        {"frame": find(2, "question", 1), "kind": "sting", "strength": 0.8},
        {"frame": find(4, "photos"), "kind": "pop", "strength": 0.6},
        {"frame": find(4, "synthesis"), "kind": "pop", "strength": 0.6},
        {"frame": PAR[7]["start"] + 12, "kind": "rewind", "strength": 0.7},
        {"frame": find(9, "slow"), "kind": "sting", "strength": 0.9},
        {"frame": find(11, "picture"), "kind": "swell", "strength": 0.8},
        {"frame": find(20, "bends"), "kind": "glitch", "strength": 0.6},
        {"frame": find(22, "question", 1), "kind": "sting", "strength": 0.7},
        {"frame": find(22, "bridge"), "kind": "crate", "strength": 0.8},
    ]
    cues.sort(key=lambda c: c["frame"])
    json.dump(cues, open(os.path.join(HERE, "test", "test_cues.json"), "w"), indent=0)
    print("test_cues.json:", len(cues), "cues")
    # stress set: clusters (more than 3 within 100 ms), invalid entries, boundary frames
    st = [{"frame": 300, "kind": "tick", "strength": 0.2}, {"frame": 301, "kind": "pop", "strength": 0.9}, {"frame": 302, "kind": "tick", "strength": 0.5},
          {"frame": 303, "kind": "whoosh", "strength": 1.0}, {"frame": 304, "kind": "impact", "strength": 0.3},
          {"frame": 3, "kind": "riser", "strength": 1.0}, {"frame": 0, "kind": "whoosh", "strength": 0.5},
          {"frame": 18366, "kind": "impact", "strength": 1.0}, {"frame": 18367, "kind": "tick", "strength": 1.0},
          {"frame": 500, "kind": "banana", "strength": 1.0}, {"frame": "x", "kind": "tick"}, {"frame": 700, "kind": "tick"},
          {"frame": 1000, "kind": "swell", "strength": 2.0}, {"frame": 1000.5, "kind": "dial", "strength": -1}]
    st += [{"frame": 10785, "kind": "impact", "strength": 1.0}, {"frame": 11225, "kind": "crate", "strength": 1.0}, {"frame": 13870, "kind": "sting", "strength": 1.0}]   # inside the film's 0.5 s pauses
    for k in ("whoosh", "tick", "pop", "impact", "riser", "swell", "dial", "crate", "sting", "glitch", "rewind", "type"):
        for j in range(5):
            st.append({"frame": 2000 + 90 * j + (k == "type") * 7 + len(k) * 11, "kind": k, "strength": 0.2 + 0.2 * j})
    json.dump(st, open(os.path.join(HERE, "test", "stress_cues.json"), "w"), indent=0)
    print("stress_cues.json:", len(st), "entries")


if __name__ == "__main__":
    main()
