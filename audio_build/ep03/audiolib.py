"""Shared DSP / IO helpers for the Episode 03 sound build (numpy, scipy, numba, ffmpeg).

Run every script that imports this with  python -I  (isolated mode); the scripts add this folder to sys.path themselves.
Nothing here executes anything from the sound libraries: audio is only decoded (ffmpeg) or read as plain WAV data.
"""
import hashlib
import json
import os
import re
import subprocess

import numpy as np
try:
    from numba import njit
except Exception:  # numba missing: the same loops run as plain Python (slower, identical results)
    def njit(*a, **k):
        def deco(f):
            return f
        return deco(a[0]) if a and callable(a[0]) else deco
from scipy import signal
from scipy.ndimage import maximum_filter1d

SR = 48000
FPS = 30


# --------------------------------------------------------------------------- basics
def db(v):
    return 20.0 * np.log10(max(float(v), 1e-12))


def undb(d):
    return 10.0 ** (np.asarray(d, dtype=np.float64) / 20.0)


def sha256(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def load(path, sr=SR, ch=2, start=None, dur=None):
    """Decode any audio file with ffmpeg to float64 array (ch, n). No execution of file content, decode only."""
    cmd = ["ffmpeg", "-v", "error", "-nostdin"]
    if start is not None:
        cmd += ["-ss", "%.6f" % start]
    if dur is not None:
        cmd += ["-t", "%.6f" % dur]
    cmd += ["-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", str(ch), "-ar", str(sr), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype="<f4").astype(np.float64)
    return x.reshape(-1, ch).T.copy()


def write_wav(path, x, sr=SR, bits=24):
    """Write (ch, n) float audio as PCM WAV through ffmpeg. Raises if any sample is beyond full scale."""
    x = np.atleast_2d(x)
    if x.size and np.max(np.abs(x)) > 1.0:
        raise ValueError("write_wav: sample peak above 0 dBFS in %s (%.2f dB)" % (path, db(np.max(np.abs(x)))))
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    codec = {16: "pcm_s16le", 24: "pcm_s24le", 32: "pcm_f32le"}[bits]
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-y", "-f", "f32le", "-ar", str(sr), "-ac", str(x.shape[0]), "-i", "-",
           "-c:a", codec, "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", path]
    subprocess.run(cmd, input=x.T.astype("<f4").tobytes(), check=True)


def ff_filter(x, chain, sr=SR):
    """Run (ch, n) float audio through an ffmpeg -af chain (float pipe)."""
    x = np.atleast_2d(x)
    ch = x.shape[0]
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-f", "f32le", "-ar", str(sr), "-ac", str(ch), "-i", "-",
           "-af", chain + ",aresample=%d,aformat=sample_fmts=flt" % sr, "-f", "f32le", "-ac", str(ch), "-"]
    out = subprocess.run(cmd, input=x.T.astype("<f4").tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype="<f4").astype(np.float64).reshape(-1, ch).T.copy()


def ffmpeg_r128(path):
    """Official ffmpeg ebur128 summary of a file: integrated loudness, LRA, true peak."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-nostdin", "-i", path, "-af",
                        "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    t = r.stderr[r.stderr.rfind("Summary:"):]

    def g(pat):
        return float(re.search(pat, t, re.S).group(1))

    return {"I": g(r"I:\s+(-?[\d.]+) LUFS"), "LRA": g(r"LRA:\s+(-?[\d.]+) LU"),
            "TP": g(r"True peak:\s+Peak:\s+(-?[\d.]+) dBFS")}


def ffprobe_stream(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "stream=sample_rate,channels,bits_per_raw_sample,duration_ts,codec_name:format=duration",
                          "-of", "json", path], capture_output=True, text=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    s["format_duration"] = float(j["format"]["duration"])
    return s


# --------------------------------------------------------------------------- loudness (ITU-R BS.1770-4)
def _kfilter(sr=SR):
    f0, G, Q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    K = np.tan(np.pi * f0 / sr)
    Vh = 10 ** (G / 20)
    Vb = Vh ** 0.4996667741545416
    a0 = 1 + K / Q + K * K
    b1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0]
    a1 = [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]
    f0, Q = 38.13547087602444, 0.5003270373238773
    K = np.tan(np.pi * f0 / sr)
    a0 = 1 + K / Q + K * K
    b2 = [1, -2, 1]
    a2 = [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]
    return (b1, a1), (b2, a2)


def kweight(x, sr=SR):
    (b1, a1), (b2, a2) = _kfilter(sr)
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, np.atleast_2d(x), axis=-1), axis=-1)


def lufs_from_power(p):
    return -0.691 + 10 * np.log10(np.maximum(p, 1e-20))


def kpower_cs(x, sr=SR, chunk=1 << 21):
    """Cumulative sum (length n+1, float64) of the K-weighted power of a (ch, n) signal, channels summed. Filtered in chunks with the
    filter state carried over, so the result equals filtering the whole signal at once while using little memory."""
    x = np.atleast_2d(x)
    ch, n = x.shape
    (b1, a1), (b2, a2) = _kfilter(sr)
    zi1 = np.zeros((ch, max(len(a1), len(b1)) - 1))
    zi2 = np.zeros((ch, max(len(a2), len(b2)) - 1))
    cs = np.empty(n + 1)
    cs[0] = 0.0
    acc = 0.0
    for a in range(0, n, chunk):
        xc = np.asarray(x[:, a:a + chunk], dtype=np.float64)
        y, zi1 = signal.lfilter(b1, a1, xc, axis=-1, zi=zi1)
        y, zi2 = signal.lfilter(b2, a2, y, axis=-1, zi=zi2)
        c = np.cumsum((y * y).sum(axis=0)) + acc
        cs[a + 1:a + 1 + len(c)] = c
        acc = float(c[-1])
    return cs


class KMeter:
    """K-weighted power of a stereo signal as a cumulative sum, so any window's loudness is O(1).
    ms()/lufs() are ungated mean-square loudness of an arbitrary window (channels summed, as in BS.1770)."""

    def __init__(self, x, sr=SR):
        self.sr = sr
        x = np.atleast_2d(x)
        self.n = x.shape[1]
        self.cs = kpower_cs(x, sr)

    def ms(self, t0, t1):
        i0 = int(np.clip(round(t0 * self.sr), 0, self.n))
        i1 = int(np.clip(round(t1 * self.sr), 0, self.n))
        if i1 <= i0:
            return 1e-20
        return (self.cs[i1] - self.cs[i0]) / (i1 - i0)

    def ms_many(self, t0, t1):
        i0 = np.clip(np.round(np.asarray(t0) * self.sr).astype(np.int64), 0, self.n)
        i1 = np.clip(np.round(np.asarray(t1) * self.sr).astype(np.int64), 0, self.n)
        d = np.maximum(i1 - i0, 1)
        return (self.cs[i1] - self.cs[i0]) / d

    def lufs(self, t0, t1):
        return float(lufs_from_power(self.ms(t0, t1)))

    def lufs_many(self, t0, t1):
        return lufs_from_power(self.ms_many(t0, t1))


def integrated_from_cs(cs, sr=SR, block=0.4, hop=0.1):
    """Gated integrated loudness (absolute gate -70 LUFS, relative gate -10 LU) from a K-power cumulative sum (see kpower_cs)."""
    n = len(cs) - 1
    B, H = int(round(block * sr)), int(round(hop * sr))
    st = np.arange(0, n - B + 1, H)
    if len(st) == 0:
        return -70.0
    p = (cs[st + B] - cs[st]) / B
    p = p[lufs_from_power(p) > -70]
    if len(p) == 0:
        return -70.0
    rel = lufs_from_power(p.mean()) - 10
    p2 = p[lufs_from_power(p) > rel]
    return float(lufs_from_power(p2.mean())) if len(p2) else -70.0


def integrated_lufs(x, sr=SR, block=0.4, hop=0.1):
    """Gated integrated loudness of a (ch, n) signal."""
    return integrated_from_cs(kpower_cs(np.atleast_2d(x), sr), sr, block, hop)


def lufs_series(x, sr=SR, block=0.4, hop=0.1):
    """Momentary loudness (400 ms, 100 ms hop) -> (times of block centres, LUFS)."""
    x = np.atleast_2d(x)
    c = kpower_cs(x, sr)
    B, H = int(round(block * sr)), int(round(hop * sr))
    st = np.arange(0, x.shape[1] - B + 1, H)
    return (st + B / 2) / sr, lufs_from_power((c[st + B] - c[st]) / B)


# --------------------------------------------------------------------------- peaks / limiter
def _os_peak(x, osf=4, chunk=1 << 16, pad=256, skip_below=0.0):
    """Per-sample true-peak estimate: max over channels and the osf-times oversampled points of each sample period.
    Chunks whose sample peak is below skip_below (linear) cannot reach the limiter ceiling and are not oversampled."""
    x = np.atleast_2d(x)
    n = x.shape[1]
    sp = np.max(np.abs(x), axis=0)
    out = sp.copy()
    for a in range(0, n, chunk):
        b = min(n, a + chunk)
        if sp[a:b].max() < skip_below:
            continue
        lo, hi = max(0, a - pad), min(n, b + pad)
        up = signal.resample_poly(x[:, lo:hi], osf, 1, axis=-1)
        pk = np.max(np.abs(up), axis=0)
        k = hi - lo
        pk = pk[: k * osf].reshape(k, osf).max(axis=1)
        out[a:b] = np.maximum(sp[a:b], pk[a - lo: a - lo + (b - a)])
    return out


def true_peak_db(x, osf=8):
    x = np.atleast_2d(x)
    best = 0.0
    for a in range(0, x.shape[1], 1 << 21):
        best = max(best, float(_os_peak(np.asarray(x[:, a:a + (1 << 21)], dtype=np.float64), osf).max()))
    return db(best)


def _box(v, w):
    """Centred moving average of odd length w (edge-padded)."""
    h = w // 2
    c = np.concatenate([[0.0], np.cumsum(np.concatenate([np.full(h, v[0]), v, np.full(h, v[-1])]))])
    return (c[w:] - c[:-w]) / w


def _release_follow(s, a, block=1 << 17):
    """h[n] = max(s[n], a*h[n-1]) computed exactly, vectorised in blocks (max-plus exponential kernel)."""
    h = np.empty_like(s)
    prev = 0.0
    idx = np.arange(block)
    w_full = a ** idx
    for i0 in range(0, len(s), block):
        sb = s[i0:i0 + block]
        w = w_full[: len(sb)]
        v = sb / w
        v[0] = max(v[0], prev * a)
        cm = np.maximum.accumulate(v)
        hb = w * cm
        h[i0:i0 + block] = hb
        prev = hb[-1]
    return h


def _limiter_gain(x, ceiling_db, look_ms, release_ms, osf):
    """Gain curve (n,) for one block of audio; exactly 1.0 wherever no reduction is needed."""
    lim = float(undb(ceiling_db))
    pk = _os_peak(x, osf, skip_below=0.35 * lim)
    need = np.minimum(1.0, lim / np.maximum(pk, 1e-12))
    d = 1.0 - need
    if d.max() <= 0:
        return np.ones(x.shape[1])
    L = int(round(look_ms * SR / 1000.0))
    L += L % 2                      # even, so both boxes (length L+1, odd) are symmetric
    m = maximum_filter1d(d, size=2 * L + 1, mode="nearest")
    s = _box(_box(m, L + 1), L + 1)
    s = np.maximum(s, d)            # numerical safety: never below the requirement
    a = float(np.exp(-1.0 / (release_ms * SR / 1000.0)))
    return 1.0 - _release_follow(s, a)


def tp_limiter(x, ceiling_db, look_ms=4.0, release_ms=90.0, osf=4, chunk=1 << 21, overlap=2 * SR):
    """Look-ahead true-peak limiter (stereo-linked), deterministic, processed in overlapping chunks (little memory).
    Required gain comes from the osf-times oversampled peak of each sample. The reduction is a max-filtered requirement smoothed by a
    triangular kernel of +-look_ms (so it never exceeds the requirement at any peak) and then released exponentially. Nothing below the
    ceiling is touched: gain is exactly 1.0 there. The overlap (2 s = 22 release time constants) makes chunking inaudible.
    Returns (y, gain) with y in x's dtype."""
    x = np.atleast_2d(x)
    n = x.shape[1]
    y = np.empty_like(x)
    g_all = np.ones(n)
    for a in range(0, n, chunk):
        b = min(n, a + chunk)
        lo, hi = max(0, a - overlap), min(n, b + overlap)
        g = _limiter_gain(np.asarray(x[:, lo:hi], dtype=np.float64), ceiling_db, look_ms, release_ms, osf)[a - lo:a - lo + (b - a)]
        g_all[a:b] = g
        y[:, a:b] = x[:, a:b] * g
    return y, g_all


# --------------------------------------------------------------------------- synthesis helpers
def tt(dur, sr=SR):
    return np.arange(int(round(dur * sr))) / sr


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def fade_edges(x, fin=0.002, fout=0.02, sr=SR):
    x = np.atleast_2d(x).copy()
    n = x.shape[1]
    k = min(n, int(round(fin * sr)))
    if k > 1:
        x[:, :k] *= (np.sin(np.linspace(0, np.pi / 2, k)) ** 2)
    k = min(n, int(round(fout * sr)))
    if k > 1:
        x[:, n - k:] *= (np.cos(np.linspace(0, np.pi / 2, k)) ** 2)
    return x


def pink_noise(n, rng):
    """Approximately -3 dB/octave noise (Paul Kellet's filter)."""
    w = rng.standard_normal(n + 64)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    y = signal.lfilter(b, a, w)[64:]
    return y / (np.std(y) + 1e-12)


@njit(cache=False)
def _svf_loop(x, a1, a2, a3, k, mode):
    n = x.shape[0]
    out = np.empty(n)
    ic1 = 0.0
    ic2 = 0.0
    for i in range(n):
        v3 = x[i] - ic2
        v1 = a1[i] * ic1 + a2[i] * v3
        v2 = ic2 + a2[i] * ic1 + a3[i] * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            out[i] = v2                      # low-pass
        elif mode == 1:
            out[i] = v1 * k[i]               # band-pass (unity peak gain)
        else:
            out[i] = x[i] - k[i] * v1 - v2   # high-pass
    return out


def svf(x, fc, q, mode="lp", sr=SR):
    """Topology-preserving state-variable filter with per-sample cutoff fc (Hz) and Q. mode: lp | bp | hp."""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), (n,))
    q = np.broadcast_to(np.asarray(q, dtype=np.float64), (n,))
    g = np.tan(np.pi * np.clip(fc, 10.0, 0.45 * sr) / sr)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    return _svf_loop(np.ascontiguousarray(x, dtype=np.float64), np.ascontiguousarray(a1), np.ascontiguousarray(a2),
                     np.ascontiguousarray(a3), np.ascontiguousarray(k), {"lp": 0, "bp": 1, "hp": 2}[mode])


def reverb_ir(rt60, pre_ms=10.0, damp_hz=4000.0, seed=1, tail=1.2, er=True, sr=SR):
    """Synthetic stereo room/hall impulse response (decaying decorrelated noise, damped highs, early reflections).
    Energy-normalised to 1 so a wet gain of 0 dB returns about the dry RMS for noise-like input."""
    n = int((rt60 * tail + pre_ms / 1000.0) * sr)
    rng = np.random.default_rng(seed)
    t = np.arange(n) / sr
    pre = int(pre_ms * sr / 1000)
    out = np.zeros((2, n))
    for c in range(2):
        z = rng.standard_normal(n)
        env = np.exp(-6.9078 * np.maximum(t - pre / sr, 0) / rt60)
        env[:pre] = 0
        bright = z * env
        dark = svf(bright, damp_hz, 0.7071, "lp")
        wgt = np.exp(-np.maximum(t - pre / sr, 0) / (0.30 * rt60))
        ir = bright * wgt * 0.5 + dark * (1 - wgt * 0.5)
        if er:
            for j, (dly, amp) in enumerate([(11, .55), (19, .45), (27, .38), (38, .30), (51, .24), (67, .18)]):
                p = pre + int(dly * sr / 1000 * (1.0 + 0.07 * (c * 2 - 1)))
                if p < n:
                    ir[p] += amp * (1 if (j + c) % 2 == 0 else -1) * 0.5
        out[c] = ir
    out /= np.sqrt((out ** 2).sum() / 2.0) + 1e-12
    return out


def apply_reverb(x, ir, wet_db):
    """x mono (n,) or stereo (2,n) -> stereo wet signal (length n + len(ir) - 1), scaled by wet_db."""
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x[0], x[0]])
    wet = np.stack([signal.fftconvolve(x[0], ir[0]) + 0.35 * signal.fftconvolve(x[1], ir[1]),
                    signal.fftconvolve(x[1], ir[1]) + 0.35 * signal.fftconvolve(x[0], ir[0])])
    wet /= 1.35
    return wet * float(undb(wet_db))


def pad_to(x, n):
    x = np.atleast_2d(x)
    if x.shape[1] >= n:
        return x[:, :n]
    return np.concatenate([x, np.zeros((x.shape[0], n - x.shape[1]))], axis=1)


def mix_into(dst, src, i):
    """dst[:, i:i+len(src)] += src, growing nothing (src must fit or is clipped)."""
    a = max(0, i)
    b = min(dst.shape[1], i + src.shape[1])
    if b > a:
        dst[:, a:b] += src[:, a - i:b - i]


def equal_power_pan(mono, p):
    """mono (n,) with pan p in [-1,1] (scalar or array) -> stereo (2,n), constant power."""
    p = np.broadcast_to(np.asarray(p, dtype=np.float64), mono.shape)
    th = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(th), mono * np.sin(th)])
