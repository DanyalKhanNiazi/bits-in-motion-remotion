"""Step 4: the v2 mixer for Episode 03.

python -I build_mix_v2.py                 # full mix -> Claude Work/Episode 03 - AI Answers/audio/ep03_mix_v2.wav (+ measure_v2.json, CREDITS_v2.md)

Reads the builders' cue files (src/ep03/sections/S*.cues.json, read only), cues_extra.json, palette_lib/, ambience/, the score stems
(stems/*.wav from compose_score.py) and the locked narration. Re-runnable for a re-timed picture: refresh the picture stats and
cues_extra.json (make_cues_extra.py), re-run compose_score.py if hero frames moved, then this script.

Rules implemented:
- narration: decoded once, one fixed gain, a true-peak limiter; it starts at sample 0 and stays sample-aligned (checked by correlation);
- music: >= 18 LU under the voice wherever the voice speaks (nominal 21 LU, closed loop on 400 ms / 1 s / 3 s / phrase windows), a
  speech-band carve (dynamic: deeper while the voice speaks), and swells of up to ~8-10 LU under the voice in pauses >= 0.4 s;
- effects: real foley / effects from palette_lib, placed sample-exact on their cue frames (anchor = onset / peak / end by kind),
  panned toward on-screen positions, never more than 3 events starting within 100 ms;
- ambience: a bed per environment with crossfades at the cuts, plus the glass-deck hum on bridge shots;
- loudness: -14 LUFS integrated, true peak <= -1 dBTP (final 4x-oversampled look-ahead limiter at -1.3 dBTP, verified with ffmpeg).
"""
import json
import os
import sys
import time

import numpy as np
from scipy.ndimage import maximum_filter1d, uniform_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402

SR = L.SR
N = L.N_TOTAL
HERE = L.HERE
PAL = os.path.join(HERE, "palette_lib")
WORK = os.path.join(HERE, "work")
OUT_WAV = os.path.join(L.OUT_DIR, "ep03_mix_v2.wav")
SPEC = dict(I_target=-14.0, I_tol=0.5, TP_max=-1.0, gap_min=18.0)
GAP_NOMINAL = 21.5           # music sits this far under the voice while it speaks (closed loop keeps >= GAP_FLOOR)
GAP_FLOOR = 18.6
PAUSE_GAP = 9.5              # in pauses >= 0.4 s the music may rise to about this far under the voice
VOICE_CEIL = -1.5
FINAL_CEIL = -1.3
HERO_ROLES = {"impact_big", "impact_small", "sub_drop", "crate_land", "crate_pass", "riser", "tape_rewind", "tape_stop", "dial_clunk", "key_enter"}
BASE = {  # target max momentary loudness of one event at strength 1, relative to the voice's integrated loudness (LU)
    "impact_big": -2.0, "impact_small": -8.0, "sub_drop": -7.0, "crate_land": -6.0, "crate_pass": -11.0, "whoosh_fast": -14.0,
    "whoosh_med": -13.0, "whoosh_slow": -13.0, "cam_swish": -18.0, "riser": -10.0, "tile_click": -19.0, "tile_seat": -17.0,
    "ui_pop": -18.0, "blade_snip": -17.0, "stopwatch_click": -18.0, "stopwatch_run": -27.0, "servo": -15.0, "dial_clunk": -11.0,
    "dial_ratchet": -17.0, "key_enter": -13.0, "card_riffle": -15.0, "glass_shimmer": -17.0, "data_chatter": -25.0, "tape_rewind": -11.0,
    "tape_stop": -14.0, "glitch": -14.0}
AMB_REL = {"desk": -25.0, "datacenter": -22.0, "chip": -24.0, "stage": -31.0, "glass_hum": -29.0}
MUSIC_BAL = {"pads": 0.0, "pulse": -1.0, "bass": -2.0, "perc": -3.0, "motif": 0.5, "hits": 1.0}


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ----------------------------------------------------------------------------------------------- voice
def load_voice():
    cache = os.path.join(WORK, "voice48k.npy")
    st = os.stat(L.VOICE)
    meta_p = cache + ".json"
    if os.path.exists(cache) and os.path.exists(meta_p):
        m = json.load(open(meta_p))
        if m.get("size") == st.st_size and m.get("mtime") == int(st.st_mtime):
            v = np.load(cache).astype(np.float64)
            return v
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", L.VOICE, "-af", "aresample=48000:resampler=soxr:precision=28", "-f", "f64le",
                          "-ac", "2", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.float64).reshape(-1, 2).T.copy()
    np.save(cache, v.astype(np.float32))
    json.dump({"size": st.st_size, "mtime": int(st.st_mtime)}, open(meta_p, "w"))
    return v


def speech_mask(v):
    """10 ms grid: True where the voice speaks (gaps < 0.4 s bridged). Returns (mask10, pauses as (start, end) in 10 ms units)."""
    p = L.kpower(v)
    I = L.integrated(p)
    w = SR // 100
    k = len(p) // w
    e = L.lufs(p[:k * w].reshape(k, w).mean(axis=1))
    e = uniform_filter1d(e, 3)
    act = e > I - 30
    m = act.copy()
    edges = np.flatnonzero(np.diff(np.r_[0, (~act).astype(int), 0]))
    pauses = []
    for a, b in zip(edges[::2], edges[1::2]):
        if b - a < 40:
            m[a:b] = True
        else:
            pauses.append((int(a), int(b)))
    return m, pauses, I, act


# ----------------------------------------------------------------------------------------------- cues
def load_palette():
    meta = json.load(open(os.path.join(PAL, "palette.json")))
    files = {m["file"][:-4]: m for m in meta["files"]}
    roles = {}
    for name, m in files.items():
        roles.setdefault(m["role"], []).append(name)
    for r in roles:
        roles[r].sort()
    return files, roles


_wav = {}


def wav(name):
    if name not in _wav:
        p = os.path.join(PAL, name + ".wav") if not name.endswith(".wav") else os.path.join(HERE, name)
        _wav[name] = L.load(p)
    return _wav[name]


def builder_cues():
    out = []
    for i in range(1, 10):
        p = os.path.join(L.SECTIONS_DIR, f"S{i}.cues.json")
        for c in json.load(open(p, encoding="utf-8")):
            out.append({"frame": int(c["frame"]), "kind": c["kind"], "strength": float(c.get("strength", 0.5)), "src": f"S{i}"})
    return sorted(out, key=lambda c: c["frame"])


def picture_transitions():
    p = os.path.join(WORK, "v4_framestats.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p))
    sc = np.array(d["scene"])
    return np.convolve(sc, np.ones(6), "same")


class Placer:
    def __init__(self, files, roles, voice_I, speech10):
        self.files, self.roles, self.V, self.sp = files, roles, voice_I, speech10
        self.count = {}
        self.items = []

    def variant(self, role):
        if role in self.files:                      # an explicit file (e.g. glass_shimmer_2)
            return role, self.files[role]["role"]
        base = role
        if role == "riser":
            raise ValueError
        lst = self.roles[base]
        k = self.count.get(base, 0)
        self.count[base] = k + 1
        return lst[k % len(lst)], base

    def speaking(self, frame):
        i = int(frame / 30 * 100)
        return bool(self.sp[min(max(i, 0), len(self.sp) - 1)])

    def place(self, frame, role, strength, pan=0.0, pan_to=None, gain_db=0.0, anchor="default", cue=None, layers=1, trim_pre_s=None,
              end_frame=None, src="extra", note="", group=None):
        name, base = self.variant(role)
        m = self.files[name]
        bkey = "riser" if base.startswith("riser") else base
        lvl = BASE.get(bkey, -18.0) + 8.0 * (strength - 1.0) + gain_db - 2.0 * (layers - 1)
        if bkey not in HERO_ROLES and self.speaking(frame):
            lvl -= 2.0
        gain = self.V + lvl - m["max_momentary_lufs"]
        self.last_level = lvl
        a_s = 0.0 if anchor == "start" else m["anchor_s"]
        self.items.append({"frame": frame, "cue": frame if cue is None else cue, "file": name, "role": base, "anchor_s": a_s, "gain_db": gain,
                           "pan": pan, "pan_to": pan_to, "strength": strength, "trim_pre_s": trim_pre_s, "end_frame": end_frame, "src": src,
                           "note": note, "group": group, "level_rel_voice_LU": round(lvl, 1)})


def build_placements(files, roles, V, speech10, extra):
    P = Placer(files, roles, V, speech10)
    cues = builder_cues()
    trans_w = picture_transitions()
    silences = [(s["from"], s["to"]) for s in extra.get("silences", [])]
    whips = {int(k): v for k, v in extra.get("whip_directions", {}).items()}
    ovs = extra["overrides"]
    used_ov = set()

    def find_ov(c):
        best = None
        for i, o in enumerate(ovs):
            if o["kind"] == c["kind"] and abs(o["frame"] - c["frame"]) <= o.get("tol", 6) and i not in used_ov:
                if best is None or abs(o["frame"] - c["frame"]) < abs(ovs[best]["frame"] - c["frame"]):
                    best = i
        if best is not None:
            used_ov.add(best)
            return ovs[best]
        return None

    def sweep(frame, default=(0.0, None)):
        for k, v in whips.items():
            if abs(k - frame) <= 10:
                return (-0.55, 0.55) if v == "L" else (0.55, -0.55)
        return default

    heroes = [c for c in cues if c["kind"] in ("impact", "sting", "crate", "swell")]
    for c in cues:
        f, k, s = c["frame"], c["kind"], c["strength"]
        o = find_ov(c)
        if o and o.get("drop"):
            continue
        pan = o["pan"] if o else 0.0
        pan_to = o.get("pan_to") if o else None
        g = o.get("gain_db", 0.0) if o else 0.0
        anchor = o.get("anchor", "default") if o else "default"
        note = (o["note"] if o else "") + f" [builder {c['src']} {k}]"
        if k == "riser":
            h = next((x["frame"] for x in heroes if f < x["frame"] <= f + 200), None)
            end = h if h is not None else f + 30
            for a, b in silences:
                if f < a <= end:
                    end = a
            dur = (end - f) / 30.0
            if dur > 4.5:                                               # very long gap: a slow whoosh on the cue, the riser ends on the reveal
                pa, pb = sweep(f)
                P.place(f, "whoosh_slow", s, pa, pb, g, anchor="start", src="builder", note=note + " (lens dive)")
                dur = 4.0
                f_start = end - 120
            else:
                f_start = f
            role = "riser_1s" if dur <= 1.0 else ("riser_2s" if dur <= 2.0 else "riser_4s")
            P.place(end, role, s, pan, pan_to, g + 2.0, cue=f, trim_pre_s=(end - f_start) / 30.0, end_frame=end, src="builder", note=note)
            continue
        if k == "whoosh":
            peak = f + 7
            if trans_w is not None:
                seg = trans_w[f + 3:f + 13]
                if len(seg) and seg.max() > 0.15:
                    peak = f + 3 + int(np.argmax(seg))
            pre = (peak - f) / 30.0
            role = "whoosh_fast" if pre <= 0.21 else ("whoosh_med" if pre <= 0.27 else "whoosh_slow")
            pa, pb = sweep(f, (pan, pan_to))
            P.place(peak, role, s, pa, pb, g, cue=f, trim_pre_s=pre, src="builder", note=note + f" (peaks on the cut at {peak})")
            continue
        if o:
            rl = o["roles"]
        else:
            rl = {"tick": ["stopwatch_click"], "pop": ["ui_pop"], "swell": ["glass_shimmer"], "dial": ["dial_clunk", "dial_ratchet"],
                  "crate": ["crate_pass", "crate_land"], "sting": ["glass_shimmer_2"], "glitch": ["glitch"], "rewind": ["tape_rewind"],
                  "type": ["data_chatter"]}.get(k)
            if k == "impact":
                rl = ["impact_big", "sub_drop"] if s >= 0.85 else (["impact_big"] if s >= 0.7 else ["impact_small"])
            if k in ("sting", "type", "rewind"):
                anchor = "start" if k != "sting" else "default"
        both_crate = "crate_pass" in rl and "crate_land" in rl
        for r in rl:
            fr = f
            if r == "crate_pass" and both_crate:
                fr = f - 6
            an = anchor
            if r in ("dial_ratchet", "glass_shimmer_2") and anchor == "default":
                an = "start"
            P.place(fr, r, s, pan, pan_to, g, anchor=an, cue=f, layers=len(rl), src="builder", note=note)
    # extra events
    for e in extra["events"]:
        P.place(e["frame"], e["role"], e["strength"], e.get("pan", 0.0), e.get("pan_to"), 0.0, anchor=e.get("anchor", "default"), src="extra",
                note=e.get("note", ""), group=e.get("group"))
    # picture transitions without a builder whoosh: start 7 frames before the cut, peak on it
    bw = [c["frame"] for c in cues if c["kind"] in ("whoosh", "riser")]
    for t in extra["transitions"]["items"]:
        p = t["peak"]
        d = t.get("dir")
        covered = any(p - 16 <= f < p for f in bw)
        grp = f"trans{p}"
        pa, pb = ((-0.55, 0.55) if d == "L" else (0.55, -0.55)) if d else (0.0, None)
        if not covered:
            P.place(p, "whoosh_fast" if t["score"] < 0.6 else "whoosh_med", 0.5, pa, pb, -1.0, cue=p - 7, trim_pre_s=7 / 30.0, src="transition",
                    note=f"picture transition (scene score {t['score']})", group=grp)
        if t.get("flash"):
            P.place(p, "impact_small", 0.4, 0.0, None, -2.0, src="transition", note="flash cut", group=grp)
    return P.items, used_ov


def enforce_stack(items, max_n=3, win_s=0.1):
    """Events = distinct sync points (cue frames). Within any 100 ms window keep at most max_n; drop the weakest extras first."""
    ev = {}
    for it in items:
        ev.setdefault((it["cue"], it["src"]), []).append(it)
    keys = sorted(ev, key=lambda k: k[0])
    dropped = []
    changed = True
    while changed:
        changed = False
        frames = [k[0] for k in keys]
        for i in range(len(keys)):
            j = i
            while j + 1 < len(keys) and (frames[j + 1] - frames[i]) / 30.0 < win_s:
                j += 1
            grp = keys[i:j + 1]
            if len(grp) > max_n:
                cand = sorted(grp, key=lambda k: (k[1] == "builder", max(x["strength"] for x in ev[k])))
                victim = cand[0]
                dropped.append(victim)
                keys.remove(victim)
                changed = True
                break
    kept = [it for k in keys for it in ev[k]]
    return kept, [ev[k][0]["note"] + f" @{k[0]}" for k in dropped]


# ----------------------------------------------------------------------------------------------- render effects + ambience
def render_fx(items):
    fx = np.zeros((2, N))
    for it in items:
        x = wav(it["file"])
        a = int(round(it["anchor_s"] * SR))
        if it["trim_pre_s"] is not None:
            keep = int(round(it["trim_pre_s"] * SR))
            if keep < a:
                x = x[:, a - keep:]
                a = keep
                x = L.fade(x, min(0.06, it["trim_pre_s"] * 0.5), 0.0)
        if it["end_frame"] is not None:                       # risers: cut exactly at the arrival
            e = a
            x = L.fade(x[:, :e + int(0.004 * SR)], 0.0, 0.004)
        y = x * L.undb(it["gain_db"])
        if it["pan_to"] is not None:
            pan = np.linspace(it["pan"], it["pan_to"], y.shape[1])
            y = L.pan_stereo(y, pan)
        elif it["pan"]:
            y = L.pan_stereo(y, it["pan"])
        start = L.f2s(it["frame"]) - a
        it["start_sample"] = start
        it["anchor_sample"] = start + a
        L.mix_into(fx, y, start)
    return fx


def tile_bed(bed, f0, f1, offset_s):
    n = L.f2s(f1) - L.f2s(f0)
    reps = int(np.ceil((n + offset_s * SR) / bed.shape[1])) + 1
    t = np.tile(bed, reps)
    o = int(offset_s * SR) % bed.shape[1]
    return t[:, o:o + n]


def render_amb(extra, V, speech10):
    beds = extra["ambience"]["beds"]
    amb = np.zeros((2, N))
    xf = L.f2s(10)
    for i, r in enumerate(extra["ambience"]["regions"]):
        b = wav(beds[r["bed"]])
        lvl = V + AMB_REL[r["bed"]] - L.lufs(L.kpower(b).mean())
        a0, a1 = L.f2s(r["from"]), L.f2s(r["to"])
        lo, hi = max(0, a0 - xf // 2), min(N, a1 + xf // 2)
        seg = tile_bed(b, lo / SR * 30, hi / SR * 30, (i * 7.3) % 40) * L.undb(lvl)
        n = seg.shape[1]
        env = np.ones(n)
        k = min(xf, n // 2)
        env[:k] = np.sin(0.5 * np.pi * np.arange(k) / k) ** 2
        env[n - k:] = np.cos(0.5 * np.pi * np.arange(k) / k) ** 2
        amb[:, lo:lo + n] += seg * env
    hum = wav(beds["glass_hum"])
    hum_l = L.lufs(L.kpower(hum).mean())
    for r in extra["ambience"]["glass_hum"]:
        a0, a1 = L.f2s(r["from"]), L.f2s(r["to"])
        seg = tile_bed(hum, r["from"], r["to"], 1.7) * L.undb(V + AMB_REL["glass_hum"] - hum_l)
        amb[:, a0:a0 + seg.shape[1]] += L.fade(seg, 0.3, 0.5)
    sp = np.repeat(speech10.astype(np.float64), SR // 100)
    sp = np.pad(sp, (0, max(0, N - len(sp))))[:N]
    duck = uniform_filter1d(sp, int(0.25 * SR))
    amb *= L.undb(-2.5 * duck)
    return amb


# ----------------------------------------------------------------------------------------------- music bus
def load_music():
    stems = {}
    for s in MUSIC_BAL:
        x = L.load(os.path.join(HERE, "stems", s + ".wav"))
        stems[s] = np.pad(x, ((0, 0), (0, max(0, N - x.shape[1]))))[:, :N] * L.undb(MUSIC_BAL[s])
    bus = sum(stems.values())
    return bus


def series(p, block, hop):
    st, bp = L.block_power(p, block, hop)
    return st, L.lufs(bp)


def music_gain(bus, vg, speech10, pauses, act10):
    """Gain curve (N,) for the music bus: nominal GAP_NOMINAL under the voice in speech, lifted in pauses, then a closed loop that
    enforces >= GAP_FLOOR LU in every speech window class. Returns (gain, report)."""
    pv = L.kpower(vg)
    V = L.integrated(pv)
    sp = np.repeat(speech10.astype(np.float64), SR // 100)
    sp = np.pad(sp, (0, max(0, N - len(sp))))[:N]
    ar = np.repeat(act10.astype(np.float64), SR // 100)                   # raw activity: decides which windows are "the voice speaks"
    ar = np.pad(ar, (0, max(0, N - len(ar))))[:N]
    pm = L.kpower(bus)
    sel = sp > 0.5
    m_speech = L.lufs(pm[sel].mean())
    g0 = V - GAP_NOMINAL - m_speech
    # pause lift: smooth bumps inside pauses >= 0.4 s (attack 120 ms after the pause starts, release finishes 60 ms before speech)
    lift = np.zeros(N)
    for a, b in pauses:
        a_s, b_s = a * SR // 100, b * SR // 100
        dur = (b_s - a_s) / SR
        up = int(min(0.14, dur * 0.35) * SR)
        dn = int(min(0.12, dur * 0.3) * SR)
        lead = int(0.03 * SR)
        tail = int(0.06 * SR)
        s0, s1 = a_s + lead, b_s - tail
        if s1 - s0 < up + dn:
            continue
        env = np.ones(s1 - s0)
        env[:up] = np.sin(0.5 * np.pi * np.arange(up) / up) ** 2
        env[-dn:] = np.cos(0.5 * np.pi * np.arange(dn) / dn) ** 2
        lift[s0:s1] = np.maximum(lift[s0:s1], env)
    # calibrate on the MEDIAN 3 s gap over speech (the mean is dominated by the score's loudest hits)
    B3, H3 = 3 * SR, SR // 4
    _, lv3 = series(pv, B3, H3)
    _, lm3 = series(pm, B3, H3)
    _, sp3 = L.block_power(ar, B3, H3)
    ok3 = sp3 >= 0.5
    med_gap = float(np.median((lv3 - (lm3 + g0))[ok3]))
    g0 += med_gap - GAP_NOMINAL
    lift_db = lift * (GAP_NOMINAL - PAUSE_GAP)
    g = np.full(N, g0) + lift_db
    rep = {"voice_I": V, "music_speech_lufs_raw": m_speech, "static_gain_db": g0, "pauses": len(pauses)}
    classes = [("400ms", 0.4, 0.05, 0.95), ("1s", 1.0, 0.1, 0.9), ("3s", 3.0, 0.25, 0.5)]
    trim_total = np.zeros(N)
    for it in range(4):
        mg = bus * L.undb(g + trim_total)
        pmg = L.kpower(mg)
        need = np.zeros(N // 480 + 1)
        worst = 99.0
        for name, blk, hop, frac in classes:
            B, H = int(blk * SR), int(hop * SR)
            st, lv = series(pv, B, H)
            _, lm = series(pmg, B, H)
            _, spf = L.block_power(ar, B, H)
            ok = spf >= frac
            gap = lv - lm
            if ok.any():
                worst = min(worst, float(gap[ok].min()))
            bad = ok & (gap < GAP_FLOOR + 0.3)
            for s0, d in zip(st[bad], (GAP_FLOOR + 0.3 - gap[bad])):
                i0, i1 = s0 // 480, (s0 + B) // 480 + 1
                need[i0:i1] = np.maximum(need[i0:i1], d)
        rep[f"loop_{it}_worst_gap"] = worst
        if need.max() <= 0.01:
            break
        need = np.minimum(need, 10.0)
        need = maximum_filter1d(need, 21)
        need = uniform_filter1d(need, 25)
        trim = np.repeat(need, 480)[:N]
        trim_total -= np.pad(trim, (0, max(0, N - len(trim))))[:N]
    rep["max_trim_db"] = float(-trim_total.min())
    rep["median_trim_db_in_speech"] = float(-np.median(trim_total[sp > 0.5]))
    return g + trim_total, sp, rep


def carve(bus, sp):
    """Dynamic speech-band carve: -7 dB around 2.5 kHz (plus -3 dB at 1.2 kHz) while the voice speaks, -2 dB in pauses."""
    deep = L.eq(bus, [("peak", 2500, 0.7, -7.0), ("peak", 1200, 1.0, -3.0), ("peak", 4200, 1.2, -2.0)])
    light = L.eq(bus, [("peak", 2500, 0.8, -2.0)])
    a = uniform_filter1d(sp, int(0.12 * SR))
    return deep * a + light * (1 - a)


# ----------------------------------------------------------------------------------------------- measurement helpers
def gaps_report(vg, mg, sp):
    pv, pm = L.kpower(vg), L.kpower(mg)
    out = {}
    for name, blk, hop, frac in [("400ms", 0.4, 0.05, 0.95), ("1s", 1.0, 0.1, 0.9), ("3s", 3.0, 0.25, 0.5)]:
        B, H = int(blk * SR), int(hop * SR)
        _, lv = series(pv, B, H)
        _, lm = series(pm, B, H)
        _, spf = L.block_power(sp, B, H)
        ok = spf >= frac
        gp = (lv - lm)[ok]
        out[name] = {"windows": int(ok.sum()), "min": round(float(gp.min()), 2), "p05": round(float(np.percentile(gp, 5)), 2),
                     "median": round(float(np.median(gp)), 2)}
    sel = sp > 0.5
    out["integrated_over_speech"] = round(float(L.lufs(pv[sel].mean()) - L.lufs(pm[sel].mean())), 2)
    return out


def alignment(raw, mixed_voice):
    """Lag of the mixed voice against the raw decode (cross-correlation on a 60 s excerpt)."""
    a = raw.mean(axis=0)[SR * 30:SR * 90]
    b = mixed_voice.mean(axis=0)[SR * 30:SR * 90]
    best = (None, -1)
    for lag in range(-8, 9):
        c = np.dot(a[8:-8], np.roll(b, -lag)[8:-8]) / (np.linalg.norm(a[8:-8]) * np.linalg.norm(b[8:-8]) + 1e-20)
        if c > best[1]:
            best = (lag, c)
    return {"best_lag_samples": best[0], "correlation": round(float(best[1]), 6)}


# ----------------------------------------------------------------------------------------------- main
def main():
    t0 = time.time()
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(L.OUT_DIR, exist_ok=True)
    extra = json.load(open(os.path.join(HERE, "cues_extra.json"), encoding="utf-8"))
    files, roles = load_palette()
    raw = load_voice()
    raw = np.pad(raw, ((0, 0), (0, max(0, N - raw.shape[1]))))[:, :N]
    speech10, pauses, I_raw, act10 = speech_mask(raw)
    np.save(os.path.join(WORK, "voice_act10ms.npy"), act10)
    log("voice I raw", round(I_raw, 2), "pauses >= 0.4 s:", len(pauses))

    # first pass voice gain (re-solved below so the final mix lands on -14 LUFS)
    G0 = SPEC["I_target"] - I_raw - 0.25
    music_raw = load_music()
    log("music loaded")
    best = None
    for attempt in range(3):
        vg, vlim = L.tp_limiter(raw * L.undb(G0), VOICE_CEIL)
        V = L.integrated(L.kpower(vg))
        items, used_ov = build_placements(files, roles, V, speech10, extra)
        items, dropped = enforce_stack(items)
        fx = render_fx(items)
        amb = render_amb(extra, V, speech10)
        gain, sp, mrep = music_gain(music_raw, vg, speech10, pauses, act10)
        music = carve(music_raw * L.undb(gain), sp)
        # silences (full-mix suck-out: everything but the voice)
        for s in extra.get("silences", []):
            i0, i1 = L.f2s(s["from"]), L.f2s(s["to"])
            r = int(0.015 * SR)
            for x in (fx, amb, music):
                x[:, i0:i1] = 0.0
                x[:, i0 - r:i0] *= np.linspace(1, 0, r)
        mix = vg + fx + amb + music
        out, glim = L.tp_limiter(mix, FINAL_CEIL)
        I = L.integrated(L.kpower(out))
        log(f"attempt {attempt}: G0 {G0:+.2f} dB -> I {I:.2f} LUFS")
        best = (G0, vg, vlim, fx, amb, music, out, glim, items, dropped, mrep, I, used_ov)
        if abs(I - SPEC["I_target"]) <= 0.08:
            break
        G0 += SPEC["I_target"] - I
    G0, vg, vlim, fx, amb, music, out, glim, items, dropped, mrep, I, used_ov = best
    L.write_wav(OUT_WAV, out, bits=24)
    log("written", OUT_WAV)

    # stems for the report (float16 to save space)
    for name, x in (("voice", vg), ("fx", fx), ("amb", amb), ("music", music)):
        np.save(os.path.join(WORK, f"stem_{name}.npy"), x.astype(np.float16))

    ff = L.ffmpeg_ebur128(OUT_WAV)
    pv = L.kpower(vg)
    meas = {
        "file": OUT_WAV.replace("\\", "/"),
        "format": {"sample_rate": SR, "channels": 2, "bits": 24, "samples": int(out.shape[1]), "duration_s": round(out.shape[1] / SR, 4),
                   "frames_at_30fps": round(out.shape[1] / SR * 30, 3)},
        "loudness": {"integrated_LUFS_ffmpeg": ff.get("I"), "LRA_LU_ffmpeg": ff.get("LRA"), "true_peak_dBTP_ffmpeg": ff.get("TP"),
                     "integrated_LUFS_numpy": round(I, 2), "true_peak_dBTP_numpy_8x": round(L.true_peak_db(out, 8), 2),
                     "LRA_numpy": round(L.lra(L.kpower(out))[0], 2), "voice_only_LRA": round(L.lra(pv)[0], 2), "target": SPEC},
        "voice": {"fixed_gain_dB": round(G0, 3), "voice_limiter_ceiling_dBTP": VOICE_CEIL,
                  "voice_limiter_max_GR_dB": round(float(L.db(vlim.min())), 2),
                  "voice_limiter_pct_samples_over_1dB": round(float(np.mean(vlim < L.undb(-1.0)) * 100), 2),
                  "final_limiter_max_GR_dB": round(float(L.db(glim.min())), 2),
                  "final_limiter_pct_samples_over_0.5dB": round(float(np.mean(glim < L.undb(-0.5)) * 100), 3),
                  "alignment_mixed_voice_vs_raw": alignment(raw, vg), "alignment_final_mix_vs_raw": alignment(raw, out),
                  "starts_at_sample": 0},
        "music_vs_voice_LU": gaps_report(vg, music, np.pad(np.repeat(act10.astype(np.float64), SR // 100), (0, N))[:N]),
        "music_gain": {k: (round(v, 2) if isinstance(v, float) else v) for k, v in mrep.items()},
        "effects": {"placed_sounds": len(items), "sync_points": len({(i["cue"], i["src"]) for i in items}), "dropped_by_stack_rule": dropped,
                    "overrides_used": len(used_ov), "overrides_total": len(extra["overrides"])},
        "pauses_ge_0.4s": len(pauses),
        "build_seconds": round(time.time() - t0, 1),
    }
    L.save_json(os.path.join(L.OUT_DIR, "measure_v2.json"), meas)
    L.save_json(os.path.join(WORK, "placements.json"), items)
    write_credits(items)
    log(json.dumps(meas["loudness"]), json.dumps(meas["music_vs_voice_LU"]))
    log("done in", round(time.time() - t0), "s")


def write_credits(items):
    files = json.load(open(os.path.join(PAL, "palette.json")))
    used = sorted({it["file"] for it in items})
    lines = ["# Episode 03 v2 mix: credits and sources", "",
             "**Mix:** `ep03_mix_v2.wav` (48 kHz, 24-bit, stereo), built by `remotion/audio_build/ep03v2/build_mix_v2.py`.", "",
             "## Music", "",
             "Original score composed and synthesized in code for this video (`compose_score.py`): D minor, 100 BPM, 21 cues. No samples, no "
             "loops and no third-party music. No credit or licence is needed. Nothing imitates an existing piece.", "",
             "The licensed Pixabay bed from v1 (\"Minimal Idm Ambient Works - Loop\" by Musinova, Pixabay Content License) is **not used** in v2; "
             "it stays only as a documented fallback (see `audio_build/CREDITS.md`).", "",
             "## Sound effects", "",
             "Real effects come from the owner's library `D:/Assets/01 Audio/Sound Effects/` (plain-named files only). Nothing from Ocular "
             "Sounds, BOOM Library, The Chris Alan 8-Bit SFX, Muctau, CSFX, \"AM - \" files, Epidemic Sound, Delta Leaks x Editing Lair, ALSFX_, "
             "Epic Stock Media or Artlist. Their licence status is the owner's (origin of these plain-named files is not recorded in their "
             "metadata). Exact source paths and hashes per palette file: `audio_build/ep03v2/SOURCES.md`.", "",
             "| palette file used | sources |", "|---|---|"]
    for m in files["files"]:
        if m["file"][:-4] in used:
            src = "; ".join(s["path"].replace("D:/Assets/01 Audio/Sound Effects/", "") for s in m["sources"]) or "synthesized in code"
            lines.append(f"| `{m['file']}` | {src} |")
    lines += ["", "Ambience beds: `amb_desk_night` (library `14 Ambiences & Beds/apartment ambience.mp3` + synthesized air), `amb_datacenter` "
              "(library `12 Weapons & Combat/ventilation and light buzz.mp3` + synthesized fans), `amb_chip` (synthesized hum + the same buzz, "
              "high-passed), `amb_stage` (synthesized).", "",
              "## Narration", "", "The channel's own recording `Videos/03 Why AI Answers Arrive One Piece at a Time/Voiceover/Fullvoiceover.mp3`, "
              "unchanged except one fixed gain and a true-peak limiter; sample-aligned from t = 0."]
    open(os.path.join(L.OUT_DIR, "CREDITS_v2.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
