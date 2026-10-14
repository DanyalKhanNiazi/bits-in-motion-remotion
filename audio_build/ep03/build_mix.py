"""Episode 03 mixer: narration + music bed + cue-driven SFX -> ep03_mix.wav (48 kHz stereo 24-bit, 612.2 s).

Run (from anywhere):
    python -I build_mix.py                                  # reads src/ep03/sections/S*.cues.json (missing files are fine)
    python -I build_mix.py --cues my_cues.json [more.json]  # explicit cue file(s) instead (nothing is written into src/)
Options: --out PATH  --plan PATH (use this music_plan.json as is)  --target-lufs -14.1  --no-sfx  --no-music
Exit code 0 = every check passed, 1 = a check failed (files are still written), 2 = bad input.

Cue files: JSON array of {"frame": <absolute 30 fps frame>, "kind": whoosh|tick|pop|impact|riser|swell|dial|crate|sting|
glitch|rewind|type, "strength": 0..1}. Each palette sound has an ANCHOR (palette/SOURCES.md): the moment that lands on the
cue frame (riser/swell/crate = their arrival, peak or thump; whoosh = its peak; the rest = their start/onset).
Variants rotate by the n-th cue of that kind in time order. At most 3 sounds may start within 100 ms (weakest dropped).

Narration: Videos/03 .../Voiceover/Fullvoiceover.mp3, starting at t = 0, never edited, trimmed, reordered or stretched.
It receives ONE fixed gain and a look-ahead true-peak limiter, nothing else (decoding to 48 kHz is the only conversion).
Music: Musinova "Minimal Idm Ambient Works - Loop" (the channel bed) plus Bearstockmusic "Engineering Graphics" (varispeed
-2 semitones, D -> C, 110 -> 98 BPM) for the hook and hero moments; both Pixabay licence, documented in audio_build/CREDITS.md.
The music is sidechain-ducked to the voice: while the voice speaks it follows the voice's own 300 ms loudness (a constant gap under
it), in pauses it breathes up 4 dB, and a closed loop trims it wherever a speech phrase, or a 3 s / 1 s / 0.4 s window that is
mostly speech, would be closer to the voice than its floor (18.8-19.5 LU; the spec is >= 18 LU). Final mix: -14.1 LUFS, true peak
<= -1.3 dBTP. Outputs next to --out: measure.json, CREDITS.md and a copy of music_plan.json; the plan itself is also kept in
audio_build/ep03/music_plan.json. Run time is a few minutes (more when the machine is busy); peak memory is about 3-4 GB.
"""
import argparse
import glob
import json
import os
import re
import sys
import time

import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audiolib import (FPS, SR, KMeter, db, ff_filter, ffmpeg_r128, ffprobe_stream, integrated_from_cs, integrated_lufs, kpower_cs,  # noqa: E402
                      kweight, load, lufs_from_power, sha256, smoothstep, svf, tp_limiter, true_peak_db, undb, write_wav)

REMOTION = os.path.dirname(os.path.dirname(HERE))
ROOT = os.path.dirname(REMOTION)
VOICE = os.path.join(ROOT, "Videos", "03 Why AI Answers Arrive One Piece at a Time", "Voiceover", "Fullvoiceover.mp3")
TIMELINE = os.path.join(REMOTION, "public", "ep03", "timeline.json")
SECTIONS_DIR = os.path.join(REMOTION, "src", "ep03", "sections")
OUT_DIR = os.path.join(ROOT, "Claude Work", "Episode 03 - AI Answers", "audio")
MUSIC_DIR = os.path.join(ROOT, "Motion Brand", "stage_a_files", "sound", "music_candidates")
MAIN_MP3 = os.path.join(MUSIC_DIR, "Style 3 - primary - Minimal Idm Ambient Works - Loop.mp3")
LIFT_MP3 = os.path.join(MUSIC_DIR, "Style 1 - primary - Engineering Graphics.mp3")
PAL = os.path.join(HERE, "palette")
WORK = os.path.join(HERE, "work")

KINDS = ["whoosh", "tick", "pop", "impact", "riser", "swell", "dial", "crate", "sting", "glitch", "rewind", "type"]
# drop order when more than 3 sounds start within 100 ms: lowest strength first, then least important kind
PRIORITY = {k: i for i, k in enumerate(["type", "tick", "pop", "glitch", "dial", "rewind", "whoosh", "swell", "riser", "sting", "crate", "impact"])}
SECTION_PARAS = {"S1": (1, 2), "S2": (3, 4), "S3": (5, 7), "S4": (8, 9), "S5": (10, 12), "S6": (13, 15), "S7": (16, 18), "S8": (19, 20), "S9": (21, 22)}

# --- SFX level model. mode 'peak': sound peak = local voice peak + base (strength 1) - (1-strength)*rng.
# --- mode 'loud': the sound's 100 ms K-weighted loudness = local voice loudness + base - (1-strength)*rng.
# --- pause: extra dB when no speech is within [t-0.25, t+0.35]; cap: the sound's peak never exceeds this (dBFS);
# --- lcap: its 100 ms loudness never exceeds (local voice loudness + lcap) LU (+pause boost when the voice is silent).
KIND = {
    "tick": dict(mode="peak", base=-13.0, rng=9.0, pause=3.0, cap=-14.0, lcap=-12.0),
    "pop": dict(mode="peak", base=-12.0, rng=9.0, pause=3.0, cap=-13.0, lcap=-12.0),
    "type": dict(mode="peak", base=-17.0, rng=8.0, pause=3.0, cap=-18.0, lcap=-14.0),
    "glitch": dict(mode="peak", base=-12.0, rng=9.0, pause=3.0, cap=-13.0, lcap=-10.0),
    "dial": dict(mode="peak", base=-13.0, rng=9.0, pause=3.0, cap=-14.0, lcap=-10.0),
    "sting": dict(mode="peak", base=-9.0, rng=10.0, pause=4.0, cap=-8.0, lcap=-6.0),
    "impact": dict(mode="peak", base=-5.0, rng=12.0, pause=5.0, cap=-3.5, lcap=-4.0),
    "crate": dict(mode="peak", base=-8.0, rng=11.0, pause=5.0, cap=-5.0, lcap=-5.0),
    "whoosh": dict(mode="loud", base=-8.0, rng=8.0, pause=4.0, cap=-8.0, lcap=-8.0),
    "riser": dict(mode="loud", base=-9.0, rng=8.0, pause=4.0, cap=-10.0, lcap=-9.0),
    "swell": dict(mode="loud", base=-10.0, rng=8.0, pause=4.0, cap=-11.0, lcap=-10.0),
    "rewind": dict(mode="loud", base=-9.0, rng=8.0, pause=4.0, cap=-9.0, lcap=-8.0),
}
HERO_KINDS = ("impact", "sting", "swell", "riser", "crate")

# --- music / ducking / spec
GAP_NOMINAL_LU = 22.0      # integrated voice-minus-music gap over the speech frames that the follower is calibrated to
MUSIC_FLOOR_LU = 19.5      # closed loop trims anything closer than this per phrase / per 3 s (spec: >= 18 LU)
CLASSES = ["phrase", "3s", "1s", "400ms"]
FLOORS = {"phrase": 19.5, "3s": 19.5, "1s": 19.0, "400ms": 18.8}   # per window class; finer windows get a smaller margin
SPEECH_FRAC_ENFORCE = {"3s": 0.5, "1s": 0.7, "400ms": 0.8}     # ENFORCED by the closed loop: sliding windows at least this much speech
SPEECH_FRAC_REPORT = {"3s": 0.5, "1s": 0.9, "400ms": 0.95}      # REPORTED: windows that are (almost) entirely speech, i.e. clearly "the voice speaks"
PAUSE_RISE_DB = 4.0
DUCK = dict(thr_dbfs_raw=-52.0, bridge_ms=150, lookahead_ms=60, attack_ms=25, release_ms=450, follow_ms=300, follow_range_dB=(-10.0, 4.0))
VOICE_CEIL_DB = -1.5       # voice-only true-peak limiter ceiling
FINAL_CEIL_DB = -1.3       # final safety limiter (4x-oversampled detection); the measured result must be <= -1.0 dBTP
SPEC = dict(I_target=-14.0, I_tol=0.5, TP_max=-1.0, gap_min=18.0)

CACHE_VER = "v7"           # bump when a bed's processing chain changes
EG_RATIO = 49.0 / 55.0     # varispeed: -2.0 semitones (0.8909), D -> C major, 110 -> 98 BPM
EG_DROP_ORIG_S = 35.04     # bar 17 (the drop) in the original track; bar = 2.1818 s at 110 BPM
EG_BAR_S = (4 * 60.0 / 110.0) / EG_RATIO
MAIN_LOOP_START_S, MAIN_LOOP_LEN_S = 0.0224, 576 * 0.25 * 60.0 / 93.0    # 36 bars of 4/4 at 93 BPM = 92.903 s


def _jsonable(o):
    if isinstance(o, np.generic):
        return o.item()
    if isinstance(o, np.ndarray):
        return o.tolist()
    raise TypeError("not JSON serializable: %r" % type(o))


# Measured on all ten Stage A candidates (librosa: tempo by onset autocorrelation, onset strength, spectral centroid, RMS, chroma key) before choosing.
MUSIC_SELECTION = [
    dict(track="Style 3 primary: Minimal Idm Ambient Works - Loop", artist="Musinova", tempo_bpm=93.0, key="A minor", onset_strength_mean=1.725, centroid_hz=1288, rms_dB=-9.7, rms_std_dB=1.8, licence_in_CREDITS_md=True, role="channel bed"),
    dict(track="Style 1 primary: Engineering Graphics", artist="bearstockmusic", tempo_bpm=110.0, key="D major / B minor", onset_strength_mean=1.999, centroid_hz=1261, rms_dB=-11.0, rms_std_dB=8.8, licence_in_CREDITS_md=True, role="hook and hero moments (most energetic documented track)"),
    dict(track="Style 3 backup: Explorations - Loopable Edit", artist="Musinova", tempo_bpm=92.3, key="C major", onset_strength_mean=1.758, centroid_hz=1358, rms_dB=-10.4, rms_std_dB=2.8, licence_in_CREDITS_md=False, role="not used (licence only in the Stage A notes, not in CREDITS.md)"),
    dict(track="Style 1 backup: Contact needle tempo 88", artist="?", tempo_bpm=89.1, key="G major", onset_strength_mean=1.419, centroid_hz=3110, rms_dB=-23.8, rms_std_dB=5.0, licence_in_CREDITS_md=False, role="not used (quiet, licence not in CREDITS.md)"),
    dict(track="Style 2 primary: Enter the realm - no Piano", artist="SamuelFJohanns", tempo_bpm=None, key="E minor", onset_strength_mean=0.687, centroid_hz=546, rms_dB=-21.0, rms_std_dB=9.7, licence_in_CREDITS_md=True, role="not used (slow, sparse: not energetic)"),
    dict(track="Style 2 backup: Rite Ambient - no Piano", artist="?", tempo_bpm=None, key="E minor", onset_strength_mean=0.68, centroid_hz=522, rms_dB=-22.8, rms_std_dB=11.4, licence_in_CREDITS_md=False, role="not used"),
    dict(track="Style 4 primary: Stay the Course", artist="Kevin MacLeod", tempo_bpm=60.1, key="C major", onset_strength_mean=0.889, centroid_hz=455, rms_dB=-21.0, rms_std_dB=8.9, licence_in_CREDITS_md=True, role="not used (60 BPM, CC BY needs a credit line)"),
    dict(track="Style 4 backup: Deep Cosmic Resonance (Purified)", artist="?", tempo_bpm=80.7, key="G major", onset_strength_mean=0.599, centroid_hz=330, rms_dB=-14.0, rms_std_dB=6.6, licence_in_CREDITS_md=False, role="not used"),
    dict(track="Style 5 primary: Soft Vibraphone Ambient Loop_012", artist="VelvetKeys", tempo_bpm=117.5, key="C major", onset_strength_mean=0.838, centroid_hz=478, rms_dB=-12.9, rms_std_dB=4.9, licence_in_CREDITS_md=True, role="not used (sparse, AI-labelled)"),
    dict(track="Style 5 backup: In Memoriam", artist="?", tempo_bpm=69.8, key="E minor", onset_strength_mean=0.78, centroid_hz=748, rms_dB=-14.1, rms_std_dB=14.3, licence_in_CREDITS_md=False, role="not used"),
]
MUSIC_CHOICE = ("Engineering Graphics is the most energetic track whose licence is documented in audio_build/CREDITS.md (onset strength 2.0 against 1.7 for the bed, "
                "110 BPM, bright marimba and bass, strong 16-bar structure: 8 bars intro, 8 bars build, drop at bar 17). Resampled -2 semitones (D -> C major, B minor -> A minor) it "
                "shares the bed's key and its tempo drops to 98 BPM, close to the bed's 93 BPM. It is never layered with the bed, only cross-faded at paragraph starts.")


def log(*a):
    print("[%6.1fs]" % (time.time() - T0), *a, flush=True)


T0 = time.time()


def die(msg):
    print("INPUT ERROR:", msg, file=sys.stderr)
    sys.exit(2)


# =========================================================================== timeline, cues
def load_timeline():
    tl = json.load(open(TIMELINE, encoding="utf-8"))
    paras = [(int(p["start"]), int(p["end"])) for p in tl["paragraphs"]]
    return paras, int(tl["durationInFrames"]), tl


def section_of(frame, paras):
    for sid, (a, b) in SECTION_PARAS.items():
        lo = paras[a - 1][0]
        hi = paras[b - 1][1] if b == 22 else paras[b][0]
        if lo <= frame < hi:
            return sid
    return "S9"


def read_cues(files, total_frames, paras):
    cues, warns = [], []
    for f in files:
        try:
            data = json.load(open(f, encoding="utf-8"))
        except Exception as e:
            warns.append("%s: not valid JSON (%s); skipped" % (os.path.basename(f), e))
            continue
        if isinstance(data, dict) and isinstance(data.get("cues"), list):
            data = data["cues"]
        if not isinstance(data, list):
            warns.append("%s: expected a JSON array; skipped" % os.path.basename(f))
            continue
        for i, c in enumerate(data):
            try:
                frame = float(c["frame"])
                kind = str(c["kind"]).strip().lower()
                s = c.get("strength", 0.6)
                s = 0.6 if s is None else float(s)
            except Exception:
                warns.append("%s[%d]: needs frame, kind, strength; skipped" % (os.path.basename(f), i))
                continue
            if kind not in KINDS:
                warns.append("%s[%d]: unknown kind %r; skipped" % (os.path.basename(f), i, kind))
                continue
            if not (0 <= frame < total_frames):
                warns.append("%s[%d]: frame %s outside 0..%d; skipped" % (os.path.basename(f), i, frame, total_frames - 1))
                continue
            cues.append(dict(frame=frame, kind=kind, strength=float(min(1.0, max(0.0, s))), src=os.path.basename(f), idx=i,
                             section=section_of(frame, paras)))
    cues.sort(key=lambda c: (c["frame"], KINDS.index(c["kind"]), c["src"], c["idx"]))
    return cues, warns


def dedupe(cues):
    """Same kind within 1 frame is a duplicate: keep the stronger cue."""
    out, dropped = [], []
    for c in cues:
        twin = next((o for o in reversed(out) if o["kind"] == c["kind"] and abs(o["frame"] - c["frame"]) <= 1.0), None)
        if twin is None:
            out.append(c)
        elif c["strength"] > twin["strength"]:
            out[out.index(twin)] = c
            dropped.append(dict(frame=twin["frame"], kind=twin["kind"], strength=twin["strength"], src=twin["src"]))
        else:
            dropped.append(dict(frame=c["frame"], kind=c["kind"], strength=c["strength"], src=c["src"]))
    return out, dropped


def enforce_stack(cues, max_n=3, window_s=0.1):
    """Drop the weakest cues until no 4 cues fall inside any 100 ms span (inclusive)."""
    kept = list(cues)
    dropped = []
    while True:
        bad = None
        for i in range(len(kept) - max_n):
            if (kept[i + max_n]["frame"] - kept[i]["frame"]) / FPS <= window_s + 1e-9:
                bad = i
                break
        if bad is None:
            return kept, dropped
        grp = kept[bad:bad + max_n + 1]
        victim = min(grp, key=lambda c: (c["strength"], PRIORITY[c["kind"]], -c["frame"]))
        kept.remove(victim)
        dropped.append(dict(frame=victim["frame"], kind=victim["kind"], strength=victim["strength"], src=victim["src"]))


# =========================================================================== voice analysis
def mask_mean_power(cs, mask, chunk=1 << 22):
    """Mean of the per-sample power (diff of the cumulative sum cs) over the samples where mask is true, without a full-size temporary."""
    tot, cnt = 0.0, 0
    for a in range(0, len(mask), chunk):
        p = np.diff(cs[a:a + chunk + 1])
        mk = mask[a:a + len(p)]
        tot += float(p[mk].sum())
        cnt += int(mk.sum())
    return tot / max(cnt, 1)


class Voice:
    def __init__(self, path):
        self.raw = load(path)
        self.n = self.raw.shape[1]
        self.dur = self.n / SR
        log("voice decoded", self.raw.shape, "%.4f s" % self.dur)
        self.km = KMeter(self.raw)
        h = int(0.005 * SR)
        nf = self.n // h
        rms = np.empty(nf)
        self.pk5 = np.empty(nf)
        step = 1 << 14                                                 # frames per block
        for f0 in range(0, nf, step):
            f1 = min(nf, f0 + step)
            blk = self.raw[:, f0 * h:f1 * h]
            rms[f0:f1] = np.sqrt(((blk.mean(axis=0)) ** 2).reshape(f1 - f0, h).mean(axis=1))
            self.pk5[f0:f1] = np.abs(blk).max(axis=0).reshape(f1 - f0, h).max(axis=1)
        self.env_db = 20 * np.log10(rms + 1e-9)
        act = self.env_db > DUCK["thr_dbfs_raw"]
        from scipy.ndimage import binary_closing
        bridge = int(DUCK["bridge_ms"] / 5)
        act = binary_closing(np.pad(act, bridge), structure=np.ones(bridge))[bridge:-bridge]
        self.act = act
        self.nf = nf
        d = np.diff(np.concatenate([[0], act.astype(int), [0]]))
        s, e = np.where(d == 1)[0], np.where(d == -1)[0]
        self.runs = [(a * 0.005, b * 0.005) for a, b in zip(s, e) if (b - a) >= 8]   # >= 40 ms
        mask = np.repeat(act, h)
        mask = np.concatenate([mask, np.zeros(self.n - len(mask), bool)])
        self.L_ref_raw = float(lufs_from_power(mask_mean_power(self.km.cs, mask)))          # speech loudness reference (ungated, speech frames only)
        self.mask = mask
        self.km_lim = None
        log("speech runs", len(self.runs), "speech %.1f s of %.1f s" % (act.sum() * 0.005, self.dur), "ref loudness %.2f LUFS (raw)" % self.L_ref_raw)

    def duck_curve(self):
        """Ducking state d in [0,1] at 5 ms resolution (1 = the voice is speaking): look-ahead, fast attack, slow release."""
        la = int(round(DUCK["lookahead_ms"] / 5))
        a = np.concatenate([self.act[la:], np.zeros(la, bool)]).astype(float)
        ka, kr = 1 - np.exp(-5.0 / DUCK["attack_ms"]), 1 - np.exp(-5.0 / DUCK["release_ms"])
        d = np.empty(len(a))
        y = 0.0
        for i in range(len(a)):
            y += (a[i] - y) * (ka if a[i] > y else kr)
            d[i] = y
        return d

    def speech_near(self, t0, t1):
        i0, i1 = max(0, int(t0 / 0.005)), min(self.nf, int(t1 / 0.005) + 1)
        return float(self.act[i0:i1].mean()) if i1 > i0 else 0.0

    def local_peak_raw(self, t0, t1):
        i0, i1 = max(0, int(t0 / 0.005)), min(self.nf, int(t1 / 0.005) + 1)
        return float(self.pk5[i0:i1].max()) if i1 > i0 else 0.0

    def windows(self, offset=0.0, enforce=False):
        """Measurement windows for "the voice speaks", as arrays (t0, t1, class index into CLASSES): every speech run (long runs split into
        <= 3 s chunks), plus sliding windows of 3 s (hop 0.5 s), 1 s (hop 25 ms) and 0.4 s (hop 10 ms, the BS.1770 momentary window) that
        are mostly speech. The closed loop enforces the wider set (SPEECH_FRAC_ENFORCE); the report uses windows that are almost entirely
        speech (SPEECH_FRAC_REPORT), so a window on the edge of the enforced set is never one that is reported."""
        a0, a1, ci = [], [], []
        for a, b in self.runs:
            L = b - a
            k = max(1, int(np.ceil(L / 3.0)))
            for j in range(k):
                a0.append(a + L * j / k)
                a1.append(a + L * (j + 1) / k)
                ci.append(0)
        a0, a1, ci = [np.array(a0)], [np.array(a1)], [np.array(ci)]
        c = np.concatenate([[0], np.cumsum(self.act)])
        fr = SPEECH_FRAC_ENFORCE if enforce else SPEECH_FRAC_REPORT
        for i, (cls, W, hop) in enumerate((("3s", 3.0, 0.5), ("1s", 1.0, 0.025), ("400ms", 0.4, 0.01)), start=1):
            t0 = np.arange(offset, self.dur - W, hop)
            i0, i1 = np.minimum((t0 / 0.005).astype(int), self.nf), np.minimum(((t0 + W) / 0.005).astype(int), self.nf)
            keep = (c[i1] - c[i0]) / np.maximum(i1 - i0, 1) >= fr[cls]
            a0.append(t0[keep])
            a1.append(t0[keep] + W)
            ci.append(np.full(int(keep.sum()), i))
        return np.concatenate(a0), np.concatenate(a1), np.concatenate(ci)


# =========================================================================== music: beds
def _cache(name, fn, deps):
    os.makedirs(WORK, exist_ok=True)
    key = "|".join("%s:%d:%d" % (os.path.basename(d), os.path.getsize(d), int(os.path.getmtime(d))) for d in deps if os.path.exists(d))
    key += "|" + CACHE_VER
    npy, meta = os.path.join(WORK, name + ".npy"), os.path.join(WORK, name + ".key")
    if os.path.exists(npy) and os.path.exists(meta) and open(meta).read() == key:
        return np.load(npy).astype(np.float64)
    x = fn().astype(np.float32)           # always hand back the float32 round trip, so cached and fresh runs are bit-identical
    np.save(npy, x)
    open(meta, "w").write(key)
    return x.astype(np.float64)


def main_loops():
    """One seamless 36-bar period (92.903 s) of the channel bed, brand-EQ'd; plus a darker copy (low-passed)."""
    def build(dark):
        x = load(MAIN_MP3)
        s0 = int(round(MAIN_LOOP_START_S * SR))
        P = int(round(MAIN_LOOP_LEN_S * SR))
        loop = x[:, s0:s0 + P]
        three = np.concatenate([loop, loop, loop], axis=1)
        chain = "highpass=f=100:poles=2,highpass=f=100:poles=2,highshelf=f=5000:g=-3,equalizer=f=2000:t=o:w=2:g=-3.5"
        if dark:
            chain += ",lowpass=f=2400:poles=2"
        y = ff_filter(three, chain)
        return y[:, P:2 * P].copy()
    full = _cache("bed_main_full", lambda: build(False), [MAIN_MP3])
    dark = _cache("bed_main_dark", lambda: build(True), [MAIN_MP3])
    return full, dark


def lift_bed():
    """Engineering Graphics, varispeed -2 st (49/55): D -> C major, 110 -> 98 BPM; brand EQ + 130 Hz high-pass."""
    def build():
        from scipy.signal import resample_poly
        x = load(LIFT_MP3)
        y = resample_poly(x, 55, 49, axis=-1)
        chain = "highpass=f=130:poles=2,highpass=f=130:poles=2,highshelf=f=5000:g=-3,equalizer=f=2000:t=o:w=2:g=-3.5"
        return ff_filter(y, chain)
    return _cache("bed_lift_shifted", build, [LIFT_MP3])


def synth_pad(dur, seed=5):
    """Tonic resolve: A minor (A2 E3 A3 C4 E4 A4), 3 detuned band-limited saws per note, soft low-pass, stereo detune."""
    rng = np.random.default_rng(seed)
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros((2, len(t)))
    notes = [110.0, 164.81, 220.0, 261.63, 329.63, 440.0]
    for c in range(2):
        acc = np.zeros(len(t))
        for fr in notes:
            for dc in (-9.0 + 3 * c, 0.0, 9.0 - 3 * c):
                ph = rng.uniform(0, 2 * np.pi)
                f = fr * 2 ** (dc / 1200.0)
                acc += sum(np.sin(2 * np.pi * f * k * t + ph * k) / k for k in range(1, 5))
        out[c] = svf(acc, 1500.0, 0.8, "lp") * 0.1
    return out


def pad_loop():
    return _cache("bed_pad", lambda: synth_pad(16.0), [])


# =========================================================================== music plan
def make_plan(paras, total_frames, dur_s, cues, lift_layers=True):
    pf = lambda n: paras[n - 1][0] / FPS                      # paragraph start (s)
    pe = lambda n: paras[n - 1][1] / FPS
    drop_shift = EG_DROP_ORIG_S / EG_RATIO                    # drop in the shifted track (s)
    hook_start = drop_shift - pf(2)                           # hook: the drop lands on P02's first word (frame 1124)
    layers = [dict(id="hook", bed="lift", note="hook: natural order of the track (quiet marimba intro, 8-bar build, then the drop on P02 'Let's follow one question')",
                   t0_s=0.0, t1_s=round(pf(3) + 1.6, 3), src_start_s=round(hook_start, 3), fade_in_s=0.12, fade_out_s=2.2)]
    if lift_layers:
        for pn, t_end, note in ((11, min(pe(11) + 1.5, pf(11) + 38.8), "P11 bridge reveal"), (13, min(pf(13) + 38.8, pe(13)), "P13 the experiment (mid-film hero)"),
                                (22, 600.6, "P22 callback: back to the question")):
            layers.append(dict(id="lift_P%d" % pn, bed="lift", note=note + ": the track's bar-16 fill then the drop on the paragraph's first word",
                               t0_s=round(pf(pn) - EG_BAR_S, 3), t1_s=round(t_end, 3), src_start_s=round(drop_shift - EG_BAR_S, 3),
                               fade_in_s=1.0, fade_out_s=2.0))
    dark = {1: .3, 2: .3, 3: .4, 4: .4, 5: .3, 6: .3, 7: .3, 8: .35, 9: .5, 10: .4, 11: .2, 12: .2, 13: .15, 14: .3, 15: .35, 16: .6, 17: .6,
            18: .6, 19: .3, 20: .2, 21: .2, 22: .1}
    sections = []
    for sid, (a, b) in SECTION_PARAS.items():
        t0 = pf(a)
        t1 = dur_s if b == 22 else pf(b + 1)
        sections.append(dict(id=sid, t0_s=round(t0, 3), t1_s=round(t1, 3), paragraphs=[a, b],
                             tone_dark=[dark[p] for p in range(a, b + 1)],
                             gap_offset_dB={"S1": 1.2, "S5": 0.5, "S6": 1.0, "S8": 0.5, "S9": 1.0}.get(sid, 0.0)))
    swells = []
    for c in cues:
        if c["kind"] in HERO_KINDS and c["strength"] >= 0.6:
            swells.append(dict(t_s=round(c["frame"] / FPS, 3), frame=c["frame"], source=c["kind"], strength=c["strength"], lead_s=1.6, release_s=1.2,
                               lift_speech_dB=round(2.0 * c["strength"], 2), lift_pause_dB=round(5.0 * c["strength"], 2)))
    for sec in sections:
        cover = [(L["id"], min(L["t1_s"], sec["t1_s"]) - max(L["t0_s"], sec["t0_s"])) for L in layers]
        cover = [(i, c) for i, c in cover if c > 1.0]
        full = sum(c for _, c in cover) >= 0.9 * (sec["t1_s"] - sec["t0_s"])
        sec["beds"] = (["lift:" + i for i, _ in cover] if full else ["main"] + ["lift:" + i for i, _ in cover])
    swells.append(dict(t_s=round(dur_s - 0.25, 3), frame=None, source="final_resolve", strength=1.0, lead_s=5.0, release_s=0.3,
                       lift_speech_dB=2.2, lift_pause_dB=9.0))
    return {
        "schema": 1, "fps": FPS, "total_frames": total_frames, "duration_s": round(dur_s, 4),
        "beds": {
            "main": dict(title="Minimal Idm Ambient Works - Loop", artist="Musinova", licence="Pixabay Content License", key="A minor", bpm=93.0,
                         source=MAIN_MP3.replace("\\", "/"), loop_s=round(MAIN_LOOP_LEN_S, 4), loop_start_s=MAIN_LOOP_START_S,
                         processing="36-bar loop tiled seamlessly, high-pass 100 Hz 24 dB/oct, high shelf -3 dB at 5 kHz, 1-4 kHz dip -3.5 dB; darker copy low-passed at 2.4 kHz for tension sections"),
            "lift": dict(title="Engineering Graphics", artist="bearstockmusic", licence="Pixabay Content License", key="D major -> C major (varispeed -2 st)", bpm=98.0,
                         source=LIFT_MP3.replace("\\", "/"), varispeed=round(EG_RATIO, 6),
                         processing="resampled 55/49 (pitch -2 semitones, tempo 110 -> 98 BPM), high-pass 130 Hz 24 dB/oct, shelf and 1-4 kHz dip as the main bed")},
        "ducking": dict(mode="sidechain: voice-activity duck + voice-loudness follower", gap_nominal_LU=GAP_NOMINAL_LU, gap_floor_LU=MUSIC_FLOOR_LU, gap_floor_by_window=FLOORS,
                        speech_fraction_enforced=SPEECH_FRAC_ENFORCE, speech_fraction_reported=SPEECH_FRAC_REPORT, pause_rise_dB=PAUSE_RISE_DB,
                        follow_window_ms=DUCK["follow_ms"], follow_range_dB=list(DUCK["follow_range_dB"]), lookahead_ms=DUCK["lookahead_ms"], attack_ms=DUCK["attack_ms"],
                        release_ms=DUCK["release_ms"], speech_threshold_dBFS_raw=DUCK["thr_dbfs_raw"], bridge_gaps_ms=DUCK["bridge_ms"],
                        note=("while the voice speaks the music sits a constant gap under the voice's own 300 ms loudness (it follows the voice envelope within follow_range_dB), "
                              "calibrated so the integrated speech gap is gap_nominal_LU; in pauses it breathes up by pause_rise_dB (ducks in 25 ms with 60 ms look-ahead, recovers over release_ms); "
                              "a closed loop then trims the music wherever a speech phrase, or a 3 s / 1 s / 0.4 s window that is mostly speech, is closer to the voice than its floor")),
        "music_selection": dict(candidates_measured=MUSIC_SELECTION, choice=MUSIC_CHOICE),
        "main_entry": dict(t_s=round(pf(3), 3), note="the main bed's loop restarts from its first bar when S2 begins"),
        "layers": layers, "sections": sections, "swells": swells,
        "final_resolve": dict(start_s=round(dur_s - 14.2, 3), peak_s=round(dur_s - 0.2, 3), end_s=round(dur_s, 4), chord="A minor (A2 E3 A3 C4 E4 A4)",
                              note="main bed cross-fades into a synthesized tonic pad that swells to land as the last word ends (the voice ends at 611.99 s); 180 ms fade at the file end"),
        "tone_note": "tone_dark: 0 = full bed, 1 = low-passed copy, per paragraph, 1.5 s cross-fades",
    }


def bump(t, t_c, lead, rel):
    """0..1 pulse: smooth rise from t_c - lead to t_c, exponential release after."""
    r = smoothstep((t - (t_c - lead)) / lead)
    f = np.exp(-np.maximum(t - t_c, 0) / (rel / 2.5))
    return np.where(t <= t_c, r, f)


def render_music(plan, vi, G0, N):  # vi.km_lim must hold the K-meter of the voice as mixed
    """Returns the music stem (2, N) at the voice's gain G0, ducked and trimmed, plus a report."""
    t5 = np.arange(vi.nf) * 0.005
    # ---------- sources
    mfull, mdark = main_loops()
    lsh = lift_bed()
    pad = pad_loop()
    # reference loudness of each source (K-weighted, ungated) to put them on a common footing
    def lufs_of(x):
        return float(lufs_from_power((kw_power(x)).mean()))
    ref_main = lufs_of(mfull)
    drop_i = int((EG_DROP_ORIG_S / EG_RATIO) * SR)
    ref_lift = lufs_of(lsh[:, drop_i:drop_i + int(30 * SR)])
    ref_pad = lufs_of(pad[:, 2 * SR:-2 * SR])
    g_main, g_lift, g_pad = undb(-23.0 - ref_main), undb(-23.0 - ref_lift), undb(-23.0 - ref_pad)
    # ---------- assemble the music in chunks (float32): main bed with its tone cross-fade, lift layers, tonic pad, equal-power cross-fades
    entry_s = int(round(plan["main_entry"]["t_s"] * SR))
    P = mfull.shape[1]
    dark_of = {}
    for sec in plan["sections"]:
        for k, pn in enumerate(range(sec["paragraphs"][0], sec["paragraphs"][1] + 1)):
            dark_of[pn] = sec["tone_dark"][k]                           # darkness of the main bed per paragraph (0 = full, 1 = low-passed)
    pdark = np.zeros(vi.nf)
    for pn, (a_, b_) in enumerate(plan["_paras_t"], start=1):
        pdark[(t5 >= a_) & (t5 < b_)] = dark_of[pn]
    k = int(1.5 / 0.005)
    pdark = np.convolve(np.pad(pdark, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    fr = plan["final_resolve"]
    fr_i = int(fr["start_s"] * SR)
    m0 = np.zeros((2, N), dtype=np.float32)
    for c0 in range(0, N, CH):
        c1 = min(N, c0 + CH)
        ii = np.arange(c0, c1)
        tc_ = ii / SR
        idx = (ii - entry_s) % P
        wd = np.interp(tc_, t5, pdark)
        blk = (mfull[:, idx] * (1 - wd) + mdark[:, idx] * wd) * g_main
        e_lift = np.zeros(c1 - c0)
        lay = np.zeros((2, c1 - c0))
        for L in plan["layers"]:
            la, lb = L["t0_s"], L["t1_s"]
            env = smoothstep((tc_ - la) / max(L["fade_in_s"], 1e-3)) * smoothstep((lb - tc_) / max(L["fade_out_s"], 1e-3))
            if env.max() <= 0:
                continue
            js = ii - int(la * SR) + int(round(L["src_start_s"] * SR))
            ok = (env > 0) & (js >= 0) & (js < lsh.shape[1])
            if ok.any():
                lay[:, ok] += lsh[:, js[ok]] * (g_lift * np.sin(0.5 * np.pi * env[ok]))
            e_lift = np.maximum(e_lift, env)
        w_pad = smoothstep((tc_ - fr["start_s"]) / (fr["peak_s"] - 0.8 - fr["start_s"]))
        pj = np.clip(ii - fr_i, 0, pad.shape[1] - 1)
        padsig = pad[:, pj] * (np.sin(0.5 * np.pi * w_pad) * g_pad)
        tot = lay + blk * np.cos(0.5 * np.pi * np.maximum(e_lift, w_pad)) + padsig
        tot *= np.sin(0.5 * np.pi * np.clip((N / SR - tc_) / 0.18, 0, 1)) ** 2
        m0[:, c0:c1] = tot
    del mfull, mdark, lsh, pad
    # ---------- gain automation (dB, 5 ms resolution): static gap offsets + swells; speech vs open (pause) states
    gap_off = np.zeros(vi.nf)
    for s in plan["sections"]:
        gap_off[(t5 >= s["t0_s"]) & (t5 < s["t1_s"])] += s["gap_offset_dB"]
    lift_sp, lift_op = np.zeros(vi.nf), np.zeros(vi.nf)
    for sw in plan["swells"]:
        p = bump(t5, sw["t_s"], sw["lead_s"], sw["release_s"])
        lift_sp = np.maximum(lift_sp, p * sw["lift_speech_dB"])
        lift_op = np.maximum(lift_op, p * sw["lift_pause_dB"])
    dk = plan["ducking"]
    Lref = vi.L_ref_raw + G0                       # the voice's average speech loudness as mixed
    d = vi.duck_curve()                            # 1 while the voice speaks (activity), 0 in pauses
    # --- follower: inside speech the music gain follows the voice's 300 ms loudness (looking 60 ms ahead), bounded around the speech reference
    tc = np.minimum(t5 + dk["lookahead_ms"] / 1000.0, vi.dur)
    h = dk["follow_window_ms"] / 2000.0
    Lv300 = vi.km_lim.lufs_many(tc - h, tc + h)
    Lm3 = np.maximum(KMeter(m0).lufs_many(t5 - 1.5, t5 + 1.5), -70.0)                      # the music's own 3 s level, so its slow drift is flattened
    g_ref = Lref - (dk["gap_nominal_LU"] - gap_off - lift_sp) - Lm3                          # gain that puts the music a nominal gap under the average speech
    g_track = np.clip(Lv300 - (dk["gap_nominal_LU"] - gap_off - lift_sp) - Lm3, g_ref + dk["follow_range_dB"][0], g_ref + dk["follow_range_dB"][1])
    g_open = g_ref + dk["pause_rise_dB"] + np.maximum(lift_op - lift_sp, 0)
    g_db = g_open * (1 - d) + g_track * d
    # calibrate: the integrated (power-averaged) voice-minus-music gap over the speech frames is set to gap_nominal_LU
    M0 = apply_gain(m0, t5, g_db)
    gap_int0 = float(lufs_from_power(mask_mean_power(vi.km_lim.cs, vi.mask)) - lufs_from_power(mask_mean_power(KMeter(M0).cs, vi.mask)))
    cal = gap_int0 - dk["gap_nominal_LU"]
    g_db = g_db + cal
    g_open = g_open + cal
    del M0
    log("music: gain %.1f..%.1f dB (open state %.1f dB), speech reference %.2f LUFS, calibration %+.2f dB" % (g_db.min(), g_db.max(), float(np.median(g_open)), Lref, cal))
    trim = np.zeros(vi.nf)
    tw0, tw1, cid = vi.windows(enforce=True)
    Lv_w = vi.km_lim.lufs_many(tw0, tw1)          # the voice as it will be in the mix (gain + limiter)
    fl = dk.get("gap_floor_by_window", FLOORS)
    floor_w = np.array([fl[c] for c in CLASSES])[cid]
    rep = {}
    for it in range(14):
        M = apply_gain(m0, t5, g_db - trim)
        km = KMeter(M)
        gaps = Lv_w - km.lufs_many(tw0, tw1)
        need = np.maximum(0.0, floor_w - gaps)
        rep = dict(iterations=it, min_gap_LU=float(gaps.min()), windows=int(len(tw0)), trimmed_windows=int((need > 0.02).sum()))
        log("music trim iter %d: min gap %.2f LU, %d of %d windows below their floor" % (it, gaps.min(), (need > 0.02).sum(), len(tw0)))
        if need.max() <= 0.02:
            break
        add = trim_curve(tw0, tw1, need, cid, vi.nf)
        trim += add
    for i, cls in enumerate(CLASSES):
        rep["gap_%s_min_LU_enforced_set" % cls] = float(gaps[cid == i].min())
    rep["max_trim_dB"] = float(trim.max())
    rep["follower_range_dB"] = [float(g_db.min()), float(g_db.max())]
    rep["open_state_gain_dB_median"] = float(np.median(g_open))
    rep["sources_ref_LUFS"] = dict(main=ref_main, lift=ref_lift, pad=ref_pad)
    return M, rep


CH = 1 << 21                                                                                  # chunk length (samples) for the big loops


def apply_gain(x, t5, g_db):
    """x (2, n) float32 times a gain curve given in dB at 5 ms frames (linear interpolation), chunk-wise, returns float32."""
    out = np.empty_like(x)
    for c0 in range(0, x.shape[1], CH):
        c1 = min(x.shape[1], c0 + CH)
        out[:, c0:c1] = x[:, c0:c1] * undb(np.interp(np.arange(c0, c1) / SR, t5, g_db)).astype(np.float32)
    return out


def trim_curve(tw0, tw1, need, cid, nf):
    """Gain reduction (dB, 5 ms frames) that gives every violating window at least its needed trim: a running max over the frames each
    window covers (fixed-width classes) or a paint of the run (phrase windows), widened by a class taper and smoothed with a Hann kernel,
    so the window interior always receives the full amount."""
    from scipy.ndimage import maximum_filter1d
    add = np.zeros(nf)
    bad = need > 0.02
    for ci, (W, f) in {1: (600, 50), 2: (200, 30), 3: (80, 16)}.items():           # window frames, taper frames (250 / 150 / 80 ms)
        sel = (cid == ci) & bad
        if not sel.any():
            continue
        ns = np.zeros(nf + W)
        np.maximum.at(ns, np.round(tw0[sel] / 0.005).astype(int), need[sel] + 0.15)
        r = maximum_filter1d(ns, size=W, origin=(W - 1) - W // 2, mode="constant")[:nf]    # r[i] = max(ns[i-W+1 .. i])
        r = maximum_filter1d(r, size=2 * f + 1, mode="constant")
        ker = np.hanning(2 * f + 3)[1:-1]
        add = np.maximum(add, np.convolve(r, ker / ker.sum(), mode="same"))
    for j in np.where((cid == 0) & bad)[0]:                                            # speech runs: variable length
        a, b = int(tw0[j] / 0.005), int(np.ceil(tw1[j] / 0.005))
        f = 50
        lo_i, hi_i = max(0, a - f), min(nf, b + f)
        prof = np.ones(hi_i - lo_i)
        if a > lo_i:
            prof[: a - lo_i] = np.sin(0.5 * np.pi * np.linspace(0, 1, a - lo_i)) ** 2
        if hi_i > b:
            prof[b - lo_i:] = np.cos(0.5 * np.pi * np.linspace(0, 1, hi_i - b)) ** 2
        add[lo_i:hi_i] = np.maximum(add[lo_i:hi_i], (need[j] + 0.15) * prof)
    return add


def kw_power(x):
    return (kweight(np.atleast_2d(x)) ** 2).sum(axis=0)


# =========================================================================== SFX
def load_palette():
    meta = json.load(open(os.path.join(PAL, "palette.json")))
    pal = {}
    for kind, v in meta["kinds"].items():
        pal[kind] = []
        for e in v["variants"]:
            x = load(os.path.join(PAL, e["file"]))
            pal[kind].append(dict(e, x=x))
    return pal, meta


def place_sfx(cues, pal, vi, G0, N, trim_db=0.0):
    """Render the SFX bus (2, N) at the voice's gain G0. Returns (bus, placements)."""
    bus = np.zeros((2, N), dtype=np.float32)
    plc = []
    Lv_ref = vi.L_ref_raw + G0
    # reference voice peak (after the limiter): 95th percentile of per-0.4 s window peaks over speech
    pk_ref = min(float(np.percentile(vi.pk5[vi.act], 97)) * undb(G0), undb(VOICE_CEIL_DB))
    counters = {}
    for c in cues:
        kind = c["kind"]
        K = KIND[kind]
        vars_ = pal[kind]
        idx = counters.get(kind, 0)
        counters[kind] = idx + 1
        t = c["frame"] / FPS
        v = vars_[idx % len(vars_)]
        # pre-roll fit: use the longest variant whose anchor fits before t, else the shortest (head truncated)
        if v["anchor_s"] > t + 0.03:
            fit = [w for w in vars_ if w["anchor_s"] <= t + 0.03]
            v = max(fit, key=lambda w: w["anchor_s"]) if fit else min(vars_, key=lambda w: w["anchor_s"])
        sfrac = vi.speech_near(t - 0.25, t + 0.35)
        speaking = sfrac > 0.25
        # local references use a 3 s window (stable, no dips at paragraph gaps), bounded around the film-wide speech reference
        loc = float(np.clip(vi.km.lufs(t - 1.5, t + 1.5) + G0, Lv_ref - 4.0, Lv_ref + 3.0)) if speaking else Lv_ref
        pk_loc = db(min(vi.local_peak_raw(t - 1.5, t + 1.5) * undb(G0), undb(VOICE_CEIL_DB))) if speaking else db(pk_ref)
        pk_loc = float(np.clip(pk_loc, db(pk_ref) - 4.0, db(pk_ref)))
        boost = K["pause"] * float(np.clip((0.6 - sfrac) / 0.5, 0.0, 1.0))      # full boost in a real pause, none inside speech
        off = K["base"] - (1 - c["strength"]) * K["rng"] + boost + trim_db
        if K["mode"] == "peak":
            gain = (pk_loc + off) - (-1.0)               # palette kinds are peak-normalised to -1 dBFS for the peakiest variant
        else:
            gain = (loc + off) - v["loud100_LUFS"]
        gain = min(gain, K["cap"] - v["peak_dBFS"], (loc + K["lcap"] + boost) - v["loud100_LUFS"])
        x = v["x"] * float(undb(gain))
        start = int(round(t * SR)) - int(round(v["anchor_s"] * SR))
        if start < 0:
            x = x[:, -start:].copy()
            k = min(x.shape[1], int(0.02 * SR))
            x[:, :k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
            start = 0
        m = min(x.shape[1], N - start)
        if m > 0:
            xs = x[:, :m]
            if m < x.shape[1]:
                k = min(m, int(0.03 * SR))
                xs = xs.copy()
                xs[:, m - k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
            bus[:, start:start + m] += xs
        plc.append(dict(frame=c["frame"], t_s=round(t, 4), kind=kind, strength=c["strength"], section=c["section"], variant=v["file"],
                        gain_dB=round(float(gain), 2), peak_dBFS=round(v["peak_dBFS"] + float(gain), 2),
                        loud100_LUFS=round(v["loud100_LUFS"] + float(gain), 2), voice_loud_LUFS=round(loc, 2), voice_peak_dBFS=round(float(pk_loc), 2),
                        in_pause=not speaking, speech_fraction=round(sfrac, 2), pause_boost_dB=round(boost, 2), src=c["src"]))
    return bus, plc


# =========================================================================== voice alignment check
def _corr(x, y, chunk=1 << 22):
    """Normalised correlation of two equal-length 1-D arrays, accumulated in float64 in chunks."""
    sxy = sxx = syy = 0.0
    for a in range(0, len(x), chunk):
        xa, ya = np.asarray(x[a:a + chunk], dtype=np.float64), np.asarray(y[a:a + chunk], dtype=np.float64)
        sxy += float(np.dot(xa, ya))
        sxx += float(np.dot(xa, xa))
        syy += float(np.dot(ya, ya))
    return sxy / (np.sqrt(sxx * syy) + 1e-30)


def _lagged(a, b, lag):
    n = min(len(a), len(b))
    return (a[lag:n], b[: n - lag]) if lag >= 0 else (a[: n + lag], b[-lag:n])


def alignment_check(path, mix_voice_stem, G, final_mix=None, raw=None):
    """Cross-correlate the voice with an independently decoded/resampled copy of the original mp3 (soxr, not ffmpeg's swr)."""
    ref44 = load(path, sr=44100, ch=1).astype(np.float32)               # the narration is dual-mono: the mono down-mix is the same signal
    try:
        import soxr
        ref = soxr.resample(ref44.T, 44100, SR, quality="VHQ").T          # independent of ffmpeg's resampler
    except Exception:
        ref = signal.resample_poly(ref44, 160, 147, axis=-1)
    del ref44
    a = ref.reshape(-1).astype(np.float32) if ref.ndim == 1 or ref.shape[0] == 1 or ref.shape[1] == 1 else ref.mean(axis=0).astype(np.float32)
    del ref
    n = min(len(a), mix_voice_stem.shape[1])
    b = mix_voice_stem.mean(axis=0).astype(np.float32)
    # coarse lag by FFT on 4x decimated copies, then exact by dot products at full rate
    da, db_ = signal.decimate(a[:n], 4, ftype="fir"), signal.decimate(b[:n], 4, ftype="fir")
    nfft = 1 << int(np.ceil(np.log2(len(da) * 2)))
    cc = np.fft.irfft(np.fft.rfft(da, nfft) * np.conj(np.fft.rfft(db_, nfft)), nfft)
    lag_c = int(np.argmax(np.concatenate([cc[-2000:], cc[:2000]]))) - 2000
    del da, db_, cc
    res = {lag: _corr(*_lagged(a, b, lag)) for lag in range(-8, 9)}
    best = max(res, key=res.get)
    rawres = None
    if raw is not None:                                    # gain only, no limiter: shows the limiter is what keeps the correlation below 1
        br = raw.mean(axis=0).astype(np.float32)
        rr0 = {lag: _corr(*_lagged(a, br, lag)) for lag in range(-4, 5)}
        bl = max(rr0, key=rr0.get)
        first = lambda z: int(np.argmax(np.abs(z) > 1e-3 * np.abs(z).max()))       # first sample above 0.1% of the signal's own peak (scale-free)
        rawres = dict(best_lag_samples=bl, correlation_at_best=round(rr0[bl], 6), first_sample_over_0p1pct_of_peak_original=first(a), first_sample_over_0p1pct_of_peak_pipeline=first(br))
        del br
    mixres = None
    if final_mix is not None:
        bm = final_mix.mean(axis=0).astype(np.float32)
        rr = {lag: _corr(*_lagged(a, bm, lag)) for lag in range(-4, 5)}
        bl = max(rr, key=rr.get)
        mixres = dict(best_lag_samples=bl, correlation_at_best=round(rr[bl], 6), correlation_lag0=round(rr[0], 6))
        del bm
    return dict(voice_gain_only_vs_original=rawres, final_mix_vs_original=mixres, coarse_lag_samples_x4=lag_c * 4, best_lag_samples=best, correlation_at_best=round(res[best], 6),
                correlation_lag0=round(res[0], 6), correlation_lag_pm1=[round(res[-1], 6), round(res[1], 6)], ref_samples=int(len(a)), stem_samples=int(mix_voice_stem.shape[1]))


# =========================================================================== main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cues", nargs="*", default=None, help="explicit cue JSON file(s); default: src/ep03/sections/S*.cues.json")
    ap.add_argument("--sections-dir", default=SECTIONS_DIR)
    ap.add_argument("--out", default=os.path.join(OUT_DIR, "ep03_mix.wav"))
    ap.add_argument("--voice", default=VOICE)
    ap.add_argument("--plan", default=None, help="use this music_plan.json as is (default: generate from the cues)")
    ap.add_argument("--target-lufs", type=float, default=-14.1)
    ap.add_argument("--sfx-trim-db", type=float, default=0.0, help="shift every SFX level by this many dB (caps still apply)")
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--stems", default=None, help="also write voice/music/sfx stems (24-bit WAV) into this folder, for inspection")
    a = ap.parse_args()
    if not os.path.exists(a.voice):
        die("narration not found: %s" % a.voice)
    if not os.path.exists(os.path.join(PAL, "palette.json")) or any(not glob.glob(os.path.join(PAL, k + "_*.wav")) for k in KINDS):
        import subprocess
        log("palette missing: building it (build_palette.py)")
        subprocess.run([sys.executable, "-I", os.path.join(HERE, "build_palette.py")], check=True)
    paras, total_frames, tl = load_timeline()
    out_dir = os.path.dirname(os.path.abspath(a.out))
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)

    # ---- cues
    files = a.cues if a.cues else sorted(glob.glob(os.path.join(a.sections_dir, "S*.cues.json")))
    cues, warns = read_cues(files, total_frames, paras)
    n_read = len(cues)
    if a.no_sfx:
        cues = []
    cues, dup = dedupe(cues)
    cues, dropped = enforce_stack(cues)
    log("cues: %d files, %d valid, %d duplicates, %d dropped by the 3-in-100-ms rule" % (len(files), n_read, len(dup), len(dropped)))

    # ---- voice
    vi = Voice(a.voice)
    N = vi.n
    dur_s = vi.dur

    # ---- reference voice gain: the raw integrated loudness plus the ~0.25 dB the limiter takes at this level (the final solve below settles the exact gain)
    I_raw = integrated_from_cs(vi.km.cs)
    G0 = round(a.target_lufs - I_raw + 0.25, 3)
    log("voice: raw %.2f LUFS integrated -> reference gain %.3f dB" % (I_raw, G0))
    v0, _ = tp_limiter(vi.raw * undb(G0), VOICE_CEIL_DB, look_ms=4.0, release_ms=90.0)
    vi.km_lim = KMeter(v0)
    del v0

    # ---- music plan, music, sfx
    if a.plan:
        plan = json.load(open(a.plan, encoding="utf-8"))
    else:
        plan = make_plan(paras, total_frames, dur_s, cues)
    plan["_paras_t"] = [(s / FPS, e / FPS) for s, e in paras]
    if a.no_music:
        M, mrep = np.zeros((2, N)), {"skipped": True}
    else:
        M, mrep = render_music(plan, vi, G0, N)
    pal, pal_meta = load_palette()
    bus, plc = place_sfx(cues, pal, vi, G0, N, a.sfx_trim_db)
    log("sfx placed:", len(plc))

    # ---- fixed gain solve: voice gain + limiter, full mix, final limiter, target loudness
    target = a.target_lufs
    G = G0
    for it in range(5):
        G_used = G
        sc = np.float32(undb(G - G0))
        x = vi.raw * undb(G)
        v, gv = tp_limiter(x, VOICE_CEIL_DB, look_ms=4.0, release_ms=90.0)
        del x
        mix = v.copy()
        for c0 in range(0, N, CH):
            mix[:, c0:c0 + CH] += (M[:, c0:c0 + CH] + bus[:, c0:c0 + CH]) * sc
        mix, gf = tp_limiter(mix, FINAL_CEIL_DB, look_ms=4.0, release_ms=90.0)
        I = integrated_from_cs(kpower_cs(mix))
        log("gain iter %d: voice gain %.3f dB -> mix %.3f LUFS (final limiter max %.2f dB)" % (it, G, I, db(gf.min())))
        if abs(I - target) <= 0.05:
            break
        G += (target - I) / 0.9
    G = G_used
    # ---- write
    write_wav(a.out, mix, bits=24)
    log("wrote", a.out)

    # ---- measurements
    r128 = ffmpeg_r128(a.out)
    st = ffprobe_stream(a.out)
    shift = G - G0                                   # the music and SFX stems scale with the voice: their loudness shifts by this many dB
    km_v, km_m, km_s = KMeter(v), KMeter(M), KMeter(bus)
    t0w, t1w, cidw = vi.windows()
    gap = km_v.lufs_many(t0w, t1w) - (km_m.lufs_many(t0w, t1w) + shift)
    by_cls = {cls: gap[cidw == i] for i, cls in enumerate(CLASSES)}
    ph, s3 = by_cls["phrase"], by_cls["3s"]
    t0o, t1o, cido = vi.windows(offset=0.0123)     # the same classes on a shifted grid: the floors must not depend on window alignment
    gap_o = km_v.lufs_many(t0o, t1o) - (km_m.lufs_many(t0o, t1o) + shift)
    by_cls_o = {cls: gap_o[cido == i] for i, cls in enumerate(CLASSES)}
    sfx_rel = km_s.lufs_many(t0w, t1w) + shift - km_v.lufs_many(t0w, t1w)
    sfx_rel_ph = sfx_rel[cidw == 0]
    gap_int_speech = float(lufs_from_power(mask_mean_power(km_v.cs, vi.mask)) - lufs_from_power(mask_mean_power(km_m.cs, vi.mask)) - shift) if not a.no_music else None
    gap_int_gated = (integrated_from_cs(km_v.cs) - (integrated_from_cs(km_m.cs) + shift)) if not a.no_music else None
    aln = alignment_check(a.voice, v, G, mix, vi.raw)
    if a.stems:
        os.makedirs(a.stems, exist_ok=True)
        for nm, arr, sc_ in (("voice_stem", v, 1.0), ("music_stem", M, undb(shift)), ("sfx_stem", bus, undb(shift))):
            write_wav(os.path.join(a.stems, nm + ".wav"), np.clip(arr * np.float32(sc_), -1.0, 1.0))
    loc_rel = []
    for pl in plc:
        t = pl["t_s"]
        if not pl["in_pause"]:
            loc_rel.append(km_s.lufs(t - 0.15, t + 0.25) + shift - km_v.lufs(t - 0.15, t + 0.25))
    loc_rel = np.array(loc_rel) if loc_rel else np.array([])
    idle = gv == 1.0
    ceil_hits = {"voice_limiter_max_GR_dB": round(db(gv.min()), 2), "voice_limiter_pct_samples_over_0.1dB": round(float((gv < undb(-0.1)).mean() * 100), 2),
                 "voice_limiter_pct_samples_over_1dB": round(float((gv < undb(-1.0)).mean() * 100), 2),
                 "voice_samples_untouched_pct": round(float(idle.mean() * 100), 2),
                 "voice_untouched_max_abs_deviation_from_gain_x_original": float(np.abs(v[:, idle] - vi.raw[:, idle] * undb(G)).max()),
                 "final_limiter_max_GR_dB": round(db(gf.min()), 2), "final_limiter_pct_samples_over_0.5dB": round(float((gf < undb(-0.5)).mean() * 100), 3)}
    onsets = np.array(sorted(p["frame"] / FPS for p in plc))
    max_stack = int(max([(np.sum((onsets >= t - 1e-9) & (onsets <= t + 0.1 + 1e-9))) for t in onsets] + [0]))
    by_kind, by_sec = {}, {}
    for p in plc:
        by_kind[p["kind"]] = by_kind.get(p["kind"], 0) + 1
        by_sec[p["section"]] = by_sec.get(p["section"], 0) + 1
    dur_frames_diff = (st["format_duration"] - 612.2) * FPS
    checks = {
        "duration_equals_narration_samples": int(st["duration_ts"]) == N,
        "duration_612.2s_within_1_frame": abs(int(st["duration_ts"]) / SR - 612.2) <= 1.0 / FPS + 1e-6,
        "integrated_-14_LUFS_pm_0.5": abs(r128["I"] - SPEC["I_target"]) <= SPEC["I_tol"],
        "true_peak_le_-1_dBTP": r128["TP"] <= SPEC["TP_max"],
        "48k_stereo": int(st["sample_rate"]) == SR and int(st["channels"]) == 2,
        "voice_aligned_lag_0": aln["best_lag_samples"] == 0,
        "music_ge_18LU_under_voice_every_phrase": (min(ph) >= SPEC["gap_min"]) if not a.no_music else True,
        "music_ge_18LU_under_voice_3s_windows": (min(s3) >= SPEC["gap_min"]) if not a.no_music else True,
        "music_ge_18LU_under_voice_1s_windows": (by_cls["1s"].min() >= SPEC["gap_min"]) if not a.no_music else True,
        "music_ge_18LU_under_voice_400ms_windows": (min(by_cls["400ms"].min(), by_cls_o["400ms"].min()) >= SPEC["gap_min"]) if not a.no_music else True,
        "max_3_sounds_within_100ms": max_stack <= 3,
        "narration_untouched_outside_limiter": ceil_hits["voice_untouched_max_abs_deviation_from_gain_x_original"] == 0.0,
    }
    meas = {
        "summary": {"integrated_LUFS": r128["I"], "true_peak_dBTP": r128["TP"], "LRA_LU": r128["LRA"],
                    "voice_vs_music_LU_min": None if a.no_music else round(float(min(by_cls[c].min() for c in by_cls)), 2),
                    "voice_vs_music_LU_integrated_speech": None if a.no_music else round(gap_int_speech, 2),
                    "cues_placed": len(plc), "duration_s": round(int(st["duration_ts"]) / SR, 4), "narration_lag_samples": aln["best_lag_samples"],
                    "pass": all(checks.values())},
        "file": os.path.abspath(a.out).replace("\\", "/"), "format": {"sample_rate": int(st["sample_rate"]), "channels": int(st["channels"]), "codec": st["codec_name"],
                                                                  "samples": int(st["duration_ts"]), "duration_s": round(int(st["duration_ts"]) / SR, 4),
                                                                  "frames_at_30fps": round(int(st["duration_ts"]) / SR * FPS, 2),
                                                                  "narration_duration_s": round(dur_s, 4), "video_frames": total_frames,
                                                                  "vs_612.2s_in_frames": round(dur_frames_diff, 3)},
        "loudness": {"integrated_LUFS": r128["I"], "true_peak_dBTP": r128["TP"], "LRA_LU": r128["LRA"], "method": "ffmpeg ebur128 peak=true on the written file",
                     "integrated_LUFS_numpy": round(I, 2), "true_peak_dBTP_numpy_8x": round(true_peak_db(mix, 8), 2), "target_LUFS": target},
        "voice_vs_music_LU": None if a.no_music else {
            "min_over_speech_phrases": round(float(min(ph)), 2), "p05_over_speech_phrases": round(float(np.percentile(ph, 5)), 2),
            "median_over_speech_phrases": round(float(np.median(ph)), 2), "min_over_3s_windows_(>=50%_speech)": round(float(min(s3)), 2),
            "min_over_1s_windows_(>=90%_speech)": round(float(by_cls["1s"].min()), 2), "min_over_400ms_windows_(>=95%_speech)": round(float(by_cls["400ms"].min()), 2),
            "shifted_grid_(+12.3ms)_min_over_1s_and_400ms_windows": [round(float(by_cls_o["1s"].min()), 2), round(float(by_cls_o["400ms"].min()), 2)],
            "p01_over_400ms_windows": round(float(np.percentile(by_cls["400ms"], 1)), 2), "median_over_400ms_windows": round(float(np.median(by_cls["400ms"])), 2),
            "windows_per_class": {k: int(len(v)) for k, v in by_cls.items()},
            "integrated_over_speech_frames": round(gap_int_speech, 2), "integrated_gated_BS1770_voice_minus_music": round(float(gap_int_gated), 2),
            "requirement": ">= 18 LU wherever the voice speaks", "closed_loop": mrep},
        "voice": {"fixed_gain_dB": round(G, 3), "limiter": ceil_hits, "alignment_vs_original": aln,
                  "processing": "one fixed gain + a look-ahead true-peak limiter (4 ms look-ahead, 90 ms release, ceiling %.1f dBTP); nothing else" % VOICE_CEIL_DB,
                  "starts_at_t0": True, "speech_seconds": round(float(vi.act.sum() * 0.005), 1)},
        "cues": {"files_read": [os.path.basename(f) for f in files], "cues_valid": n_read, "cues_placed": len(plc), "cues_dropped_3_in_100ms": dropped, "cues_dropped_duplicates": dup,
                 "max_sounds_starting_within_100ms": max_stack, "by_kind": by_kind, "by_section": by_sec, "warnings": warns,
                 "sfx_minus_voice_LU_in_speech_phrases": None if not len(sfx_rel_ph) else {"max": round(float(np.max(sfx_rel_ph)), 2), "p95": round(float(np.percentile(sfx_rel_ph, 95)), 2),
                                                                                   "median": round(float(np.median(sfx_rel_ph)), 2)},
                 "sfx_minus_voice_LU_400ms_at_each_cue_in_speech": None if not len(loc_rel) else {"max": round(float(loc_rel.max()), 2), "p90": round(float(np.percentile(loc_rel, 90)), 2),
                                                                                              "median": round(float(np.median(loc_rel)), 2), "n": int(len(loc_rel))},
                 "loudest_sfx_peak_dBFS": max([p["peak_dBFS"] for p in plc], default=None)},
        "checks": checks, "pass": all(checks.values()),
        "inputs": {"voice": a.voice.replace("\\", "/"), "voice_sha256": sha256(a.voice), "palette_files": sum(len(v) for v in pal.values()),
                   "music_main": MAIN_MP3.replace("\\", "/"), "music_lift": LIFT_MP3.replace("\\", "/")},
        "note": "Nobody listened: every number is a measurement.",
    }
    json.dump(meas, open(os.path.join(out_dir, "measure.json"), "w", encoding="utf-8"), indent=1, default=_jsonable)
    plan_out = {k: v for k, v in plan.items() if not k.startswith("_")}
    plan_out["measured"] = {k: v for k, v in mrep.items() if k.startswith("gap_") or k in ("max_trim_dB", "follower_range_dB", "open_state_gain_dB_median")}
    json.dump(plan_out, open(os.path.join(HERE, "music_plan.json"), "w", encoding="utf-8"), indent=1, default=_jsonable)
    json.dump(plan_out, open(os.path.join(out_dir, "music_plan.json"), "w", encoding="utf-8"), indent=1, default=_jsonable)
    json.dump(plc, open(os.path.join(WORK, "last_placements.json"), "w"), indent=0, default=_jsonable)
    write_credits(out_dir, plan, pal_meta, a.no_music)
    log("I %.2f LUFS | TP %.2f dBTP | LRA %.1f | music gap min phrase %s / 3s %s / 1s %s / 0.4s %s | cues %d | %s" % (
        r128["I"], r128["TP"], r128["LRA"], *(["-"] * 4 if a.no_music else [round(float(min(ph)), 1), round(float(min(s3)), 1), round(float(by_cls["1s"].min()), 1), round(float(by_cls["400ms"].min()), 1)]),
        len(plc), "PASS" if meas["pass"] else "FAIL"))
    for k, ok in checks.items():
        if not ok:
            print("  OUT OF SPEC:", k)
    sys.exit(0 if meas["pass"] else 1)


def write_credits(out_dir, plan, pal_meta, no_music):
    md = ["# Credits and sources: Episode 03 mix", "",
          "Generated by `audio_build/ep03/build_mix.py`. Nobody listened; levels are by measurement. Before publishing, upload a private or unlisted test so YouTube's Content ID can flag a claim before release.", "",
          "## Narration", "",
          "The channel's own ElevenLabs recording, `Videos/03 Why AI Answers Arrive One Piece at a Time/Voiceover/Fullvoiceover.mp3`. Used unchanged (never edited, trimmed, reordered or stretched): one fixed gain and a true-peak limiter only. It starts at t = 0 and the mix is exactly as long as the recording (612.2057 s).", ""]
    if not no_music:
        md += ["## Music", "", "| Role | Title | Artist | Licence | Source page | Credit required? |", "|---|---|---|---|---|---|",
               "| Channel bed (most of the film) | Minimal Idm Ambient Works - Loop | Musinova | Pixabay Content License | https://pixabay.com/music/ambient-minimal-idm-ambient-works-loop-518246/ | No. Optional: *Music by Musinova from Pixabay*. |",
               "| Hook and hero moments (the hook, P11, P13, P22) | Engineering Graphics | bearstockmusic | Pixabay Content License | https://pixabay.com/music/instrumental-engineering-graphics-587758/ | No. Optional: *Music: \"Engineering Graphics\" by bearstockmusic (Pixabay)*. |", "",
               "- Pixabay Content License: commercial use and modification allowed without attribution; the music may not be redistributed as a standalone file. Summary: https://pixabay.com/service/license-summary/; terms: https://pixabay.com/service/terms/. The licences were quoted and checked in Stage A (`Motion Brand/stage_a_files/sound/music_style1.md`, `music_style3.md`) and are repeated in `audio_build/CREDITS.md`.",
               "- Changes (permitted): the bed is looped, high-passed, shelved and dipped at 1-4 kHz, ducked under the voice and faded; Engineering Graphics is pitched down two semitones by resampling (110 -> 98 BPM) and used in excerpts; a tonic pad (A minor) is synthesized for the ending.",
               "- No Content ID badge and no AI label on either page when checked in Stage A (9 October 2026); this is not a guarantee.", ""]
    md += ["## Sound effects", "",
           "- Everything is synthesized in numpy for this project (no credit needed) except `tick_1`.",
           "- `tick_1`: the licence-checked Signal Atlas kit click (`audio_build/sfx/style6/button_press_f0.wav`), cut from the library file `D:/Assets/01 Audio/Sound Effects/06 UI, Clicks & Camera/rm click (3).wav` (plain-named, no pack metadata, origin unknown, as recorded in `audio_build/CREDITS.md`).",
           "- Nothing from Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX, Muctau, CSFX, `AM - ` files, Epidemic Sound or any UCS-style (DSGN..., COMCam_, MAGShim_, B00M) file.",
           "- Per-file sources and cue timing conventions: `audio_build/ep03/palette/SOURCES.md`.", ""]
    open(os.path.join(out_dir, "CREDITS.md"), "w", encoding="utf-8").write("\n".join(md))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(3)
