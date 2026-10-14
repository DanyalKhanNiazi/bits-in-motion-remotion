"""Shared audio helpers for the Bits in Motion intro audio build (numpy/scipy + ffmpeg)."""
import json, os, re, subprocess
import numpy as np
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.dirname(HERE)
REMOTION = os.path.dirname(BUILD)


def load(path, sr=SR, ch=2, start=None, dur=None):
    """Decode any file with ffmpeg to float64 array shape (ch, n)."""
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", "%.6f" % start]
    if dur is not None:
        cmd += ["-t", "%.6f" % dur]
    cmd += ["-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", str(ch), "-ar", str(sr), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype="<f4").astype(np.float64)
    return x.reshape(-1, ch).T.copy()


def write_wav(path, x, sr=SR, bits=24):
    """Write (ch, n) float array as PCM WAV via ffmpeg (no dither, clip-safe check)."""
    x = np.atleast_2d(x)
    if np.max(np.abs(x)) > 1.0:
        raise ValueError("write_wav: sample peak > 0 dBFS in %s (%.2f dB)" % (path, 20 * np.log10(np.max(np.abs(x)))))
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    codec = {16: "pcm_s16le", 24: "pcm_s24le", 32: "pcm_f32le"}[bits]
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", str(x.shape[0]), "-i", "-",
           "-c:a", codec, "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", path]
    subprocess.run(cmd, input=x.T.astype("<f4").tobytes(), check=True)


def db(v):
    return 20 * np.log10(max(float(v), 1e-12))


def undb(d):
    return 10 ** (d / 20.0)


def peak_db(x):
    return db(np.max(np.abs(x))) if x.size else -240.0


def true_peak_db(x, os_factor=4):
    y = signal.resample_poly(np.atleast_2d(x), os_factor, 1, axis=-1)
    return db(np.max(np.abs(y)))


# ---- BS.1770-4 loudness (K-weighting, 400 ms blocks, gating) ----
def _kfilter(sr=SR):
    # pre-filter (high shelf) and RLB high-pass, coefficients per BS.1770 (re-derived for sr)
    f0, G, Q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    K = np.tan(np.pi * f0 / sr); Vh = 10 ** (G / 20); Vb = Vh ** 0.4996667741545416
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


def block_power(x, sr=SR, block=0.4, hop=0.1):
    """Mean-square (summed over channels) of K-weighted signal in sliding blocks."""
    y = kweight(x, sr) ** 2
    s = y.sum(axis=0)
    c = np.concatenate([[0.0], np.cumsum(s)])
    B, H = int(round(block * sr)), int(round(hop * sr))
    starts = np.arange(0, len(s) - B + 1, H)
    return (c[starts + B] - c[starts]) / B, starts / sr


def lufs_from_power(p):
    return -0.691 + 10 * np.log10(np.maximum(p, 1e-20))


def integrated_lufs(x, sr=SR, t0=None, t1=None):
    x = np.atleast_2d(x)
    if t0 is not None:
        x = x[:, int(t0 * sr):int(t1 * sr)]
    p, _ = block_power(x, sr)
    if len(p) == 0:
        return -70.0
    p = p[lufs_from_power(p) > -70]
    if len(p) == 0:
        return -70.0
    rel = lufs_from_power(p.mean()) - 10
    p2 = p[lufs_from_power(p) > rel]
    return float(lufs_from_power(p2.mean())) if len(p2) else -70.0


def ungated_lufs(x, sr=SR, t0=None, t1=None):
    x = np.atleast_2d(x)
    if t0 is not None:
        x = x[:, int(t0 * sr):int(t1 * sr)]
    y = kweight(x, sr) ** 2
    return float(lufs_from_power(y.sum(axis=0).mean()))


def ffmpeg_r128(path):
    """Official ffmpeg ebur128 summary: I, LRA, true peak."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    t = r.stderr[r.stderr.rfind("Summary:"):]
    g = lambda pat: float(re.search(pat, t, re.S).group(1))
    return {"I": g(r"I:\s+(-?[\d.]+) LUFS"), "LRA": g(r"LRA:\s+(-?[\d.]+) LU"), "TP": g(r"True peak:\s+Peak:\s+(-?[\d.inf]+) dBFS")}


def fade(x, fin=0.0, fout=0.0, sr=SR, shape="cos"):
    x = np.atleast_2d(x).copy()
    n = x.shape[1]
    if fin > 0:
        k = min(n, int(round(fin * sr)))
        w = np.sin(np.linspace(0, np.pi / 2, k)) ** 2 if shape == "cos" else np.linspace(0, 1, k)
        x[:, :k] *= w
    if fout > 0:
        k = min(n, int(round(fout * sr)))
        w = np.cos(np.linspace(0, np.pi / 2, k)) ** 2 if shape == "cos" else np.linspace(1, 0, k)
        x[:, n - k:] *= w
    return x


def band_shares(x, sr=SR, edges=(300, 1000, 4000)):
    m = np.atleast_2d(x).mean(axis=0)
    if len(m) < 16:
        return [0] * (len(edges) + 1)
    S = np.abs(np.fft.rfft(m * np.hanning(len(m)))) ** 2
    f = np.fft.rfftfreq(len(m), 1 / sr)
    e = [0] + list(edges) + [sr / 2 + 1]
    tot = S.sum() + 1e-30
    return [round(100 * S[(f >= e[i]) & (f < e[i + 1])].sum() / tot, 1) for i in range(len(e) - 1)]


def f0_estimate(x, sr=SR, fmin=40, fmax=2000):
    m = np.atleast_2d(x).mean(axis=0)
    N = 1 << 18
    S = np.abs(np.fft.rfft(m * np.hanning(len(m)), N))
    f = np.fft.rfftfreq(N, 1 / sr)
    sel = (f >= fmin) & (f <= fmax)
    i = np.argmax(S * sel)
    if 0 < i < len(S) - 1:
        a, b, c = np.log(S[i - 1] + 1e-30), np.log(S[i] + 1e-30), np.log(S[i + 1] + 1e-30)
        p = 0.5 * (a - c) / (a - 2 * b + c)
        return float(f[i] + p * (f[1] - f[0]))
    return float(f[i])


def onsets(x, sr=SR, thresh_db=-30, min_gap=0.015):
    """Simple transient list: times where 1 ms envelope rises > 12 dB within 5 ms and exceeds threshold."""
    m = np.max(np.abs(np.atleast_2d(x)), axis=0)
    hop = sr // 1000
    env = np.array([m[i:i + hop].max() for i in range(0, len(m) - hop, hop)])
    edb = 20 * np.log10(env + 1e-9)
    pk = edb.max()
    out = []
    last = -1e9
    for i in range(5, len(edb)):
        if edb[i] > pk + thresh_db and edb[i] - edb[i - 5] > 12 and (i - last) / 1000 > min_gap:
            out.append((i / 1000.0, round(float(edb[i:i + 5].max()), 1)))
            last = i
    return out


def note_hz(name, octave):
    idx = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}[name]
    return 440.0 * 2 ** ((idx + 12 * (octave - 4)) / 12)


def tp_limit(x, limit_dbtp, os_factor=4, attack_ms=1.5, release_ms=80.0, sr=SR):
    """Look-ahead true-peak limiter, deterministic.
    Peaks are detected on a 4x oversampled copy; the gain curve is a forward-looking min filter
    followed by a box average of the same length (so the gain never exceeds the required value
    at any oversampled peak) and an exponential release. No make-up gain, no compression below
    the threshold: samples whose oversampled peak stays under the limit get gain 1.0."""
    x = np.atleast_2d(x)
    lim = undb(limit_dbtp)
    up = signal.resample_poly(x, os_factor, 1, axis=-1)
    pk = np.max(np.abs(up), axis=0).reshape(-1, os_factor).max(axis=1)[: x.shape[1]]
    if len(pk) < x.shape[1]:
        pk = np.pad(pk, (0, x.shape[1] - len(pk)))
    r = np.minimum(1.0, lim / np.maximum(pk, 1e-12))
    W = max(1, int(round(attack_ms * sr / 1000)))
    m = _fwd_min(r, W)  # min over [n, n+W-1]
    s = _trail_mean(m, W)
    # release smoothing (only where the gain rises)
    a = np.exp(-1.0 / (release_ms * sr / 1000))
    g = _release(s, a)
    return x * g, g


def _fwd_min(r, W):
    from scipy.ndimage import minimum_filter1d
    # minimum_filter1d with origin shifts the window; window [n, n+W-1] => origin = -(W//2) for odd W
    if W % 2 == 0:
        W += 1
    return minimum_filter1d(r, size=W, origin=-(W // 2), mode="nearest")


def _trail_mean(m, W):
    if W % 2 == 0:
        W += 1
    c = np.concatenate([np.full(W, m[0]), m])
    cs = np.cumsum(c)
    return (cs[W:] - cs[:-W]) / W


def _release(s, a):
    # g[n] = s[n] if s[n] <= g[n-1] else g[n-1] + (1-a)*(s[n]-g[n-1]); vectorised in chunks via python loop on reduced set
    g = np.empty_like(s)
    prev = 1.0
    # fast path: where s == 1 and prev == 1 nothing happens; loop only over the active region
    idx = np.where(s < 1.0)[0]
    if len(idx) == 0:
        return np.ones_like(s)
    g[:] = 1.0
    start = idx[0]
    sv = s.tolist()
    out = g.tolist()
    b = 1.0 - a
    n = len(sv)
    for i in range(start, n):
        v = sv[i]
        if v <= prev:
            prev = v
        else:
            prev = prev + b * (v - prev)
        out[i] = prev
    return np.array(out)


def ff_filter(x, chain, sr=SR):
    """Run (ch, n) float audio through an ffmpeg -af filter chain (float32 pipe, no clipping)."""
    x = np.atleast_2d(x)
    ch = x.shape[0]
    cmd = ["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", str(ch), "-i", "-",
           "-af", chain + ",aresample=%d,aformat=sample_fmts=flt" % sr, "-f", "f32le", "-ac", str(ch), "-"]
    out = subprocess.run(cmd, input=x.T.astype("<f4").tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype="<f4").astype(np.float64).reshape(-1, ch).T.copy()


def varispeed(x, ratio, sr=SR):
    """Resample-based pitch+speed change (ratio > 1 = higher and shorter)."""
    from fractions import Fraction
    fr = Fraction(1 / ratio).limit_denominator(2000)
    return signal.resample_poly(np.atleast_2d(x), fr.numerator, fr.denominator, axis=-1)


SENTENCES = [("S01", 0.00, 4.22), ("S02", 4.58, 10.86), ("S03", 11.18, 14.24), ("S04", 14.54, 20.24),
             ("S05", 20.56, 23.52), ("S06", 23.90, 29.96), ("S07", 30.46, 35.24), ("S08", 35.60, 41.20),
             ("S09", 41.58, 47.46), ("S10", 47.94, 55.68), ("S11", 56.02, 60.58), ("S12", 61.00, 61.66)]
SPEECH_END = 61.66
VOICE_STEM = os.path.join(REMOTION, "public", "audio", "voice_intro.wav")


def window_lufs(x, t0, t1, sr=SR):
    """Gated BS.1770 loudness of a time window (falls back to ungated for windows < 0.4 s)."""
    if t1 - t0 < 0.4:
        c = (t0 + t1) / 2
        t0, t1 = c - 0.2, c + 0.2
    return integrated_lufs(x, sr, t0, t1)
