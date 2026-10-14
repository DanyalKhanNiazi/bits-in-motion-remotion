"""Step 1b: build the real foley / effects palette (palette_lib/) and the ambience beds (ambience/).

python -I build_palette_lib.py

Library files come from D:/Assets/01 Audio/Sound Effects (plain-named files only; chosen by the measurements in
work/shortlist_measure.json, see SOURCES.md). They are decoded, trimmed around a detected sync anchor, filtered, layered,
faded, normalised and written as 48 kHz / 24-bit stereo WAVs. Where the library had nothing clean, the sound is synthesized here
(numpy, seeded). palette_lib/palette.json records, for every file, its anchor (the sample that lands on the cue frame), its
measurements and the exact source paths, gains, offsets and pitch changes used.
"""
import hashlib
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402

SR = L.SR
PAL = os.path.join(L.HERE, "palette_lib")
AMB = os.path.join(L.HERE, "ambience")
_ALLOWED = None


def resolve(rel):
    """Map a (category/)file name to its allowed library path (work/library_index.json). Refuses anything the name filter excluded."""
    global _ALLOWED
    if _ALLOWED is None:
        import json
        _ALLOWED = json.load(open(os.path.join(L.HERE, "work", "library_index.json"), encoding="utf-8"))["allowed_files"]
    if rel in _ALLOWED:
        return rel
    base = rel.rsplit("/", 1)[-1]
    hits = [a for a in _ALLOWED if a.rsplit("/", 1)[-1] == base]
    hits.sort(key=lambda a: a.startswith("00 "))          # prefer a categorised copy over "00 Review"
    if not hits:
        raise SystemExit("not an allowed library file: " + rel)
    return hits[0]


def P(rel):
    return L.LIB_ROOT + "/" + resolve(rel)


_cache = {}


def src(rel, max_dur=None, start=0.0):
    k = (rel, max_dur, start)
    if k not in _cache:
        _cache[k] = L.load(P(rel), max_dur=max_dur, start=start)
    return _cache[k]


def sha(rel):
    h = hashlib.sha256()
    with open(P(rel), "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()[:16]


# ----------------------------------------------------------------------------------------------- anchors
def env_ms(x):
    m = np.max(np.abs(x), axis=0)
    w = SR // 1000
    k = len(m) // w
    return m[:k * w].reshape(k, w).max(axis=1)


def onset_anchor(x, search_ms=60):
    """Onset of the strongest transient (s): last point before the peak where the 1 ms envelope is below -18 dB of it,
    limited to search_ms; if the rise is slower than that, the point of steepest rise in the window."""
    e = env_ms(x)
    p = int(np.argmax(e))
    thr = e[p] * 10 ** (-18 / 20)
    lo = max(0, p - search_ms)
    below = np.where(e[lo:p + 1] < thr)[0]
    if len(below):
        return (lo + below[-1] + 1) / 1000.0
    d = np.diff(e[lo:p + 1])
    if len(d) == 0:
        return p / 1000.0
    return (lo + int(np.argmax(d)) + 1) / 1000.0


def peak_anchor(x, win_ms=30):
    m = np.mean(x, axis=0) ** 2
    w = int(win_ms * SR / 1000)
    c = np.convolve(m, np.ones(w) / w, "same")
    return int(np.argmax(c)) / SR


# ----------------------------------------------------------------------------------------------- processing
def pitch(x, semis):
    if not semis:
        return x
    from scipy import signal
    r = 2 ** (semis / 12.0)            # play faster -> higher; resample to fewer samples
    up, down = 1000, int(round(1000 * r))
    return signal.resample_poly(x, up, down, axis=-1)


def window(x, anchor_s, pre_s, post_s, fin=None, fout=None):
    """Cut [anchor-pre, anchor+post]; returns (y, anchor offset in y). Pads with zeros if the file is shorter."""
    a = int(round((anchor_s - pre_s) * SR))
    b = int(round((anchor_s + post_s) * SR))
    pad_l = max(0, -a)
    y = x[:, max(0, a):min(x.shape[1], b)]
    if pad_l:
        y = np.concatenate([np.zeros((2, pad_l)), y], axis=1)
    y = L.fade(y, fin if fin is not None else min(0.002, pre_s), fout if fout is not None else min(0.25, post_s * 0.5))
    return y, pre_s


def layer(parts):
    """parts: list of (y, anchor_s, gain_db, delay_s). Aligns every part's anchor; returns (sum, anchor_s)."""
    pre = max(a - d for (_, a, _, d) in parts)
    n = max(int(round((pre - (a - d)) * SR)) + y.shape[1] for (y, a, _, d) in parts)
    out = np.zeros((2, n))
    for y, a, g, d in parts:
        i = int(round((pre - (a - d)) * SR))
        out[:, i:i + y.shape[1]] += y * L.undb(g)
    return out, pre


def norm_peak(x, target_db=-1.0):
    pk = np.max(np.abs(x))
    return x * (L.undb(target_db) / pk) if pk > 0 else x


def mono(x):
    m = x.mean(axis=0)
    return np.vstack([m, m])


# ----------------------------------------------------------------------------------------------- synthesis
def syn_ceramic_ping(seed, f=(2900.0, 4700.0), tau=0.008, dur=0.06):
    t = np.arange(int(dur * SR)) / SR
    r = L.rng(seed)
    y = sum(np.sin(2 * np.pi * fi * t + r.uniform(0, 6.28)) * np.exp(-t / (tau * (1.0 - 0.25 * k))) for k, fi in enumerate(f))
    y += 0.4 * L.butter(r.standard_normal(len(t)), "hp", 3000) * np.exp(-t / 0.0015)
    return np.vstack([y, y]) * 0.3


def syn_blade_snip(seed):
    """Metal blade chop: short bright noise scrape (3-10 kHz) + a pitched ring at ~6.4 kHz + a low knock."""
    r = L.rng(seed)
    dur = 0.22
    t = np.arange(int(dur * SR)) / SR
    nz = L.butter(r.standard_normal(len(t)), "bp", [2800, 10500], 4) * np.exp(-t / 0.012)
    ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tt) for a, f, tt in [(0.5, 6400 + 300 * r.uniform(-1, 1), 0.035),
                                                                              (0.3, 9100 + 400 * r.uniform(-1, 1), 0.02),
                                                                              (0.25, 3800 + 200 * r.uniform(-1, 1), 0.05)])
    knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.012) * 0.5
    y = nz + 0.6 * ring + knock
    y = L.fade(np.vstack([y, y]), 0.0005, 0.05)
    return y


def syn_servo(seed, dur=0.75):
    """Gauge needle servo: geared DC motor whine gliding up then settling, with gear ripple, a stop click and a needle wobble."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    f0 = 210 + 520 * np.sin(np.pi * np.clip(u / 0.75, 0, 1)) ** 1.2          # rises then falls as the needle settles
    ph = 2 * np.pi * np.cumsum(f0) / SR
    whine = 0.55 * np.sin(ph) + 0.25 * np.sin(2 * ph + 0.3) + 0.12 * np.sin(3 * ph + 1.1)
    ripple = 1 + 0.35 * np.sin(np.cumsum(2 * np.pi * f0 / 7.0) / SR * SR / SR)
    nz = L.butter(r.standard_normal(n), "bp", [900, 5200], 2) * 0.25
    amp = np.clip(u / 0.04, 0, 1) * np.clip((0.82 - u) / 0.1, 0, 1)
    y = (whine * ripple + nz) * amp
    click_at = int(0.8 * dur * SR)
    tc = np.arange(int(0.05 * SR)) / SR
    click = (L.butter(r.standard_normal(len(tc)), "bp", [1800, 7000], 2) * np.exp(-tc / 0.003) + 0.6 * np.sin(2 * np.pi * 1250 * tc) * np.exp(-tc / 0.01))
    y[click_at:click_at + len(tc)] += 0.9 * click[: max(0, min(len(tc), n - click_at))]
    y = L.butter(y, "hp", 120, 2)
    return L.fade(np.vstack([y, y]), 0.004, 0.06)


def syn_card_riffle(seed, dur=0.75, n_cards=34):
    """Card riffle: a train of paper flicks whose rate accelerates then eases; each flick = band-limited noise snap + a soft body."""
    r = L.rng(seed)
    n = int((dur + 0.15) * SR)
    y = np.zeros(n)
    u = np.linspace(0, 1, n_cards)
    times = dur * (0.55 * u + 0.45 * u ** 2.2)                   # dense in the middle, easing at the end
    for i, ti in enumerate(times):
        L0 = int(0.012 * SR)
        tt = np.arange(L0) / SR
        snap = L.butter(r.standard_normal(L0), "bp", [1400 + r.uniform(-200, 600), 7500], 2) * np.exp(-tt / (0.0018 + r.uniform(0, 0.0012)))
        body = np.sin(2 * np.pi * r.uniform(220, 380) * tt) * np.exp(-tt / 0.004) * 0.35
        a = int(ti * SR)
        g = (0.55 + 0.45 * np.sin(np.pi * min(1.0, (i + 1) / n_cards))) * r.uniform(0.7, 1.0)
        y[a:a + L0] += g * (snap + body)
    st = L.butter(r.standard_normal(n), "bp", [2000, 6000], 2) * 0.03 * np.interp(np.arange(n), [0, int(0.1 * SR), int(dur * SR), n], [0, 1, 1, 0])
    y = y + st
    return L.fade(np.vstack([y, np.roll(y, 37)]), 0.002, 0.05)


def syn_glass_hum(seed, dur=6.0):
    """Glass deck hum (tonal, in D): soft partials D3/A3/D4 with slow beating, a glassy 1.17/2.35 kHz shimmer and air."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros((2, n))
    for f, a in [(146.83, 0.5), (220.0, 0.28), (293.66, 0.3), (587.33, 0.12), (1174.66, 0.05), (2349.3, 0.025)]:
        for c in range(2):
            det = 1 + (0.0015 if c else -0.0015) * (1 + r.uniform(0, 0.5))
            y[c] += a * np.sin(2 * np.pi * f * det * t + r.uniform(0, 6.28)) * (1 + 0.25 * np.sin(2 * np.pi * r.uniform(0.07, 0.25) * t + c))
    air = L.butter(r.standard_normal((2, n)), "hp", 5000, 2) * 0.01
    y = y + air
    return L.fade(y, 0.4, 0.8)


def syn_room_air(seed, dur, lp=2600.0, level=1.0):
    r = L.rng(seed)
    n = int(dur * SR)
    a = np.vstack([L.pink(n, r), L.pink(n, r)])
    a = L.butter(a, "lp", lp, 2)
    a = L.butter(a, "hp", 60, 2)
    return a * 0.05 * level


def syn_fans(seed, dur):
    """Server fans: broadband airflow (pink, bump 200-900 Hz) with several fans' blade-pass tones (slowly drifting, beating) and a faint
    coil whine; stereo decorrelated."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for c in range(2):
        air = L.pink(n, r)
        air = L.eq(air, [("peak", 450, 0.6, 6.0), ("lowshelf", 120, 0.7, -4.0), ("highshelf", 6000, 0.7, -8.0)])
        out[c] += 0.06 * air
        for k in range(5):
            bp = r.uniform(380, 720)
            drift = 1 + 0.004 * np.sin(2 * np.pi * r.uniform(0.02, 0.08) * t + r.uniform(0, 6.28))
            ph = 2 * np.pi * np.cumsum(bp * drift) / SR
            out[c] += 0.004 * (np.sin(ph) + 0.35 * np.sin(2 * ph)) * (1 + 0.3 * np.sin(2 * np.pi * r.uniform(0.1, 0.4) * t))
        out[c] += 0.0008 * np.sin(2 * np.pi * (11200 + 60 * c) * t)
    return out


def syn_chip_hum(seed, dur):
    """Chip-world electrical hum, tuned to the score (D): 73.4 Hz fundamental with odd-heavy harmonics, slow breathing, a little
    120 Hz-rate buzz, sparse electrical crackle and a faint high coil whine."""
    r = L.rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = 73.42
    out = np.zeros((2, n))
    breath = 1 + 0.18 * np.sin(2 * np.pi * 0.11 * t) + 0.08 * np.sin(2 * np.pi * 0.37 * t + 1.0)
    for c in range(2):
        h = np.zeros(n)
        for k, a in [(1, 0.6), (2, 0.25), (3, 0.3), (4, 0.08), (5, 0.12), (7, 0.06), (9, 0.03)]:
            h += a * np.sin(2 * np.pi * f0 * k * (1 + 0.0007 * c) * t + r.uniform(0, 6.28))
        buzz = np.tanh(3 * np.sin(2 * np.pi * f0 * 2 * t)) * 0.04
        buzz = L.butter(buzz, "bp", [400, 3000], 2)
        crackle = np.zeros(n)
        idx = r.choice(n, size=int(dur * 6), replace=False)
        crackle[idx] = r.standard_normal(len(idx))
        crackle = L.butter(crackle, "bp", [2500, 9000], 2) * 0.5
        whine = 0.0015 * np.sin(2 * np.pi * (9300 + 40 * c) * t)
        out[c] = 0.05 * h * breath + 0.5 * buzz * breath + 0.04 * crackle + whine
    return out


def loopify(x, xf_s=2.0):
    """Make a bed loop seamlessly: crossfade its tail into its head (equal power)."""
    n = int(xf_s * SR)
    a, b = x[:, :n], x[:, -n:]
    w = np.sin(0.5 * np.pi * np.arange(n) / n)
    head = a * w + b * np.cos(0.5 * np.pi * np.arange(n) / n)
    return np.concatenate([head, x[:, n:-n]], axis=1)


# ----------------------------------------------------------------------------------------------- recipes
META = []


ONSET_ROLES = {"tile_click", "tile_seat", "ui_pop", "crate_land", "impact_big", "impact_small", "sub_drop", "stopwatch_click", "dial_clunk",
               "key_enter", "glitch", "blade_snip"}


def put(name, role, y, anchor_s, sources, note, target_db=-1.0, stereo_mono=False):
    if stereo_mono:
        y = mono(y)
    y = norm_peak(y, target_db)
    if role in ONSET_ROLES:
        # the sync point is the onset of the strongest attack of the finished (layered) sound; sub-only files keep the full band
        probe = y if role == "sub_drop" else L.butter(y, "hp", 200, 2)
        lo = max(0, int((anchor_s - 0.02) * SR))
        hi = min(y.shape[1], int((anchor_s + 0.25) * SR))
        anchor_s = lo / SR + onset_anchor(probe[:, lo:hi])
        head = int(round((anchor_s - 0.025) * SR))
        if head > 0:
            y = L.fade(y[:, head:], 0.008, 0.0)
            anchor_s -= head / SR
    path = os.path.join(PAL, name + ".wav")
    L.write_wav(path, y)
    p = L.kpower(y)
    mom = L.lufs(L.block_power(p, int(0.4 * SR), int(0.05 * SR))[1]) if y.shape[1] > int(0.4 * SR) else np.array([L.lufs(p.mean())])
    nf = 1 << 14
    seg = y.mean(axis=0)
    spec = np.abs(np.fft.rfft(np.pad(seg, (0, max(0, nf - len(seg))))[:max(nf, len(seg))])) ** 2
    f = np.fft.rfftfreq(max(nf, len(seg)), 1 / SR)
    META.append({"file": name + ".wav", "role": role, "anchor_s": round(anchor_s, 4), "dur_s": round(y.shape[1] / SR, 3),
                 "peak_db": round(float(L.db(np.max(np.abs(y)))), 2), "max_momentary_lufs": round(float(np.max(mom)), 2),
                 "centroid_hz": int(np.sum(f * spec) / (np.sum(spec) + 1e-20)), "sources": sources, "note": note})


def S(rel, **kw):
    d = {"path": "D:/Assets/01 Audio/Sound Effects/" + resolve(rel), "sha256_16": sha(rel)}
    d.update(kw)
    return d


def cut(rel, kind="onset", pre=0.01, post=0.5, semis=0, hp=None, lp=None, at=None, fin=None, fout=None, max_dur=30.0, start=0.0):
    x = src(rel, max_dur=max_dur, start=start)
    x = pitch(x, semis)
    a = at if at is not None else (onset_anchor(x) if kind == "onset" else peak_anchor(x))
    y, an = window(x, a, pre, post, fin, fout)
    bands = []
    if hp:
        bands.append(("hp", hp, 0.707, 0))
    if lp:
        bands.append(("lp", lp, 0.707, 0))
    y = L.eq(y, bands)
    return y, an, round(a + start, 4)


def build():
    os.makedirs(PAL, exist_ok=True)
    os.makedirs(AMB, exist_ok=True)

    # --- token-tile clicks: ceramic / plastic snaps (onset on the cue) -------------------------------------------------------
    tiles = [("06 UI, Clicks & Camera/Organic_Click_27.wav", 0), ("06 UI, Clicks & Camera/Organic_Click_07.wav", 0),
             ("06 UI, Clicks & Camera/click_plastic_1.wav", -1), ("06 UI, Clicks & Camera/Tactile Click.wav", 0)]
    for i, (rel, st) in enumerate(tiles, 1):
        y, an, a0 = cut(rel, pre=0.004, post=0.22, semis=st, hp=180)
        srcs = [S(rel, anchor_in_file_s=a0, gain_db=0, pitch_semitones=st)]
        note = "tile snap, HP 180 Hz"
        if i == 4:
            ping = syn_ceramic_ping(11)
            y, an = layer([(y, an, 0, 0), (ping, 0.0, -16, 0.0005)])
            note += " + synthesized ceramic ping 2.9/4.7 kHz at -16 dB"
        put(f"tile_click_{i}", "tile_click", y, an, srcs, note, target_db=-3.0, stereo_mono=True)
    for i, (rel, st) in enumerate([("09 Mechanical & Objects/Part_Assembly_06.wav", 0), ("06 UI, Clicks & Camera/click_plastic_5.wav", -2)], 1):
        y, an, a0 = cut(rel, pre=0.006, post=0.3, semis=st, hp=90)
        put(f"tile_seat_{i}", "tile_seat", y, an, [S(rel, anchor_in_file_s=a0, pitch_semitones=st)], "heavier tile landing in a slot",
            target_db=-2.0, stereo_mono=True)
    for i, rel in enumerate(["06 UI, Clicks & Camera/Organic_Click_09.wav", "06 UI, Clicks & Camera/Organic_Click_23.wav",
                             "06 UI, Clicks & Camera/click_plastic_4.wav"], 1):
        y, an, a0 = cut(rel, pre=0.004, post=0.25, hp=200)
        put(f"ui_pop_{i}", "ui_pop", y, an, [S(rel, anchor_in_file_s=a0)], "caption / label pop (real click)", target_db=-3.0, stereo_mono=True)
    for i in (1, 2):
        put(f"blade_snip_{i}", "blade_snip", syn_blade_snip(20 + i), 0.0, [], "synthesized: noise scrape 2.8-10.5 kHz + 6.4/9.1/3.8 kHz ring + 180 Hz knock",
            target_db=-3.0)

    # --- crates: heavy metal landings (composites, onset on the cue) and pass-bys (peak on the cue) ---------------------------
    rattle, ran, ra0 = cut("01 Impacts & Hits/Debris_Metal_03.wav", pre=0.01, post=1.6, hp=300)
    combos = [
        [("01 Impacts & Hits/Slam_Metal_02.wav", 0, 0.0), ("01 Impacts & Hits/Slam_Door_Low_01.wav", 0, -3.0)],
        [("01 Impacts & Hits/Metallic_Impact_01.wav", 0, 0.0), ("01 Impacts & Hits/Slam_Metal_03.wav", 0, -2.0)],
        [("01 Impacts & Hits/Slam_Metal_02.wav", -3, 0.0), ("01 Impacts & Hits/Slam_Door_Low_02.wav", 0, -4.0)],
    ]
    for i, combo in enumerate(combos, 1):
        parts, srcs = [], []
        for rel, st, g in combo:
            y, an, a0 = cut(rel, pre=0.012, post=2.2, semis=st, fout=0.7)
            parts.append((y, an, g, 0.0))
            srcs.append(S(rel, anchor_in_file_s=a0, gain_db=g, pitch_semitones=st))
        parts.append((rattle, ran, -11.0, 0.018))
        srcs.append(S("01 Impacts & Hits/Debris_Metal_03.wav", anchor_in_file_s=ra0, gain_db=-11.0, delay_s=0.018, note="rattle layer, HP 300 Hz"))
        y, an = layer(parts)
        y = L.butter(y, "hp", 28, 2)
        put(f"crate_land_{i}", "crate_land", y, an, srcs, "heavy metal crate landing: slam + low body + metal rattle", target_db=-1.0)
    passes = [("02 Whooshes & Transitions/Flyby Whoosh.wav", 0.9, 1.1), ("02 Whooshes & Transitions/Doppler_FX_01.wav", 1.1, 1.2),
              ("02 Whooshes & Transitions/Power_Wooshes_02.wav", 0.8, 1.1)]
    for i, (rel, pre, post) in enumerate(passes, 1):
        y, an, a0 = cut(rel, kind="peak", pre=pre, post=post, hp=35, fin=pre * 0.6, fout=post * 0.6)
        put(f"crate_pass_{i}", "crate_pass", y, an, [S(rel, peak_in_file_s=a0)], "crate pass-by (Doppler), peak on the cue", target_db=-2.0)

    # --- whooshes in three speeds: pre-roll cut to 6 / 8 / 10 frames, the peak sits on the cut -----------------------------------
    air_rel = "02 Whooshes & Transitions/small_whoosh_fast_4.wav"
    air, aan, aa0 = cut(air_rel, kind="peak", pre=0.2, post=0.4, fin=0.12, fout=0.25)
    sets = {
        "whoosh_fast": (0.2, [("02 Whooshes & Transitions/small_whoosh_fast_1.wav", 0.40), ("02 Whooshes & Transitions/small_whoosh_fast_5.wav", 0.40),
                              ("02 Whooshes & Transitions/Epic_Swishes_03.wav", 0.5)]),
        "whoosh_med": (0.267, [("02 Whooshes & Transitions/medium_whoosh_1.wav", 0.7), ("02 Whooshes & Transitions/medium_whoosh_4.wav", 0.7),
                               ("02 Whooshes & Transitions/medium_whoosh_5.wav", 0.75)]),
        "whoosh_slow": (0.333, [("02 Whooshes & Transitions/large_whoosh_4.wav", 1.0), ("02 Whooshes & Transitions/Smooth Cinematic Whoosh.wav", 1.5),
                                ("02 Whooshes & Transitions/Short Airy Whoosh.wav", 0.9)]),
    }
    for role, (pre, lst) in sets.items():
        for i, (rel, post) in enumerate(lst, 1):
            y, an, a0 = cut(rel, kind="peak", pre=pre, post=post, hp=40, fin=pre, fout=post * 0.6)
            srcs = [S(rel, peak_in_file_s=a0)]
            note = f"{role.split('_')[1]} whoosh, pre-roll {round(pre * 30)} frames (cosine fade-in), peak on the cut"
            if role != "whoosh_fast":
                y, an = layer([(y, an, 0, 0), (air, aan, -9 if role == "whoosh_med" else -12, 0)])
                srcs.append(S(air_rel, peak_in_file_s=aa0, gain_db=-9 if role == "whoosh_med" else -12, note="air layer, peaks aligned"))
                note += " + air layer"
            put(f"{role}_{i}", role, y, an, srcs, note, target_db=-1.0)
    for i, rel in enumerate(["07 Foley & Movement/cloth_fast_whoosh_1.wav", "07 Foley & Movement/cloth_fast_whoosh_4.wav"], 1):
        rr = rel
        y, an, a0 = cut(rr, kind="peak", pre=0.2, post=0.35, hp=80, fin=0.2, fout=0.2)
        put(f"cam_swish_{i}", "cam_swish", y, an, [S(rr, peak_in_file_s=a0)], "camera-move swish (cloth/air), peak on the move", target_db=-2.0)

    # --- impacts (onset on the cue) and sub drops --------------------------------------------------------------------------
    for i, (rel, post) in enumerate([("11 Cinematic & Drones/Cinematic_Hit_003.wav", 3.5), ("01 Impacts & Hits/Impact_Hits_02.wav", 3.5),
                                     ("11 Cinematic & Drones/Cinematic_Hit_001.wav", 3.5)], 1):
        rr = rel
        y, an, a0 = cut(rr, pre=0.03, post=post, fout=1.5)
        put(f"impact_big_{i}", "impact_big", y, an, [S(rr, anchor_in_file_s=a0)], "big cinematic impact", target_db=-1.0)
    for i, rel in enumerate(["01 Impacts & Hits/Slam_Tech_02.wav", "01 Impacts & Hits/Quick_Impact_01.wav", "01 Impacts & Hits/Quick_Impact_02.wav"], 1):
        y, an, a0 = cut(rel, pre=0.02, post=0.9, fout=0.4)
        put(f"impact_small_{i}", "impact_small", y, an, [S(rel, anchor_in_file_s=a0)], "small impact / slam", target_db=-1.0)
    for i, rel in enumerate(["01 Impacts & Hits/Sub_Impact.wav", "01 Impacts & Hits/Sub_Boom.wav"], 1):
        y, an, a0 = cut(rel, pre=0.01, post=2.6, lp=180, fout=1.2)
        put(f"sub_drop_{i}", "sub_drop", y, an, [S(rel, anchor_in_file_s=a0)], "sub drop, LP 180 Hz", target_db=-1.0)

    # --- risers 1 / 2 / 4 s (anchor = the arrival at the end) ---------------------------------------------------------------
    rz = [("riser_1s", 1.0, [("03 Risers & Buildups/Risers_Tech_04.wav", None), ("03 Risers & Buildups/Risers_Tech_02.wav", None)]),
          ("riser_2s", 2.0, [("03 Risers & Buildups/Risers_Tech_01.wav", None), ("03 Risers & Buildups/Classic Riser (2).wav", None)]),
          ("riser_4s", 4.0, [("03 Risers & Buildups/Risers_Deep_02.wav", "03 Risers & Buildups/Risers_Tech_03.wav"),
                             ("03 Risers & Buildups/Energy Rise_01.wav", None)])]
    for role, dur, lst in rz:
        for i, (rel, rel2) in enumerate(lst, 1):
            y, an, a0 = cut(rel, kind="peak", pre=dur, post=0.06, hp=35, fin=dur * 0.35, fout=0.05)
            srcs = [S(rel, peak_in_file_s=a0, note=f"last {dur} s before its climax")]
            if rel2:
                y2, an2, a02 = cut(rel2, kind="peak", pre=dur, post=0.06, hp=200, fin=dur * 0.35, fout=0.05)
                y, an = layer([(y, an, 0, 0), (y2, an2, -5, 0)])
                srcs.append(S(rel2, peak_in_file_s=a02, gain_db=-5))
            put(f"{role}_{i}", role, y, an, srcs, f"{dur:g} s noise riser, anchor = its arrival (end)", target_db=-1.0)

    # --- stopwatch, servo, dial, keyboard, cards ---------------------------------------------------------------------------
    for i, rel in enumerate(["06 UI, Clicks & Camera/click_tick1_1.wav", "06 UI, Clicks & Camera/click_tick2_4.wav"], 1):
        y, an, a0 = cut(rel, pre=0.003, post=0.12, hp=300)
        put(f"stopwatch_click_{i}", "stopwatch_click", y, an, [S(rel, anchor_in_file_s=a0)], "stopwatch button click", target_db=-3.0, stereo_mono=True)
    rel = "06 UI, Clicks & Camera/Tick_Tock_Fast_01.wav"
    x = src(rel)
    y = L.fade(L.eq(x[:, int(0.5 * SR):int(9.5 * SR)], [("hp", 250, 0.7, 0)]), 0.05, 0.3)
    put("stopwatch_run_1", "stopwatch_run", y, 0.0, [S(rel, segment_s=[0.5, 9.5])], "running clock ticks (bed, start-aligned)", target_db=-3.0)
    for i in (1, 2):
        y = syn_servo(40 + i, dur=0.65 if i == 1 else 0.95)
        rel = "09 Mechanical & Objects/Robotic_Movement_01.wav"
        yr, anr, a0 = cut(rel, kind="peak", pre=0.15, post=0.45 if i == 1 else 0.7, hp=150, fin=0.08, fout=0.2)
        y, an = layer([(y, 0.0, 0, 0), (yr, anr, -8, 0.15)])
        put(f"servo_{i}", "servo", y, an, [S(rel, peak_in_file_s=a0, gain_db=-8, delay_s=0.15, note="real motor layer")],
            "gauge needle servo: synthesized geared-motor glide + stop click, with a real robotic-movement layer; anchor = motion start", target_db=-2.0)
    for i, (r1, r2) in enumerate([("09 Mechanical & Objects/Locked_Down_02.wav", "09 Mechanical & Objects/Locked_Down_01.wav"),
                                  ("01 Impacts & Hits/Slam_Unlock_02.wav", "09 Mechanical & Objects/Locked_Down_Gears_01.wav")], 1):
        r1p, r2p = r1, r2
        y1, a1, s1 = cut(r1p, pre=0.01, post=0.9, fout=0.3)
        y2, a2, s2 = cut(r2p, pre=0.01, post=1.0, fout=0.4)
        y, an = layer([(y1, a1, 0, 0), (y2, a2, -3, 0)])
        put(f"dial_clunk_{i}", "dial_clunk", y, an, [S(r1p, anchor_in_file_s=s1), S(r2p, anchor_in_file_s=s2, gain_db=-3)],
            "power-dial clunk: mechanism click + low clunk", target_db=-1.0)
    rel = "09 Mechanical & Objects/Gears_Cranks_Small_01.wav"
    y, an, a0 = cut(rel, kind="onset", pre=0.01, post=0.8, hp=400, fout=0.25)
    put("dial_ratchet_1", "dial_ratchet", y, an, [S(rel, anchor_in_file_s=a0)], "ratchet turn under the dial", target_db=-3.0)
    for i, rel in enumerate(["06 UI, Clicks & Camera/keyboard_logitech_enter.wav", "06 UI, Clicks & Camera/Keyboard one key press.wav"], 1):
        y, an, a0 = cut(rel, pre=0.01, post=0.28, hp=90)
        put(f"key_enter_{i}", "key_enter", y, an, [S(rel, anchor_in_file_s=a0)], "keyboard Enter press", target_db=-2.0)
    for i, rel in enumerate(["07 Foley & Movement/turn_paper_fast_4.wav", "07 Foley & Movement/turn_paper_fast_5.wav"], 1):
        rf = syn_card_riffle(50 + i)
        yp, anp, a0 = cut(rel, kind="peak", pre=0.25, post=0.45, hp=250, fin=0.1, fout=0.2)
        y, an = layer([(rf, 0.0, 0, 0), (yp, anp, -4, 0.3)])
        put(f"card_riffle_{i}", "card_riffle", y, an, [S(rel, peak_in_file_s=a0, gain_db=-4, delay_s=0.3, note="real paper layer")],
            "card riffle: synthesized flick train (34 cards, 0.75 s) + real fast page turn; anchor = first card", target_db=-2.0)

    # --- glass, data, rewind, glitch -----------------------------------------------------------------------------------------
    rel = "05 Glitch & Digital/Energy Sparkle_02.wav"
    rr = rel
    y, an, a0 = cut(rr, kind="peak", pre=2.0, post=1.2, hp=3000, fin=1.2, fout=0.8)
    put("glass_shimmer_1", "glass_shimmer", y, an, [S(rr, peak_in_file_s=a0)], "high glass sparkle swell, HP 3 kHz, anchor = peak", target_db=-3.0)
    rel = "06 UI, Clicks & Camera/Gleams_Chimes_01.wav"
    y, an, a0 = cut(rel, kind="peak", pre=0.3, post=3.0, hp=600, fin=0.25, fout=1.2)
    put("glass_shimmer_2", "glass_shimmer", y, an, [S(rel, peak_in_file_s=a0)], "glass chime gleam, HP 600 Hz, anchor = peak", target_db=-3.0)
    put("glass_hum_1", "glass_hum", syn_glass_hum(60), 0.0, [], "synthesized glass-deck hum in D (D3 A3 D4 + 1.17/2.35 kHz glass partials)", target_db=-6.0)
    for i, (rel, seg) in enumerate([("05 Glitch & Digital/digital_data_4.wav", (0.2, 6.2)), ("05 Glitch & Digital/Glitch_Tech_Chatter_01.wav", (0.0, 2.7)),
                                    ("05 Glitch & Digital/digital_data_1.wav", (0.0, 2.8))], 1):
        x = src(rel)
        y = L.fade(L.eq(x[:, int(seg[0] * SR):int(seg[1] * SR)], [("hp", 2500, 0.7, 0), ("lp", 15000, 0.7, 0)]), 0.08, 0.3)
        put(f"data_chatter_{i}", "data_chatter", y, 0.0, [S(rel, segment_s=list(seg))], "digital data chatter (HP 2.5 kHz), start-aligned", target_db=-4.0)
    rel = "08 Nature & Elements/VCR_Rewind_01.wav"
    rr = rel
    x = src(rr)
    y = L.fade(L.butter(x[:, int(2.6 * SR):int(6.3 * SR)], "hp", 60), 0.25, 0.08)
    put("tape_rewind_1", "tape_rewind", y, 0.0, [S(rr, segment_s=[2.6, 6.3])], "VCR rewind whine (accelerating), start-aligned", target_db=-2.0)
    rel = "08 Nature & Elements/Rewind.mp3"
    rr = rel
    y, an, a0 = cut(rr, kind="onset", pre=0.01, post=2.4, fout=0.4)
    put("tape_rewind_2", "tape_rewind", y, an, [S(rr, anchor_in_file_s=a0)], "rewind scrub", target_db=-2.0)
    for i, rel in enumerate(["11 Cinematic & Drones/Record_Warp_01.wav", "11 Cinematic & Drones/Record_Warp_02.wav"], 1):
        y, an, a0 = cut(rel, kind="peak", pre=0.05, post=1.1, hp=40, fout=0.35)
        put(f"tape_stop_{i}", "tape_stop", y, an, [S(rel, peak_in_file_s=a0)], "tape-stop / record warp, anchor = start of the slow-down", target_db=-2.0)
    for i, rel in enumerate(["05 Glitch & Digital/Glitch_Small_01.wav", "05 Glitch & Digital/Glitch_Tech_Short_02.wav",
                             "05 Glitch & Digital/Glitch_Tech_Short_01.wav"], 1):
        y, an, a0 = cut(rel, pre=0.01, post=0.6, hp=150, fout=0.15)
        put(f"glitch_{i}", "glitch", y, an, [S(rel, anchor_in_file_s=a0)], "digital glitch", target_db=-3.0)

    # --- ambience beds (loop seamlessly, 60 s) -------------------------------------------------------------------------------
    rel = "14 Ambiences & Beds/apartment ambience.mp3"
    x = src(rel, max_dur=None)
    room = x[:, int(4 * SR):int(66 * SR)]
    room = L.eq(room, [("hp", 30, 0.7, 0)])
    bed = room / (np.sqrt(np.mean(room ** 2)) + 1e-12) * 0.05 + syn_room_air(71, room.shape[1] / SR, lp=2400, level=0.35)
    bed = loopify(bed)
    L.write_wav(os.path.join(AMB, "amb_desk_night.wav"), norm_peak(bed, -6))
    vent_rel = "12 Weapons & Combat/ventilation and light buzz.mp3"
    vx = src(vent_rel, max_dur=None)
    vent = vx[:, int(8 * SR):int(70 * SR)]
    vent = vent / (np.sqrt(np.mean(vent ** 2)) + 1e-12) * 0.05
    fans = syn_fans(72, vent.shape[1] / SR)
    dc = loopify(vent + 0.8 * fans / (np.sqrt(np.mean(fans ** 2)) + 1e-12) * 0.05)
    L.write_wav(os.path.join(AMB, "amb_datacenter.wav"), norm_peak(dc, -6))
    chip = syn_chip_hum(73, 62.0)
    buzz = L.eq(vent, [("hp", 900, 0.7, 0)]) * 0.35
    chip = loopify(chip / (np.sqrt(np.mean(chip ** 2)) + 1e-12) * 0.05 + buzz)
    L.write_wav(os.path.join(AMB, "amb_chip.wav"), norm_peak(chip, -6))
    stage = loopify(syn_room_air(74, 62.0, lp=1800, level=1.0) + 0.02 * L.butter(L.brown(int(62 * SR), L.rng(75)), "lp", 90, 2))
    L.write_wav(os.path.join(AMB, "amb_stage.wav"), norm_peak(stage, -6))
    amb_meta = {
        "amb_desk_night.wav": {"sources": [S(rel, segment_s=[4, 66], note="real apartment room tone (low rumble)")], "synth": "pink room air LP 2.4 kHz"},
        "amb_datacenter.wav": {"sources": [S(vent_rel, segment_s=[8, 70], note="real ventilation + 60 Hz light buzz")],
                               "synth": "server fans: airflow + 5 drifting blade-pass tones per channel + faint coil whine"},
        "amb_chip.wav": {"sources": [S(vent_rel, segment_s=[8, 70], note="buzz layer, HP 900 Hz, -9 dB")],
                         "synth": "73.4 Hz (D) electrical hum with harmonics, breathing, crackle, coil whine"},
        "amb_stage.wav": {"sources": [], "synth": "studio air (pink LP 1.8 kHz) + sub rumble < 90 Hz"},
    }
    L.save_json(os.path.join(PAL, "palette.json"), {"sr": SR, "files": META, "ambience": amb_meta,
                                                    "rules": "anchor_s = the sample that lands on the cue frame"})
    print("palette files:", len(META))
    for m in META:
        print(f"  {m['file']:22s} anchor {m['anchor_s']:.3f}s dur {m['dur_s']:.2f}s pk {m['peak_db']} momMax {m['max_momentary_lufs']} cen {m['centroid_hz']}")


if __name__ == "__main__":
    build()
