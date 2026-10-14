"""Shared DSP helpers for the Episode 03 v2 sound build (48 kHz, float64 internally).

Everything is deterministic (seeded RNGs). Library audio is only decoded (soundfile / ffmpeg); nothing from the library is executed.
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d

sys.dont_write_bytecode = True

SR = 48000
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
REMOTION = os.path.dirname(os.path.dirname(HERE))
ROOT = os.path.dirname(REMOTION)
LIB_ROOT = "D:/Assets/01 Audio/Sound Effects"
VOICE = os.path.join(ROOT, "Videos", "03 Why AI Answers Arrive One Piece at a Time", "Voiceover", "Fullvoiceover.mp3")
OUT_DIR = os.path.join(ROOT, "Claude Work", "Episode 03 - AI Answers", "audio")
SECTIONS_DIR = os.path.join(REMOTION, "src", "ep03", "sections")
TOTAL_FRAMES = 18367
N_TOTAL = int(round(TOTAL_FRAMES / FPS * SR))      # 29,387,200 samples = 612.2333 s


def db(v):
    return 20.0 * np.log10(np.maximum(np.abs(v), 1e-12))


def undb(d):
    return 10.0 ** (np.asarray(d, dtype=np.float64) / 20.0)


def f2s(frame):
    """Film frame -> sample index (exact: 1600 samples per frame)."""
    return int(round(frame * SR / FPS))


# ----------------------------------------------------------------------------------------------- I/O
def load(path, sr=SR, max_dur=None, start=0.0):
    """Decode any audio file to float64 (2, n) at sr. soundfile first, ffmpeg as the fallback decoder."""
    x = None
    try:
        import soundfile as sf
        with sf.SoundFile(path) as f:
            fsr = f.samplerate
            if start:
                f.seek(int(start * fsr))
            frames = -1 if max_dur is None else int(max_dur * fsr)
            x = f.read(frames=frames, dtype="float64", always_2d=True).T
    except Exception:
        x = None
    if x is None or x.size == 0:
        cmd = ["ffmpeg", "-v", "error", "-nostdin"]
        if start:
            cmd += ["-ss", str(start)]
        cmd += ["-i", path]
        if max_dur is not None:
            cmd += ["-t", str(max_dur)]
        cmd += ["-f", "f32le", "-ac", "2", "-ar", str(sr), "-"]
        raw = subprocess.run(cmd, capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.float32).astype(np.float64).reshape(-1, 2).T
        fsr = sr
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    elif x.shape[0] > 2:
        x = x[:2]
    if fsr != sr:
        g = np.gcd(int(fsr), int(sr))
        x = signal.resample_poly(x, sr // g, fsr // g, axis=-1)
    return np.ascontiguousarray(x)


def write_wav(path, x, sr=SR, bits=24):
    import soundfile as sf
    x = np.atleast_2d(x)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sub = {16: "PCM_16", 24: "PCM_24", 32: "FLOAT"}[bits]
    sf.write(path, np.clip(x.T, -1.0, 1.0) if bits != 32 else x.T.astype(np.float32), sr, subtype=sub)


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, default=_jsonable)


def _jsonable(o):
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    raise TypeError(type(o))


# ----------------------------------------------------------------------------------------------- loudness (BS.1770-4)
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
    return np.vstack([np.r_[b1, a1], np.r_[b2, a2]])


KSOS = _kfilter()


def kpower(x):
    """K-weighted power per sample, channels summed."""
    x = np.atleast_2d(x)
    y = signal.sosfilt(KSOS, x, axis=-1)
    return np.sum(y * y, axis=0)


def lufs(p):
    return -0.691 + 10 * np.log10(np.maximum(p, 1e-20))


def block_power(p, block, hop):
    """Mean of p over blocks (block, hop in samples) -> (starts, mean power)."""
    c = np.concatenate([[0.0], np.cumsum(p)])
    st = np.arange(0, len(p) - block + 1, hop)
    return st, (c[st + block] - c[st]) / block


def integrated(p):
    st, bp = block_power(p, int(0.4 * SR), int(0.1 * SR))
    g = bp[lufs(bp) > -70]
    if len(g) == 0:
        return -70.0
    rel = lufs(np.mean(g)) - 10
    g2 = g[lufs(g) > rel]
    return float(lufs(np.mean(g2)))


def lra(p):
    st, bp = block_power(p, int(3.0 * SR), int(0.1 * SR))   # BS.1771 / EBU 3342 uses 3 s windows; hop 0.1 s
    l = lufs(bp)
    l = l[l > -70]
    rel = lufs(np.mean(10 ** ((l + 0.691) / 10))) - 20
    l = l[l > rel]
    return float(np.percentile(l, 95) - np.percentile(l, 10)), l


def ffmpeg_ebur128(path):
    """Integrated loudness, LRA and true peak from ffmpeg's ebur128 filter on a written file."""
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                       capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind("Summary:"):]
    out = {}
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("I:"):
            out["I"] = float(s.split()[1])
        elif s.startswith("LRA:"):
            out["LRA"] = float(s.split()[1])
        elif s.startswith("Peak:"):
            out["TP"] = float(s.split()[1])
    return out


# ----------------------------------------------------------------------------------------------- peaks / limiter
def os_peak(x, osf=4, chunk=1 << 16, pad=256, skip_below=0.0):
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
        best = max(best, float(os_peak(np.asarray(x[:, a:a + (1 << 21)], dtype=np.float64), osf).max()))
    return float(db(best))


def _box(v, w):
    h = w // 2
    c = np.concatenate([[0.0], np.cumsum(np.concatenate([np.full(h, v[0]), v, np.full(h, v[-1])]))])
    return (c[w:] - c[:-w]) / w


def _release_follow(s, a, block=1 << 17):
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
    lim = float(undb(ceiling_db))
    pk = os_peak(x, osf, skip_below=0.35 * lim)
    need = np.minimum(1.0, lim / np.maximum(pk, 1e-12))
    d = 1.0 - need
    if d.max() <= 0:
        return np.ones(x.shape[1])
    L = int(round(look_ms * SR / 1000.0))
    L += L % 2
    m = maximum_filter1d(d, size=2 * L + 1, mode="nearest")
    s = _box(_box(m, L + 1), L + 1)
    s = np.maximum(s, d)
    a = float(np.exp(-1.0 / (release_ms * SR / 1000.0)))
    return 1.0 - _release_follow(s, a)


def tp_limiter(x, ceiling_db, look_ms=4.0, release_ms=90.0, osf=4, chunk=1 << 21, overlap=2 * SR):
    """Look-ahead, stereo-linked true-peak limiter. Gain is exactly 1.0 wherever nothing is near the ceiling.
    The output is delay-free: the look-ahead is realised by smoothing the requirement symmetrically, not by delaying audio."""
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


# ----------------------------------------------------------------------------------------------- filters
def _rbj(kind, f0, q=0.707, gain_db=0.0, sr=SR):
    A = 10 ** (gain_db / 40.0)
    w0 = 2 * np.pi * min(f0, 0.49 * sr) / sr
    cw, sw = np.cos(w0), np.sin(w0)
    al = sw / (2 * q)
    if kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]; a = [1 + al, -2 * cw, 1 - al]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; a = [1 + al, -2 * cw, 1 - al]
    elif kind == "bp":
        b = [al, 0, -al]; a = [1 + al, -2 * cw, 1 - al]
    elif kind == "peak":
        b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]
    elif kind == "lowshelf":
        s2 = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * cw + s2), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - s2)]
        a = [(A + 1) + (A - 1) * cw + s2, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - s2]
    elif kind == "highshelf":
        s2 = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * cw + s2), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - s2)]
        a = [(A + 1) - (A - 1) * cw + s2, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - s2]
    else:
        raise ValueError(kind)
    b = np.array(b) / a[0]
    a = np.array(a) / a[0]
    return np.r_[b, a]


def eq(x, bands, sr=SR):
    """bands: list of (kind, f0, q, gain_db). Zero-latency IIR (sosfilt)."""
    if not bands:
        return x
    sos = np.vstack([_rbj(k, f, q, g, sr) for (k, f, q, g) in bands])
    return signal.sosfilt(sos, x, axis=-1)


def butter(x, kind, fc, order=4, sr=SR):
    sos = signal.butter(order, fc, btype={"lp": "lowpass", "hp": "highpass", "bp": "bandpass", "bs": "bandstop"}[kind], fs=sr, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


try:
    from numba import njit
except Exception:          # pragma: no cover
    def njit(*a, **k):
        def deco(f):
            return f
        return deco if not (a and callable(a[0])) else a[0]


@njit(cache=False, fastmath=True)
def _svf(x, fc, q, sr, mode):
    n = x.shape[0]
    y = np.empty(n)
    ic1 = 0.0
    ic2 = 0.0
    k = 1.0 / q
    for i in range(n):
        g = np.tan(np.pi * min(fc[i], 0.45 * sr) / sr)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            y[i] = v2
        elif mode == 1:
            y[i] = v1 * k
        else:
            y[i] = x[i] - k * v1 - v2
    return y


def svf(x, fc, q=0.707, mode="lp", sr=SR):
    """Time-varying state-variable filter (TPT). fc: scalar or per-sample array. x: (n,) or (ch, n)."""
    m = {"lp": 0, "bp": 1, "hp": 2}[mode]
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        f = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape).copy()
        return _svf(x, f, float(q), float(sr), m)
    f = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape[-1:]).copy()
    return np.vstack([_svf(np.ascontiguousarray(c), f, float(q), float(sr), m) for c in x])


# ----------------------------------------------------------------------------------------------- generators / shaping
def rng(seed):
    return np.random.default_rng(seed)


def pink(n, r):
    w = r.standard_normal(n)
    f = np.fft.rfft(w)
    k = np.arange(len(f))
    k[0] = 1
    f /= np.sqrt(k)
    y = np.fft.irfft(f, n)
    return y / (np.std(y) + 1e-12)


def brown(n, r):
    w = r.standard_normal(n)
    f = np.fft.rfft(w)
    k = np.arange(len(f)).astype(np.float64)
    k[0] = 1
    f /= k
    y = np.fft.irfft(f, n)
    y = butter(y, "hp", 18.0, 2)
    return y / (np.std(y) + 1e-12)


def fade(x, fin=0.002, fout=0.02, sr=SR):
    x = np.array(x, dtype=np.float64, copy=True)
    n = x.shape[-1]
    a = min(n, int(fin * sr))
    b = min(n, int(fout * sr))
    if a > 0:
        x[..., :a] *= np.sin(0.5 * np.pi * np.arange(a) / a) ** 2
    if b > 0:
        x[..., n - b:] *= np.cos(0.5 * np.pi * np.arange(b) / b) ** 2
    return x


def pan_mono(m, p):
    """Equal-power pan of a mono signal, p in [-1, 1] (scalar or per-sample)."""
    th = (np.asarray(p) + 1) * np.pi / 4
    return np.vstack([m * np.cos(th), m * np.sin(th)]) * np.sqrt(2)


def pan_stereo(x, p):
    """Balance-pan a stereo signal: p in [-1, 1] (scalar or per-sample). Keeps the centre at unity."""
    p = np.asarray(p, dtype=np.float64)
    gl = np.where(p > 0, np.cos(p * np.pi / 2), 1.0)
    gr = np.where(p < 0, np.cos(-p * np.pi / 2), 1.0)
    # add a little of the attenuated side into the other so hard pans keep energy
    l = x[0] * gl + x[1] * (1 - gr) * 0.5
    r = x[1] * gr + x[0] * (1 - gl) * 0.5
    return np.vstack([l, r])


def width(x, w):
    m = 0.5 * (x[0] + x[1])
    s = 0.5 * (x[0] - x[1]) * w
    return np.vstack([m + s, m - s])


def reverb_ir(rt60, sr=SR, seed=1, pre_ms=12.0, damp_hz=5000.0, length=None, er=True, bright_rt=None):
    """Stereo decorrelated synthetic hall IR: exponentially decaying noise whose high band decays faster, plus sparse early reflections."""
    r = rng(seed)
    L = int((length or rt60 * 1.1) * sr)
    t = np.arange(L) / sr
    out = np.zeros((2, L))
    for c in range(2):
        nz = r.standard_normal(L)
        lo = butter(nz, "lp", damp_hz, 2)
        hi = nz - lo
        env_lo = np.exp(-6.91 * t / rt60)
        env_hi = np.exp(-6.91 * t / (bright_rt or rt60 * 0.45))
        tail = lo * env_lo + 0.5 * hi * env_hi
        tail *= 1 - np.exp(-t / 0.018)                      # soft onset of the diffuse tail
        out[c] = tail
        if er:
            for _ in range(14):
                d = r.uniform(0.004, 0.075)
                i = int(d * sr)
                if i < L:
                    out[c, i] += r.uniform(-1, 1) * 2.2 * np.exp(-d / 0.05)
    pre = int(pre_ms * sr / 1000)
    out = np.concatenate([np.zeros((2, pre)), out], axis=1)
    out /= np.sqrt(np.sum(out ** 2) / 2)
    return out


def convolve(x, ir):
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    y = np.vstack([signal.oaconvolve(x[c], ir[c % ir.shape[0]]) for c in range(2)])
    return y


def apply_reverb(x, ir, wet_db, dry=1.0):
    y = convolve(x, ir)
    out = np.zeros((2, y.shape[1]))
    out[:, :x.shape[1]] += dry * np.atleast_2d(x)
    out += undb(wet_db) * y
    return out


def mix_into(dst, src, i):
    """Add src (2, m) into dst (2, N) at sample i (clipped to bounds)."""
    n = dst.shape[1]
    a, b = max(0, i), min(n, i + src.shape[1])
    if b > a:
        dst[:, a:b] += src[:, a - i:b - i]


def env_follow_db(x, win_s=0.010, sr=SR):
    """Peak-ish envelope in dB on a 10 ms grid (max abs over each window, channels combined)."""
    m = np.max(np.abs(np.atleast_2d(x)), axis=0)
    w = max(1, int(win_s * sr))
    k = len(m) // w
    if k == 0:
        return np.array([db(m.max() if len(m) else 0)])
    return db(m[:k * w].reshape(k, w).max(axis=1))
