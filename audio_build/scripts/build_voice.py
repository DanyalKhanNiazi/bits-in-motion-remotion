"""Build the locked narration stem used by all five intro tests.
Source: Videos/01 .../Voiceover/Full Voiceover.mp3 (copied to audio_build/src/voice/).
Processing (identical for all five styles): 0-62.000 s, 48 kHz stereo, 20 ms fade-out ending at 62.000 s,
ONE fixed gain, then a 4x-oversampled look-ahead true-peak limiter at -1.5 dBTP, padded with digital
silence to exactly 63.000 s. No EQ, no compression. Output: remotion/public/audio/voice_intro.wav (24-bit)."""
import os, sys, json, shutil, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

SRC = "F:/YouTube Channels/Bits in Motion/Videos/01 What Happens When You Press Power/Voiceover/Full Voiceover.mp3"
COPY = os.path.join(BUILD, "src", "voice", "Full Voiceover.mp3")
OUT = os.path.join(REMOTION, "public", "audio", "voice_intro.wav")
TARGET_LUFS = -14.3
TP_CEIL = -1.5
LIM_INTERNAL = -1.65   # limiter threshold on the 4x peak; small margin so the measured dBTP stays <= -1.5

os.makedirs(os.path.dirname(COPY), exist_ok=True)
if not os.path.exists(COPY):
    shutil.copy2(SRC, COPY)
x = load(COPY, start=None, dur=62.0)
n62 = int(62.0 * SR)
x = x[:, :n62]
assert x.shape[1] == n62, x.shape
x = fade(x, fout=0.020)            # 20 ms half-cosine fade ending at 62.000 s
raw_I = integrated_lufs(x)
raw_tp = true_peak_db(x)

def render(gain_db):
    y, g = tp_limit(x * undb(gain_db), LIM_INTERNAL, release_ms=80.0)
    out = np.zeros((2, 63 * SR))
    out[:, :n62] = y
    return out, g

gain = TARGET_LUFS - raw_I
for it in range(6):
    out, g = render(gain)
    I = integrated_lufs(out)
    if abs(I - TARGET_LUFS) < 0.02:
        break
    gain += TARGET_LUFS - I
out[:, n62:] = 0.0
write_wav(OUT, out, bits=24)
r = ffmpeg_r128(OUT)
gr = db(g.min())
active = np.mean(g < 0.999) * 100
rep = {"source": SRC, "copy": COPY, "sha256_source": hashlib.sha256(open(COPY, "rb").read()).hexdigest(),
       "excerpt_s": [0.0, 62.0], "fade_out_ms": 20, "length_samples": out.shape[1], "sr": SR,
       "raw_excerpt": {"I_LUFS_numpy": round(raw_I, 2), "TP_dBTP_numpy": round(raw_tp, 2)},
       "fixed_gain_dB": round(gain, 3), "limiter": {"type": "look-ahead true-peak, 4x oversampled detection", "threshold_dBTP": LIM_INTERNAL,
       "attack_ms": 1.5, "release_ms": 80.0, "max_gain_reduction_dB": round(gr, 2), "pct_samples_reduced": round(active, 2)},
       "result_ffmpeg_ebur128": r, "result_numpy_I": round(integrated_lufs(out), 2)}
json.dump(rep, open(os.path.join(BUILD, "work", "voice_report.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))
assert r["TP"] <= TP_CEIL, "voice true peak above ceiling"
