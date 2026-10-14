"""Instruments and effects for the Episode 03 score (numpy + numba, deterministic). All instruments return float64 stereo (2, n)."""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402
from lib_v2 import njit  # noqa: E402

SR = L.SR


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=np.float64) - 69.0) / 12.0)


# ----------------------------------------------------------------------------------------------- oscillators
def saw(freq, n, phase0=0.0):
    """Band-limited (polyBLEP) sawtooth; freq scalar or per-sample array."""
    dt = np.broadcast_to(np.asarray(freq, dtype=np.float64) / SR, (n,))
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1.0
    m = ph > 1.0 - dt
    t = (ph[m] - 1.0) / dt[m]
    y[m] -= t * t + t + t + 1.0
    return y


def tri(freq, n, phase0=0.0):
    dt = np.broadcast_to(np.asarray(freq, dtype=np.float64) / SR, (n,))
    ph = (phase0 + np.cumsum(dt)) % 1.0
    return 4.0 * np.abs(ph - 0.5) - 1.0


def sine(freq, n, phase0=0.0):
    dt = np.broadcast_to(np.asarray(freq, dtype=np.float64) / SR, (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(dt)))


def adsr(n, a, d, s, r, hold=None):
    """Linear-in-dB-ish ADSR (curved), n samples total; release starts at `hold` seconds (default n - r)."""
    t = np.arange(n) / SR
    h = (n / SR - r) if hold is None else hold
    env = np.where(t < a, (t / max(a, 1e-4)) ** 0.7, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - h) / max(r, 1e-4), 0, 1)
    env = env * (1 - rel) ** 2
    return env


# ----------------------------------------------------------------------------------------------- instruments
def pad_chord(notes, dur, vel=0.5, seed=0, attack=1.5, release=2.5, cut0=500.0, cut1=1800.0, voices=5, detune=11.0, bright=1.0):
    """Detuned saw pad: `voices` saws per note spread +-detune cents, stereo spread, slowly opening low-pass."""
    r = L.rng(seed)
    n = int((dur + release) * SR)
    out = np.zeros((2, n))
    t = np.arange(n) / SR
    for m in notes:
        f = mtof(m)
        for k in range(voices):
            c = (k - (voices - 1) / 2) / max(1, (voices - 1) / 2) * detune
            drift = 1 + 0.0009 * np.sin(2 * np.pi * r.uniform(0.05, 0.2) * t + r.uniform(0, 6.3))
            y = saw(f * 2 ** (c / 1200) * drift, n, r.uniform())
            p = (k / max(1, voices - 1)) * 1.6 - 0.8
            out[0] += y * np.cos((p + 1) * np.pi / 4)
            out[1] += y * np.sin((p + 1) * np.pi / 4)
    out /= np.sqrt(len(notes) * voices)
    env = adsr(n, attack, 2.0, 0.85, release, hold=dur)
    cut = (cut0 + (cut1 - cut0) * np.clip(t / max(attack * 1.6, 0.1), 0, 1) ** 1.5) * bright
    cut = cut * (1 + 0.08 * np.sin(2 * np.pi * 0.13 * t))
    out = L.svf(out, cut, 0.8, "lp")
    out = L.butter(out, "hp", 70, 2)
    return out * env * vel


def pluck(m, dur=0.6, vel=0.5, seed=0, bright=1.0, decay=0.28):
    """Warm digital pluck: two detuned saws + sine sub through an enveloped low-pass."""
    r = L.rng(seed)
    n = int((dur + 0.25) * SR)
    f = mtof(m)
    y = saw(f * 1.0035, n, r.uniform()) + saw(f * 0.9965, n, r.uniform()) + 0.5 * sine(f / 2, n)
    t = np.arange(n) / SR
    cut = 450 + 3200 * bright * np.exp(-t / 0.11)
    y = L.svf(y, cut, 1.1, "lp")
    env = np.minimum(1, t / 0.003) * np.exp(-t / decay)
    env[int(dur * SR):] *= np.exp(-(t[int(dur * SR):] - dur) / 0.06)
    y = y * env * vel * 0.4
    return np.vstack([y, y])


def bell(m, dur=2.5, vel=0.5, seed=0, glass=1.0):
    """Glass bell (additive, slightly inharmonic) for the loop motif and stings."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = np.zeros(n)
    for ratio, a, d in [(1.0, 1.0, 1.4), (2.0, 0.35, 0.8), (2.76, 0.28 * glass, 0.55), (4.07, 0.14 * glass, 0.35), (5.43, 0.08 * glass, 0.22)]:
        y += a * np.sin(2 * np.pi * f * ratio * (1 + r.uniform(-0.0004, 0.0004)) * t + r.uniform(0, 6.3)) * np.exp(-t / d)
    y *= np.minimum(1, t / 0.002)
    y = L.fade(y, 0.0, 0.05)
    l = y * 0.5
    rr = np.roll(y, 23) * 0.5
    return np.vstack([l, rr]) * vel


def epiano(m, dur=1.2, vel=0.5, seed=0):
    """Soft FM electric-piano-like tone (2-op, ratio 1:1 with a 14:1 tine)."""
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    I = 1.6 * np.exp(-t / 0.35) * vel
    tine = 0.15 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t)) + tine
    env = np.minimum(1, t / 0.004) * np.exp(-t / 1.1)
    env[int(dur * SR):] *= np.exp(-(t[int(dur * SR):] - dur) / 0.15)
    y = y * env * vel * 0.5
    return np.vstack([y * 0.95, np.roll(y, 17)])


def lead(m, dur, vel=0.5, seed=0, attack=0.25, release=0.9, cut=1900.0, vib=8.0):
    """Broad theme voice: 4 detuned saws + a triangle an octave down, slow attack, delayed vibrato, low-pass ~1.9 kHz."""
    r = L.rng(seed)
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    vibr = 1 + (vib / 1200 * np.log(2)) * np.sin(2 * np.pi * 5.1 * t) * np.clip((t - 0.45) / 0.6, 0, 1)
    out = np.zeros((2, n))
    for k, c in enumerate([-9, -3, 3, 9]):
        y = saw(f * 2 ** (c / 1200) * vibr, n, r.uniform())
        out[k % 2] += y
    sub = tri(f / 2 * vibr, n, r.uniform()) * 0.8
    out += sub
    out = L.svf(out, cut * (0.55 + 0.45 * np.clip(t / (attack * 2), 0, 1)), 0.9, "lp")
    env = adsr(n, attack, 0.5, 0.82, release, hold=dur)
    return out * env * vel * 0.3


def sub(m, dur, vel=0.5, release=0.15, attack=0.02):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(4 * np.pi * f * t)
    y = np.tanh(1.4 * y) / np.tanh(1.4)
    env = adsr(n, attack, 0.3, 0.9, release, hold=dur)
    y = y * env * vel
    return np.vstack([y, y])


def kick(vel=0.6, tone=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 75 * tone * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    y += 0.25 * L.butter(L.rng(3).standard_normal(n), "lp", 900, 2) * np.exp(-t / 0.006)
    y = L.butter(y, "lp", 260, 2)
    return np.vstack([y, y]) * vel


def taiko(vel=0.7, pitch=1.0, seed=0):
    r = L.rng(seed)
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = (62 + 30 * np.exp(-t / 0.05)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    skin = L.butter(r.standard_normal(n), "lp", 520, 2) * np.exp(-t / 0.05) * 0.8
    mid = np.sin(2 * np.pi * 138 * pitch * t) * np.exp(-t / 0.12) * 0.35
    y = np.tanh(1.5 * (body + skin + mid))
    y = L.butter(y, "lp", 700, 2)
    return np.vstack([y, np.roll(y, 11)]) * vel


def hat(vel=0.3, open_=False, seed=0):
    r = L.rng(seed)
    n = int((0.25 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    y = L.butter(r.standard_normal(n), "hp", 7200, 4) * np.exp(-t / (0.07 if open_ else 0.018))
    return np.vstack([y, np.roll(y, 7)]) * vel * 0.6


def tick(vel=0.3, seed=0, f=9200.0):
    r = L.rng(seed)
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    y = (L.butter(r.standard_normal(n), "hp", 6000, 2) * np.exp(-t / 0.0015) + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.005))
    return np.vstack([y, y]) * vel


def brass_stab(notes, vel=0.8, dur=1.8, seed=0):
    """Low synth-brass stab for hits: detuned saws, fast attack, closing low-pass."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        for k, c in enumerate([-10, -4, 4, 10]):
            out[k % 2] += saw(mtof(m) * 2 ** (c / 1200), n, r.uniform())
    out /= np.sqrt(len(notes) * 4)
    cut = 300 + 1500 * np.exp(-t / 0.25)
    out = L.svf(out, cut, 1.0, "lp")
    env = np.minimum(1, t / 0.008) * np.exp(-t / 0.7)
    return np.tanh(1.3 * out * env) * vel


def noise_swell(dur, vel=0.4, seed=0, lo=2500, hi=9000, rev=True):
    """Reverse-cymbal style swell (rises into its end)."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = L.butter(r.standard_normal((2, n)), "bp", [lo, hi], 2)
    env = (t / dur) ** 3 if rev else np.exp(-t / (dur / 4))
    return y * env * vel * 0.5


def tonal_riser(notes, dur, vel=0.5, seed=0):
    """Rising detuned-saw cluster (glides up a fifth) + noise, for musical builds; ends at `dur`."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    glide = 2 ** (7 / 12 * u ** 2)
    out = np.zeros((2, n))
    for m in notes:
        for k, c in enumerate([-12, 0, 12]):
            out[k % 2] += saw(mtof(m) * glide * 2 ** (c / 1200), n, r.uniform())
    out = L.svf(out, 300 + 4200 * u ** 2.2, 1.2, "lp")
    out += L.butter(r.standard_normal((2, n)), "hp", 3000, 2) * 0.25 * u ** 3
    env = u ** 2.4
    return out * env * vel * 0.35


# ----------------------------------------------------------------------------------------------- effects
@njit(cache=False, fastmath=True)
def _chorus(x, sr, depth_ms, base_ms, rate, phase):
    n = x.shape[0]
    y = np.zeros(n)
    buf_n = int((base_ms + depth_ms + 5) * sr / 1000) + 2
    buf = np.zeros(buf_n)
    w = 0
    for i in range(n):
        buf[w] = x[i]
        d = (base_ms + depth_ms * 0.5 * (1 + np.sin(2 * np.pi * rate * i / sr + phase))) * sr / 1000.0
        rp = w - d
        while rp < 0:
            rp += buf_n
        i0 = int(rp)
        fr = rp - i0
        i1 = i0 + 1
        if i1 >= buf_n:
            i1 = 0
        y[i] = buf[i0] * (1 - fr) + buf[i1] * fr
        w += 1
        if w >= buf_n:
            w = 0
    return y


def chorus(x, mix=0.45, depth_ms=4.0, base_ms=14.0, rate=0.35):
    l = _chorus(np.ascontiguousarray(x[0]), float(SR), depth_ms, base_ms, rate, 0.0)
    r = _chorus(np.ascontiguousarray(x[1]), float(SR), depth_ms, base_ms * 1.13, rate * 1.07, 1.7)
    return np.vstack([x[0] * (1 - mix) + l * mix, x[1] * (1 - mix) + r * mix])


@njit(cache=False, fastmath=True)
def _pingpong(l, r, d, fb, damp):
    n = l.shape[0]
    bl = np.zeros(d)
    br = np.zeros(d)
    yl = np.zeros(n)
    yr = np.zeros(n)
    w = 0
    zl = 0.0
    zr = 0.0
    for i in range(n):
        ol = bl[w]
        orr = br[w]
        yl[i] = ol
        yr[i] = orr
        zl = zl + damp * (orr - zl)
        zr = zr + damp * (ol - zr)
        bl[w] = l[i] + fb * zl
        br[w] = r[i] * 0.0 + fb * zr
        w += 1
        if w >= d:
            w = 0
    return yl, yr


def pingpong(x, delay_s, fb=0.35, wet=0.3, damp=0.35):
    d = int(delay_s * SR)
    mono_in = 0.5 * (x[0] + x[1])
    yl, yr = _pingpong(np.ascontiguousarray(mono_in), np.ascontiguousarray(mono_in), d, fb, damp)
    return x + wet * np.vstack([yl, yr])


def tape_stop(x, i0, i1):
    """Tape-stop between samples i0..i1 of x (2, n): playback speed falls 1 -> 0 (quadratic), silence after i1."""
    seg_len = i1 - i0
    u = np.arange(seg_len) / seg_len
    speed = (1 - u) ** 1.6
    pos = i0 + np.cumsum(speed)
    out = x.copy()
    for c in range(2):
        out[c, i0:i1] = np.interp(pos, np.arange(x.shape[1]), x[c]) * (1 - u ** 3)
    out[:, i1:] = 0.0
    return out
