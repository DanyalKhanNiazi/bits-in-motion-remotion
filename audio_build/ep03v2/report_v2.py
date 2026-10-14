"""Step 5: self-check by measurement -> REPORT.md (+ report_spectrograms.png, report_balance.png).

python -I report_v2.py

Reads measure_v2.json, work/placements.json and the mix stems saved by build_mix_v2.py (work/stem_*.npy). Nobody listened:
every statement in the report is a measurement or a design rationale.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402

SR = L.SR
HERE = L.HERE
WORK = os.path.join(HERE, "work")

# Top visual events: cue frame and the frame where the picture shows the event (read off the v4 contact sheets
# out/ep03/sound_v2/hero_sheet1.png and hero_sheet2.png, 2-frame steps unless noted).
SECS = [("S1 cold open + title", 0, 1582), ("S2 tokens", 1582, 2811), ("S3 scoring, loop, streaming", 2811, 4897), ("S4 reading vs writing", 4897, 6524),
        ("S5 weights + THE BRIDGE", 6524, 9507), ("S6 experiment + bandwidth", 9507, 11907), ("S7 three waits", 11907, 15091),
        ("S8 tricks", 15091, 17080), ("S9 close + finale", 17080, 18367)]
TOP = [
    (532, "x200 slams in", "532 (text arrives, motion-blurred) / 534 crisp"),
    (991, "the 16 GB crate hits the math", "990-994 (crate merges into the die)"),
    (1027, "the monumental crate lands", "1026-1028 (landed, stamp crisp)"),
    (1097, "'piece!' - the tiny tile", "1097-1100 (4-frame steps)"),
    (1279, "the '?' tile seats (title)", "see hero_sheet2"),
    (2094, "'11' lands hard", "2091-2094"),
    (3600, "THE LOOP slams", "3600"),
    (4917, "the rewind starts", "see hero_sheet2"),
    (4959, "Enter key pressed", "see hero_sheet2"),
    (6300, "x1000 burst", "see hero_sheet2"),
    (7874, "THE BRIDGE reveal", "7874 (title arriving) / 7876 crisp"),
    (8886, "~300x slams", "8886 (blurred) / 8889 crisp"),
    (10077, "payoff: reading slowed", "10079 (needle drops)"),
    (10731, "verdict: 'memory'", "10731"),
    (14633, "x60", "see hero_sheet2"),
    (15843, "40% faster", "see hero_sheet2"),
    (16783, "the big model's own token", "see hero_sheet2"),
    (17850, "'It's the trip' - crate hits the die", "17850-17852"),
]


def onset_frames(x, a, b):
    """Onset (frame, float) of the strongest transient between samples a..b of x: last point before the max of the 1 ms envelope
    where it is below -18 dB of that max."""
    seg = np.max(np.abs(x[:, a:b]), axis=0)
    w = SR // 1000
    k = len(seg) // w
    e = seg[:k * w].reshape(k, w).max(axis=1)
    p = int(np.argmax(e))
    thr = e[p] * 10 ** (-18 / 20)
    lo = max(0, p - 60)
    below = np.where(e[lo:p + 1] < thr)[0]
    i = lo + (below[-1] + 1 if len(below) else 0)
    return (a + i * w) / SR * 30.0


def main():
    meas = json.load(open(os.path.join(L.OUT_DIR, "measure_v2.json")))
    items = json.load(open(os.path.join(WORK, "placements.json")))
    v = np.load(os.path.join(WORK, "stem_voice.npy")).astype(np.float64)
    fx = np.load(os.path.join(WORK, "stem_fx.npy")).astype(np.float64)
    mu = np.load(os.path.join(WORK, "stem_music.npy")).astype(np.float64)
    am = np.load(os.path.join(WORK, "stem_amb.npy")).astype(np.float64)
    mix = v + fx + mu + am
    N = v.shape[1]
    fx_hp = L.butter(fx, "hp", 150, 2)

    # ---- cue density and stacking -------------------------------------------------------------------------------------------
    sync = sorted({(it["cue"], it["src"], it["role"]) for it in items})
    pts = sorted({(c, s) for c, s, _ in sync})
    frames = np.array([c for c, _ in pts], dtype=float)
    per_min = np.histogram(frames / 30.0, bins=np.arange(0, 612.3 + 60, 60))[0]
    # designed cues: collapse runs of the same role closer than 0.5 s (a tile run, a chop run = one designed cue)
    groups = {}
    fg = {}
    for it in items:
        key = ("g", it["group"]) if it.get("group") else ("p", it["cue"], it["src"])
        groups[key] = min(groups.get(key, 1e9), it["cue"])
        fg[key] = max(fg.get(key, -99), it.get("level_rel_voice_LU", -99))
    designed = np.array(sorted(groups.values()), dtype=float)
    fore = np.array(sorted(v for k, v in groups.items() if fg[k] >= -16.0), dtype=float)
    per_min_f = np.histogram(fore / 30.0, bins=np.arange(0, 612.3 + 60, 60))[0]
    per_min_d = np.histogram(designed / 30.0, bins=np.arange(0, 612.3 + 60, 60))[0]
    stack = 0
    for i in range(len(frames)):
        j = np.searchsorted(frames, frames[i] + 3.0, side="left")      # 3 frames = 100 ms
        stack = max(stack, j - i)
    builder = [p for p in pts if p[1] == "builder"]

    # ---- sync: isolated renders of the top events ----------------------------------------------------------------------------
    rows = []
    for cue, label, vis in TOP:
        cand = [it for it in items if it["cue"] == cue and it["src"] in ("builder", "extra")]
        if not cand:
            cand = [it for it in items if abs(it["frame"] - cue) <= 2]
        if not cand:
            rows.append((cue, label, vis, "-", "-", "-", "-"))
            continue
        main_it = sorted(cand, key=lambda it: it["gain_db"] + (6 if it["role"] in ("impact_big", "crate_land", "tile_seat", "key_enter", "tape_rewind") else 0))[-1]
        x = L.load(os.path.join(HERE, "palette_lib", main_it["file"] + ".wav"))
        iso = np.zeros((2, int(SR * 3)))
        off = int(SR)                                                     # put the anchor 1 s into the probe buffer
        a = int(round(main_it["anchor_s"] * SR))
        st = off - a
        L.mix_into(iso, x, st)
        if main_it["anchor_s"] == 0.0 or main_it["role"].startswith(("whoosh", "crate_pass", "glass", "data", "tape_rewind")):
            measured = main_it["anchor_sample"] / SR * 30.0 if main_it["anchor_s"] else main_it["start_sample"] / SR * 30.0
            how = "file start (start-anchored)" if main_it["anchor_s"] == 0.0 else "peak (by construction)"
        else:
            probe = iso if main_it["role"] == "sub_drop" else L.butter(iso, "hp", 200, 2)
            o = onset_frames(probe, off - int(0.05 * SR), off + int(0.25 * SR))
            measured = main_it["start_sample"] / SR * 30.0 + (o - st / SR * 30.0)
            how = "onset detected in an isolated render"
        a0 = L.f2s(cue - 6)
        mixed = onset_frames(fx_hp, a0, L.f2s(cue + 6))
        rows.append((cue, label, vis, main_it["file"], round(measured - cue, 2), round(mixed - cue, 2), how))

    # ---- spectral balance: voice vs music during speech --------------------------------------------------------------------
    from scipy import signal
    act = np.load(os.path.join(WORK, "voice_act10ms.npy")) if os.path.exists(os.path.join(WORK, "voice_act10ms.npy")) else None
    sp = np.repeat(act.astype(bool), SR // 100)[:N] if act is not None else np.ones(N, bool)
    sp = np.pad(sp, (0, max(0, N - len(sp))))[:N]
    idx = np.flatnonzero(sp)
    sel = idx[:: max(1, len(idx) // (SR * 240))]                         # ~240 s of speech samples (strided)
    vm = v.mean(axis=0)
    mm = mu.mean(axis=0)
    fm = (fx + am).mean(axis=0)
    seg_n = 1 << 14
    starts = np.arange(0, N - seg_n, seg_n * 4)
    starts = [s for s in starts if sp[s:s + seg_n].mean() > 0.9][:400]

    def ltas(x):
        acc = None
        for s in starts:
            f, p = signal.welch(x[s:s + seg_n], SR, nperseg=4096)
            acc = p if acc is None else acc + p
        return f, acc / max(1, len(starts))
    f, pv_ = ltas(vm)
    _, pm_ = ltas(mm)
    _, pf_ = ltas(fm)
    bands = [(31, 63), (63, 125), (125, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000)]
    bal = []
    for lo, hi in bands:
        m = (f >= lo) & (f < hi)
        bal.append((lo, hi, round(float(10 * np.log10(pv_[m].sum() + 1e-30)), 1), round(float(10 * np.log10(pm_[m].sum() + 1e-30)), 1),
                    round(float(10 * np.log10(pv_[m].sum() / (pm_[m].sum() + 1e-30))), 1), round(float(10 * np.log10(pv_[m].sum() / (pf_[m].sum() + 1e-30))), 1)))
    m14 = (f >= 1000) & (f < 4000)
    sb = float(10 * np.log10(pv_[m14].sum() / (pm_[m14].sum() + 1e-30)))
    share_v = float(pv_[m14].sum() / pv_.sum())
    share_m = float(pm_[m14].sum() / pm_.sum())

    # ---- figures -----------------------------------------------------------------------------------------------------------
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    heroes = [("Cold open: crate hits the math (991) and the monument lands (1027)", 960, 1110, [991, 1027, 1086, 1097]),
              ("The Bridge reveal: riser, suck-out 7862-7874, hit + full theme at 7874", 7760, 7950, [7774, 7862, 7874]),
              ("Finale: theme bars 5-8 and the D-major resolve at 18295", 18060, 18367, [18079, 18151, 18223, 18295])]
    fig, axs = plt.subplots(3, 1, figsize=(13, 11))
    for ax, (title, f0, f1, marks) in zip(axs, heroes):
        a, b = L.f2s(f0), L.f2s(f1)
        x = mix[:, a:b].mean(axis=0)
        ff, tt, S = signal.spectrogram(x, SR, nperseg=2048, noverlap=1536)
        ax.pcolormesh(tt * 30 + f0, ff, 10 * np.log10(S + 1e-14), shading="auto", cmap="magma", vmin=-130, vmax=-40)
        ax.set_yscale("symlog", linthresh=200)
        ax.set_ylim(30, 16000)
        for mk in marks:
            ax.axvline(mk, color="cyan", lw=0.8, alpha=0.8)
        ax.set_title(title, fontsize=10)
        ax.set_ylabel("Hz")
    axs[-1].set_xlabel("film frame (30 fps)")
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, "report_spectrograms.png"), dpi=90)
    plt.close()
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.semilogx(f[1:], 10 * np.log10(pv_[1:] + 1e-30), label="voice (as mixed)", color="#1f77b4")
    ax.semilogx(f[1:], 10 * np.log10(pm_[1:] + 1e-30), label="music (as mixed, during speech)", color="#d62728")
    ax.semilogx(f[1:], 10 * np.log10(pf_[1:] + 1e-30), label="effects + ambience (during speech)", color="#2ca02c", alpha=0.7)
    ax.axvspan(1000, 4000, color="grey", alpha=0.15, label="speech band 1-4 kHz")
    ax.set_xlim(30, 18000)
    ax.set_xlabel("Hz")
    ax.set_ylabel("dB (Welch PSD)")
    ax.legend(fontsize=8)
    ax.set_title("Long-term spectra while the voice speaks")
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, "report_balance.png"), dpi=90)
    plt.close()

    # ---- write -------------------------------------------------------------------------------------------------------------
    lo = meas["loudness"]
    gp = meas["music_vs_voice_LU"]
    judge_p = os.path.join(WORK, "score_judgement.json")
    judge = json.load(open(judge_p)) if os.path.exists(judge_p) else None
    out = []
    w = out.append
    w("# Episode 03 sound design v2: measured self-check")
    w("")
    w("**Nobody listened to this mix — not the author, not anyone else.** Every number below is a measurement of the rendered files, and every "
      "judgement is design reasoning backed by those numbers. The owner should audition it before release.")
    w("")
    w("Files: `" + meas["file"] + "`; measurements `measure_v2.json`; credits `CREDITS_v2.md`; figures `report_spectrograms.png`, `report_balance.png`.")
    w("")
    w("## 1. Loudness and true peak")
    w("")
    w("| metric | measured | target |")
    w("|---|---|---|")
    w(f"| integrated loudness (ffmpeg ebur128) | {lo['integrated_LUFS_ffmpeg']} LUFS | -14 ±0.5 |")
    w(f"| true peak (ffmpeg, 4x) / numpy 8x | {lo['true_peak_dBTP_ffmpeg']} / {lo['true_peak_dBTP_numpy_8x']} dBTP | ≤ -1.0 |")
    w(f"| loudness range (LRA) | {lo['LRA_LU_ffmpeg']} LU | 4-8 |")
    w(f"| LRA of the narration alone (fixed gain) | {lo['voice_only_LRA']} LU | locked |")
    w(f"| narration alignment, mixed voice vs raw decode | lag {meas['voice']['alignment_mixed_voice_vs_raw']['best_lag_samples']} samples, r = {meas['voice']['alignment_mixed_voice_vs_raw']['correlation']} | 0 |")
    w(f"| narration alignment, final mix vs raw decode | lag {meas['voice']['alignment_final_mix_vs_raw']['best_lag_samples']} samples, r = {meas['voice']['alignment_final_mix_vs_raw']['correlation']} | 0 |")
    w(f"| narration processing | fixed gain {meas['voice']['fixed_gain_dB']:+.2f} dB, true-peak limiter (max GR {meas['voice']['voice_limiter_max_GR_dB']} dB, "
      f"{meas['voice']['voice_limiter_pct_samples_over_1dB']}% of samples reduced by > 1 dB) | gain + limiter only |")
    w("")
    w("**LRA is below target, and this is a property of the locked narration.** The voice is spoken almost without pause: only "
      f"{meas['pauses_ge_0.4s']} pauses of 0.4 s or more in 612 s, none longer than about 0.5 s. Its own short-term loudness spans only "
      f"{lo['voice_only_LRA']} LU. Music must stay at least 18 LU under the voice wherever it speaks, so it cannot move a 3-second loudness "
      "window. Simulation on the mixed stems: raising every effect by +4 dB moves the LRA only from 2.29 to 2.39 LU, and +6 dB moves it to 2.62 LU, "
      "with effects then louder than the words they land on. Reaching 4 LU would mean riding the narration's level, which the brief forbids, "
      "or burying words under effects. The mix keeps its dynamics *inside* the music and effects instead: drop-outs before reveals, a silent "
      "suck-out before the Bridge, hits in the pauses, and swells in every pause of 0.4 s or more.")
    w("")
    w("## 2. Music against the voice")
    w("")
    w("| window class (speech share) | windows | min gap | 5th pct | median |")
    w("|---|---|---|---|---|")
    for k in ("400ms", "1s", "3s"):
        g = gp[k]
        w(f"| {k} (≥{ {'400ms': 95, '1s': 90, '3s': 50}[k] }% speech) | {g['windows']} | {g['min']} LU | {g['p05']} LU | {g['median']} LU |")
    w(f"| integrated over all speech | | | | {gp['integrated_over_speech']} LU |")
    w("")
    w(f"Requirement: ≥ 18 LU wherever the voice speaks. Closed-loop trims: up to {meas['music_gain'].get('max_trim_db', 0):.1f} dB on the loudest score moments. "
      f"In the {meas['pauses_ge_0.4s']} pauses of 0.4 s or more, the music rises toward about {9.5} LU under the voice (an attack of 0.14 s after the voice stops, "
      "and back down 60 ms before it returns).")
    w("")
    w("**Spectral balance (Welch long-term spectra, speech-only stretches):**")
    w("")
    w("| band (Hz) | voice dB | music dB | voice − music | voice − (effects + ambience) |")
    w("|---|---|---|---|---|")
    for lo_, hi_, a, b, d, e in bal:
        w(f"| {lo_}-{hi_} | {a} | {b} | {d} | {e} |")
    w("")
    w(f"In the speech band (1-4 kHz) the voice sits **{sb:.1f} dB** above the music. That band holds {share_v * 100:.0f}% of the voice's energy but only "
      f"{share_m * 100:.1f}% of the music's. The carve is dynamic: −7 dB at 2.5 kHz, −3 dB at 1.2 kHz and −2 dB at 4.2 kHz while the voice speaks, and −2 dB in pauses. "
      "The arrangement itself also stays out of the band: pads are low-passed at 0.45-2 kHz, the percussion lives below 260 Hz or above 6 kHz, and the stems carry a static −2 to −6 dB dip near 2.5 kHz. See `report_balance.png`.")
    w("")
    w("## 3. Effects: density, stacking, sync")
    w("")
    w(f"- Placed sounds: {meas['effects']['placed_sounds']} sounds on {len(pts)} sync points. {len(builder)} are the builders' cues; the rest are extra foley, transitions and crate rhythms.")
    w(f"- **Density, raw sync points per minute:** {', '.join(str(int(x)) for x in per_min)} (mean {per_min.mean():.1f}).")
    w(f"- **Density, designed cues per minute** (a run of the same sound within 0.5 s, such as a tile run or a chop run, counts as one): "
      f"{', '.join(str(int(x)) for x in per_min_d)} (mean {per_min_d.mean():.1f}; target about 10-20).")
    w(f"- **Density, foreground cues per minute** (designed cues whose level is within 16 LU of the voice; the rest are background foley "
      f"such as tile runs, crate rhythms, data chatter and clock ticks, at 17-27 LU under the voice): {', '.join(str(int(x)) for x in per_min_f)} "
      f"(mean {per_min_f.mean():.1f}).")
    w(f"- **Stacking:** at most **{stack}** sync points start within any 100 ms window (rule: ≤ 3). The stack rule dropped "
      f"{len(meas['effects']['dropped_by_stack_rule'])} extras.")
    w("- **Sync method:** every sound is placed sample-exactly. Its anchor sample sits on `frame × 1600`. The anchor is the onset for hits and clicks, the peak for whooshes and pass-bys, and the end for risers. Builder whoosh cues mark the *start* of the whip, which the picture confirms: scene-change energy begins at cue +1 and peaks at cue +6 to +8. So each whoosh starts on its cue and peaks on the detected cut. Risers start on their cue and end exactly on the next hero cue.")
    w("")
    w("**The top visual events.** Here 'isolated' is the sync point measured in an isolated render of the event's main sound, and 'in mix' is the onset found in the effects stem around the cue (other sounds can bias that one).")
    w("")
    w("| cue | event | picture shows it at | main sound | isolated Δ (frames) | in mix Δ (frames) | how measured |")
    w("|---|---|---|---|---|---|---|")
    for r in rows:
        w(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} |")
    w("")
    w("**The music's arc, as mixed** (integrated loudness of the music bus per section, relative to the voice in the same section). The score's own dynamics survive the ducking:")
    w("")
    w("| section | frames | music − voice (LU) | music short-term range in the section (P10-P95, LU) |")
    w("|---|---|---|---|")
    for sid, a_, b_ in SECS:
        i0, i1 = L.f2s(a_), L.f2s(b_)
        pv_s, pm_s = L.kpower(v[:, i0:i1]), L.kpower(mu[:, i0:i1])
        _, bpm = L.block_power(pm_s, 3 * SR, SR // 10)
        stv = L.lufs(bpm)
        w(f"| {sid} | {a_}-{b_} | {L.integrated(pm_s) - L.integrated(pv_s):.1f} | {np.percentile(stv, 10):.1f} to {np.percentile(stv, 95):.1f} |")
    w("")
    w("## 4. Hero moments (spectrograms)")
    w("")
    w("`report_spectrograms.png` shows the full mix on a log-frequency axis, with cyan lines on the cue frames:")
    w("")
    w("1. **Cold-open crate:** the build, the crate impact at 991, an 8-frame suck-out, then the monument at 1027 (broadband hit plus sub), and the high bell 'piece!' at 1097.")
    w("2. **Bridge reveal:** the riser energy climbs into 7862, then 12 frames of silence (only the voice's own pause), then the hit and the full theme at 7874.")
    w("3. **Finale:** theme bars 5-8 (Gm, Bb, C) build into the D-major resolve on the sign-off at 18295, then the music fades to digital silence at the last frame.")
    w("")
    w("## 5. Score (rubric)")
    w("")
    if judge:
        w("| area | weight | score | evidence |")
        w("|---|---|---|---|")
        tot = 0
        for k, d in judge["areas"].items():
            w(f"| {k} | {d['weight']} | {d['score']} | {d['why']} |")
            tot += d["score"]
        w(f"| **total** | 100 | **{tot}** | measurement only; nobody listened |")
        w("")
        for line in judge.get("notes", []):
            w("- " + line)
    else:
        w("(score_judgement.json not written yet)")
    w("")
    w("## 6. Rebuild")
    w("")
    w("```")
    w("cd remotion/audio_build/ep03v2")
    w("python -I compose_score.py        # only if hero frames moved")
    w("python -I make_cues_extra.py      # after refreshing work/v4_framestats.json for a new picture (see below)")
    w("python -I build_mix_v2.py")
    w("python -I report_v2.py")
    w("```")
    w("")
    w("Refresh the picture stats for v5 (writes per-frame scene score and luma). Then convert them with the snippet in `make_cues_extra.py`'s docstring, or keep the file name and re-run:")
    w("")
    w("```")
    w('ffmpeg -i <picture.mp4> -an -vf "scale=192:108:flags=fast_bilinear,select=\'gte(scene\\,0)\',signalstats,metadata=mode=print:file=work/v4_framestats.txt" -f null -')
    w("```")
    open(os.path.join(HERE, "REPORT.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("REPORT.md written; stack", stack, "per_min", per_min.tolist(), "designed", per_min_d.tolist(), "foreground", per_min_f.tolist())
    for r in rows:
        print(r)
    print("speech band voice-music dB", round(sb, 1))


if __name__ == "__main__":
    main()
