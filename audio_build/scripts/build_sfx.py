"""Build the five SFX kits at audio_build/sfx/styleN/ (48 kHz, 24-bit, stereo WAV) plus kit.json.

Licence ruling (owner, 9 Oct 2026): nothing from Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX,
Muctau(.Com), CSFX/CSFX-2, "AM - " files, Epidemic (incl. "SFX Producer"), or the leaked
"Delta Leaks x Editing Lair" packs. Every library file used here is checked against
scan_library.py's exclusion rules at build time (the build stops if a source is flagged).

Each cue is trimmed so its attack starts ~1 ms into the file, faded, and peak-normalised to -1.0 dBFS.
The mixer sets the playback level from kit.json ("level_db" = peak relative to the local narration peak).
Usage: python -I build_sfx.py [N ...]"""
import os, sys, json, shutil, re, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

LIB = "D:/Assets/01 Audio/Sound Effects/"
SRC_DIR = os.path.join(BUILD, "src", "sfx")
OUT = os.path.join(BUILD, "sfx")
NOTES = ["A", "C", "D", "E", "G"]
NORM_DB = -1.0
SCAN = json.load(open(os.path.join(BUILD, "work", "library_scan.json"), encoding="utf-8"))
SCAN = {r["path"]: r for r in SCAN}
BANNED = re.compile(r"ocular|boom|b00m|chris ?alan|8-bit sfx|muctau|csfx|epidemic|^ES_|^AM - |DSGN|COMCam_|MAGShim_|^AMB|SFX Producer|delta leaks|editing lair|gfxfather|artlist|^ALSFX_", re.I)

# ---------------------------------------------------------------- sources
USED = {}


def lib(rel):
    """Copy a library file into audio_build/src/sfx (never touching the original) and return the copy path."""
    p = LIB + rel
    r = SCAN.get(p)
    name = os.path.basename(p)
    if r is None or r.get("excl_name") or r.get("excl_tag") or BANNED.search(name) or BANNED.search(p):
        raise SystemExit("LICENCE STOP: %s is excluded or not in the scan" % p)
    dst = os.path.join(SRC_DIR, name)
    os.makedirs(SRC_DIR, exist_ok=True)
    if not os.path.exists(dst):
        shutil.copy2(p, dst)
    USED[name] = {"library_path": p, "copy": dst.replace("\\", "/"), "sha256": hashlib.sha256(open(dst, "rb").read()).hexdigest(),
                  "metadata_tags": r.get("tagtxt", "")[:120]}
    return dst


def L(rel, start=None, dur=None):
    return load(lib(rel), start=start, dur=dur)

# ---------------------------------------------------------------- helpers


def mono(x):
    return np.atleast_2d(x).mean(axis=0, keepdims=True)


def st(x):
    x = np.atleast_2d(x)
    return np.vstack([x[0], x[0]]) if x.shape[0] == 1 else x


def cut(x, t0, t1, pre_ms=1.0, thr_db=-24):
    """Cut [t0, t1] and move the start to 1 ms before the first sample within thr_db of the segment peak."""
    seg = x[:, int(t0 * SR):int(t1 * SR)]
    m = np.max(np.abs(seg), axis=0)
    i = int(np.argmax(m > m.max() * undb(thr_db)))
    i = max(0, i - int(pre_ms * SR / 1000))
    return seg[:, i:]


def finish(x, fin_ms=0.5, fout_ms=10.0, length_ms=None):
    x = st(x)
    if length_ms:
        x = x[:, :int(length_ms * SR / 1000)]
    x = fade(x, fin=fin_ms / 1000, fout=fout_ms / 1000)
    return x * undb(NORM_DB) / np.max(np.abs(x))


def env_exp(n, tau_ms):
    return np.exp(-np.arange(n) / (tau_ms * SR / 1000))


def tone(f, dur, partials, attack_ms=1.0, phase=0.0):
    """partials: list of (ratio, dB, decay_tau_ms or None for sustained)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for ratio, gdb, tau in partials:
        e = env_exp(n, tau) if tau else np.ones(n)
        y += undb(gdb) * np.sin(2 * np.pi * f * ratio * t + phase) * e
    a = int(attack_ms * SR / 1000)
    if a > 1:
        y[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    return y[None, :]


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def stft_sweep(x, f_lo, f_hi, nper=1024):
    """Time-varying band-pass via STFT mask. f_lo/f_hi: (start, end) Hz pairs, log-interpolated over time."""
    x = np.atleast_2d(x)
    out = []
    for ch in x:
        f, t, Z = signal.stft(ch, SR, nperseg=nper, noverlap=nper * 3 // 4)
        r = np.clip(t / max(t[-1], 1e-9), 0, 1)
        lo = f_lo[0] * (f_lo[1] / f_lo[0]) ** r
        hi = f_hi[0] * (f_hi[1] / f_hi[0]) ** r
        F = f[:, None]
        mask = 1 / np.sqrt(1 + (lo[None, :] / np.maximum(F, 1)) ** 4) / np.sqrt(1 + (F / hi[None, :]) ** 4)
        _, y = signal.istft(Z * mask, SR, nperseg=nper, noverlap=nper * 3 // 4)
        out.append(y[:x.shape[1]])
    return np.array(out)


def swell(x, rise_ms, fall_ms):
    """sin^2 rise from the start, cos^2 fall at the end."""
    return fade(x, fin=rise_ms / 1000, fout=fall_ms / 1000)


def glide(f0, f1, dur, partials=((1, 0),), expo=True):
    n = int(dur * SR)
    r = np.arange(n) / n
    f = f0 * (f1 / f0) ** r if expo else f0 + (f1 - f0) * r
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(undb(g) * np.sin(k * ph) for k, g in partials)[None, :]


def periodic_loop(components, L_s=20.0, noise_spec=None, seed=1):
    """Exactly periodic (seamless) loop: every frequency snapped to a multiple of 1/L_s.
    components: list of (freq_hz, dB, am_rate_hz, am_depth_db).
    noise_spec: (lo_hz, hi_hz, dB) adds band-limited noise built in the frequency domain (also periodic)."""
    n = int(L_s * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    snap = lambda f: round(f * L_s) / L_s
    for f, gdb, am_rate, am_db in components:
        am = undb(am_db * np.sin(2 * np.pi * snap(am_rate) * t)) if am_rate else 1.0
        y += undb(gdb) * np.sin(2 * np.pi * snap(f) * t) * am
    if noise_spec:
        lo, hi, gdb = noise_spec
        spec = np.zeros(n // 2 + 1, complex)
        fr = np.fft.rfftfreq(n, 1 / SR)
        sel = (fr >= lo) & (fr <= hi)
        rng = np.random.default_rng(seed)
        spec[sel] = np.exp(2j * np.pi * rng.random(sel.sum()))
        nz = np.fft.irfft(spec, n)
        nz *= undb(gdb) * np.sqrt(np.mean(y ** 2)) / np.sqrt(np.mean(nz ** 2))
        y += nz
    return y[None, :]


def xcorr_best(a, b, maxlag):
    """lag k in [0, maxlag) maximising correlation of a with b[k:k+len(a)]."""
    best, bk = -1e9, 0
    for k in range(maxlag):
        c = np.dot(a, b[k:k + len(a)])
        if c > best:
            best, bk = c, k
    return bk


def extend_aligned(x, total, X):
    """Extend a steady drone by appending copies of itself with correlation-aligned equal-gain cross-fades."""
    m = x.mean(axis=0)
    out = x.copy()
    ramp = np.linspace(0, 1, X)
    while out.shape[1] < total:
        tail = out.mean(axis=0)[-X:]
        k = xcorr_best(tail, m, int(0.05 * SR))
        seg = x[:, k:]
        out[:, -X:] = out[:, -X:] * ramp[::-1] + seg[:, :X] * ramp
        out = np.concatenate([out, seg[:, X:]], axis=1)
    return out


def make_loop(x, L_s, X_s=1.0, search_s=0.05):
    """Seamless loop of about L_s seconds: the head is cross-faded with the material that follows the loop end,
    with the loop length nudged (within search_s) to the best waveform match so tones do not dip."""
    X = int(X_s * SR)
    L0 = int(L_s * SR)
    m = x.mean(axis=0)
    head = m[:X]
    k = xcorr_best(head, m[L0:], int(search_s * SR))
    Ln = L0 + k
    assert x.shape[1] >= Ln + X
    ramp = np.linspace(0, 1, X)
    y = x[:, :Ln].copy()
    y[:, :X] = x[:, Ln:Ln + X] * ramp[::-1] + x[:, :X] * ramp
    return y


def loop_metrics(y):
    m = y.mean(axis=0)
    d = np.abs(np.diff(m))
    wrap = abs(m[0] - m[-1])
    w = int(0.05 * SR)
    r = np.array([np.sqrt(np.mean(m[i:i + w] ** 2)) for i in range(0, len(m) - w, w)])
    return {"length_s": round(len(m) / SR, 3), "wrap_jump_vs_p99_step": round(float(wrap / np.percentile(d, 99)), 3),
            "rms_50ms_range_db": round(db(r.max()) - db(r.min()), 2)}


def lowpass(x, f, poles=2, n=1):
    return ff_filter(x, ",".join(["lowpass=f=%g:poles=%d" % (f, poles)] * n))


def highpass(x, f, poles=2, n=1):
    return ff_filter(x, ",".join(["highpass=f=%g:poles=%d" % (f, poles)] * n))


def onset_ms(x):
    m = np.max(np.abs(x), axis=0)
    return round(1000 * int(np.argmax(m > m.max() * undb(-24))) / SR, 2)


def measure(x, pitched=False):
    d = {"dur_ms": round(1000 * x.shape[1] / SR, 1), "peak_dBFS": round(peak_db(x), 2), "onset_ms": onset_ms(x),
         "bands_pct_<300/300-1k/1-4k/>4k": [float(v) for v in band_shares(x[:, :int(0.25 * SR)] if x.shape[1] > 0.25 * SR else x)]}
    if pitched:
        d["f0_hz"] = round(f0_estimate(x[:, :int(0.1 * SR)], fmin=60, fmax=2000), 1)
    return d


class Kit:
    def __init__(self, n):
        self.n, self.dir, self.cues = n, os.path.join(OUT, "style%d" % n), {}
        os.makedirs(self.dir, exist_ok=True)

    def add(self, name, x, source, processing, level_db, pitched=False, extra=None):
        x = st(x)
        p = os.path.join(self.dir, name + ".wav")
        write_wav(p, x, bits=24)
        e = {"file": p.replace("\\", "/"), "source": source, "processing": processing, "level_db": level_db}
        e.update(measure(x, pitched))
        if extra:
            e.update(extra)
        self.cues[name] = e

    def save(self, meta):
        meta = dict(meta)
        meta["cues"] = self.cues
        json.dump(meta, open(os.path.join(self.dir, "kit.json"), "w"), indent=1)


def notes_hz(octave_of_A, names=NOTES):
    """Ascending A-C-D-E-G starting from A in the given octave."""
    out = {}
    base = note_hz("A", octave_of_A)
    semis = {"A": 0, "C": 3, "D": 5, "E": 7, "G": 10}
    for k in names:
        out[k] = base * 2 ** (semis[k] / 12)
    return out

# ================================================================= STYLE 1: Bench Notebook (wood and paper)


def style1():
    k = Kit(1)
    S = "synthesized (numpy)"
    # button: real micro-switch press and release (plain-named library file, no metadata)
    src = "06 UI, Clicks & Camera/Mouse Click 1.wav"
    x = L(src)
    k.add("button_press", finish(cut(x, 0.105, 0.150), 0.5, 10), LIB + src, "press 0.105-0.150 s, attack aligned to 1 ms, 0.5 ms in / 10 ms out, peak -1 dBFS", -15.0, extra={"level_db_f0": -18.0})
    k.add("button_release", finish(cut(x, 0.200, 0.245), 0.5, 10), LIB + src, "release 0.200-0.245 s, same fades; played 3 dB under its press", -18.0)
    # land: synthesized soft-mallet marimba (fundamental + 4x bar partial) + real wood knock attack layer
    wsrc = "09 Mechanical & Objects/Wood_39.wav"
    w = mono(L(wsrc))
    knock = cut(w, 0.186, 0.230)  # first knock only (second strike at ~0.269 s)
    for nm, f in notes_hz(4).items():
        body = tone(f, 0.085, [(1, 0, 28), (4, -23, 8), (10, -44, 3)], attack_ms=1.0)
        kn = varispeed(knock, f / 325.4)[:, :body.shape[1]]
        kn = fade(kn, fout=0.02)
        kn = kn / np.max(np.abs(kn)) * np.max(np.abs(body)) * undb(-10)
        y = body.copy()
        y[:, :kn.shape[1]] += kn
        y = finish(y, 0.5, 25)
        k.add("land_" + nm, y, S + " + wood-knock layer from " + LIB + wsrc,
              "marimba-like tone %s%d %.1f Hz: partials 1x (tau 28 ms), 4x -23 dB (tau 8 ms), 10x -44 dB; Wood_39 first knock "
              "varispeed to the note, 10 dB under, as the wooden attack; 85 ms, 25 ms cos^2 fade-out" % (nm, 4 if nm == "A" else 5, f), -12.0, pitched=True)
    # lens: synthesized filtered paper-slide breath (no clean paper-drag file in the library)
    n = int(0.22 * SR)
    b = noise(n, 11)[None, :]
    grain = 1 + 0.35 * lowpass(noise(n, 12)[None, :], 60)[0] / 0.05
    b = b * np.clip(grain, 0.3, 2.0)
    b = ff_filter(st(b), "highpass=f=120:poles=2,highpass=f=120:poles=2,lowpass=f=1000:poles=2,lowpass=f=1000:poles=2")
    op = finish(swell(b, 140, 60), 0, 0)
    k.add("lens_open", op, S, "paper-slide breath: noise with slow grain modulation, band 120 Hz-1 kHz (24 dB/oct high-pass and low-pass), 220 ms, 140 ms sin^2 rise, 60 ms cos^2 fall", -13.0)
    k.add("lens_close", op[:, ::-1], S, "exact reverse of lens_open", -14.0)
    # lock: real wood tap, doubled 40 ms apart (2nd copy -2 dB, +50 cents)
    wsrc2 = "09 Mechanical & Objects/Wood_38.wav"
    t = cut(mono(L(wsrc2)), 0.172, 0.190)
    t = fade(t, fin=0.0005, fout=0.005)
    t2 = varispeed(t, 2 ** (50 / 1200)) * undb(-2)
    y = np.zeros((1, int(0.060 * SR)))
    y[:, :t.shape[1]] += t
    o = int(0.040 * SR)
    y[:, o:o + t2.shape[1]] += t2[:, :y.shape[1] - o]
    k.add("lock", finish(y, 0, 5), LIB + wsrc2, "first knock (0.172-0.190 s) as a dry tap, placed at 0 and +40 ms (2nd copy -2 dB, +50 cents), 60 ms", -15.0)
    # standby: synthesized A1 'bowed' drone, exactly periodic 20 s loop
    y = cyclic_filter(st(periodic_loop([(55, 0, 0.25, 0.7), (110, -2, 0.25, 0.5), (165, -20, 0, 0), (220, -7, 0.15, 0.6), (440, -14, 0.1, 0.8)], 20.0, (60, 900, -26), seed=13)), "highpass=f=40:poles=2,lowpass=f=1200:poles=2")
    k.add("standby_loop", finish(y, 0, 0), S, "A1 (55 Hz) drone with partials 2x -2, 3x -20, 4x -7, 8x -14 dB (the measured profile of the excluded Ocular drone), slow 'bow' level motion, faint 60-900 Hz air; HP 40 Hz, LP 1.2 kHz; exactly periodic 20.0 s loop", -26.0, extra=loop_metrics(y))
    # energize: low warm swell (A2 + E3 + A3)
    y = tone(110, 0.40, [(1, 0, None), (1.5, -6, None), (2, -9, None)], attack_ms=1)
    y = finish(swell(lowpass(y, 1000), 250, 150), 0, 0)
    k.add("energize", y, S, "A2/E3/A3 swell, 400 ms, 250 ms sin^2 rise, 150 ms fall, LP 1 kHz", -11.0)
    # dive: rising filtered paper breath
    n = int(0.5 * SR)
    y = stft_sweep(noise(n, 21)[None, :], (80, 120), (400, 3000))
    y = finish(swell(y, 300, 80), 0, 0)
    k.add("dive", y, S, "noise breath with a rising low-pass 400 Hz -> 3 kHz (HP 80-120 Hz), 500 ms, 300 ms rise, 80 ms fall", -11.0)
    # alert: two real knuckle knocks on wood, the second a minor third lower
    asrc = "09 Mechanical & Objects/door knock hard.mp3"
    x = mono(L(asrc))
    k1 = fade(cut(x, 0.0, 0.085), fout=0.02)
    k2 = fade(varispeed(cut(x, 0.190, 0.275), 2 ** (-300 / 1200)), fout=0.02)
    y = np.zeros((1, int(0.23 * SR)))
    y[:, :k1.shape[1]] += k1
    o = int(0.110 * SR)
    y[:, o:o + k2.shape[1]] += k2[:, :y.shape[1] - o] * np.max(np.abs(k1)) / np.max(np.abs(k2))
    y = ff_filter(st(y), "highpass=f=50:poles=2,lowpass=f=1500:poles=2")
    k.add("alert", finish(y, 0.5, 15), LIB + asrc, "knock 1 (0-85 ms) at 0, knock 2 (190-275 ms) -300 cents at +110 ms, HP 50 Hz, LP 1.5 kHz", -9.0)
    k.save({"style": 1, "name": "Bench Notebook", "release_delay_ms": 180})

# ================================================================= STYLE 2: Night Signal (low and airy)


def style2():
    k = Kit(2)
    S = "synthesized (numpy)"
    src = "06 UI, Clicks & Camera/rm click (1).wav"
    x = L(src)
    pr = finish(cut(x, 0.040, 0.090), 0.5, 10)
    k.add("button_press", pr, LIB + src, "press 0.040-0.090 s (bright click), attack aligned, 0.5/10 ms fades; crisp version for f1837", -10.0)
    k.add("button_press_f0", finish(lowpass(pr, 1200, 2, 2), 0.5, 10), LIB + src, "the same press low-passed at 1.2 kHz (24 dB/oct): the muffled flash-forward press at f0", -20.0)
    rl = finish(cut(x, 0.286, 0.336), 0.5, 12)
    k.add("button_release", rl, LIB + src, "release 0.286-0.336 s (low plastic thock, 61% below 300 Hz); played 3 dB under its press", -13.0)
    k.add("button_release_f0", finish(lowpass(rl, 1200, 2, 2), 0.5, 12), LIB + src, "release low-passed at 1.2 kHz (muffled, f0)", -23.0)
    # land: low sine pluck, body in 300 Hz-1 kHz (owner ruling), with a sub-octave for weight; muffled
    for nm, f in notes_hz(4).items():
        y = tone(f, 0.11, [(1, 0, 45), (0.5, -9, 60), (2, -16, 20)], attack_ms=4)
        y = lowpass(y, 1600)
        k.add("land_" + nm, finish(y, 0, 30), S, "soft sine pluck %s %.1f Hz (body in 300 Hz-1 kHz) + sub-octave -9 dB + 2x -16 dB, 4 ms attack, tau 45 ms, LP 1.6 kHz (muffled), 110 ms" % (nm, f), -12.0, pitched=True)
    # lens: rising reverse effect ending on its first peak (the alternate named in sfx_style2.md)
    lsrc = "02 Whooshes & Transitions/Reverse_FX_High_02.wav"
    x = L(lsrc)
    seg = x[:, int(0.700 * SR):int(0.930 * SR)]
    seg = ff_filter(seg, "highpass=f=60:poles=2,lowpass=f=6000:poles=2")
    op = finish(swell(seg, 150, 25), 0, 0)
    k.add("lens_open", op, LIB + lsrc, "0.700-0.930 s (the rise into its first peak), HP 60 Hz, LP 6 kHz, 150 ms sin^2 rise, 25 ms fall", -13.0)
    k.add("lens_close", op[:, ::-1], LIB + lsrc, "exact reverse of lens_open", -13.0)
    # lock: a real key's two release ticks, re-spaced to 40 ms
    ksrc = "06 UI, Clicks & Camera/Keyboard one key press.wav"
    x = mono(L(ksrc))
    t1 = fade(x[:, int(0.0865 * SR):int(0.0985 * SR)], fin=0.0005, fout=0.004)
    t2 = fade(x[:, int(0.1005 * SR):int(0.1125 * SR)], fin=0.0005, fout=0.004)
    t1 *= np.max(np.abs(t2)) / np.max(np.abs(t1))
    y = np.zeros((1, int(0.060 * SR)))
    y[:, :t1.shape[1]] += t1
    o = int(0.040 * SR)
    y[:, o:o + t2.shape[1]] += t2 * undb(-1)
    y = lowpass(y, 7000)
    k.add("lock", finish(y, 0, 5), LIB + ksrc, "the key's two release ticks (86.5-98.5 ms and 100.5-112.5 ms) placed 40 ms apart (2nd -1 dB), LP 7 kHz, 60 ms", -15.0)
    # standby: A1 + A2, low-passed
    y = cyclic_filter(st(periodic_loop([(55, 0, 0.1, 0.6), (110, -4, 0.15, 0.8), (165, -24, 0, 0)], 20.0)), "lowpass=f=250:poles=2")
    k.add("standby_loop", finish(y, 0, 0), S, "A1 55 Hz + A2 -4 dB + E3 -24 dB, slow level motion, LP 250 Hz; exactly periodic 20.0 s loop", -26.0, extra=loop_metrics(y))
    y = tone(55, 0.45, [(1, 0, None), (2, -3, None), (3, -12, None)], attack_ms=1)
    k.add("energize", finish(swell(lowpass(y, 400), 280, 150), 0, 0), S, "A1/A2/E3 swell, 450 ms, 280 ms rise, 150 ms fall, LP 400 Hz", -11.0)
    seg = ff_filter(L(lsrc)[:, int(0.420 * SR):int(0.930 * SR)], "highpass=f=60:poles=2,lowpass=f=6000:poles=2")
    k.add("dive", finish(swell(seg, 200, 30), 0, 0), LIB + lsrc, "0.420-0.930 s crescendo into its first peak, HP 60 Hz, LP 6 kHz, 200 ms rise, 30 ms fall", -11.0)
    y = alert_thunks([130.81, 110.0], gap=0.100, dur=0.09, lp=600)
    k.add("alert", finish(y, 0.5, 10), S, "two dull sine thunks C3 then A2 (each 90 ms, 10% pitch drop), 100 ms apart, LP 600 Hz", -9.0)
    k.save({"style": 2, "name": "Night Signal", "release_delay_ms": 160})


def alert_thunks(freqs, gap, dur, lp, shape="sine", drop=0.10):
    n = int((gap * (len(freqs) - 1) + dur + 0.02) * SR)
    y = np.zeros((1, n))
    for i, f in enumerate(freqs):
        m = int(dur * SR)
        r = np.arange(m) / m
        ph = 2 * np.pi * np.cumsum(f * (1 - drop * r)) / SR
        w = np.sin(ph) if shape == "sine" else np.tanh(3 * np.sin(ph)) / np.tanh(3)
        w = w * env_exp(m, dur * 1000 / 3)
        w[:48] *= np.linspace(0, 1, 48)
        o = int(i * gap * SR)
        y[0, o:o + m] += w * undb(-1.5 * i)
    return lowpass(y, lp, 2, 2)


def cyclic_filter(x, chain):
    """Filter a periodic loop without breaking its periodicity: filter three copies, keep the middle one."""
    n = x.shape[1]
    y = ff_filter(np.concatenate([x, x, x], axis=1), chain)
    return y[:, n:2 * n]

# ================================================================= STYLE 3: Living Schematic (dry synthesized ticks)


def style3():
    k = Kit(3)
    S = "synthesized (numpy)"
    src = "06 UI, Clicks & Camera/rm click (3).wav"
    x = L(src)
    k.add("button_press", finish(cut(x, 0.110, 0.150), 0.5, 8), LIB + src, "press 0.110-0.150 s, attack aligned, 0.5/8 ms fades", -12.0, extra={"level_db_f0": -16.0})
    k.add("button_release", finish(cut(x, 0.325, 0.365), 0.5, 8), LIB + src, "release 0.325-0.365 s (the switch's own, naturally softer); played 4 dB under its press", -16.0)
    n2 = int(0.002 * SR)
    for nm, f in notes_hz(4).items():
        body = tone(f, 0.060, [(1, 0, 16), (2, -18, 6)], attack_ms=0.5)
        clk = highpass(noise(n2, 31)[None, :] * np.hanning(n2), 4000, 2, 2)
        clk = clk / np.max(np.abs(clk)) * undb(-8)
        y = body.copy()
        y[:, :n2] += clk
        k.add("land_" + nm, finish(y, 0.3, 20), S, "dry tick: 2 ms noise click above 4 kHz (-8 dB) + sine body %s %.1f Hz (body in 300 Hz-1 kHz), tau 16 ms, 2x -18 dB, no room, 60 ms" % (nm, f), -12.0, pitched=True)
    ssrc = "06 UI, Clicks & Camera/Shutter.wav"
    x = L(ssrc)
    seg = x[:, int(0.050 * SR):int(0.270 * SR)]
    seg = ff_filter(seg, "highpass=f=300:poles=2,equalizer=f=2500:t=o:w=1.5:g=-4")
    op = finish(swell(seg, 50, 60), 0, 0)
    k.add("lens_open", op, LIB + ssrc, "very short shutter 0.050-0.270 s, HP 300 Hz, -4 dB at 2.5 kHz, 50 ms sin^2 swell-in, 60 ms fall (open = shaped swell)", -13.0)
    k.add("lens_close", op[:, ::-1], LIB + ssrc, "exact reverse of lens_open", -13.0)
    tick = np.zeros((1, int(0.012 * SR)))
    c = highpass(noise(n2, 33)[None, :] * np.hanning(n2), 4000, 2, 2)
    tick[:, :n2] += c / np.max(np.abs(c))
    tick += 0.25 * tone(220, 0.012, [(1, 0, 3)], attack_ms=0.2)
    y = np.zeros((1, int(0.060 * SR)))
    y[:, :tick.shape[1]] += tick
    o = int(0.040 * SR)
    y[:, o:o + tick.shape[1]] += tick * undb(-2)
    k.add("lock", finish(y, 0, 5), S, "two dry synthesized ticks 40 ms apart: 2 ms noise click above 4 kHz + 3 ms 220 Hz body; 2nd -2 dB; 60 ms", -15.0)
    # Drones_01.wav (the Stage A pick) was rendered and rejected: after the shift to 55 Hz it beats at ~1.8 Hz
    # with 10-12 dB level swings (measured), which breaks the "steady 55 Hz sine" spec. The spec tone is synthesized.
    y = periodic_loop([(55, 0, 0, 0), (110, -14, 0, 0)], 20.0)
    k.add("standby_loop", finish(y, 0, 0), S, "55.00 Hz sine (A1) + 110 Hz octave at -14 dB (a hint on small speakers, as the notes suggest); exactly periodic 20.0 s loop. Replaces Drones_01.wav, which beats at ~1.8 Hz (10-12 dB swings) after the shift", -26.0, extra=loop_metrics(y))
    esrc = "05 Glitch & Digital/Analog Synth Hit Deep.wav"
    x = L(esrc)
    seg = varispeed(x[:, int(0.50 * SR):int(0.98 * SR)], 55.0 / 51.9)
    seg = lowpass(seg, 400)
    k.add("energize", finish(swell(seg, 250, 150), 0, 0), LIB + esrc, "sustain 0.50-0.98 s, varispeed to A1 (51.9 -> 55 Hz), LP 400 Hz, 250 ms rise, 150 ms fall (~450 ms)", -11.0)
    n = int(0.5 * SR)
    y = stft_sweep(noise(n, 35)[None, :], (1500, 5000), (4000, 12000))
    k.add("dive", finish(swell(y, 350, 40), 0, 0), S, "dry rising sweep: band-passed noise 1.5-4 kHz -> 5-12 kHz over 500 ms, 350 ms rise, 40 ms fall", -11.0)
    y = alert_thunks([164.81, 130.81], gap=0.100, dur=0.07, lp=800, shape="tri")
    k.add("alert", finish(y, 0.3, 8), S, "two dry low blips E3 then C3 (70 ms each, soft-clipped sine), 100 ms apart, LP 800 Hz", -9.0)
    k.save({"style": 3, "name": "Living Schematic", "release_delay_ms": 150})

# ================================================================= STYLE 4: Signal Score (clean sine and square)


def style4():
    k = Kit(4)
    S = "synthesized (numpy)"
    src = "06 UI, Clicks & Camera/mouse click.wav"
    x = L(src)
    k.add("button_press", finish(cut(x, 0.190, 0.250), 0.5, 10), LIB + src, "press 0.190-0.250 s: low plastic thock + click (62% below 300 Hz), 0.5/10 ms fades", -8.0, extra={"level_db_f0": -18.0})
    rel = ff_filter(x[:, int(0.265 * SR):int(0.300 * SR)], "highpass=f=60:poles=2")
    k.add("button_release", finish(cut(rel, 0, 0.035), 0.5, 10), LIB + src, "the switch's own faint release 0.265-0.300 s (natural level ~30 dB under the press), HP 60 Hz, normalised; played 9 dB under the press", -17.0)
    for nm, f in notes_hz(3).items():
        y = tone(f, 0.085, [(1, 0, 35), (3, -14, 20), (5, -24, 12)], attack_ms=2)
        k.add("land_" + nm, finish(y, 0, 25), S, "clean sine + soft square partials (3x -14 dB, 5x -24 dB) at %s %.1f Hz (220-392 Hz register), 2 ms attack, tau 35 ms, 85 ms" % (nm, f), -12.0, pitched=True)
    y = glide(220.0, 329.63, 0.22, partials=((1, 0), (3, -18)))
    op = finish(swell(y, 120, 60), 0, 0)
    k.add("lens_open", op, S, "rising sine glide A3 -> E4 (220 -> 330 Hz) over 220 ms with a 3x partial at -18 dB, 120 ms rise, 60 ms fall", -13.0)
    k.add("lens_close", op[:, ::-1], S, "exact reverse of lens_open (falling glide)", -13.0)
    lsrc = "06 UI, Clicks & Camera/Mouse Click 1.wav"
    x = mono(L(lsrc))
    c1 = fade(cut(x, 0.110, 0.118), fout=0.003)
    c2 = fade(cut(x, 0.204, 0.212), fout=0.003)
    y = np.zeros((1, int(0.050 * SR)))
    y[:, :c1.shape[1]] += c1
    o = int(0.040 * SR)
    y[:, o:o + c2.shape[1]] += c2
    k.add("lock", finish(y, 0, 3), LIB + lsrc, "its two clicks (press 110-118 ms, release 204-212 ms) re-spaced to exactly 40 ms, 3 ms fades", -15.0)
    bsrc = "11 Cinematic & Drones/Bass_Atmospheric_09.wav"
    x = mono(L(bsrc))[:, int(0.05 * SR):int(20.60 * SR)]
    x = varispeed(x, 55.0 / 59.69)
    sos1 = signal.butter(4, [46, 64], btype="bandpass", fs=SR, output="sos")
    sos2 = signal.butter(2, [53.6, 56.4], btype="bandpass", fs=SR, output="sos")
    x = signal.sosfiltfilt(sos2, signal.sosfiltfilt(sos1, x, axis=-1), axis=-1)
    x = x[:, int(0.5 * SR):]
    y = make_loop(x, 20.0, 1.0)
    k.add("standby_loop", finish(y, 0, 0), LIB + bsrc,
          "0.05-20.60 s summed to mono, varispeed x0.9214 (59.69 -> 55.0 Hz), band-pass 46-64 Hz (4th-order Butterworth) then 53.6-56.4 Hz (2nd order) to remove the flutter, looped with a 1 s aligned cross-fade, ~20 s", -26.0, extra=loop_metrics(y))
    x = mono(L(bsrc))[:, int(2.0 * SR):int(2.8 * SR)]
    x = varispeed(x, 110.0 / 59.69)
    x = ff_filter(x, "highpass=f=80:poles=2,lowpass=f=200:poles=2")
    k.add("energize", finish(swell(x[:, :int(0.40 * SR)], 250, 150), 0, 0), LIB + bsrc, "0.8 s excerpt varispeed x1.843 (-> 110 Hz), band 80-200 Hz, 400 ms swell (250 ms rise, 150 ms fall)", -11.0)
    y = glide(110.0, 440.0, 0.5, partials=((1, 0), (3, -16)))
    k.add("dive", finish(swell(y, 300, 60), 0, 0), S, "exponential sine sweep 110 -> 440 Hz over 500 ms with 3x partial -16 dB, 300 ms rise, 60 ms fall", -11.0)
    y = alert_thunks([110.0, 110.0], gap=0.100, dur=0.08, lp=1000, shape="tri", drop=0.0)
    k.add("alert", finish(y, 0.3, 8), S, "two low square-ish pulses on A2 (80 ms each), 100 ms apart, LP 1 kHz (dull)", -9.0)
    k.save({"style": 4, "name": "Signal Score", "release_delay_ms": 200})

# ================================================================= STYLE 5: Live Panels (celesta / vibraphone)


def style5():
    k = Kit(5)
    S = "synthesized (numpy)"
    src = "06 UI, Clicks & Camera/mouse-click-153941.mp3"
    x = L(src)
    k.add("button_press", finish(cut(x, 0.068, 0.115), 0.5, 10), LIB + src, "press 0.068-0.115 s, attack aligned, 0.5/10 ms fades", -12.0, extra={"level_db_f0": -16.0})
    k.add("button_release", finish(cut(x, 0.158, 0.205), 0.5, 10), LIB + src, "release 0.158-0.205 s; played 2.7 dB under its press (its natural ratio per sfx_style5.md)", -14.7)
    for nm, f in notes_hz(4).items():
        y = tone(f, 0.30, [(1, 0, 160), (2, -14, 50), (3, -26, 25), (4, -22, 35)], attack_ms=3)
        k.add("land_" + nm, finish(y, 0, 120), S, "soft celesta-like tone %s %.1f Hz: 1x (tau 160 ms), 2x -14 dB, 3x -26 dB, 4x -22 dB, 3 ms attack, 300 ms with 120 ms fade" % (nm, f), -14.0, pitched=True)
    y = tone(261.63, 0.25, [(1, 0, None), (4, -24, None)], attack_ms=1)
    n = y.shape[1]
    e = np.ones(n)
    a, h = int(0.150 * SR), int(0.180 * SR)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    e[h:] = np.cos(np.linspace(0, np.pi / 2, n - h)) ** 2
    op = finish(y * e, 0, 0)
    k.add("lens_open", op, S, "bowed-vibraphone-like swell on C4 261.6 Hz (+4x -24 dB): 150 ms rise, 30 ms hold, 70 ms release; 250 ms", -14.0)
    k.add("lens_close", op[:, ::-1], S, "exact reverse of lens_open", -14.0)
    tk = tone(1318.5, 0.030, [(1, 0, 6), (2, -15, 3)], attack_ms=0.3)
    y = np.zeros((1, int(0.075 * SR)))
    y[:, :tk.shape[1]] += tk
    o = int(0.040 * SR)
    y[:, o:o + tk.shape[1]] += tk * undb(-1)
    y = highpass(y, 700)
    k.add("lock", finish(y, 0, 5), S, "two dry celesta ticks E6 1318.5 Hz (tau 6 ms, 2x -15 dB) 40 ms apart, 2nd -1 dB, HP 700 Hz", -15.0)
    y = cyclic_filter(st(periodic_loop([(110, 0, 0.25, 1.0), (220, -11, 0.25, 1.0), (440, -30, 0, 0)], 20.0)), "lowpass=f=250:poles=2,lowpass=f=250:poles=2")
    k.add("standby_loop", finish(y, 0, 0), S, "held bowed-vibraphone-like A2 110 Hz + octave -11 dB, slow 0.25 Hz +-1 dB swell, LP 250 Hz 24 dB/oct; exactly periodic 20.0 s loop", -26.0, extra=loop_metrics(y))
    y = tone(55, 0.45, [(1, 0, None), (2, -3, None), (3, -9, None)], attack_ms=1)
    k.add("energize", finish(swell(lowpass(y, 400), 300, 150), 0, 0), S, "A1/A2/E3 swell 450 ms, HP none, LP 400 Hz, 300 ms quarter-sine rise, 150 ms fall", -11.0)
    y = glide(261.63, 523.25, 0.52, partials=((1, 0), (4, -22)))
    k.add("dive", finish(swell(y, 420, 50), 0, 0), S, "rising vibraphone-like glide C4 -> C5 over 520 ms (+4x -22 dB), peaks at its end", -11.0)
    y = alert_thunks([130.81, 130.81], gap=0.105, dur=0.11, lp=600)
    k.add("alert", finish(y, 0.5, 10), S, "two dull thumps on C3 (110 ms, 10% drop), 105 ms apart, 2nd -1.5 dB, LP 600 Hz", -9.0)
    k.save({"style": 5, "name": "Live Panels", "release_delay_ms": 140})


# ================================================================= STYLE 6: Signal Atlas ("glass pixel"; STYLE_BIBLE.md §12)


def glass_bell(f, dur=0.120, tau_ms=28.0, h3_db=-10.0, h5_db=-16.0, h_tau_ms=5.0, attack_ms=1.5):
    """The style-6 Land: a sine bell whose attack adds the 3rd and 5th harmonics (the sine-to-square nod).
    The odd harmonics die within ~15 ms, so the note is a pure sine after the attack; the body sits at f."""
    return tone(f, dur, [(1, 0, tau_ms), (3, h3_db, h_tau_ms), (5, h5_db, h_tau_ms * 0.6)], attack_ms=attack_ms)


def glass_tick(f, n_ms=14.0, click_db=-6.0, seed=61):
    """One dry tick: a 1.5 ms high-passed noise click plus a 4 ms-decay sine body at f."""
    n = int(n_ms * SR / 1000)
    y = tone(f, n / SR, [(1, 0, 4.0), (3, -14, 1.5)], attack_ms=0.2)
    m = int(0.0015 * SR)
    c = highpass(noise(m, seed)[None, :] * np.hanning(m), 3500, 2, 2)
    y[:, :m] += c / np.max(np.abs(c)) * undb(click_db)
    return y


def style6():
    """Signal Atlas, the hybrid of 02 Night Signal, 03 Living Schematic and 05 Live Panels.
    Timbre per STYLE_BIBLE.md §12 ("glass pixel"): sine bells with an odd-harmonic attack, airy noise lenses,
    a dry double tick, a 55 + 110 Hz standby hum, and a real momentary click (+ a 90 Hz body at f1837 only).
    Levels follow src/engine/tokens.ts SOUND.levelsDb; previews/demos get gain_db -4 in cues.json."""
    k = Kit(6)
    S = "synthesized (numpy)"
    # --- button: the cleanest plain-named momentary switch of the five kits (Style 3's), one physical switch
    src = "06 UI, Clicks & Camera/rm click (3).wav"
    x = L(src)
    click = finish(cut(x, 0.110, 0.150), 0.5, 8)
    n = int(0.110 * SR)
    body = tone(90.0, n / SR, [(1, 0, 22), (2, -14, 10)], attack_ms=2.0)
    real = np.zeros((2, n))
    real[:, :click.shape[1]] += click
    real += st(body) * undb(-5.0)          # body peak 4-6 dB under the click peak: the click still sets the peak
    k.add("button_press", finish(real, 0.5, 20), LIB + src + " + synthesized 90 Hz body",
          "the real press at f1837: rm click (3) press 0.110-0.150 s (attack aligned, 0.5/8 ms fades) + a 90 Hz sine body "
          "(2 ms attack, tau 22 ms, 2x -14 dB) at -5 dB re the click, 110 ms", -9.0)
    k.add("button_press_f0", click, LIB + src,
          "the f0 preview press: the click alone (no 90 Hz body, bible §12); the cue's gain_db -4 makes it 4 dB quieter", -9.0)
    k.add("button_release", finish(cut(x, 0.325, 0.365), 0.5, 8), LIB + src,
          "release 0.325-0.365 s (the same switch's own, naturally softer); played 4 dB under its press, 200 ms after the frame "
          "(the cap's release starts 6 frames after contact)", -13.0)
    # --- Lands A4 C5 D5 E5 G5: glass bells, body 440-784 Hz (phone band)
    for nm, f in notes_hz(4).items():
        y = glass_bell(f)
        k.add("land_" + nm, finish(y, 0, 30), S,
              "glass-pixel bell %s %.2f Hz: sine (1.5 ms attack, tau 28 ms, about 70 ms to -22 dB) whose attack adds 3x at -10 dB "
              "(tau 5 ms) and 5x at -16 dB (tau 3 ms); 120 ms with a 30 ms fade; body in 300 Hz-1 kHz" % (nm, f), -12.0, pitched=True)
    # --- Lens: 220 ms airy filtered-noise swell (open) and its exact reverse (close), with a faint glass glide E5 -> A5
    n = int(0.220 * SR)
    air = stft_sweep(noise(n, 62)[None, :], (1200, 2800), (5000, 10000), nper=512)
    air = ff_filter(air, "equalizer=f=2000:t=o:w=1.5:g=-3")
    air /= np.max(np.abs(air))
    gl = glide(659.25, 880.0, 0.220, partials=((1, 0), (3, -18)))
    gl /= np.max(np.abs(gl))
    op = finish(swell(air + undb(-16) * gl, 170, 45), 0, 0)
    k.add("lens_open", op, S, "airy filtered-noise swell, 220 ms: band-pass sweeping 1.2-5 kHz -> 2.8-10 kHz, -3 dB at 2 kHz (speech band), "
          "plus a faint glass glide E5 -> A5 (659 -> 880 Hz, 3x -18 dB) at -16 dB; 170 ms sin^2 rise, 45 ms fall. Played at -16, not the "
          "token -13: dense noise reads 3-4 LU louder than a click or bell of the same peak, and the Land must stay the leading sound", -16.0)
    k.add("lens_close", op[:, ::-1].copy(), S, "exact reverse of lens_open (the bible's 'and its reverse'); -16 like the open", -16.0)
    # --- lock: dry double tick, 40 ms apart, A5 body
    t = glass_tick(880.0)
    y = np.zeros((1, int(0.060 * SR)))
    y[:, :t.shape[1]] += t
    o = int(0.040 * SR)
    t2 = glass_tick(880.0 * 2 ** (1 / 24), seed=63)
    y[:, o:o + t2.shape[1]] += t2 * undb(-2)
    k.add("lock", finish(y, 0, 5), S, "dry double tick 40 ms apart: each a 1.5 ms noise click high-passed at 3.5 kHz (-6 dB) + an A5 880 Hz sine body "
          "(tau 4 ms, 3x -14 dB); the 2nd -2 dB and +50 cents; 60 ms. Played at -13, not the token -15: it lands on the stressed 'like' "
          "(f1798), where at -15 its phone-band (350 Hz-8 kHz) loudness measured 19 LU under the word", -13.0)
    # --- standby: 55 + 110 Hz sines, 0.25 Hz +-1 dB swell, exactly periodic 20.0 s
    y = periodic_loop([(55, 0, 0.25, 1.0), (110, -6, 0.25, 1.0)], 20.0)
    k.add("standby_loop", finish(y, 0, 0), S, "A1 55 Hz sine + A2 110 Hz at -6 dB, both with a 0.25 Hz +-1 dB swell; exactly periodic 20.0 s loop "
          "(the mixer fades 0.4 s inside the span, so it is gone within 1 s of the span's end)", -26.0, extra=loop_metrics(y))
    # --- energize (long-form: main rails come up): an A-minor swell that opens from a low hum into the phone band
    n = int(0.45 * SR)
    y = tone(110.0, 0.45, [(1, 0, None), (1.5, -4, None), (2, -6, None), (3, -10, None), (4, -16, None)], attack_ms=1)
    y = stft_sweep(y, (40, 40), (350, 2400), nper=1024)
    k.add("energize", finish(swell(y, 330, 110), 0, 0), S, "A2/E3/A3/E4/A4 chord (110-440 Hz) under a low-pass opening 350 Hz -> 2.4 kHz over 450 ms, "
          "330 ms rise, 110 ms fall (the fill-front's sound: low hum to phone-audible)", -11.0)
    # --- dive / surface (long-form level change through the Lens): the Lens air, longer, with a rising octave glass glide
    n = int(0.50 * SR)
    air = stft_sweep(noise(n, 64)[None, :], (600, 3000), (2500, 11000), nper=512)
    air = ff_filter(air, "equalizer=f=2000:t=o:w=1.5:g=-3")
    air /= np.max(np.abs(air))
    gl = glide(440.0, 880.0, 0.50, partials=((1, 0), (3, -16)))
    gl /= np.max(np.abs(gl))
    dv = finish(swell(air + undb(-9) * gl, 420, 50), 0, 0)
    k.add("dive", dv, S, "500 ms: band-passed noise rising 0.6-2.5 kHz -> 3-11 kHz (-3 dB at 2 kHz) + a glass glide A4 -> A5 (440 -> 880 Hz, 3x -16 dB) at -9 dB; "
          "420 ms rise, 50 ms fall (peaks on the arrival)", -11.0)
    k.add("surface", dv[:, ::-1].copy(), S, "exact reverse of dive (the bible's dive / surface pair, T7)", -11.0)
    # --- alert: the Land's bell turned square (odd harmonics held, not decaying) on a falling minor third C5 -> A4
    y = np.zeros((1, int(0.205 * SR)))
    for i, f in enumerate((523.25, 440.0)):
        b = tone(f, 0.085, [(1, 0, 30), (3, -9, 30), (5, -14, 30), (7, -19, 30)], attack_ms=1.5)
        o = int(i * 0.100 * SR)
        y[:, o:o + b.shape[1]] += b * undb(-1.5 * i)
    y = lowpass(y, 3000)
    k.add("alert", finish(y, 0.3, 10), S, "two square-ish blips on a falling minor third, C5 then A4 (85 ms each, tau 30 ms, 3x -9, 5x -14, 7x -19 dB held: "
          "the Land's sine gone square), 100 ms apart, 2nd -1.5 dB, LP 3 kHz; body in 300 Hz-1 kHz", -9.0)
    k.save({"style": 6, "name": "Signal Atlas", "release_delay_ms": 200})


if __name__ == "__main__":
    which = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5, 6]
    for n in which:
        {1: style1, 2: style2, 3: style3, 4: style4, 5: style5, 6: style6}[n]()
        print("style", n, "kit written")
    up = os.path.join(BUILD, "work", "sfx_sources.json")
    old = json.load(open(up)) if os.path.exists(up) else {}
    old.update(USED)
    json.dump(old, open(up, "w"), indent=1)
