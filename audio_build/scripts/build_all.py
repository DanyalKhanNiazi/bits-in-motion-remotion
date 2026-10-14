"""Rebuild everything in order: voice stem, music beds, SFX kits, then the six provisional mixes.
Usage: python -I build_all.py   (run from audio_build/scripts). Exit 1 if any provisional mix is out of spec."""
import os, subprocess, sys

H = os.path.dirname(os.path.abspath(__file__))
B = os.path.dirname(H)
py = [sys.executable, "-I"]
for s in ("build_voice.py", "build_music.py", "build_sfx.py"):
    subprocess.run(py + [os.path.join(H, s)], check=True, cwd=H, stdout=subprocess.DEVNULL)
    print(s, "done")
bad = False
for n in range(1, 7):
    r = subprocess.run(py + [os.path.join(H, "mix.py"), "--style", str(n),
                             "--cues", os.path.join(B, "cues_provisional", "style%d.json" % n),
                             "--out", os.path.join(B, "mixes", "style%d_provisional_mix.wav" % n),
                             "--report", os.path.join(B, "mixes", "style%d_provisional_report.json" % n)], cwd=H)
    bad = bad or r.returncode != 0
sys.exit(1 if bad else 0)
