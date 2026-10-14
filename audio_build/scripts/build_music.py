"""Build the six 63.000 s music beds (48 kHz stereo, 24-bit) at audio_build/music/styleN_bed.wav.
Each bed is written MIX-READY: the mixer adds it at 0 dB. Its level is set here so that, during every
spoken sentence S01-S12, the bed sits at least GAP_TARGET LU under the locked voice stem.
Usage: python -I build_music.py [N ...]"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

MUSIC_SRC = os.path.join(BUILD, "src", "music")
OUT_DIR = os.path.join(BUILD, "music")
DUR = 63.0
N = int(DUR * SR)
GAP_TARGET = 19.5      # LU under the voice in the loudest-music sentence (spec: >= 18)
DIP = "equalizer=f=2000:t=o:w=2:g=-3.5"   # brand 1-4 kHz dip, same in all five
FILES = {1: "Style 1 - primary - Engineering Graphics.mp3",
         2: "Style 2 - primary - Enter the realm - no Piano.mp3",
         3: "Style 3 - primary - Minimal Idm Ambient Works - Loop.mp3",
         4: "Style 4 - primary - Stay the Course.mp3",
         5: "Style 5 - primary - Soft Vibraphone Ambient Loop_012.mp3",
         # Style 6 (Signal Atlas) re-uses the Style 3 primary, chosen from the ten Stage A candidates by measurement
         6: "Style 3 - primary - Minimal Idm Ambient Works - Loop.mp3"}


def src(n, start=0.0, dur=None):
    # decode in float and attenuate 6 dB before anything else (several masters are hot)
    return load(os.path.join(MUSIC_SRC, FILES[n]), start=start, dur=dur) * undb(-6)


def loop_tile(x, s0, period, total, xf=0.030):
    """Tile x[s0:s0+period] seamlessly: each repetition carries an extra xf of material that is
    cross-faded (equal-gain; the material is periodic) into the head of the next repetition."""
    P, X = int(round(period * SR)), int(round(xf * SR))
    a = int(round(s0 * SR))
    seg = x[:, a:a + P + X]
    out = np.zeros((x.shape[0], total + P + X))
    ramp = np.linspace(0, 1, X)
    pos, first = 0, True
    while pos < total:
        s = seg.copy()
        if not first:
            s[:, :X] *= ramp
        s[:, P:] *= ramp[::-1]
        out[:, pos:pos + P + X] += s
        pos += P
        first = False
    return out[:, :total]


def refine_period(x, s0, guess, search=0.08):
    """Refine the loop length: onset-envelope correlation (10 ms hop), then waveform correlation (+-10 ms)."""
    m = np.abs(x).mean(axis=0)
    hop = SR // 100
    env = np.array([m[i:i + hop].mean() for i in range(0, len(m) - hop, hop)])
    a, L = int(s0 * 100), int(guess * 100)
    best = None
    for d in range(-int(search * 100), int(search * 100) + 1):
        p = L + d
        c = np.corrcoef(env[a:a + L], env[a + p:a + p + L])[0, 1]
        if best is None or c > best[0]:
            best = (c, p)
    p0 = best[1] * hop
    mono = x.mean(axis=0)
    A, W = int(s0 * SR), int(0.5 * SR)
    seg = mono[A:A + W]
    cands = list(range(p0 - SR // 100, p0 + SR // 100))
    cc = [np.dot(seg, mono[A + p:A + p + W]) for p in cands]
    return cands[int(np.argmax(cc))] / SR, best[0]


def best_seam(x, period, lo, hi, w=0.25):
    """Pick the loop start s0 in [lo, hi] whose following material best matches the material that
    naturally follows s0+period (log-spectrogram correlation over w seconds, 10 ms hop), so the
    seam (end of repetition k -> head of repetition k+1) sounds like the track's own continuation."""
    mono = x.mean(axis=0)
    f, t, S = signal.stft(mono, SR, nperseg=2048, noverlap=2048 - 480)
    S = np.log1p(np.abs(S[(f > 40) & (f < 4000)]))
    n = int(w / 0.01)
    best = None
    for s0 in np.arange(lo, hi, 0.01):
        i, j = int(round(s0 / 0.01)), int(round((s0 + period) / 0.01))
        c = np.corrcoef(S[:, i:i + n].ravel(), S[:, j:j + n].ravel())[0, 1]
        if best is None or c > best[0]:
            best = (c, s0)
    return round(float(best[1]), 2), float(best[0])


def rider(x, t_end=SPEECH_END, win=1.0, smooth=1.5, maxdb=4.0):
    """Slow level rider: flattens the bed's 1 s loudness (within +-maxdb) up to t_end, then holds."""
    p, starts = block_power(x, block=win, hop=0.1)
    L = lufs_from_power(p)
    tgt = np.median(L[(starts > 0.5) & (starts < t_end - win)])
    gdb = np.clip(tgt - L, -maxdb, maxdb)
    k = max(1, int(smooth / 0.1))
    gdb = np.convolve(np.pad(gdb, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    tc = starts + win / 2
    t = np.arange(x.shape[1]) / SR
    g = np.interp(np.minimum(t, t_end), tc, gdb)
    return x * undb(g), g


def finish(x, fade_in, rise_db=3.0, rise_t=(SPEECH_END, 62.40), fade_out=0.30):
    x = x[:, :N].copy()
    assert x.shape[1] == N
    x = fade(x, fin=fade_in)
    t = np.arange(N) / SR
    r = np.clip((t - rise_t[0]) / (rise_t[1] - rise_t[0]), 0, 1)
    x *= undb(rise_db * (np.sin(r * np.pi / 2) ** 2))
    x = fade(x, fout=fade_out)
    x[:, -1] = 0.0
    return x


def build(n):
    info = {"style": n, "source": os.path.join(MUSIC_SRC, FILES[n]).replace("\\", "/")}
    if n == 1:
        full = src(1, 0, 40)
        period, corr = refine_period(full, 17.4, 8.72)
        s0, sc = best_seam(full, period, 17.45, 25.5)
        info["loop"] = {"period_s": round(period, 4), "env_corr": round(float(corr), 3), "start_s": s0, "seam_spectral_corr": round(sc, 3), "crossfade_ms": 30}
        bed = loop_tile(full, s0, period, N + 2 * SR)
        # -2 semitones (D major -> C major, so the bed's notes become the Land scale); tempo kept at 110 BPM
        bed = ff_filter(bed, "rubberband=pitch=0.8908987:pitchq=quality:transients=mixed," + DIP)
        info["processing"] = ("4-bar marimba+bass block (17.4-26.1 s region) looped, period and seam point found by correlation, 30 ms cross-fades, "
                              "rubberband pitch x0.8909 (-2 st, D -> C, tempo kept at 110 BPM), 1-4 kHz dip -3.5 dB, rider, "
                              "0.25 s fade-in, +3 dB rise 61.66-62.40 s, 0.30 s fade-out ending at 63.0 s")
        fin, rise, fo = 0.25, 3.0, 0.30
    elif n == 2:
        bed = src(2, 7.0, DUR + 1)
        bed = ff_filter(bed, DIP)
        info["processing"] = ("starts at track 7.00 s (the track's own swell then lands on the press), 1-4 kHz dip -3.5 dB, "
                              "rider (also tames the +4-5 dB bump at intro 57.1-57.5 s), 0.25 s fade-in, rider held after 61.66 s "
                              "so the natural swell carries the hand-off, +1.5 dB rise, 0.30 s fade-out ending at 63.0 s")
        fin, rise, fo = 0.25, 1.5, 0.30
    elif n == 3:
        bed = src(3, 0.0, DUR + 1)
        bed = ff_filter(bed, "highpass=f=120:poles=2,highpass=f=120:poles=2," + DIP)
        info["processing"] = ("starts at 0.00 s, high-pass 120 Hz 24 dB/oct (removes the A1 sub so the 55 Hz standby tone is the only low tone), "
                              "1-4 kHz dip -3.5 dB, rider, 50 ms fade-in (the notes say no fade-in; 50 ms only prevents a click), "
                              "+2 dB rise after 61.66 s, 67 ms (2-frame) fade-out ending at 63.0 s")
        fin, rise, fo = 0.05, 2.0, 0.067
    elif n == 4:
        bed = src(4, 0.0, DUR + 1)
        bed = ff_filter(bed, DIP)
        t = np.arange(bed.shape[1]) / SR
        tone = np.sin(2 * np.pi * 65.406 * t) + undb(-12) * np.sin(2 * np.pi * 130.81 * t)
        a, b = int(61.0 * SR), int(61.66 * SR)
        lowband = ff_filter(bed[:, a:b], "lowpass=f=150:poles=2,lowpass=f=150:poles=2")
        tone *= np.sqrt(np.mean(lowband ** 2)) / np.sqrt(np.mean(tone ** 2))
        x0 = np.clip((t - SPEECH_END) / 0.30, 0, 1)
        bed = bed * np.cos(x0 * np.pi / 2) + np.vstack([tone, tone]) * np.sin(x0 * np.pi / 2)
        info["processing"] = ("starts at 0.00 s (pulse on whole seconds = every 30 frames), 1-4 kHz dip -3.5 dB, rider, 0.25 s fade-in; "
                              "from 61.66 s a 0.30 s cross-fade into a synthesized held sine on the bed's root C2 65.4 Hz (+C3 at -12 dB), "
                              "matched to the bed's low band; +3 dB rise, 0.30 s fade-out ending at 63.0 s")
        fin, rise, fo = 0.25, 3.0, 0.30
    elif n == 6:
        bed = src(6, 0.0, DUR + 1)
        # darker than Style 3's cut: high-pass 90 Hz (not 120) keeps the A2 weight but removes the A1 sub, so the
        # 55 Hz standby hum stays the only sub tone; a -3 dB shelf above 5 kHz takes the edge off the ticks
        bed = ff_filter(bed, "highpass=f=90:poles=2,highpass=f=90:poles=2,highshelf=f=5000:g=-3," + DIP)
        info["processing"] = ("starts at 0.00 s (on its downbeat), high-pass 90 Hz 24 dB/oct (A1 sub out, A2 kept), high shelf -3 dB at 5 kHz, "
                              "1-4 kHz dip -3.5 dB, rider, 0.15 s fade-in, +2 dB rise 61.66-62.40 s, 0.30 s fade-out ending at 63.0 s")
        fin, rise, fo = 0.15, 2.0, 0.30
    else:
        bed = src(5, 1.33, DUR + 1)
        bed = ff_filter(bed, "highpass=f=85:poles=2,lowpass=f=2000:poles=2," + DIP)
        info["processing"] = ("starts at 1.33 s (its re-attack then lands on the press, f1838), high-pass 85 Hz, low-pass 2 kHz, "
                              "1-4 kHz dip -3.5 dB, rider, 0.25 s fade-in, +3 dB rise after 61.66 s, 0.30 s fade-out ending at 63.0 s")
        fin, rise, fo = 0.25, 3.0, 0.30
    bed = bed[:, :N + SR]
    bed, rg = rider(bed)
    k = int(SPEECH_END * SR)
    info["rider_range_db"] = [round(float(rg[:k].min()), 2), round(float(rg[:k].max()), 2)]
    bed = finish(bed, fin, rise, fade_out=fo)
    voice = load(VOICE_STEM)
    vl = {s: window_lufs(voice, a, b) for s, a, b in SENTENCES}
    gaps = [vl[s] - window_lufs(bed, a, b) for s, a, b in SENTENCES]
    g = min(gaps) - GAP_TARGET
    bed *= undb(g)
    tp = true_peak_db(bed)
    assert tp < -6, tp
    out = os.path.join(OUT_DIR, "style%d_bed.wav" % n)
    write_wav(out, bed, bits=24)
    gaps = {s: round(vl[s] - window_lufs(bed, a, b), 2) for s, a, b in SENTENCES}
    info.update({"out": out.replace("\\", "/"), "level_gain_db_after_rider": round(g, 2),
                 "bed_I_LUFS": round(integrated_lufs(bed), 2),
                 "bed_I_speech_LUFS": round(integrated_lufs(bed, SR, 0, SPEECH_END), 2), "bed_TP_dBTP": round(tp, 2),
                 "gap_per_sentence_LU": gaps, "gap_min_LU": min(gaps.values()),
                 "gap_integrated_speech_LU": round(integrated_lufs(voice, SR, 0, SPEECH_END) - integrated_lufs(bed, SR, 0, SPEECH_END), 2),
                 "bands_pct_<300/300-1k/1-4k/>4k": [float(v) for v in band_shares(bed[:, :int(60 * SR)])]})
    return info


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    which = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5, 6]
    rp = os.path.join(BUILD, "work", "music_report.json")
    rep = json.load(open(rp)) if os.path.exists(rp) else {}
    for n in which:
        rep[str(n)] = build(n)
        print(json.dumps(rep[str(n)], indent=1))
    json.dump(rep, open(rp, "w"), indent=1)
