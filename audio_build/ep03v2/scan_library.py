"""Step 1a: shortlist library files by NAME, then measure them (decode only; nothing in the library is executed).

python -I scan_library.py            -> work/library_index.json, work/shortlist_measure.json, prints a compact table

Rules (owner, 9 Oct 2026, and audio_build/CREDITS.md): plain-named files only. Never Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX
(UCS names such as DSGNDron_, DSGNRise_, COMCam_, MAGShim_, anything with B00M). Also skipped: Muctau, CSFX, "AM - " files, Epidemic Sound
(ES_ files, SFX Producer, Rannar Sillard), Delta Leaks x Editing Lair, ALSFX_, Epic Stock Media, Artlist downloads, and files whose names carry
another pack or vendor tag (CTDS2, NGTVST, MA_, am_, SFXW, numbered marketplace ids).
"""
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402

EXCLUDE = re.compile(
    r"(DSGN|COMCam|MAGShim|B00M|BOOM ?Library|Ocular|Chris Alan|8-?Bit SFX|Muctau|CSFX|(^|/)AM - |Epidemic|(^|/)ES_|SFX Producer|"
    r"Rannar Sillard|Delta Leaks|Editing Lair|ALSFX_|Epic Stock|Artlist|CTDS2|NGTVST|(^|/)MA_|(^|/)am_|SFXW\d|CSI_|(^|/)\d{5,6}_|"
    r"\(HD\)|160kbps|Sound Effect|copyright|Nelkboys|YouTube|daruma|ni-sound|y2mate|online-audio-converter)", re.I)
UCS = re.compile(r"^[A-Z]{3,}[a-z]+[A-Za-z]*_")       # UCS CatID prefix such as DSGNRise_, AMBRoom_

# role -> list of (basename regex, how many base files to take)
SHORTLIST = {
    "tile_click": [(r"^Part_Assembly_\d+\.wav$", 8), (r"^Attachments_Small_\d+\.wav$", 4), (r"^click_plastic_\d+\.wav$", 5),
                   (r"^Organic_Click_\d+\.wav$", 4), (r"^Tactile Click", 1), (r"^Clicks_Clanks_\d+\.wav$", 6), (r"^Glass_\d+\.wav$", 3),
                   (r"^Wood_\d+\.wav$", 2)],
    "crate_land": [(r"^Metal Hit (Heavy|Medium)\.wav$", 2), (r"^Slam_Metal_\d+\.wav$", 3), (r"^Metallic_Impact_\d+\.wav$", 2),
                   (r"^Debris_Metal_\d+\.wav$", 3), (r"^Slam_Deep_\d+\.wav$", 3), (r"^Slam_Door_Low_\d+\.wav$", 2), (r"^Drop_Impact_\d+\.wav$", 2),
                   (r"^Hydraulic_\d+\.wav$", 2), (r"^package_drop_\d+\.wav$", 2)],
    "passby": [(r"^Doppler_FX_\d+\.wav$", 3), (r"^Doppler_FX_Tech_\d+\.wav$", 3), (r"^Abstract_Fly_By_\d+\.wav$", 2), (r"^Flyby Whoosh\.wav$", 1),
               (r"^Power_Wooshes_\d+\.wav$", 2)],
    "whoosh": [(r"^small_whoosh_fast_\d+\.wav$", 3), (r"^medium_whoosh_\d+\.wav$", 3), (r"^large_whoosh_\d+\.wav$", 3), (r"^Epic_Swishes_\d+\.wav$", 3),
               (r"^Short Airy Whoosh", 1), (r"^Deep Long Whoosh", 1), (r"^Low Slow Whoosh", 1), (r"^whoosh_swish_high_fast_\d+", 2),
               (r"^Smooth Cinematic Whoosh", 1)],
    "impact": [(r"^Trailer_Hits_Impact_\d+\.wav$", 4), (r"^Cinematic_Hit_\d+\.wav$", 3), (r"^Impact_Hits_\d+\.wav$", 2), (r"^Quick_Impact_\d+\.wav$", 3),
               (r"^Slam_Tech_\d+\.wav$", 2)],
    "sub_drop": [(r"^Bass_Drop_Clean_\d+\.wav$", 3), (r"^Sub_Impact", 1), (r"^Sub_Boom", 1), (r"^LowBoom", 1)],
    "riser": [(r"^Risers_Tech_\d+\.wav$", 4), (r"^Risers_Deep_\d+\.wav$", 3), (r"^Riser Simple\.wav$", 1), (r"^Classic Riser \(\d+\)\.wav$", 2),
              (r"^Energy Rise_\d+\.wav$", 2)],
    "stopwatch": [(r"^click_tick1_\d+\.wav$", 2), (r"^click_tick2_\d+\.wav$", 2), (r"^Tick_Tock_Fast_01\.wav$", 1), (r"^Tick_Tock_Slow_01\.wav$", 1),
                  (r"^clock tick fast\.wav$", 1), (r"^Clock001_Closed\.wav$", 1)],
    "servo": [(r"^Robotic_Movement_\d+\.wav$", 3), (r"^Robotic_Light_\d+\.wav$", 2), (r"^Gears_Cranks_Small_\d+\.wav$", 2), (r"^cam motor\.mp3$", 1),
              (r"^Camera Mechanics", 1)],
    "dial": [(r"^Locked_Down_\d+\.wav$", 3), (r"^Locked_Down_Gears_\d+\.wav$", 2), (r"^Slam_Unlock_\d+\.wav$", 2), (r"^Mechanics_\d+\.wav$", 2),
             (r"^Switch SFX\.mp3$", 1)],
    "key_enter": [(r"^keyboard_(cougar|logitech|macbook|old)_enter\.wav$", 4), (r"^Keyboard one key press\.wav$", 1)],
    "card_riffle": [(r"^turn_paper_fast_\d+\.wav$", 3), (r"^Paper Flip 0\d\.wav$", 2), (r"^SFX - Flip 0\d\.mp3$", 2)],
    "glass_shimmer": [(r"^Gleams_Chimes_\d+\.wav$", 3), (r"^Energy Sparkle_\d+\.wav$", 2), (r"^Metallic Shine Up - version [AB]", 2)],
    "data_chatter": [(r"^Processing-Loop_\d+\.wav$", 4), (r"^Glitch_Tech_Chatter_\d+\.wav$", 3), (r"^digital_data_\d+\.wav$", 3)],
    "rewind": [(r"^VCR_Rewind_01\.wav$", 1), (r"^Rewind\.mp3$", 1), (r"^Rewind_3\.mp3$", 1), (r"^Record_Warp_\d+\.wav$", 2)],
    "glitch": [(r"^Glitch_Tech_Short_\d+\.wav$", 3), (r"^Glitch_Small_\d+\.wav$", 3)],
    "camera_swish": [(r"^Camera Whoosh", 2), (r"^cloth_fast_whoosh_\d+\.wav$", 3), (r"^whoosh_swish_small_\d+", 2)],
    "room": [(r"^apartment ambience\.mp3$", 1), (r"^Office amb[12]\.mp3$", 2), (r"^ventilation and light buzz\.mp3$", 1),
             (r"^ESCP Ambiences \(\d+\)\.wav$", 4), (r"^Atmospheric_Eerie_Tech_0[12]\.wav$", 2), (r"^Drones_Light_\d+\.wav$", 2)],
}


def natural_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def index_library():
    allf = []
    for d, _, fs in os.walk(L.LIB_ROOT):
        for f in fs:
            if f.lower().endswith((".wav", ".mp3", ".flac", ".aif", ".aiff", ".ogg")):
                rel = os.path.relpath(os.path.join(d, f), L.LIB_ROOT).replace("\\", "/")
                allf.append(rel)
    ok = [p for p in allf if not EXCLUDE.search(p) and not UCS.match(p.rsplit("/", 1)[-1])]
    return allf, ok


def pick(ok, rx, n):
    r = re.compile(rx, re.I)
    hits = [p for p in ok if r.search(p.rsplit("/", 1)[-1])]
    base = [p for p in hits if not re.search(r"_[23]\.(wav|mp3)$", p, re.I)] or hits
    return sorted(base, key=lambda p: natural_key(p.rsplit("/", 1)[-1]))[:n]


def measure(path, role):
    long_ok = role == "room"
    x = L.load(os.path.join(L.LIB_ROOT, path), max_dur=45.0 if long_ok else 12.0)
    m = np.max(np.abs(x), axis=0)
    n = x.shape[1]
    out = {"path": path, "role": role, "dur_s": round(n / L.SR, 3)}
    pk = float(m.max()) if n else 0.0
    out["peak_db"] = round(float(L.db(pk)), 2)
    if pk <= 0:
        return out
    w = int(0.005 * L.SR)                                   # 5 ms envelope grid
    k = n // w
    env = m[:k * w].reshape(k, w).max(axis=1) if k else m
    edb = L.db(env / pk)
    act = np.where(edb > -45)[0]
    i0, i1 = (act[0], act[-1]) if len(act) else (0, len(edb) - 1)
    ipk = int(np.argmax(env))
    rise = np.where(edb[i0:ipk + 1] > -20)[0]
    out["onset_ms"] = round(i0 * 5.0, 1)
    out["attack_ms"] = round((ipk - (i0 + (rise[0] if len(rise) else 0))) * 5.0, 1)
    out["peak_at_s"] = round(ipk * 0.005, 3)
    out["active_s"] = round((i1 - i0) * 0.005, 3)
    seg = x[:, i0 * w:(i1 + 1) * w]
    mono = seg.mean(axis=0)
    rms = np.sqrt(np.mean(mono ** 2) + 1e-20)
    out["rms_db"] = round(float(L.db(rms)), 2)
    out["crest_db"] = round(float(L.db(pk / rms)), 1)
    # spectrum of the active part
    nfft = 1 << 15
    f = np.fft.rfftfreq(nfft, 1 / L.SR)
    frames = [mono[a:a + nfft] for a in range(0, max(1, len(mono) - nfft + 1), nfft // 2)][:40]
    ps = np.zeros(len(f))
    for fr in frames:
        if len(fr) < nfft:
            fr = np.pad(fr, (0, nfft - len(fr)))
        ps += np.abs(np.fft.rfft(fr * np.hanning(nfft))) ** 2
    tot = ps.sum() + 1e-20
    out["centroid_hz"] = int(np.sum(f * ps) / tot)
    out["sub_lt120"] = round(float(ps[f < 120].sum() / tot), 3)
    out["low_120_500"] = round(float(ps[(f >= 120) & (f < 500)].sum() / tot), 3)
    out["speech_1k_4k"] = round(float(ps[(f >= 1000) & (f < 4000)].sum() / tot), 3)
    out["air_gt8k"] = round(float(ps[f >= 8000].sum() / tot), 3)
    out["flatness"] = round(float(np.exp(np.mean(np.log(ps[(f > 50) & (f < 16000)] + 1e-20))) / np.mean(ps[(f > 50) & (f < 16000)] + 1e-20)), 3)
    # noise floor: 5th percentile of 20 ms RMS over the whole decoded file, relative to peak
    w2 = int(0.02 * L.SR)
    k2 = n // w2
    if k2 > 4:
        r20 = np.sqrt(np.mean(x.mean(axis=0)[:k2 * w2].reshape(k2, w2) ** 2, axis=1) + 1e-20)
        out["floor_rel_db"] = round(float(L.db(np.percentile(r20, 5) / pk)), 1)
        if long_ok:
            sec = int(L.SR)
            k3 = n // sec
            r1 = L.db(np.sqrt(np.mean(x.mean(axis=0)[:k3 * sec].reshape(k3, sec) ** 2, axis=1) + 1e-20))
            out["stationarity_db_std"] = round(float(np.std(r1)), 2)
            out["transient_ratio_db"] = round(float(L.db(np.percentile(env, 99.5) / (np.median(env) + 1e-12))), 1)
    out["clip_samples"] = int(np.sum(m >= 0.999))
    if x.shape[1] > 100:
        a, b = x[0] - x[0].mean(), x[1] - x[1].mean()
        out["lr_corr"] = round(float(np.dot(a, b) / (np.sqrt(np.dot(a, a) * np.dot(b, b)) + 1e-20)), 3)
    return out


def main():
    allf, ok = index_library()
    L.save_json(os.path.join(L.HERE, "work", "library_index.json"), {"total": len(allf), "allowed": len(ok), "allowed_files": ok})
    picks = []
    for role, pats in SHORTLIST.items():
        for rx, n in pats:
            for p in pick(ok, rx, n):
                picks.append((role, p))
    print("library files:", len(allf), "allowed by name:", len(ok), "shortlisted:", len(picks))
    res = []
    for role, p in picks:
        try:
            res.append(measure(p, role))
        except Exception as e:  # unreadable file: record and move on
            res.append({"path": p, "role": role, "error": str(e)[:120]})
    L.save_json(os.path.join(L.HERE, "work", "shortlist_measure.json"), res)
    cols = ["dur_s", "peak_db", "attack_ms", "peak_at_s", "active_s", "centroid_hz", "sub_lt120", "speech_1k_4k", "floor_rel_db", "clip_samples"]
    cur = None
    for r in res:
        if r["role"] != cur:
            cur = r["role"]
            print("\n##", cur, "|", " ".join(cols))
        name = r["path"].rsplit("/", 1)[-1][:34]
        if "error" in r:
            print(f"  {name:34s} ERROR {r['error']}")
            continue
        extra = f" st{r.get('stationarity_db_std', '')} tr{r.get('transient_ratio_db', '')}" if r["role"] == "room" else ""
        print(f"  {name:34s} " + " ".join(str(r.get(c, "-")) for c in cols) + extra)


if __name__ == "__main__":
    main()
