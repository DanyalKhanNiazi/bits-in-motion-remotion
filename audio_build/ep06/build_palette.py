"""Episode 06 sound palette (unchanged from the Episode 03 palette; same deterministic synthesis): 12 cue kinds x 3-4 variants, 48 kHz stereo 24-bit WAVs in ./palette/.

Run:  python -I build_palette.py            (deterministic: seeded RNGs, no network, nothing executed from any library)

Sources (see palette/SOURCES.md, which this script writes):
  * synthesized in numpy (the large majority),
  * tick_1  = the licence-checked Signal Atlas kit click (audio_build/sfx/style6/button_press_f0.wav, from 'rm click (3).wav').
Everything else is synthesized, so no other library audio is used at all.
Nothing from Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX, Muctau, CSFX, 'AM - ' files or Epidemic Sound is used.

Every variant of one kind is loudness-matched (max 100 ms K-weighted loudness), and the kind is scaled so its peakiest
variant peaks at -1.0 dBFS. palette.json records, per file, the ANCHOR (the moment that lands on the cue frame),
duration, peak, loudness and spectral centroid; build_mix.py reads it.
"""
import json
import os
import sys
from fractions import Fraction

import numpy as np
from scipy import signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audiolib import (SR, KMeter, apply_reverb, db, equal_power_pan, fade_edges, load, lufs_from_power, pad_to,
                      pink_noise, reverb_ir, sha256, smoothstep, svf, tt, undb, write_wav)  # noqa: E402

REMOTION = os.path.dirname(os.path.dirname(HERE))
PAL = os.path.join(HERE, "palette")
KIT = os.path.join(REMOTION, "audio_build", "sfx", "style6")

# A-minor pentatonic / chord tones (the music bed is A minor), Hz
N = {"F2": 87.31, "A2": 110.0, "C3": 130.81, "D3": 146.83, "F3": 174.61, "E3": 164.81, "G3": 196.0, "A3": 220.0,
     "C4": 261.63, "D4": 293.66, "E4": 329.63, "G4": 392.0, "A4": 440.0, "B4": 493.88, "C5": 523.25, "D5": 587.33,
     "E5": 659.26, "G5": 783.99, "A5": 880.0, "C6": 1046.5, "E6": 1318.5}


def curve(t, tk, vk, log=True):
    """Smooth (smoothstep-eased) interpolation of values vk at times tk; geometric if log."""
    tk = np.asarray(tk, dtype=float)
    v = np.log(np.asarray(vk, dtype=float)) if log else np.asarray(vk, dtype=float)
    idx = np.clip(np.searchsorted(tk, t, side="right") - 1, 0, len(tk) - 2)
    u = smoothstep((t - tk[idx]) / (tk[idx + 1] - tk[idx]))
    y = v[idx] * (1 - u) + v[idx + 1] * u
    return np.exp(y) if log else y


def hp(x, f=28.0):
    return svf(x, f, 0.7071, "hp")


def hp2(x, f):
    return np.stack([hp(x[0], f), hp(x[1], f)])


def dual(mono):
    return np.vstack([mono, mono])


def soft_sat(x, drive):
    return np.tanh(drive * x) / np.tanh(drive)


def att(t, a):
    return smoothstep(t / a)


def flange(x, d0, d1, mix):
    """Swept comb (flanger): y = x + mix * x(t - d(t)), d from d0 to d1 seconds (linear): a moving 'jet' character."""
    n = len(x)
    d = np.linspace(d0, d1, n) * SR
    return x + mix * np.interp(np.arange(n) - d, np.arange(n), x, left=0.0)


# =========================================================================== WHOOSH (anchor = peak)
def mk_whoosh(seed, dur, tp, f, q, rise_pow, tail, pan, air, body, flange_mix=0.0):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    fc = curve(t, [0, tp, dur], f)
    a = np.where(t < tp, (0.5 - 0.5 * np.cos(np.pi * np.clip(t / tp, 0, 1))) ** rise_pow, np.exp(-(t - tp) / tail))
    pans = curve(t, [0, dur], pan, log=False)
    th = (pans + 1) * np.pi / 4
    chans = []
    for c in range(2):
        main = svf(pink_noise(n, rng), fc, q, "bp")
        upper = svf(pink_noise(n, rng), np.minimum(fc * 2.0, 6000.0), q, "bp") * 0.42
        low = svf(pink_noise(n, rng), fc * 0.5, q * 0.8, "bp") * body
        hiss = svf(rng.standard_normal(n), 5500.0, 0.7071, "hp") * air * a ** 1.5
        sig = (main + upper + low) * a + hiss
        if flange_mix:
            sig = flange(sig, 0.0035 + 0.0004 * c, 0.0006, flange_mix)
        chans.append(sig * (np.cos(th) if c == 0 else np.sin(th)))
    return fade_edges(hp2(np.stack(chans), 60), 0.004, 0.03), tp


# =========================================================================== TICK (anchor = onset)
def mk_tick(seed, f_body, f_hp=3200.0, dur=0.045):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    click = svf(svf(rng.standard_normal(n), f_hp, 0.7071, "hp"), 9000.0, 0.7071, "lp") * np.exp(-t / 0.0005)
    ping = np.sin(2 * np.pi * f_body * t) * np.exp(-t / 0.0030) * att(t, 0.0002)
    knock = np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.0045) * att(t, 0.0003)
    rel = np.where(t > 0.022, svf(rng.standard_normal(n), 4200.0, 0.7071, "hp") * np.exp(-np.maximum(t - 0.022, 0) / 0.0004), 0.0)
    x = 0.55 * click + 0.9 * ping + 0.42 * knock + 0.05 * rel
    x = x - x.mean()
    return fade_edges(dual(x), 0.0001, 0.006), 0.0004


def mk_tick_kit():
    x = load(os.path.join(KIT, "button_press_f0.wav"))
    k = int(np.argmax(np.abs(x).max(axis=0) > 0.30 * np.abs(x).max()))   # the main transient lands on the cue
    x = x[:, max(0, k - 48):]
    x = x - x.mean(axis=1, keepdims=True)
    return fade_edges(x, 0.0002, 0.004), min(k, 48) / SR


# =========================================================================== POP (anchor = onset)
def mk_pop(seed, f_end, dur=0.11):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    f = f_end * (0.5 + 0.5 * (1 - np.exp(-t / 0.007)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = att(t, 0.0010) * np.exp(-t / 0.016)
    tone = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * env
    puff = svf(rng.standard_normal(n), 1500.0, 0.7071, "hp") * np.exp(-t / 0.0015) * 0.18
    x = svf(tone + puff, 5000.0, 0.7071, "lp")
    x = x - x.mean()
    return fade_edges(dual(x), 0.0003, 0.010), 0.0006


# =========================================================================== IMPACT (anchor = onset)
def mk_impact(seed, dur, sub, body, crack, rv, partials=None, drive=1.6, knock_f=(170, 262)):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    f0, f1, tau_p, tau_a, amp = sub
    f = f1 + (f0 - f1) * np.exp(-t / tau_p)
    sub_s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau_a) * att(t, 0.002) * amp * 0.42
    blp, btau = body
    body_s = svf(rng.standard_normal(n), blp, 0.9, "lp") * np.exp(-t / btau) * att(t, 0.001)
    knock = (np.sin(2 * np.pi * knock_f[0] * t) * np.exp(-t / 0.11) + 0.7 * np.sin(2 * np.pi * knock_f[1] * t) * np.exp(-t / 0.08)) * att(t, 0.0008) * 0.65
    mid = svf(rng.standard_normal(n), 1400.0, 1.0, "bp") * np.exp(-t / 0.030) * att(t, 0.0006) * 0.7
    chp, ctau = crack
    crack_s = svf(rng.standard_normal(n), chp, 0.7071, "hp") * np.exp(-t / ctau) * 0.62
    crack_s[0:3] += np.array([0.6, -0.4, 0.2])
    dry = sub_s + 1.5 * (body_s + knock + mid) + crack_s * 1.2
    if partials:
        for fr, am, tau in partials:
            dry = dry + np.sin(2 * np.pi * fr * t) * np.exp(-t / tau) * att(t, 0.0015) * am
    dry = soft_sat(dry, drive)
    rt60, wet_db, damp = rv
    wet = apply_reverb(dry, reverb_ir(rt60, pre_ms=9.0, damp_hz=damp, seed=seed + 100), wet_db)
    out = np.zeros((2, max(n, wet.shape[1])))
    out[:, :n] += dry
    out += pad_to(wet, out.shape[1])
    out = hp2(out[:, : int((dur + 0.15) * SR)], 30)
    return fade_edges(out, 0.0003, 0.2), 0.0


# =========================================================================== RISER (anchor = the end of the build)
def mk_riser(seed, T, tail=0.18):
    rng = np.random.default_rng(seed)
    dur = T + tail
    t = tt(dur)
    n = len(t)
    u = np.clip(t / T, 0, 1)
    amp = np.where(t <= T, u ** 2.6, np.exp(-(t - T) / 0.045))
    fc = 250.0 * (9000.0 / 250.0) ** u
    q = 1.0 + 3.0 * u
    noise = [svf(pink_noise(n, rng), fc, q, "bp") for _ in range(2)]
    f_t = 220.0 * 1.5 ** u
    tone = np.zeros(n)
    for dc in (-7.0, 0.0, 7.0):
        ph = 2 * np.pi * np.cumsum(f_t * 2 ** (dc / 1200.0)) / SR
        tone += sum(np.sin(k * ph) / k for k in range(1, 9))
    tone = svf(tone, 400.0 + 5200.0 * u ** 2, 0.9, "lp")
    sub = np.sin(2 * np.pi * np.cumsum(55.0 * 2 ** u) / SR)
    trem = 1.0 + 0.30 * np.sin(2 * np.pi * np.cumsum(5.0 + 13.0 * u) / SR) * u
    x = np.stack([noise[0] * (1.0 + 2.5 * u) + tone * 0.15 + sub * 0.08, noise[1] * (1.0 + 2.5 * u) + tone * 0.15 + sub * 0.08]) * amp * trem
    return fade_edges(hp2(x, 40), 0.01, 0.02), T - 0.005


# =========================================================================== SWELL (anchor = the peak)
def mk_swell(seed, dur, tp, notes, cutoff=(500, 3200), rt60=1.8):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    u = np.clip(t / tp, 0, 1)
    amp = np.where(t < tp, np.sin(0.5 * np.pi * u) ** 2.4, np.exp(-(t - tp) / 0.55))
    pad = np.zeros(n)
    for fr in notes:
        for dc in (-8.0, 0.0, 9.0):
            ph = 2 * np.pi * fr * 2 ** (dc / 1200.0) * t + rng.uniform(0, 2 * np.pi)
            pad += sum(np.sin(k * ph) / k for k in range(1, 7))
    pad = svf(pad, curve(t, [0, tp, dur], [cutoff[0], cutoff[1], cutoff[0] * 1.2]), 0.8, "lp") * 0.12
    air = [svf(rng.standard_normal(n), 3500.0 * (0.6 + 0.8 * u), 1.1, "bp") * 0.2 for _ in range(2)]
    dry = np.stack([pad + air[0], pad + air[1]]) * amp
    wet = apply_reverb(dry, reverb_ir(rt60, pre_ms=16.0, damp_hz=3200.0, seed=seed + 7), -8.0)
    out = pad_to(dry, wet.shape[1]) + wet
    out = hp2(out[:, : int((dur + 0.8) * SR)], 50)
    return fade_edges(out, 0.02, 0.4), tp


# =========================================================================== DIAL (anchor = start of the turn)
def mk_dial(seed, dur, n_clicks, i0, i1, f_hum):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    u = t / dur
    gaps = i0 * (i1 / i0) ** (np.arange(n_clicks) / max(n_clicks - 1, 1))
    times = np.concatenate([[0.0], np.cumsum(gaps)])
    times = times[times < dur * 0.9]
    clicks = np.zeros(n)
    ct = tt(0.035)
    for tc in times:
        i = int(round(tc * SR))
        a = (1.0 - 0.45 * tc / dur) * rng.uniform(0.8, 1.0)
        c = svf(svf(rng.standard_normal(len(ct)), 1800.0, 0.7071, "hp"), 6500.0, 0.7071, "lp") * np.exp(-ct / 0.0010) * 1.1
        c += np.sin(2 * np.pi * 520 * ct) * np.exp(-ct / 0.005) * 0.32 + np.sin(2 * np.pi * 1100 * ct) * np.exp(-ct / 0.003) * 0.25
        m = min(len(ct), n - i)
        if m > 0:
            clicks[i:i + m] += c[:m] * a
    fh = f_hum[1] + (f_hum[0] - f_hum[1]) * (1 - smoothstep(u))
    ph = 2 * np.pi * np.cumsum(fh) / SR
    hum = svf(np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph), 800.0, 0.8, "lp")
    hum = hum * att(t, 0.05) * np.exp(-np.maximum(t - dur * 0.55, 0) / (dur * 0.22)) * 0.12
    rate = 50.0 * (1 - 0.5 * u)
    chans = []
    for c in range(2):
        fizz = svf(rng.standard_normal(n), 4200.0, 3.0, "bp") * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR + 1.1 * c)) * 0.10 * np.exp(-u * 2.2)
        chans.append(clicks + hum + fizz)
    return fade_edges(hp2(np.stack(chans), 60), 0.0005, 0.08), 0.0


# =========================================================================== CRATE (anchor = the thump)
def mk_crate(seed, dur, tp, whoosh_lp, sub, wood_pitch, wood_amp=0.8):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    u = np.clip(t / tp, 0, 1)
    amp = np.where(t < tp, smoothstep(u) ** 1.7, np.exp(-(t - tp) / 0.10))
    fc = curve(t, [0, tp, dur], list(whoosh_lp))
    whoosh = np.stack([(svf(pink_noise(n, rng), fc, 1.3, "lp") + svf(pink_noise(n, rng), fc * 1.8, 1.6, "bp") * 0.35) * amp for _ in range(2)])
    ts = np.maximum(t - tp, 0)
    on = (t >= tp).astype(float)
    f0, f1, tau_p, tau_a, a_sub = sub
    f = f1 + (f0 - f1) * np.exp(-ts / tau_p)
    sub_s = np.sin(2 * np.pi * np.cumsum(f * on) / SR) * np.exp(-ts / tau_a) * att(ts, 0.002) * a_sub * on * 0.42
    kn = sum(np.sin(2 * np.pi * fr * ts) * np.exp(-ts / tau) * am for fr, tau, am in ((185, 0.07, 0.5), (412, 0.05, 0.34), (731, 0.035, 0.22))) * att(ts, 0.0008) * on
    knock_noise = svf(rng.standard_normal(n), 1100.0, 1.2, "bp") * np.exp(-ts / 0.02) * on * 0.5
    thump = sub_s + kn * 0.9 + knock_noise
    # box rattle: inharmonic wood-like modes (pitch-scaled) plus a short grain of noise
    modes = sum(np.sin(2 * np.pi * fr * wood_pitch * ts) * np.exp(-ts / tau) * am for fr, tau, am in ((301, 0.05, 0.5), (553, 0.04, 0.4), (947, 0.028, 0.3), (1480, 0.018, 0.2)))
    grain = svf(rng.standard_normal(n), 2200.0, 1.4, "bp") * np.exp(-ts / 0.008) * 0.5
    thump = thump + wood_amp * (modes * att(ts, 0.0006) + grain) * on
    thump = soft_sat(thump, 1.5)
    mono = whoosh + np.stack([thump, thump])
    wet = apply_reverb(mono, reverb_ir(0.55, pre_ms=6.0, damp_hz=2600.0, seed=seed + 31), -13.0)
    out = hp2((pad_to(mono, wet.shape[1]) + wet)[:, : int((dur + 0.1) * SR)], 32)
    return fade_edges(out, 0.003, 0.18), tp


# =========================================================================== STING (anchor = onset)
def mk_sting(seed, notes, strum=0.028, dur=3.0, rv=(2.0, -7.0), root=None):
    t = tt(dur)
    n = len(t)
    dry = np.zeros(n)
    ratios = [(1.0, 1.0, 1.0), (2.0, 0.34, 0.42), (3.01, 0.20, 0.26), (4.17, 0.12, 0.17), (5.43, 0.07, 0.12)]
    for j, fr in enumerate(notes):
        i = int(round(j * strum * SR))
        tj = t[: n - i]
        for r, am, tau in ratios:
            dry[i:] += np.sin(2 * np.pi * fr * r * tj) * am * np.exp(-tj / (0.55 * tau * 1.6)) * att(tj, 0.0012)
    sub = np.sin(2 * np.pi * 55.0 * t) * np.exp(-t / 0.30) * att(t, 0.004) * 0.9
    warm = 0.0
    if root:
        warm = (np.sin(2 * np.pi * root * t) + 0.35 * np.sin(2 * np.pi * root * 2 * t)) * np.exp(-t / 0.55) * att(t, 0.006) * 0.55
    dry = dry * 0.33 + sub * 0.22 + warm * 0.30
    dry = dry * np.where(t > dur - 0.9, np.cos(0.5 * np.pi * np.clip((t - (dur - 0.9)) / 0.9, 0, 1)) ** 2, 1.0)
    st = np.stack([dry, dry])
    wet = apply_reverb(st, reverb_ir(rv[0], pre_ms=14.0, damp_hz=4200.0, seed=seed), rv[1])
    return fade_edges(hp2(pad_to(st, wet.shape[1]) + wet, 40), 0.0003, 0.6), 0.0


# =========================================================================== GLITCH (anchor = onset)
def mk_glitch(seed, dur, slice_ms=(10, 26), freqs=(620, 930, 1450, 2200, 3300)):
    """Digital stutter: gated, repeated tone/noise slices at stepped pitches, bit-crushed and sample-and-hold decimated."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n)
    pos = 0
    while pos < n:
        sl = int(rng.uniform(*slice_ms) * SR / 1000)
        st = tt(sl / SR)
        f = float(rng.choice(freqs))
        seg = np.sign(np.sin(2 * np.pi * f * st)) * 0.5 + np.sin(2 * np.pi * f * 1.5 * st) * 0.4 + rng.standard_normal(len(st)) * 0.35
        seg *= att(st, 0.0008) * np.where(st > st[-1] - 0.002, 0.0, 1.0)
        bits = int(rng.integers(4, 7))
        seg = np.round(seg / (np.abs(seg).max() + 1e-9) * (2 ** bits)) / (2 ** bits)
        ds = int(rng.integers(3, 8))
        seg = np.repeat(seg[::ds], ds)[: len(st)]
        seg = seg * float(rng.uniform(0.6, 1.0))
        reps = int(rng.integers(1, 4))
        for _ in range(reps):
            m = min(len(seg), n - pos)
            if m <= 0:
                break
            x[pos:pos + m] += seg[:m]
            pos += len(seg)
        pos += int(rng.integers(0, 3)) * int(0.004 * SR)        # occasional tiny gate gap
    t = tt(dur)
    x = x[: len(t)] * np.exp(-t / (dur * 0.8))
    zzt = svf(rng.standard_normal(len(t)), 5200.0, 0.7071, "hp") * np.exp(-t / 0.006) * 0.5
    x = svf(x + zzt, 9000.0, 0.7071, "lp")
    x = x - x.mean()
    return fade_edges(np.stack([x, np.roll(x, int(0.0006 * SR)) * 0.9]), 0.0003, 0.02), 0.0


# =========================================================================== REWIND (anchor = start)
def mk_rewind(seed, dur):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    u = t / dur
    s = 0.15 + 0.85 * smoothstep(u / 0.22)
    s = np.where(u > 0.80, s * (1 - 0.85 * smoothstep((u - 0.80) / 0.20)), s)
    f = (150.0 + 1050.0 * s ** 1.5) * (1 + 0.025 * np.sin(2 * np.pi * 7.5 * t) + 0.010 * np.sin(2 * np.pi * 23.0 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = svf(sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 6)), 900.0 + 2200.0 * s, 0.8, "lp") * 0.50
    chans = []
    for c in range(2):
        hiss = svf(rng.standard_normal(n), 600.0 + 1800.0 * s, 1.2, "bp") * s ** 1.2 * 0.45
        gear = svf(rng.standard_normal(n), 1500.0, 2.0, "bp") * (0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(38.0 * s) / SR + c)) * s * 0.80
        motor = svf(rng.standard_normal(n), 150.0 + 90.0 * s, 2.5, "bp") * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(24.0 * s) / SR)) * s * 1.4
        chans.append(tone * (0.9 if c == 0 else 1.0) + hiss + gear + motor)
    x = np.stack(chans) * att(t, 0.012)
    ct = tt(0.12)
    cl = np.sin(2 * np.pi * 140 * ct) * np.exp(-ct / 0.022) * 0.5 + svf(rng.standard_normal(len(ct)), 1500.0, 0.7071, "hp") * np.exp(-ct / 0.004) * 0.35
    clunk = np.zeros(n)
    i = n - int(0.11 * SR)
    clunk[i:i + len(ct)] = cl[: n - i]
    x = x * np.where(t > dur - 0.12, np.exp(-(t - (dur - 0.12)) / 0.05), 1.0) + np.stack([clunk, clunk]) * 0.8
    return fade_edges(hp2(x, 60), 0.004, 0.04), 0.0


# =========================================================================== TYPE (anchor = start of the burst)
def mk_type(seed, nkeys, dur, gap=(0.058, 0.108)):
    """Soft keyboard burst, fully synthesized: each key = soft top click + bottom-out thock (band noise + case resonance) + a faint key-up tick."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros((2, n))
    kt = tt(0.12)
    t = 0.0
    for j in range(nkeys):
        r = float(rng.uniform(0.88, 1.15))
        a = float(undb(rng.uniform(-4.0, 0.0)))
        top = svf(rng.standard_normal(len(kt)), 2500.0, 0.7071, "hp") * np.exp(-kt / 0.0009) * 0.70
        thock = svf(rng.standard_normal(len(kt)), 1400.0 * r, 1.2, "bp") * np.exp(-kt / 0.005) * att(kt, 0.0005) * 1.0
        body = np.sin(2 * np.pi * 190.0 * r * kt) * np.exp(-kt / 0.012) * att(kt, 0.0006) * 0.22
        up_i = int(rng.uniform(0.070, 0.095) * SR)
        up = np.zeros(len(kt))
        m = min(len(kt) - up_i, int(0.01 * SR))
        if m > 0:
            up[up_i:up_i + m] = svf(rng.standard_normal(m), 3000.0, 0.7071, "hp") * np.exp(-np.arange(m) / SR / 0.0006) * 0.16
        key = svf(svf(top + thock + body + up, 5500.0, 0.7071, "lp"), 5500.0, 0.7071, "lp")
        i = int(round(t * SR))
        stt = equal_power_pan(key * a, float(rng.uniform(-0.12, 0.12)))
        m = min(stt.shape[1], n - i)
        if m > 0:
            x[:, i:i + m] += stt[:, :m]
        t += float(rng.uniform(*gap))
        if t * SR >= n - 0.2 * SR:
            break
    x = x - x.mean(axis=1, keepdims=True)
    return fade_edges(x, 0.0002, 0.03), 0.0


# =========================================================================== catalogue
def catalogue():
    C = []
    C += [("whoosh", "whoosh_1", "peak", lambda: mk_whoosh(11, 0.80, 0.30, (250, 2000, 700), 1.8, 1.6, 0.16, (-0.5, 0.5), 0.12, 0.35, 0.5),
           "pass-by whoosh: pink noise through a swept band-pass 250 Hz -> 2.0 kHz -> 700 Hz (Q 1.8) plus a 2x formant band and a half-frequency body layer, swept 3.5 -> 0.6 ms flanger, cosine rise 0.30 s then 0.16 s decay, L->R pan, faint 5.5 kHz air"),
          ("whoosh", "whoosh_2", "peak", lambda: mk_whoosh(12, 0.45, 0.15, (700, 3600, 1500), 2.0, 1.2, 0.09, (0.6, -0.6), 0.20, 0.10),
           "quick swish: band-pass 0.7 -> 3.6 -> 1.5 kHz (Q 2.0) plus formant band, 0.15 s rise, 0.09 s decay, R->L pan"),
          ("whoosh", "whoosh_3", "peak", lambda: mk_whoosh(13, 1.15, 0.50, (180, 1500, 380), 1.4, 2.0, 0.22, (-0.7, 0.7), 0.10, 0.70, 0.4),
           "long heavy pass-by: band-pass 180 Hz -> 1.5 kHz -> 380 Hz (Q 1.4) with a strong half-frequency body layer and a light flanger, 0.5 s rise, wide pan"),
          ("whoosh", "whoosh_4", "peak", lambda: mk_whoosh(14, 0.90, 0.62, (300, 3200, 1200), 1.8, 2.4, 0.07, (-0.15, 0.15), 0.15, 0.25, 0.35),
           "inbound zoom whoosh: band-pass 300 Hz -> 3.2 kHz (Q 1.8), slow rise to 0.62 s then a quick 0.07 s fall, near-centre wide noise, light flanger")]
    C += [("tick", "tick_1", "onset", mk_tick_kit,
           "licence-checked Signal Atlas kit click: audio_build/sfx/style6/button_press_f0.wav (derived from the library file '06 UI, Clicks & Camera/rm click (3).wav'); the main transient sits on the cue"),
          ("tick", "tick_2", "onset", lambda: mk_tick(21, 2400.0),
           "token-commit click: 0.5 ms band-limited noise burst (3.2-9 kHz) + 2.4 kHz ping (tau 3 ms) + 620 Hz knock + a faint release click at 22 ms"),
          ("tick", "tick_3", "onset", lambda: mk_tick(22, 1900.0, 2900.0),
           "token-commit click, as tick_2 with a 1.9 kHz ping (slightly rounder)"),
          ("tick", "tick_4", "onset", lambda: mk_tick(23, 3100.0, 3600.0),
           "token-commit click, as tick_2 with a 3.1 kHz ping (slightly brighter)")]
    C += [("pop", "pop_%d" % (i + 1), "onset", (lambda f=f, s=30 + i: mk_pop(s, f)),
           "bloop: sine chirp ending on %.0f Hz (starts at 0.5x, 7 ms glide), decay tau 16 ms, 2nd harmonic -12 dB, faint HP air puff, low-passed 5 kHz (A-minor pentatonic pitch)" % f)
          for i, f in enumerate((N["C5"], N["E5"], N["G5"], N["A5"]))]
    C += [("impact", "impact_1", "onset", lambda: mk_impact(41, 2.2, (110, 46, 0.075, 0.55, 1.0), (700, 0.12), (2800, 0.008), (1.9, -9.0, 2600)),
           "heavy cinematic hit: 110 -> 46 Hz sine drop (tau 75 ms, decay 0.55 s), low-passed noise thump, 170/262 Hz body, 1.4 kHz mid slap, HP crack, soft saturation, dark synthetic hall (RT60 1.9 s)"),
          ("impact", "impact_2", "onset", lambda: mk_impact(42, 1.0, (130, 68, 0.040, 0.22, 0.95), (900, 0.07), (3200, 0.010), (0.55, -11.0, 3200), drive=2.0, knock_f=(210, 330)),
           "tight slam: 130 -> 68 Hz drop (decay 0.22 s), body 210/330 Hz, mid slap, crack, saturation, small room (RT60 0.55 s)"),
          ("impact", "impact_3", "onset", lambda: mk_impact(43, 1.7, (100, 52, 0.06, 0.36, 0.85), (800, 0.09), (3400, 0.006), (1.6, -8.0, 3800),
                                                            partials=[(440.0, 0.16, 0.9), (440 * 2.32, 0.09, 0.5), (440 * 4.18, 0.05, 0.3), (440 * 6.7, 0.03, 0.2)], drive=1.4),
           "glass-metal hit: sub drop 100 -> 52 Hz plus inharmonic bell partials on A4 (x1, 2.32, 4.18, 6.7), hall RT60 1.6 s")]
    rs = "noise band-pass swept 250 Hz -> 9 kHz (Q 1 -> 4), detuned saw stack A3 -> E4 rising a fifth under an opening low-pass, sine sub 55 -> 110 Hz, accelerating tremolo 5 -> 18 Hz, t^2.6 build with the noise rising a further 3.5x in level; the anchor is the end of the build"
    C += [("riser", "riser_1", "end", lambda: mk_riser(51, 1.2), "1.2 s riser: pink " + rs),
          ("riser", "riser_2", "end", lambda: mk_riser(52, 2.0), "2.0 s riser, same recipe"),
          ("riser", "riser_3", "end", lambda: mk_riser(53, 3.2), "3.2 s riser, same recipe")]
    C += [("swell", "swell_1", "peak", lambda: mk_swell(61, 2.2, 1.5, [N["A2"], N["E3"], N["A3"], N["C4"], N["E4"], N["B4"]]),
           "pad swell on Am(add9): 3 detuned band-limited saws per note, low-pass opening 500 Hz -> 3.2 kHz, sin^2.4 rise to the peak at 1.5 s, hall reverb RT60 1.8 s"),
          ("swell", "swell_2", "peak", lambda: mk_swell(62, 3.0, 2.1, [N["F2"], N["C3"], N["A3"], N["C4"], N["E4"], N["G4"]], cutoff=(450, 3000)),
           "pad swell on Fmaj7(add9), peak at 2.1 s"),
          ("swell", "swell_3", "peak", lambda: mk_swell(63, 4.0, 2.8, [N["C3"], N["G3"], N["E4"], N["B4"], N["D5"], N["G5"]], cutoff=(550, 3600), rt60=2.2),
           "pad swell on Cmaj9, peak at 2.8 s, hall RT60 2.2 s")]
    C += [("dial", "dial_1", "start", lambda: mk_dial(71, 0.70, 14, 0.024, 0.060, (200, 110)), "ratcheting dial: 14 detent clicks slowing 24 -> 60 ms apart, falling hum 200 -> 110 Hz, 50 Hz-modulated electrical fizz; 0.7 s"),
          ("dial", "dial_2", "start", lambda: mk_dial(72, 1.00, 20, 0.022, 0.070, (220, 98)), "ratcheting dial, 1.0 s, 20 clicks, hum 220 -> 98 Hz"),
          ("dial", "dial_3", "start", lambda: mk_dial(73, 1.40, 26, 0.020, 0.085, (240, 90)), "ratcheting dial, 1.4 s, 26 clicks, hum 240 -> 90 Hz")]
    C += [("crate", "crate_1", "thump", lambda: mk_crate(81, 1.15, 0.42, (120, 1000, 260), (82, 46, 0.045, 0.30, 1.0), 1.0),
           "heavy whoosh-thump: low-passed pink noise swept 120 Hz -> 1 kHz building for 0.42 s, then a sine-drop thump 82 -> 46 Hz, wood-box modes (185/412/731 Hz and a 301-1480 Hz rattle), a noise grain, small room; anchor = the thump"),
          ("crate", "crate_2", "thump", lambda: mk_crate(82, 0.95, 0.34, (140, 1300, 320), (92, 52, 0.04, 0.24, 0.95), 1.18),
           "crate_1 recipe, shorter build (0.34 s), thump 92 -> 52 Hz, rattle pitched up"),
          ("crate", "crate_3", "thump", lambda: mk_crate(83, 1.30, 0.52, (100, 900, 220), (74, 42, 0.05, 0.36, 1.0), 0.84),
           "crate_1 recipe, longer build (0.52 s), thump 74 -> 42 Hz, rattle pitched down")]
    C += [("sting", "sting_1", "onset", lambda: mk_sting(91, [N["A4"], N["E5"], N["A5"]], root=110.0), "glass-pixel chord stab A4 E5 A5 (additive bell partials 1, 2, 3.01, 4.17, 5.43; 28 ms strum), warm A2 root, 55 Hz sine boom, hall RT60 2.0 s"),
          ("sting", "sting_2", "onset", lambda: mk_sting(92, [N["C5"], N["G5"], N["C6"]], root=130.81), "chord stab C5 G5 C6 over a C3 root"),
          ("sting", "sting_3", "onset", lambda: mk_sting(93, [N["D5"], N["A5"], N["E6"]], root=146.83), "chord stab D5 A5 E6 over a D3 root (suspended, question-like)")]
    gl = "digital stutter: gated square/fifth/noise slices at stepped pitches (620-3300 Hz), 4-6 bit crush, 3-7x sample-and-hold decimation, repeated 1-3x, plus a 6 ms HF zzt"
    C += [("glitch", "glitch_1", "onset", lambda: mk_glitch(101, 0.24), gl + "; 0.24 s"),
          ("glitch", "glitch_2", "onset", lambda: mk_glitch(102, 0.32, (8, 20)), gl + "; 0.32 s, shorter slices"),
          ("glitch", "glitch_3", "onset", lambda: mk_glitch(103, 0.18, (12, 30)), gl + "; 0.18 s, longer slices")]
    rw = "tape rewind: sawtooth whine 150 Hz -> 1.2 kHz with wow/flutter (7.5 and 23 Hz), 150-240 Hz motor rumble, band-pass hiss, 38 Hz-modulated gear noise, 0.2 s spool-up, slow-down and clunk at the end"
    C += [("rewind", "rewind_1", "start", lambda: mk_rewind(111, 0.90), rw + "; 0.9 s"),
          ("rewind", "rewind_2", "start", lambda: mk_rewind(112, 1.20), rw + "; 1.2 s"),
          ("rewind", "rewind_3", "start", lambda: mk_rewind(113, 1.60), rw + "; 1.6 s")]
    ty = "soft keyboard burst, synthesized: per key a soft HP top click, a 1.4 kHz band-noise thock, a 190 Hz case resonance (tau 12 ms) and a faint key-up tick, low-passed 5.5 kHz, +-12% pitch, 0 to -4 dB per key, keys 58-108 ms apart"
    C += [("type", "type_1", "start", lambda: mk_type(121, 9, 0.80), ty + "; 9 keys"),
          ("type", "type_2", "start", lambda: mk_type(122, 12, 1.10), ty + "; 12 keys"),
          ("type", "type_3", "start", lambda: mk_type(123, 6, 0.55, (0.050, 0.095)), ty + "; 6 keys")]
    return C


# =========================================================================== analysis helpers
def loud100(x):
    """Max 100 ms K-weighted (ungated) loudness of a clip, channels summed."""
    z = np.zeros((x.shape[0], int(0.05 * SR)))
    km = KMeter(np.concatenate([z, x, z, z], axis=1))
    W = int(0.1 * SR)
    st = np.arange(0, max(km.n - W, 1), int(0.01 * SR))
    return float(lufs_from_power(km.ms_many(st / SR, (st + W) / SR).max()))


def phone_drop(x):
    """loud100 of the clip minus loud100 after a 150 Hz 4-pole high-pass: how much a phone speaker would take away."""
    y = np.stack([hp(hp(c, 150.0), 150.0) for c in x])
    return loud100(x) - loud100(y)


def profile(x):
    m = x.mean(axis=0)
    S = np.abs(np.fft.rfft(m * np.hanning(len(m)), 1 << 16)) ** 2
    f = np.fft.rfftfreq(1 << 16, 1 / SR)
    tot = S.sum() + 1e-30
    edges = [0, 150, 500, 2000, 6000, 24001]
    bands = [round(float(100 * S[(f >= edges[i]) & (f < edges[i + 1])].sum() / tot), 1) for i in range(5)]
    env = np.abs(x).max(axis=0)
    return float((S * f).sum() / tot), bands, int(np.argmax(env > 10 ** (-40 / 20) * env.max())) / SR


def main():
    os.makedirs(PAL, exist_ok=True)
    built = {}
    for kind, name, anchor_kind, fn, desc in catalogue():
        x, anchor_s = fn()
        x = np.atleast_2d(x)
        if x.shape[0] == 1:
            x = np.vstack([x[0], x[0]])
        env = np.abs(x).max(axis=0)
        last = len(env) - int(np.argmax(env[::-1] > env.max() * 10 ** (-72 / 20)))     # trim trailing silence
        x = x[:, : max(last + int(0.01 * SR), int((anchor_s + 0.02) * SR))]
        built.setdefault(kind, []).append(dict(name=name, anchor_kind=anchor_kind, x=x, anchor_s=float(anchor_s), desc=desc))
    meta = {"sr": SR, "bit_depth": 24, "channels": 2, "kinds": {}}
    src_lines = []
    for kind, items in built.items():
        for it in items:
            it["l100"] = loud100(it["x"])
        target = float(np.mean([it["l100"] for it in items]))
        for it in items:
            it["x"] = it["x"] * undb(target - it["l100"])
        scale = undb(-1.0) / max(np.abs(it["x"]).max() for it in items)
        variants = []
        for it in items:
            x = it["x"] * scale
            assert np.all(np.isfinite(x))
            path = os.path.join(PAL, it["name"] + ".wav")
            write_wav(path, x, bits=24)
            cent, bands, first = profile(x)
            variants.append({"file": it["name"] + ".wav", "anchor_s": round(it["anchor_s"], 4), "anchor": it["anchor_kind"],
                             "dur_s": round(x.shape[1] / SR, 4), "peak_dBFS": round(db(np.abs(x).max()), 2),
                             "loud100_LUFS": round(loud100(x), 2), "phone_drop_dB": round(phone_drop(x), 1), "centroid_hz": round(cent),
                             "bands_pct_<150/150-500/0.5-2k/2-6k/>6k": bands, "onset_s": round(first, 4),
                             "dc": round(float(x.mean()), 6), "sha256": sha256(path)})
            src_lines.append((it["name"], kind, it["desc"]))
        meta["kinds"][kind] = {"anchor": items[0]["anchor_kind"], "n_variants": len(variants), "variants": variants}
    json.dump(meta, open(os.path.join(PAL, "palette.json"), "w"), indent=1)
    write_sources(src_lines)
    print("palette:", sum(len(v["variants"]) for v in meta["kinds"].values()), "files in", PAL)


def write_sources(lines):
    def sh(p):
        return sha256(p) if os.path.exists(p) else "n/a"
    md = ["# Episode 06 sound palette: sources and cue conventions", "",
          "Built by `build_palette.py` (deterministic: seeded RNGs). 48 kHz stereo 24-bit WAVs; `palette.json` holds each file's anchor, duration, peak, loudness and spectrum.",
          "Nobody listened: every judgement is by measurement (peaks, loudness, spectra, spectrogram plots).", "",
          "## Licensing", "",
          "- Everything is **synthesized in numpy** for this project (no credit needed) except `tick_1.wav`.",
          "- `tick_1.wav` is the licence-checked Signal Atlas kit click `audio_build/sfx/style6/button_press_f0.wav` (sha256 `%s`), itself cut from the library file `D:/Assets/01 Audio/Sound Effects/06 UI, Clicks & Camera/rm click (3).wav` (plain name, no pack metadata, origin unknown, as recorded in `audio_build/CREDITS.md`)." % sh(os.path.join(KIT, "button_press_f0.wav")),
          "- No other library audio is used. Nothing here is from Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX, Muctau, CSFX, an `AM - ` file or Epidemic Sound, and no UCS-style name (DSGN..., COMCam_, MAGShim_, B00M) is involved. Library audio, where used, is only decoded; nothing from the library is executed.", "",
          "## Cue timing conventions (for the section builders)", "",
          "`build_mix.py` aligns each sound's **anchor** to the cue frame (`frame / 30` s). Put the cue where the event lands:", "",
          "| kind | anchor (what sits on the cue frame) | length |", "|---|---|---|",
          "| `whoosh` | the peak of the move (about 35-55% into the sound, so it starts 0.15-0.6 s earlier) | 0.45-1.15 s |",
          "| `tick`, `pop` | the onset | 40-110 ms |",
          "| `impact`, `sting` | the onset (the hit / the first note) | 1.0-3.0 s |",
          "| `riser` | the **arrival** (the end of the build); it starts 1.2 / 2.0 / 3.2 s before | 1.4-3.4 s |",
          "| `swell` | the **peak** of the swell; it starts 1.5-2.8 s before | 2.2-4.0 s |",
          "| `dial`, `rewind`, `type`, `glitch` | the start of the turn / scrub / typing / glitch | 0.2-1.6 s |",
          "| `crate` | the **thump** (the crate lands); its heavy whoosh starts 0.34-0.52 s before | 0.95-1.3 s |", "",
          "Variants rotate deterministically by the n-th cue of that kind in time order. Strength 0..1 sets the level (an 8-12 dB range, by kind).",
          "Never more than 3 sounds start within 100 ms (the weakest are dropped).", "",
          "## Files", "", "| file | kind | how it was made |", "|---|---|---|"]
    for name, kind, desc in lines:
        md.append("| `%s.wav` | %s | %s |" % (name, kind, desc))
    open(os.path.join(PAL, "SOURCES.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")


if __name__ == "__main__":
    main()
