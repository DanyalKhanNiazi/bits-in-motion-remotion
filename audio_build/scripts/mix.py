"""Bits in Motion intro mixer: voice stem + music bed + SFX cues from a builder's cues.json.

Usage (from audio_build/scripts):
  python -I mix.py --style N --cues <cues.json> --out <wav> --report <json>
Optional: --voice <wav> --bed <wav> --kit <dir>   (defaults: public/audio/voice_intro.wav,
          audio_build/music/styleN_bed.wav, audio_build/sfx/styleN/)

cues.json (Part A, A7):
  { "style": N, "cues": [ {"cue": "button", "frame": 0}, {"cue": "land", "frame": 59, "note": "A"},
                          {"cue": "standby", "start": 1475, "end": 1817}, ... ] }
Vocabulary: button (f0 and f1837 only: press at the frame, release release_delay_ms later), land (note A/C/D/E/G),
energize, standby (span, 0.4 s fades inside the span), lens_open, lens_close, dive, lock (the double tick), alert,
and (style 6 kit only) surface, the reverse of dive.
Optional per-cue "gain_db" (-20..+3) trims a cue's level; unknown keys are ignored.

Levels: each cue's peak is set relative to the narration's local peak (max within +-1 s of the cue), using
"level_db" from the style's kit.json; standby is set relative to the narration's typical speech peak.
Output: 48 kHz, 24-bit, stereo WAV of exactly 63.000 s, after a final true-peak safety limiter at -1.0 dBTP.
Exit code 0 = every measured value in spec, 1 = a value out of spec (the WAV and report are still written),
2 = bad input, 3 = unexpected error."""
import argparse, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

FPS = 30
DUR_S = 63.0
NS = int(DUR_S * SR)
VOCAB = {"button", "land", "energize", "standby", "lens_open", "lens_close", "dive", "lock", "alert",
         "surface"}   # style 6 addition: the reverse of dive (bible T7, long-form); a kit without it exits 2 if it is used
NOTES = {"A", "C", "D", "E", "G"}
SPEC = {"I_target": -14.0, "I_tol": 0.5, "TP_max": -1.0, "music_gap_min_LU": 18.0, "standby_max_rel_db": -24.0}
FINAL_LIMIT_INTERNAL = -1.15   # limiter threshold on the 4x-oversampled peak (margin for the -1.0 dBTP spec)
STANDBY_FADE = 0.4


def die(msg):
    print("INPUT ERROR:", msg, file=sys.stderr)
    sys.exit(2)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", type=int, required=True, choices=[1, 2, 3, 4, 5, 6])
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", required=True)
    ap.add_argument("--voice", default=VOICE_STEM)
    ap.add_argument("--bed", default=None)
    ap.add_argument("--kit", default=None)
    a = ap.parse_args()
    bed_p = a.bed or os.path.join(BUILD, "music", "style%d_bed.wav" % a.style)
    kit_d = a.kit or os.path.join(BUILD, "sfx", "style%d" % a.style)
    for p in (a.cues, a.voice, bed_p, os.path.join(kit_d, "kit.json")):
        if not os.path.exists(p):
            die("missing file: %s" % p)
    try:
        cj = json.load(open(a.cues, encoding="utf-8"))
    except Exception as e:
        die("cues.json is not valid JSON: %s" % e)
    if not isinstance(cj, dict) or not isinstance(cj.get("cues"), list):
        die('cues.json must be {"style": N, "cues": [...]}')
    warnings = []
    if cj.get("style") != a.style:
        warnings.append("cues.json says style %r but --style is %d" % (cj.get("style"), a.style))
    kit = json.load(open(os.path.join(kit_d, "kit.json")))
    K = kit["cues"]
    rel_ms = kit.get("release_delay_ms", 160)

    voice = load(a.voice)
    if voice.shape[1] != NS:
        die("voice stem must be exactly 63.000 s at 48 kHz (got %d samples)" % voice.shape[1])
    bed = load(bed_p)
    if bed.shape[1] != NS:
        die("music bed must be exactly 63.000 s at 48 kHz (got %d samples)" % bed.shape[1])

    # narration reference peaks (sample peak of the processed stem)
    vm = np.max(np.abs(voice), axis=0)
    w1 = SR
    win_pk = [vm[i:i + w1].max() for i in range(int(0.1 * SR), int(SPEECH_END * SR) - w1, w1 // 2)]
    voice_typ_peak_db = db(np.median(win_pk))

    def local_peak_db(t):
        i0, i1 = max(0, int((t - 1.0) * SR)), min(NS, int((t + 1.0) * SR))
        p = db(vm[i0:i1].max()) if i1 > i0 else -120
        return p if p > voice_typ_peak_db - 12 else voice_typ_peak_db   # no speech nearby: use the typical peak

    cache = {}

    def clip(name):
        if name not in K:
            die("kit for style %d has no '%s'" % (a.style, name))
        if name not in cache:
            cache[name] = load(K[name]["file"])
        return cache[name]

    bus = np.zeros((2, NS))
    placed = []

    def place(name, t, level_db, ref_db, trim_db=0.0, cue_label=None):
        x = clip(name)
        g = undb(ref_db + level_db + trim_db - peak_db(x))
        i = int(round(t * SR))
        if i >= NS:
            warnings.append("%s at %.3f s starts after the end; skipped" % (name, t))
            return
        n = min(x.shape[1], NS - i)
        y = x[:, :n] * g
        bus[:, i:i + n] += y
        placed.append({"cue": cue_label or name, "file": K[name]["file"], "t_s": round(t, 4), "gain_db": round(db(g), 2),
                       "target_rel_db": round(level_db + trim_db, 2), "ref_peak_dBFS": round(ref_db, 2),
                       "peak_dBFS": round(peak_db(y), 2), "_y": (i, y)})

    for c in cj["cues"]:
        name = c.get("cue")
        if name not in VOCAB:
            die("unknown cue %r (allowed: %s)" % (name, ", ".join(sorted(VOCAB))))
        trim = float(c.get("gain_db", 0.0))
        if not -20 <= trim <= 3:
            die("gain_db %r out of range -20..+3" % trim)
        if name == "standby":
            if "start" not in c or "end" not in c:
                die("standby needs start and end frames")
            s, e = int(c["start"]), int(c["end"])
            if not 0 <= s < e:
                die("standby span invalid: %r" % c)
            if s < 1438 - 3 * FPS or e > 1850:
                warnings.append("standby span f%d-f%d extends outside S10-S11 (f1438-f1817)" % (s, e))
            x = clip("standby_loop")
            t0, t1 = s / FPS, e / FPS
            i0, i1 = int(round(t0 * SR)), min(NS, int(round(t1 * SR)))
            n = i1 - i0
            reps = int(np.ceil(n / x.shape[1])) + 1
            y = np.tile(x, reps)[:, :n]
            y = fade(y, fin=STANDBY_FADE, fout=STANDBY_FADE)
            lvl = K["standby_loop"]["level_db"] + trim
            g = undb(voice_typ_peak_db + lvl - peak_db(x))
            y = y * g
            bus[:, i0:i1] += y
            placed.append({"cue": "standby", "file": K["standby_loop"]["file"], "t_s": round(t0, 4), "end_s": round(t1, 4),
                           "gain_db": round(db(g), 2), "target_rel_db": lvl, "ref_peak_dBFS": round(voice_typ_peak_db, 2),
                           "peak_dBFS": round(peak_db(y), 2), "_y": (i0, y)})
            continue
        if "frame" not in c:
            die("cue %r needs a frame" % c)
        f = int(c["frame"])
        if f < 0 or f >= int(DUR_S * FPS):
            die("frame out of range: %r" % c)
        t = f / FPS
        ref = local_peak_db(t)
        if name == "button":
            if f not in (0, 1837):
                warnings.append("button at f%d: Part A allows only f0 and f1837" % f)
            pv = "button_press_f0" if f == 0 and "button_press_f0" in K else "button_press"
            rv = "button_release_f0" if f == 0 and "button_release_f0" in K else "button_release"
            lvl_p = K[pv]["level_db"]
            if f == 0 and "level_db_f0" in K[pv]:
                lvl_p = K[pv]["level_db_f0"]
            lvl_r = lvl_p + (K[rv]["level_db"] - K["button_press"]["level_db"]) if rv == "button_release" else K[rv]["level_db"]
            place(pv, t, lvl_p, ref, trim, "button press f%d" % f)
            place(rv, t + rel_ms / 1000.0, lvl_r, ref, trim, "button release f%d (+%d ms)" % (f, rel_ms))
        elif name == "land":
            note = str(c.get("note", "")).upper()
            if note not in NOTES:
                die("land needs note A, C, D, E or G: %r" % c)
            place("land_" + note, t, K["land_" + note]["level_db"], ref, trim, "land %s f%d" % (note, f))
        else:
            if name not in K:
                die("kit for style %d has no '%s'" % (a.style, name))
            place(name, t, K[name]["level_db"], ref, trim, "%s f%d" % (name, f))

    # ---- sum, safety limiter, write
    pre = voice + bed + bus
    pre_tp = true_peak_db(pre)
    mix, g = tp_limit(pre, FINAL_LIMIT_INTERNAL, release_ms=80.0)
    mix = mix[:, :NS]
    write_wav(a.out, mix, bits=24)

    # ---- measurements
    r = ffmpeg_r128(a.out)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate,channels,bits_per_raw_sample,duration_ts,codec_name",
                            "-of", "json", a.out], capture_output=True, text=True).stdout
    st_ = json.loads(probe)["streams"][0]
    vI = {s: window_lufs(voice, t0, t1) for s, t0, t1 in SENTENCES}
    gaps = {s: round(vI[s] - window_lufs(bed, t0, t1), 2) for s, t0, t1 in SENTENCES}
    gap_int = integrated_lufs(voice, SR, 0, SPEECH_END) - integrated_lufs(bed, SR, 0, SPEECH_END)
    cue_rows = []
    worst_cue = -120.0
    for p in placed:
        i, y = p.pop("_y")
        p["peak_rel_local_voice_db"] = round(p["peak_dBFS"] - p["ref_peak_dBFS"], 2)
        p["peak_rel_typical_voice_db"] = round(p["peak_dBFS"] - voice_typ_peak_db, 2)
        if p["cue"] != "standby":
            # audibility indicator: ungated loudness of the cue vs the narration over the cue's first 400 ms
            j = min(NS, i + int(0.4 * SR))
            cue_seg = np.zeros((2, j - i))
            cue_seg[:, :min(y.shape[1], j - i)] = y[:, :j - i]
            p["loudness_rel_voice_400ms_LU"] = round(ungated_lufs(cue_seg) - ungated_lufs(voice[:, i:j]), 1)
        worst_cue = max(worst_cue, p["peak_dBFS"])
        cue_rows.append(p)
    standby_rows = [p for p in cue_rows if p["cue"] == "standby"]
    checks = {
        "integrated_LUFS_in_-14+-0.5": abs(r["I"] - SPEC["I_target"]) <= SPEC["I_tol"],
        "true_peak_le_-1.0_dBTP": r["TP"] <= SPEC["TP_max"],
        "music_at_least_18_LU_under_voice_every_sentence": min(gaps.values()) >= SPEC["music_gap_min_LU"],
        "music_at_least_18_LU_under_voice_integrated": gap_int >= SPEC["music_gap_min_LU"],
        "no_cue_peak_above_typical_voice_peak": worst_cue < voice_typ_peak_db,
        "standby_peak_le_-24_dB_re_voice_peak": all(p["peak_rel_typical_voice_db"] <= SPEC["standby_max_rel_db"] for p in standby_rows),
        "length_exactly_63.000_s": int(st_["duration_ts"]) == NS,
        "format_48k_24bit_stereo": int(st_["sample_rate"]) == SR and int(st_["channels"]) == 2 and st_["codec_name"] == "pcm_s24le",
    }
    checks = {k_: bool(v) for k_, v in checks.items()}
    rep = {
        "style": a.style, "kit": kit.get("name"), "out": os.path.abspath(a.out).replace("\\", "/"),
        "inputs": {"cues": os.path.abspath(a.cues).replace("\\", "/"), "voice": a.voice.replace("\\", "/"), "voice_sha256": sha(a.voice),
                   "bed": bed_p.replace("\\", "/"), "kit": kit_d.replace("\\", "/")},
        "measurements": {"integrated_LUFS": r["I"], "true_peak_dBTP": r["TP"], "LRA_LU": r["LRA"],
                         "integrated_LUFS_numpy": round(integrated_lufs(mix), 2),
                         "pre_limiter_true_peak_dBTP": round(pre_tp, 2), "final_limiter_max_reduction_dB": round(db(g.min()), 2),
                         "music_gap_per_sentence_LU": gaps, "music_gap_min_LU": min(gaps.values()),
                         "music_gap_integrated_speech_LU": round(gap_int, 2),
                         "voice_typical_speech_peak_dBFS": round(voice_typ_peak_db, 2),
                         "loudest_cue_peak_dBFS": round(worst_cue, 2),
                         "length_samples": int(st_["duration_ts"]), "sample_rate": int(st_["sample_rate"]),
                         "channels": int(st_["channels"]), "codec": st_["codec_name"]},
        "spec": SPEC, "checks": checks, "pass": all(checks.values()), "warnings": warnings, "cues_placed": cue_rows,
        "method": "ffmpeg ebur128 (peak=true) for I/LRA/TP of the written file; BS.1770-4 gated loudness (numpy, matches ffmpeg within 0.05 LU on the voice stem) for the per-sentence music-vs-voice gaps on the stems; sample peaks for cue levels. Nobody listened.",
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.report)), exist_ok=True)
    json.dump(rep, open(a.report, "w"), indent=1)
    m = rep["measurements"]
    print("style %d: I %.1f LUFS, TP %.1f dBTP, LRA %.1f LU, music gap min %.1f LU (integrated %.1f), loudest cue %.1f dBFS vs voice typical %.1f, %d cues -> %s"
          % (a.style, m["integrated_LUFS"], m["true_peak_dBTP"], m["LRA_LU"], m["music_gap_min_LU"], m["music_gap_integrated_speech_LU"],
             m["loudest_cue_peak_dBFS"], m["voice_typical_speech_peak_dBFS"], len(cue_rows), "PASS" if rep["pass"] else "FAIL"))
    for w in warnings:
        print("  warning:", w)
    for k_, v in checks.items():
        if not v:
            print("  OUT OF SPEC:", k_)
    sys.exit(0 if rep["pass"] else 1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:  # unexpected failure: distinct exit code
        import traceback
        traceback.print_exc()
        sys.exit(3)
