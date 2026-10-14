"""Step 2: the original score for Episode 03, rendered to stems/ (48 kHz float WAVs).

python -I compose_score.py

Key D minor (Aeolian; Dorian colour for light sections, Phrygian colour for the data-centre wait), 100 BPM: one beat = 18 frames,
one bar = 72 frames, so downbeats can be placed on exact film frames. The film is scored as 21 cues (M1..M21); each cue anchors its
own bar grid on a sync point (a hero beat), the way film cues are spotted. Hero beats follow the builders' cue files when present
(src/ep03/sections/S*.cues.json, matched within a tolerance), otherwise the word frames from TRANSCRIPT.md, so a re-timed picture (v5)
only needs a re-run.

Material: a 4-note "loop" motif (A4 D5 F5 E5, eighth notes, circular) and a broad 8-bar "bridge" theme over Dm-Bb-F-C | Gm-Bb-C-D.
Stems: pads (detuned saws, filters, chorus, long hall), pulse (plucks / arps / e-piano), bass (sub), perc (kick, taiko, hats and
ticks kept below 250 Hz or above 6 kHz), motif (bells + theme lead), hits (stabs, swells, risers, stings).
Nobody can listen: every choice here is principled design + measurement (see REPORT.md).
"""
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402
import synth_v2 as Y  # noqa: E402

SR = L.SR
N = L.N_TOTAL
BEAT = 18.0
BAR = 72.0
STEMS = ["pads", "pulse", "bass", "perc", "motif", "hits"]
OUT = os.path.join(L.HERE, "stems")


# ----------------------------------------------------------------------------------------------- cue anchors (follow the picture)
def load_cues():
    cues = []
    for i in range(1, 10):
        p = os.path.join(L.SECTIONS_DIR, f"S{i}.cues.json")
        if os.path.exists(p):
            for c in json.load(open(p, encoding="utf-8")):
                cues.append((int(c["frame"]), c["kind"], float(c.get("strength", 0.5))))
    return sorted(cues)


CUES = load_cues()
ANCHORS = {}


def A(name, default, kinds=None, tol=10):
    """A sync point: the builder cue of one of `kinds` nearest to `default` (within tol frames), else `default`."""
    f = default
    if kinds:
        best = None
        for fr, k, _ in CUES:
            if k in kinds and abs(fr - default) <= tol and (best is None or abs(fr - default) < abs(best - default)):
                best = fr
        if best is not None:
            f = best
    ANCHORS[name] = f
    return f


# ----------------------------------------------------------------------------------------------- harmony
CH = {
    "Dm": [50, 57, 62, 64, 65], "Dm_lo": [38, 45, 50, 53, 57], "Bb": [46, 53, 57, 58, 62], "F": [53, 57, 60, 65, 67],
    "C": [48, 55, 57, 62, 64], "Gm": [43, 50, 53, 57, 58], "Asus": [45, 52, 57, 62, 64], "A7": [45, 52, 55, 61, 64],
    "D": [50, 57, 62, 66, 69], "G13": [43, 53, 57, 59, 64], "Ebmaj": [51, 55, 58, 62, 69], "Dm_b9": [50, 51, 57, 62, 65],
    "Bblyd": [46, 53, 57, 60, 64], "Fmaj7": [41, 53, 57, 60, 64], "Cadd9": [48, 55, 62, 64, 67], "Gm9": [43, 50, 53, 57, 58],
}
ROOT = {"Dm": 38, "Dm_lo": 38, "Bb": 34, "F": 41, "C": 36, "Gm": 43, "Asus": 33, "A7": 33, "D": 38, "G13": 43, "Ebmaj": 39, "Dm_b9": 38,
        "Bblyd": 34, "Fmaj7": 41, "Cadd9": 36, "Gm9": 43}
MOTIF = [69, 74, 77, 76]                                   # the loop: A4 D5 F5 E5
THEME = [  # (beat offset, midi, beats) - the bridge theme, 8 bars
    (0, 62, 2), (2, 69, 2), (4, 70, 3), (7, 69, 1), (8, 65, 2), (10, 72, 2), (12, 76, 4),
    (16, 74, 2), (18, 70, 1), (19, 72, 1), (20, 74, 2), (22, 77, 2), (24, 76, 3), (27, 74, 1), (28, 74, 4)]
THEME_CH = ["Dm", "Bb", "F", "C", "Gm", "Bb", "C", "Dm"]


# ----------------------------------------------------------------------------------------------- event store
class Score:
    def __init__(self):
        self.ev = []              # (stem, start_frame (float), fn, kwargs)
        self.mutes = []           # (f0, f1): full music drop-outs
        self.post = []            # post effects: ("tapestop", f0, f1), ("rewind", f0, f1, src_f0, src_f1), ("crush", f0, f1), ("stutter", f)
        self.marks = []           # (frame, text) for the report

    def add(self, stem, frame, fn, **kw):
        self.ev.append((stem, float(frame), fn, kw))

    def mark(self, f, text):
        self.marks.append((int(round(f)), text))


S = Score()
_seed = [100]


def sd():
    _seed[0] += 1
    return _seed[0]


# --- building blocks -----------------------------------------------------------------------------------------------------------
def pad(f0, f1, chord, vel=0.45, attack=1.6, release=2.6, cut0=450, cut1=1700, bright=1.0, voices=5):
    notes = CH[chord] if isinstance(chord, str) else chord
    S.add("pads", f0, Y.pad_chord, notes=notes, dur=(f1 - f0) / 30.0, vel=vel, seed=sd(), attack=attack, release=release, cut0=cut0,
          cut1=cut1, bright=bright, voices=voices)


def pad_prog(f0, chords, bars=2, vel=0.45, **kw):
    f = f0
    for c in chords:
        pad(f, f + bars * BAR, c, vel=vel, **kw)
        f += bars * BAR
    return f


def bass(f0, f1, chord_or_midi, vel=0.5, rhythm="hold", step=9.0, accent=1.0, octave=0):
    m = (ROOT[chord_or_midi] if isinstance(chord_or_midi, str) else chord_or_midi) + 12 * octave
    if rhythm == "hold":
        S.add("bass", f0, Y.sub, m=m, dur=(f1 - f0) / 30.0, vel=vel, release=0.4)
        return
    k = 0
    f = f0
    while f < f1 - 1:
        a = accent if k % 2 == 0 else 1.0
        S.add("bass", f, Y.sub, m=m, dur=min(step, f1 - f) / 30.0 * 0.6, vel=vel * a, release=0.08, attack=0.008)
        f += step
        k += 1


def bass_prog(f0, chords, bars=2, **kw):
    f = f0
    for c in chords:
        bass(f, f + bars * BAR, c, **kw)
        f += bars * BAR


def arp(f0, f1, chord, step=9.0, vel=0.3, pattern=(0, 2, 4, 3, 1, 3, 2, 4), up=12, inst="pluck", bright=0.8, decay=0.28, accent_every=4,
        stem="pulse", pan=None):
    notes = (CH[chord] if isinstance(chord, str) else chord)
    seq = [n + up for n in notes]
    k = 0
    f = f0
    while f < f1 - 0.5:
        m = seq[pattern[k % len(pattern)] % len(seq)]
        v = vel * (1.15 if k % accent_every == 0 else 0.85 + 0.1 * ((k * 7) % 3) / 2)
        if inst == "pluck":
            S.add(stem, f, Y.pluck, m=m, dur=step / 30.0 * 1.6, vel=v, seed=sd(), bright=bright, decay=decay)
        elif inst == "bell":
            S.add(stem, f, Y.bell, m=m, dur=1.6, vel=v * 0.8, seed=sd())
        else:
            S.add(stem, f, Y.epiano, m=m, dur=step / 30.0 * 1.8, vel=v, seed=sd())
        f += step
        k += 1


def arp_prog(f0, chords, bars=2, **kw):
    f = f0
    for c in chords:
        arp(f, f + bars * BAR, c, **kw)
        f += bars * BAR


def motif(f0, reps=1, step=9.0, vel=0.35, inst="bell", transpose=0, stem="motif", accel=None):
    f = f0
    k = 0
    total = reps * 4
    while k < total:
        m = MOTIF[k % 4] + transpose
        if inst == "bell":
            S.add(stem, f, Y.bell, m=m, dur=2.2, vel=vel, seed=sd())
        else:
            S.add(stem, f, Y.pluck, m=m, dur=step / 30 * 1.5, vel=vel, seed=sd(), bright=1.0)
        st = step if accel is None else step * (accel ** k)
        f += max(2.0, st)
        k += 1
    return f


def theme(f0, bars=range(8), vel=0.5, octave=0, inst="lead", chords=True, pad_vel=0.42, bass_vel=0.5, final=None):
    for (b, m, d) in THEME:
        bar_i = b // 4
        if bar_i not in bars:
            continue
        f = f0 + (b - 4 * bars[0]) * BEAT
        mm = m + 12 * octave
        if inst == "lead":
            S.add("motif", f, Y.lead, m=mm, dur=d * BEAT / 30.0, vel=vel, seed=sd())
            S.add("motif", f, Y.bell, m=mm + 12, dur=2.6, vel=vel * 0.35, seed=sd())
        elif inst == "bell":
            S.add("motif", f, Y.bell, m=mm, dur=2.6, vel=vel, seed=sd())
        else:
            S.add("motif", f, Y.pluck, m=mm, dur=d * BEAT / 30 * 0.9, vel=vel, seed=sd(), bright=1.0, decay=0.5)
    if chords:
        for i, bi in enumerate(bars):
            c = THEME_CH[bi] if not (final and bi == 7) else final
            fb = f0 + i * BAR
            pad(fb, fb + BAR, c, vel=pad_vel, attack=0.5, release=2.0, cut0=900, cut1=2000)
            bass(fb, fb + BAR, c, vel=bass_vel)


def kick_pat(f0, f1, step=18.0, vel=0.5, skip=()):
    f = f0
    k = 0
    while f < f1 - 0.5:
        if k not in skip:
            S.add("perc", f, Y.kick, vel=vel)
        f += step
        k += 1


def hats(f0, f1, step=9.0, vel=0.12, open_every=0):
    f = f0
    k = 0
    while f < f1 - 0.5:
        S.add("perc", f, Y.hat, vel=vel * (1.0 if k % 2 == 0 else 0.6), open_=bool(open_every and k % open_every == open_every - 1), seed=k % 7)
        f += step
        k += 1


def ticks(f0, f1, step=4.5, vel=0.1, f=9200.0):
    t = f0
    k = 0
    while t < f1 - 0.5:
        S.add("perc", t, Y.tick, vel=vel * (1.0 if k % 4 == 0 else 0.55), seed=k % 5, f=f)
        t += step
        k += 1


def taiko(f, vel=0.6, pitch=1.0):
    S.add("perc", f, Y.taiko, vel=vel, pitch=pitch, seed=sd())


def hit(f, chord="Dm_lo", size=1.0, swell=0.8, sub_m=26, stab_oct=0):
    """Musical hit on frame f: reverse swell into it, low brass stab, taiko, sub drop."""
    notes = [n + 12 * stab_oct for n in (CH[chord] if isinstance(chord, str) else chord)]
    if swell:
        d = swell
        S.add("hits", f - d * 30, Y.noise_swell, dur=d, vel=0.35 * size, seed=sd())
    S.add("hits", f, Y.brass_stab, notes=notes, vel=0.7 * size, dur=2.2 + size, seed=sd())
    S.add("perc", f, Y.taiko, vel=0.75 * size, pitch=0.9, seed=sd())
    S.add("bass", f, Y.sub, m=sub_m + 12, dur=0.9 * size, vel=0.7 * size, release=0.9)
    S.mark(f, f"hit {chord} x{size}")


def sting(f, notes, vel=0.45, strum=0.8):
    for i, m in enumerate(notes):
        S.add("hits", f + i * strum, Y.bell, m=m, dur=3.0, vel=vel * (1 - 0.08 * i), seed=sd())
    S.mark(f, "sting")


def riser(f_end, dur_s, chord="Asus", vel=0.5):
    S.add("hits", f_end - dur_s * 30, Y.tonal_riser, notes=[n + 12 for n in CH[chord][:3]], dur=dur_s, vel=vel, seed=sd())
    S.mark(f_end, f"riser {dur_s}s")


def mute(f0, f1, label):
    S.mutes.append((f0, f1))
    S.mark(f0, "drop-out: " + label)


# ----------------------------------------------------------------------------------------------- the cue sheet
def cue_sheet():
    # M1 cold open (0-1124): tense pulse, grid on frame 1 so 991 and 1027 fall on beats -----------------------------------------
    g = A("M1_grid", 1, ["impact"], 2)
    hit(g, "Dm_lo", 0.6, swell=0)
    pad_prog(g, ["Dm_lo", "Ebmaj", "Dm_lo", "Bb"], bars=3, vel=0.34, cut0=300, cut1=900, attack=2.2)
    bass(g, 862, 38, vel=0.36, rhythm="pulse", step=9.0, accent=1.25)
    ticks(g, 862, 4.5, 0.09)
    kick_pat(g + 18 * 28, 590, 18.0, 0.32)
    x200 = A("x200", 532, ["impact"], 6)
    hit(x200, "Dm_lo", 0.5, swell=0.3)
    pad(735, 1000, "Asus", vel=0.36, attack=3.5, cut0=400, cut1=2200)
    taiko_roll = [735 + i * 9 for i in range(14)]
    for i, f in enumerate(taiko_roll):
        taiko(f, 0.18 + 0.025 * i, 1.1)
    crate_f = A("crate1", 891, ["crate"], 6)
    riser(crate_f, (crate_f - A("riser1", 846, ["riser"], 6)) / 30.0, "Asus", 0.45)
    kick_pat(crate_f, 990, 9.0, 0.42)
    bass(crate_f, 990, 38, vel=0.5, rhythm="pulse", step=4.5)
    hats(crate_f, 990, 4.5, 0.1)
    h1 = A("crate_hits_math", 991, ["impact"], 4)
    hit(h1, "Dm_lo", 0.85, swell=0.5)
    h2 = A("monument", 1027, ["impact"], 4)
    mute(h2 - 8, h2, "suck-out before the monument")
    hit(h2, [26, 38, 45, 50, 53], 1.25, swell=0.0)
    S.add("hits", h2 - 26, Y.noise_swell, dur=26 / 30, vel=0.5, seed=sd())
    pad(h2, 1120, "Dm_lo", vel=0.3, attack=0.05, release=3.0, cut0=1200, cut1=500)
    one = A("one", 1086, ["sting"], 6)
    S.add("motif", one, Y.bell, m=74, dur=2.0, vel=0.32, seed=sd())
    piece = A("piece", 1097, ["impact"], 6)
    sting(piece, [86, 93, 98], vel=0.42, strum=1.0)
    S.add("bass", piece, Y.sub, m=38, dur=0.6, vel=0.45, release=0.6)

    # M2 question + title theme + experiment tease (1124-1582); title grid on the "?" (1279) ------------------------------------
    pad(1124, 1279, "Dm", vel=0.3, attack=2.0, cut0=500, cut1=1300)
    motif(1142, reps=1, step=18.0, vel=0.22)
    title = A("title", 1279, ["swell"], 6)
    theme(title, bars=[0, 1], vel=0.34, inst="bell", pad_vel=0.38, bass_vel=0.42)
    arp_prog(title, ["Dm", "Bb"], bars=1, step=9.0, vel=0.2, bright=0.9)
    dial = A("dial1", 1375, ["dial"], 8)
    pad(title + 2 * BAR, 1600, "Gm9", vel=0.32, attack=1.0, cut0=900, cut1=380)       # amber drains: the filter closes
    for k in range(10):                                                                # two lanes: lane 1 slows, lane 2 keeps pace
        S.add("pulse", 1445 + k * 12, Y.pluck, m=69, dur=0.3, vel=0.16, seed=sd(), bright=0.7)
    for k, f in enumerate([1445, 1463, 1490, 1526, 1570]):
        S.add("pulse", f, Y.pluck, m=64, dur=0.5, vel=0.16, seed=sd(), bright=0.6)
    pad(1500, 1600, "Asus", vel=0.28, attack=1.2, cut0=600, cut1=900)
    S.mark(dial, "power dial: pad filter closes (amber drains)")

    # M3 tokens (1582-2811): light Dorian textures --------------------------------------------------------------------------------
    t0 = 1582
    prog = ["Dm", "G13", "Bb", "Cadd9"] * 5
    pad_prog(t0, prog[:8], bars=2, vel=0.3, cut0=700, cut1=1500, attack=1.2)
    arp_prog(t0 + 36, prog[:8], bars=2, step=9.0, vel=0.2, bright=0.75)
    bass_prog(t0, prog[:8], bars=2, vel=0.32)
    hats(1700, 2400, 9.0, 0.06)
    kick_pat(1700, 2400, 36.0, 0.18)
    eleven = A("eleven", 2094, ["impact"], 6)
    hit(eleven, "Dm_lo", 0.45, swell=0.35, stab_oct=1)
    chop = A("photo_chop", 2467, ["impact"], 6)
    hit(chop, "Gm", 0.4, swell=0.3)

    # M4a scoring (2811-3436) -----------------------------------------------------------------------------------------------------
    t0 = 2811
    pad_prog(t0, ["Dm", "Bb", "Gm9"], bars=2, vel=0.3, cut0=600, cut1=1400)
    arp(t0, 3045, "Dm", step=9.0, vel=0.18, bright=0.7)
    opt = A("200k", 3132, ["impact"], 8)
    riser(opt, (opt - A("riser200k", 3045, ["riser"], 6)) / 30.0, "Asus", 0.4)
    hit(opt, "Bblyd", 0.7, swell=0.4)
    pad(opt, opt + 2 * BAR, "Bblyd", vel=0.36, attack=0.3, cut0=1600, cut1=2400)
    for k in range(12):                                                                  # the weighted wheel spins and decelerates
        f = 3205 + 47 * (1 - 0.92 ** k) / (1 - 0.92) * 0.28
        S.add("pulse", f, Y.pluck, m=[74, 72, 69, 67, 65, 62][k % 6] + 12, dur=0.25, vel=0.15, seed=sd(), bright=0.9)
    S.add("motif", A("likely", 3252, ["pop"], 6), Y.bell, m=74, dur=2.0, vel=0.25, seed=sd())
    S.add("motif", 3370, Y.bell, m=69, dur=2.0, vel=0.22, seed=sd())
    S.add("motif", 3383, Y.bell, m=72, dur=2.0, vel=0.22, seed=sd())
    S.add("motif", A("different", 3404, ["pop"], 6), Y.bell, m=73, dur=2.2, vel=0.24, seed=sd())   # the "different answer" rub
    pad(3243, 3460, "Dm", vel=0.26, attack=1.2, cut0=600, cut1=1100)

    # M4b THE LOOP (3436-4234): grid 3456, so 3600 is a downbeat ------------------------------------------------------------------
    g = 3456
    loop = A("loop", 3600, ["impact"], 6)
    g = loop - 2 * BAR
    pad_prog(g, ["Dm", "Dm"], bars=1, vel=0.3, cut0=600, cut1=1300)
    motif(g, reps=4, step=9.0, vel=0.18)
    riser(loop, (loop - A("riser_loop", 3580, ["riser"], 6)) / 30.0, "Asus", 0.35)
    hit(loop, "Dm_lo", 0.65, swell=0.3, stab_oct=1)
    pad_prog(loop, ["Dm", "Bb", "Gm9", "Asus"], bars=1, vel=0.36, cut0=900, cut1=1800, attack=0.4)
    motif(loop, reps=1, step=9.0, vel=0.3)
    motif(loop + 36, reps=4, step=9.0, vel=0.26, accel=0.9)                               # laps accelerate
    bass(loop, 3782, "Dm", vel=0.42, rhythm="pulse", step=18.0)
    end_tok = A("end_token", 3706, ["pop"], 6)
    S.add("motif", end_tok, Y.bell, m=76, dur=3.0, vel=0.26, seed=sd())                   # the loop hangs on E (never resolves)
    S.post.append(("stutter", A("never_see", 3751, ["glitch"], 6)))
    hund = 3826
    pad(hund, 3967, "Gm9", vel=0.32, cut0=800, cut1=1500)
    motif(3782, reps=16, step=4.5, vel=0.17, inst="pluck")                               # 100 runs, one after another
    bass(3782, 3967, "Gm", vel=0.38, rhythm="pulse", step=9.0)
    hats(3782, 3967, 4.5, 0.06)
    pad_prog(3967, ["Dm", "Bb"], bars=2, vel=0.3, cut0=700, cut1=1300)
    motif(3967, reps=6, step=9.0, vel=0.16)
    trick = A("trick", 4181, ["sting"], 6)
    S.add("motif", trick, Y.lead, m=76, dur=0.5, vel=0.32, seed=sd())
    S.add("motif", trick + 15, Y.lead, m=78, dur=1.2, vel=0.36, seed=sd())                 # the rule bends: E5 -> F#5
    sting(trick + 15, [78, 83, 86], vel=0.3, strum=1.2)

    # M5 streaming (4234-4897): desk at night, e-piano ------------------------------------------------------------------------------
    t0 = 4234
    prog = ["Dm", "Bb", "Gm9", "Asus", "Dm", "Bb", "Gm9", "Asus", "Dm"]
    pad_prog(t0, prog, bars=1, vel=0.26, cut0=600, cut1=1100, attack=1.0)
    arp_prog(t0, prog, bars=1, step=18.0, vel=0.22, inst="epiano", up=0)
    for k in range(40):                                                                 # one token at a time (stream)
        f = 4250 + k * 9.0
        if f > 4545:
            break
        S.add("pulse", f, Y.pluck, m=[81, 84, 86, 88, 89][(k * 3) % 5], dur=0.12, vel=0.08, seed=sd(), bright=1.0, decay=0.08)
    ten = A("ten_s", 4497, ["pop"], 6)
    sting(ten, [74, 81], vel=0.22, strum=0.5)
    pad(4752, 4893, "Asus", vel=0.24, attack=2.0, cut0=500, cut1=800)
    rew = A("rewind", 4917, ["rewind"], 6)
    S.post.append(("tapestop", rew - 26, rew - 4))
    S.post.append(("rewind", rew, A("hit_enter", 4952, [], 0), rew - 140, rew - 26))
    S.mark(rew, "tape-stop, then the music rewinds")

    # M6 reading vs writing (4970-5954) --------------------------------------------------------------------------------------------
    t0 = 4970
    pad_prog(t0, ["Dm", "Bb", "Gm9", "Asus"], bars=2, vel=0.28, cut0=700, cut1=1300)
    bass_prog(t0, ["Dm", "Bb", "Gm9", "Asus"], bars=2, vel=0.32)
    for i, m in enumerate([62, 65, 69, 72, 74, 77, 81]):                                 # the block hops the loop: one quick gliss
        S.add("pulse", 5013 + i * 1.5, Y.pluck, m=m, dur=0.3, vel=0.2, seed=sd(), bright=1.0)
    for f, m in [(5148, 74), (5182, 72), (5200, 69)]:                                       # piece 5 waits for piece 4
        S.add("motif", f, Y.bell, m=m, dur=1.6, vel=0.24, seed=sd())
    ready = 5320
    sting(ready, [62, 69, 74, 76, 81], vel=0.2, strum=0.0)                                 # all tiles flare at once
    one_run = A("one_run", 5463, ["impact"], 6)
    riser(one_run, (one_run - A("riser_onerun", 5425, ["riser"], 6)) / 30.0, "Asus", 0.35)
    hit(one_run, [38, 50, 53, 57, 60, 64, 65, 69], 0.7, swell=0.3)                         # every note at once = one run
    for f in (5506, 5524, 5546):                                                          # chunk by chunk
        S.add("hits", f, Y.brass_stab, notes=[50, 57, 62], vel=0.22, dur=0.8, seed=sd())
    pad(5546, 5700, "Bb", vel=0.27, cut0=700, cut1=1200)
    pad(5700, 5940, "Gm9", vel=0.27, cut0=700, cut1=1200)
    bass(5546, 5700, "Bb", vel=0.3)
    bass(5700, 5936, "Gm9", vel=0.3)
    arp(5680, 5800, "Dm", step=18.0, vel=0.2, pattern=(0, 1, 2, 3, 4))                      # one token per run, in order
    arp(5800, 5936, "Dm", step=9.0, vel=0.2, pattern=(0, 2, 4, 3, 1))
    arp(5880, 5936, "Dm", step=4.5, vel=0.15, pattern=(4, 3, 2, 1, 0))
    q1 = A("q_card1", 5954, ["sting"], 6)
    mute(q1 - 16, q1, "before the re-hook card 'Why is each writing run so slow?'")

    # M7 math vs wait (5954-6524) ---------------------------------------------------------------------------------------------------
    sting(q1, [63, 70, 74, 81], vel=0.34, strum=1.0)
    pad(q1, 6290, "Ebmaj", vel=0.3, attack=1.0, cut0=500, cut1=1100)
    bass(q1, 6290, 38, vel=0.34, rhythm="pulse", step=18.0)
    ticks(6071, 6236, 9.0, 0.06)
    tie = A("tie", 6236, ["pop"], 6)
    sting(tie, [74, 81], vel=0.22, strum=0.0)
    burst = A("burst", 6300, ["impact"], 6)
    hit(burst, "Dm_lo", 1.0, swell=0.5)
    for i, m in enumerate([50, 53, 57, 60, 62, 65, 69, 72, 74]):                           # nine layers slam down 2.6 f apart
        S.add("hits", burst + i * 2.6, Y.brass_stab, notes=[m], vel=0.16, dur=1.4, seed=sd())
    pad(burst, 6470, "Dm", vel=0.36, attack=0.3, cut0=1500, cut1=900)
    for f in (A("w1", 6385, ["tick"], 4), A("w2", 6397, ["tick"], 4), A("w3", 6409, ["tick"], 4)):
        taiko(f, 0.42, 0.75)
    verdict = A("verdict1", 6470, ["impact"], 6)
    hit(verdict, "Bb", 0.55, swell=0.3)
    pad(verdict, 6560, "Bb", vel=0.32, attack=0.2, cut0=1400, cut1=800)

    # M8 weights (6524-7444) --------------------------------------------------------------------------------------------------------
    t0 = 6524
    prog = ["Dm_lo", "Bb", "Gm9", "Dm_lo", "Bb", "Asus"]
    pad_prog(t0, prog, bars=2, vel=0.3, cut0=450, cut1=1100, attack=2.0)
    bass_prog(t0, prog, bars=2, vel=0.3)
    arp_prog(t0 + BAR, prog[1:5], bars=2, step=18.0, vel=0.14, pattern=(0, 2, 1, 3), up=0, bright=0.6)
    S.add("hits", 6668, Y.noise_swell, dur=1.2, vel=0.25, seed=sd())
    for f in (6843, 6849, 6860):
        S.add("motif", f, Y.bell, m=[81, 84, 88][[6843, 6849, 6860].index(f)], dur=1.8, vel=0.2, seed=sd())
    S.add("motif", A("8b", 7076, ["pop"], 6), Y.bell, m=74, dur=2.0, vel=0.24, seed=sd())
    for k in range(16):
        S.add("pulse", 7164 + k * 1.2, Y.pluck, m=74 + (k % 2) * 7, dur=0.1, vel=0.08, seed=sd(), decay=0.05)
    gb = A("16GB_again", 7343, ["impact"], 6)
    riser(gb, 2.0, "Asus", 0.3)
    hit(gb, [26, 38, 45, 50, 53], 0.8, swell=0.0)
    cb = A("callback", 7393, ["sting"], 6)
    sting(cb, [86, 93, 98], vel=0.3, strum=1.0)
    bass(cb, 7440, 38, vel=0.36, rhythm="pulse", step=9.0, accent=1.25)                    # the cold-open pulse, for a second
    ticks(cb, 7440, 4.5, 0.08)

    # M9 VRAM -> the build into the bridge (7444-7874) ------------------------------------------------------------------------------
    reveal = A("bridge", 7874, ["impact"], 4)
    g = reveal - 6 * BAR
    pad_prog(g, ["Bb", "Gm9", "Bb", "Gm9"], bars=1, vel=0.3, cut0=500, cut1=1200)
    bass(g, g + 4 * BAR, "Bb", vel=0.34, rhythm="pulse", step=18.0)
    S.add("perc", A("gpu_drop", 7465, [], 0), Y.taiko, vel=0.4, pitch=0.9, seed=sd())
    pad(g + 4 * BAR, reveal - 12, "Asus", vel=0.36, attack=2.5, cut0=500, cut1=3200)
    bass(g + 4 * BAR, reveal - 12, "Asus", vel=0.42, rhythm="pulse", step=9.0)
    hats(g + 4 * BAR, reveal - 12, 4.5, 0.09)
    for i in range(int((reveal - 12 - (g + 4 * BAR)) / 9)):
        taiko(g + 4 * BAR + i * 9, 0.15 + 0.02 * i, 1.0)
    riser_start = A("riser_bridge", 7774, ["riser"], 6)
    S.add("hits", riser_start, Y.tonal_riser, notes=[57, 64, 69], dur=(reveal - 12 - riser_start) / 30.0, vel=0.55, seed=sd())
    mute(reveal - 12, reveal, "the moment of silence before the bridge")

    # M10 THE BRIDGE: the full theme (7874-8479) ---------------------------------------------------------------------------------------
    hit(reveal, [26, 38, 45, 50, 57, 62], 1.2, swell=0.0)
    theme(reveal, bars=list(range(8)), vel=0.5, pad_vel=0.44, bass_vel=0.5)
    kick_pat(reveal, reveal + 8 * BAR, 18.0, 0.3)
    hats(reveal + 2 * BAR, reveal + 8 * BAR, 9.0, 0.07)
    for b in range(8):
        taiko(reveal + b * BAR, 0.28 if b % 2 == 0 else 0.2, 0.95)
    for i in range(16):                                                                   # the token flies through 32 plates
        S.add("pulse", A("token_fly", 8222, ["whoosh"], 6) + i * 3.5, Y.pluck, m=62 + [0, 3, 5, 7, 10][i % 5] + 12 * (i // 5), dur=0.18, vel=0.12,
              seed=sd(), bright=1.0, decay=0.1)

    # M11 fast but narrow, x300, waiting (8479-9507) ------------------------------------------------------------------------------------
    t0 = 8479
    pad(t0, 8549, "Dm", vel=0.3, cut0=700, cut1=1300)
    arp(8549, 8808, "Dm", step=4.5, vel=0.15, bright=0.9, pattern=(0, 2, 4, 2, 3, 1, 4, 2))
    pad_prog(8549, ["Dm", "Bb"], bars=2, vel=0.3, cut0=800, cut1=1600)
    hats(8549, 8808, 4.5, 0.07)
    kick_pat(8549, 8808, 18.0, 0.28)
    bass(8549, 8808, "Dm", vel=0.36, rhythm="pulse", step=9.0)
    S.add("motif", A("3tb", 8640, ["pop"], 6), Y.bell, m=81, dur=2.0, vel=0.24, seed=sd())
    x300 = A("x300", 8886, ["impact"], 6)
    riser(x300, (x300 - A("riser300", 8868, ["riser"], 6)) / 30.0, "Asus", 0.35)
    pad(8808, x300, "Gm9", vel=0.28, cut0=500, cut1=900)
    hit(x300, "Dm_lo", 0.8, swell=0.3)
    pad(x300, 9191, "Ebmaj", vel=0.3, attack=0.5, cut0=600, cut1=1200)
    bass(x300, 9191, 38, vel=0.32, rhythm="pulse", step=18.0)
    motif(A("math_turn", 8989, ["tick"], 6), reps=1, step=3.0, vel=0.2, inst="pluck")
    ticks(A("delivery", 9028, ["dial"], 6), 9060, 2.0, 0.08)
    pad(9191, 9257, "Dm_lo", vel=0.22, attack=1.0, cut0=400, cut1=500)                       # waiting: thin, held
    S.add("motif", 9191, Y.bell, m=69, dur=2.5, vel=0.14, seed=sd())
    gauge = A("gauge150", 9257, ["dial"], 6)
    pad_prog(gauge, ["F", "C"], bars=2, vel=0.32, cut0=900, cut1=1800, attack=0.6)
    arp(gauge, 9489, "F", step=9.0, vel=0.14, bright=0.8)
    bass_prog(gauge, ["F", "C"], bars=2, vel=0.32)

    # M12 the experiment (9507-10789) ---------------------------------------------------------------------------------------------------
    ex = A("experiment", 9521, ["pop"], 6)
    sting(ex, [69, 74, 76], vel=0.24, strum=1.0)
    pad_prog(ex, ["Gm9", "Dm_lo", "Gm9"], bars=2, vel=0.3, cut0=500, cut1=1100)
    bass(ex, 9910, 38, vel=0.36, rhythm="pulse", step=9.0, accent=1.3)
    ticks(ex, 9910, 4.5, 0.08)
    kick_pat(9692, 9905, 18.0, 0.3)
    cap = A("cap", 9910, ["dial"], 6)
    S.add("hits", cap, Y.noise_swell, dur=1.5, vel=0.2, seed=sd(), rev=False)
    pad(cap, 10050, "Dm_lo", vel=0.3, attack=0.3, cut0=1400, cut1=350)                       # power halves: the filter drains
    bass(cap, 10050, 38, vel=0.3, rhythm="pulse", step=18.0)
    pay = A("payoff", 10077, ["impact"], 6)
    riser(pay, (pay - A("riser_pay", 10030, ["riser"], 6)) / 30.0, "Asus", 0.4)
    mute(pay - 10, pay - 2, "a breath before the payoff")
    hit(pay, "Dm_lo", 0.9, swell=0.0)
    arp(pay, 10163, "Dm", step=18.0, vel=0.18, pattern=(0, 2, 4, 3))                        # reading: slowed (half rate)
    arp(10142, 10200, "Dm", step=9.0, vel=0.16, pattern=(4, 3, 2, 1), up=24)                 # writing: barely changed
    ok = A("barely_changed", 10177, [], 0)
    pad_prog(ok - 36, ["Bb", "F", "C", "Dm"], bars=1, vel=0.38, cut0=1200, cut1=2000, attack=0.3)
    theme(ok + 36 - 2 * BAR + 2 * BAR, bars=[0], vel=0.34, chords=False)
    S.mark(ok, "payoff resolves (Bb-F-C-Dm)")
    t0 = 10200
    pad_prog(10324, ["Dm", "Bb", "Gm9", "Asus"], bars=1, vel=0.3, cut0=800, cut1=1400)
    arp(10328, 10444, "Dm", step=4.5, vel=0.13, bright=0.9)                                   # all at once: the math stays busy
    for f in range(10454, 10620, 24):                                                         # writes: one token per conversation
        S.add("pulse", f, Y.pluck, m=74, dur=0.2, vel=0.12, seed=sd())
    S.add("hits", A("bounce", 10633, [], 0), Y.brass_stab, notes=[51, 57], vel=0.18, dur=0.9, seed=sd())
    pad(10612, 10731, "Asus", vel=0.28, attack=0.8, cut0=600, cut1=1100)
    mem = A("memory", 10731, ["impact"], 6)
    riser(mem, (mem - A("riser_mem", 10670, ["riser"], 6)) / 30.0, "Asus", 0.4)
    hit(mem, "Dm_lo", 0.8, swell=0.2)
    pad(mem, 10800, "Dm", vel=0.36, attack=0.2, cut0=1500, cut1=900)
    S.add("motif", mem, Y.lead, m=62, dur=0.6, vel=0.3, seed=sd())
    S.add("motif", mem + 18, Y.lead, m=69, dur=1.0, vel=0.3, seed=sd())

    # M13 bandwidth + the home card (10789-11565) -------------------------------------------------------------------------------------
    t0 = 10789
    prog = ["Dm", "G13", "Dm", "G13", "Bb", "Cadd9", "Dm", "G13", "Bb", "Cadd9"]
    pad_prog(t0, prog, bars=1, vel=0.28, cut0=800, cut1=1500)
    bass_prog(t0, prog, bars=1, vel=0.3)
    arp_prog(t0, prog[:4], bars=1, step=9.0, vel=0.15, bright=0.8)
    hats(t0, 11346, 9.0, 0.06)
    kick_pat(t0, 11346, 36.0, 0.2)
    S.add("motif", A("rtx", 11046, ["pop"], 6), Y.bell, m=81, dur=2.0, vel=0.22, seed=sd())
    arp(11136, 11346, "Bb", step=9.0, vel=0.12, up=24, pattern=(0, 2, 4, 2))                   # H100 lane: full rate
    arp(11136, 11346, "Bb", step=18.0, vel=0.12, up=12, pattern=(0, 2, 4, 2))                  # RTX lane: about half
    arp(11346, 11550, "Dm", step=18.0, vel=0.18, inst="epiano", up=0)
    arp(11467, 11550, "Dm", step=4.5, vel=0.1, up=24, bright=1.0)
    q2 = A("q_card2", 11565, ["sting"], 6)
    mute(q2 - 15, q2, "before the re-hook card 'Why do chatbots keep you waiting?'")

    # M14 three doors (11565-11907) ---------------------------------------------------------------------------------------------------
    sting(q2, [63, 70, 74, 81], vel=0.32, strum=1.0)
    pad(q2, 11907, "Asus", vel=0.3, attack=1.0, cut0=500, cut1=1200)
    bass(q2, 11907, 33, vel=0.3)
    for f, m in [(11752, 63), (11804, 70), (11858, 77)]:
        S.add("motif", f, Y.bell, m=m, dur=2.6, vel=0.26, seed=sd())
    riser(A("door1", 11907, ["swell"], 6), 22 / 30, "Asus", 0.3)

    # M15 wait 1, data center (11907-12845): Phrygian, mechanical ---------------------------------------------------------------------
    t0 = 11907
    pad_prog(t0, ["Dm_b9", "Ebmaj", "Dm_b9", "Ebmaj", "Dm_b9", "Gm9", "Dm_b9"], bars=2, vel=0.28, cut0=450, cut1=1000)
    bass(t0, 12118, 38, vel=0.34, rhythm="pulse", step=9.0)
    bass(12154, 12554, 38, vel=0.34, rhythm="pulse", step=9.0)
    ticks(t0, 12118, 4.5, 0.08, f=7400)
    ticks(12154, 12554, 4.5, 0.08, f=7400)
    arp(12029, 12118, [50, 51, 57, 62], step=9.0, vel=0.14, pattern=(0, 1, 0, 2, 0, 1, 3, 2), up=12, bright=0.6)
    for k in range(6):                                                                       # thinking dots
        S.add("motif", 12183 + k * 18, Y.bell, m=86 - (k % 3) * 2, dur=1.0, vel=0.1, seed=sd())
    big = A("giant_crate", 12464, ["crate"], 8)
    riser(big, (big - A("riser_w1", 12400, ["riser"], 6)) / 30.0, "Dm_b9", 0.35)
    hit(big, "Dm_lo", 0.7, swell=0.0)
    split = A("split", 12604, ["impact"], 6)
    hit(split, [27, 39, 46, 51, 55], 0.8, swell=0.3)                                         # Eb: the cold Phrygian colour
    for i in range(40):                                                                      # 40 chips light in a wave, left to right
        S.add("pulse", split + 20 + i * 1.6, Y.pluck, m=[62, 63, 69, 74, 75][i % 5] + 12, dur=0.15, vel=0.06 + 0.002 * i, seed=sd(), decay=0.12)
    arp(12711, 12823, [62, 63, 69, 74], step=9.0, vel=0.12, up=12, pattern=(0, 3, 1, 2))
    S.post.append(("pingpong", 12711, 12845))

    # M16 wait 2, long chats (12845-13873): creeping bass, notes that pile up ---------------------------------------------------------
    d2 = A("door2", 12851, ["swell"], 6)
    sting(d2, [70, 77], vel=0.2, strum=1.0)
    t0 = d2 + 36
    creep = [38, 37, 36, 35, 34, 33, 34, 36, 38, 37, 36, 35, 34]
    for i, m in enumerate(creep):
        f = t0 + i * BAR
        if f > 13853:
            break
        bass(f, f + BAR, m, vel=0.32)
        pad(f, f + BAR, [m + 12, 57, 62, 65] if m != 33 else [45, 57, 61, 64], vel=0.27, cut0=600, cut1=1100, attack=0.8)
        for j in range(min(8, 1 + i)):                                                       # bar i carries i+1 notes: the notes pile up
            S.add("motif", f + j * 9, Y.bell, m=[74, 77, 76, 69, 72, 74, 81, 79][j], dur=1.4, vel=0.11, seed=sd())
    gbn = A("1GB", 13607, ["impact"], 6)
    riser(gbn, (gbn - A("riser_1gb", 13590, ["riser"], 6)) / 30.0, "Asus", 0.3)
    hit(gbn, "Dm_lo", 0.65, swell=0.2)
    haul = A("haul", 13816, ["crate"], 6)
    taiko(haul, 0.4, 0.8)

    # M17 wait 3, sharing (13873-15091): busy interlocking voices -----------------------------------------------------------------------
    d3 = A("door3", 13883, ["swell"], 6)
    sting(d3, [77, 84], vel=0.2, strum=1.0)
    t0 = d3 + 36
    prog = ["Dm", "G13", "Bb", "Cadd9", "Dm", "G13", "Bb", "Cadd9", "Dm", "G13", "Bb", "Cadd9", "Dm", "Bb", "Gm9", "Asus"]
    pad_prog(t0, prog, bars=1, vel=0.26, cut0=800, cut1=1500)
    bass_prog(t0, prog, bars=1, vel=0.3)
    arp_prog(t0, prog[:10], bars=1, step=9.0, vel=0.12, pattern=(0, 2, 4, 2), up=12, bright=0.8)
    arp_prog(t0 + 4.5, prog[:10], bars=1, step=18.0, vel=0.1, pattern=(4, 3, 1), up=24, bright=0.9)
    hats(t0, 14735, 9.0, 0.06)
    kick_pat(t0, 14735, 18.0, 0.22)
    for f in range(14040, 14200, 36):                                                         # three bins at once: 3-note stabs
        S.add("pulse", f, Y.pluck, m=74, dur=0.2, vel=0.12, seed=sd())
        S.add("pulse", f, Y.pluck, m=77, dur=0.2, vel=0.1, seed=sd())
        S.add("pulse", f, Y.pluck, m=81, dur=0.2, vel=0.1, seed=sd())
    hit(A("batch", 14216, ["impact"], 6), "Gm", 0.6, swell=0.3)
    x60 = A("x60", 14633, ["impact"], 6)
    riser(x60, (x60 - A("riser_x60", 14620, ["riser"], 6)) / 30.0 + 0.6, "Asus", 0.3)
    hit(x60, "Bblyd", 0.85, swell=0.0)
    arp(x60, 14734, "Bblyd", step=2.25, vel=0.07, up=24, bright=1.0)                          # density: 200 requests at once
    far = A("far_apart", 14808, ["sting"], 8)
    sting(far, [74, 81], vel=0.2, strum=27 / 3)
    arp(14734, 14866, "Dm", step=27.0, vel=0.14, pattern=(0, 2, 4, 3))                        # tokens three times further apart
    pad(14866, 15091, "Asus", vel=0.26, attack=1.0, cut0=700, cut1=500)
    arp(14866, 15060, "Gm9", step=18.0, vel=0.14, inst="epiano", up=0, pattern=(4, 3, 2, 1, 0))

    # M18 the tricks (15091-17080): lift ------------------------------------------------------------------------------------------------
    t0 = 15091
    prog = ["F", "Cadd9", "Bblyd", "Cadd9"]
    pad_prog(t0, prog * 2, bars=1, vel=0.3, cut0=1000, cut1=1800)
    bass_prog(t0, prog * 2, bars=1, vel=0.32)
    arp_prog(t0 + BAR, (prog * 2)[1:7], bars=1, step=9.0, vel=0.14, bright=0.9, pattern=(0, 2, 4, 3))
    kick_pat(t0 + BAR, t0 + 8 * BAR, 18.0, 0.25)
    hats(t0 + BAR, t0 + 8 * BAR, 9.0, 0.07, open_every=8)
    for f in (A("leverB", 15355, ["dial"], 6), A("leverA", 15418, ["dial"], 6)):
        taiko(f, 0.3, 1.2)
    for f, m in [(15466, 74), (15514, 62), (15539, 50)]:                                       # 16 -> 8 -> 4 bits: each a step lower
        S.add("motif", f, Y.bell, m=m + 12, dur=1.6, vel=0.2, seed=sd())
    S.post.append(("crush", A("squeeze", 15673, ["glitch"], 6) - 14, 15712))
    t1 = 15600
    pad_prog(t1, ["Dm", "Bb", "Gm9", "Asus"], bars=1, vel=0.28, cut0=700, cut1=1300)
    forty = A("40pct", 15843, ["impact"], 6)
    riser(forty, (forty - A("riser40", 15826, ["riser"], 6)) / 30.0 + 0.5, "Asus", 0.3)
    hit(forty, "F", 0.6, swell=0.2, stab_oct=1)
    S.add("motif", 15893, Y.bell, m=81, dur=1.2, vel=0.18, seed=sd())                           # not twice: a deflating fall
    S.add("motif", 15899 + 12, Y.bell, m=76, dur=1.8, vel=0.16, seed=sd())
    pad_prog(15843, ["F", "Cadd9"], bars=1, vel=0.28, cut0=900, cut1=1500)
    t2 = A("another", 16044, [], 0)
    pad_prog(t2, ["Bblyd", "F", "Cadd9", "Dm", "Bblyd", "F", "Cadd9", "Dm", "Bblyd", "F", "Cadd9", "Dm", "D"], bars=1, vel=0.3, cut0=1000, cut1=1800)
    bass_prog(t2, ["Bblyd", "F", "Cadd9", "Dm", "Bblyd", "F", "Cadd9", "Dm", "Bblyd", "F", "Cadd9", "Dm"], bars=1, vel=0.32)
    s1 = A("spec", 16114, ["sting"], 6)
    sting(s1, [77, 81, 84], vel=0.28, strum=1.0)
    s2 = A("bends", 16191, ["sting"], 6)
    S.add("motif", s2, Y.lead, m=76, dur=0.4, vel=0.3, seed=sd())
    S.add("motif", s2 + 12, Y.lead, m=78, dur=1.2, vel=0.34, seed=sd())                         # the bend, called back
    arp(16255, 16348, "F", step=2.25, vel=0.08, up=24, bright=1.0)                              # the draft model races ahead
    S.add("hits", 16348, Y.brass_stab, notes=[41, 53, 57, 60], vel=0.3, dur=1.6, seed=sd())    # the big model
    for f in (A("ok1", 16406, ["tick"], 2), A("ok2", 16410, ["tick"], 2), A("ok3", 16414, ["tick"], 2)):
        S.add("pulse", f, Y.pluck, m=81, dur=0.15, vel=0.16, seed=sd(), bright=1.0)
    S.add("hits", A("cross", 16418, ["impact"], 4), Y.brass_stab, notes=[50, 51], vel=0.22, dur=0.8, seed=sd())
    S.add("pulse", 16547, Y.pluck, m=77, dur=0.3, vel=0.14, seed=sd())
    S.add("pulse", 16547, Y.pluck, m=81, dur=0.3, vel=0.14, seed=sd())
    S.add("pulse", 16547, Y.pluck, m=84, dur=0.3, vel=0.14, seed=sd())
    own = A("own", 16783, ["impact"], 6)
    hit(own, "Dm_lo", 0.6, swell=0.25, stab_oct=1)
    S.add("motif", own, Y.lead, m=62, dur=0.6, vel=0.3, seed=sd())
    S.add("motif", own + 18, Y.lead, m=69, dur=1.2, vel=0.32, seed=sd())
    x23 = A("x2_3", 16897, ["impact"], 6)
    riser(x23, (x23 - A("riser_x23", 16880, ["riser"], 6)) / 30.0 + 0.5, "Asus", 0.3)
    hit(x23, "F", 0.75, swell=0.0, stab_oct=1)
    pad_prog(x23, ["F", "Cadd9"], bars=1, vel=0.32, cut0=1200, cut1=2000)
    arp(x23, 17058, "F", step=9.0, vel=0.14, bright=0.9)

    # M19 close: the loop remains, the question again (17080-17682) ---------------------------------------------------------------
    t0 = 17080
    pad_prog(t0, ["Dm", "Bb", "Gm9", "Dm"], bars=1, vel=0.27, cut0=700, cut1=1200)
    motif(t0, reps=4, step=9.0, vel=0.2)
    motif(17134, reps=6, step=4.5, vel=0.14, inst="pluck")                                     # the tricks speed the loop up...
    motif(17275, reps=2, step=9.0, vel=0.2)                                                   # ...but it is still a loop
    S.add("motif", A("loop_again", 17313, ["pop"], 6), Y.bell, m=76, dur=2.6, vel=0.24, seed=sd())
    qa = 17494
    theme(qa, bars=[0, 1], vel=0.3, inst="bell", pad_vel=0.32, bass_vel=0.38)
    arp_prog(qa, ["Dm", "Bb"], bars=1, step=9.0, vel=0.14, bright=0.9)
    pad(qa + 2 * BAR, 17706, "Gm9", vel=0.3, cut0=800, cut1=1300)

    # M20 bridge hero (17682-17874) -------------------------------------------------------------------------------------------------
    trip = A("trip", 17850, ["impact"], 6)
    pad(17706, trip, "Bb", vel=0.3, attack=1.5, cut0=500, cut1=1300)
    bass(17706, trip, 34, vel=0.32, rhythm="pulse", step=18.0)
    S.add("hits", trip - 72, Y.tonal_riser, notes=[57, 64, 69], dur=72 / 30, vel=0.35, seed=sd())
    hit(trip, [26, 38, 45, 50, 57], 1.0, swell=0.0)
    S.add("motif", trip, Y.lead, m=62, dur=0.6, vel=0.32, seed=sd())
    S.add("motif", trip + 18, Y.lead, m=69, dur=1.2, vel=0.34, seed=sd())

    # M21 finale (17874-18367): all at once -> one piece at a time -> the theme's last four bars, resolve to D major --------------
    pad(trip, 17918, "Dm", vel=0.3, attack=0.2, cut0=1200, cut1=900)
    allat = A("all_at_once", 17918, ["pop"], 6)
    S.add("hits", allat, Y.brass_stab, notes=[50, 53, 57, 60, 62, 64, 65, 69], vel=0.3, dur=1.2, seed=sd())   # in, all at once
    sting(allat, [62, 65, 69, 74, 76, 77, 81], vel=0.16, strum=0.0)
    for k in range(10):                                                                           # out, one piece at a time
        S.add("pulse", 17956 + k * 9, Y.pluck, m=[74, 77, 76, 69, 74, 77, 81, 79, 77, 76][k], dur=0.3, vel=0.14, seed=sd(), bright=0.9)
    pad(17918, 18007, "Dm", vel=0.3, attack=1.0, cut0=800, cut1=1300)
    resolve = A("signoff", 18295, ["sting"], 6)
    b5 = resolve - 3 * BAR
    pre = b5 - BAR
    pad(pre, b5, "Asus", vel=0.38, attack=2.0, cut0=600, cut1=2600)
    bass(pre, b5, 33, vel=0.4, rhythm="pulse", step=9.0)
    S.add("hits", pre, Y.tonal_riser, notes=[57, 64, 69], dur=BAR / 30, vel=0.3, seed=sd())
    for i in range(8):
        taiko(pre + i * 9, 0.14 + 0.03 * i, 1.0)
    theme(b5, bars=[4, 5, 6, 7], vel=0.58, pad_vel=0.48, bass_vel=0.55, final="D")
    theme(b5, bars=[4, 5, 6, 7], vel=0.22, octave=1, inst="bell", chords=False)
    kick_pat(b5, resolve, 18.0, 0.34)
    hats(b5, resolve, 9.0, 0.08, open_every=8)
    for b in range(3):
        taiko(b5 + b * BAR, 0.32, 0.95)
    hit(resolve, [26, 38, 50, 57, 62, 66], 0.7, swell=0.4)
    sting(resolve, [74, 78, 81, 86], vel=0.34, strum=1.5)
    S.mark(resolve, "final chord D major (Picardy), rings to the end")


# ----------------------------------------------------------------------------------------------- render
def render():
    t_start = time.time()
    cue_sheet()
    stems = {s: np.zeros((2, N), dtype=np.float32) for s in STEMS}
    cache = {}
    for stem, f, fn, kw in S.ev:
        key = None
        if fn in (Y.pluck, Y.bell, Y.epiano, Y.kick, Y.hat, Y.tick, Y.sub):
            key = (fn.__name__, tuple(sorted((k, v if not isinstance(v, list) else tuple(v)) for k, v in kw.items() if k != "seed")))
        if key is not None and key in cache:
            y = cache[key]
        else:
            y = fn(**kw)
            if key is not None and len(cache) < 4000:
                cache[key] = y
        i = int(round(f / 30.0 * SR))
        a, b = max(0, i), min(N, i + y.shape[1])
        if b > a:
            stems[stem][:, a:b] += y[:, a - i:b - i].astype(np.float32)
    print(f"events {len(S.ev)} rendered in {time.time() - t_start:.0f}s")

    # post effects on the whole music (each stem the same way) -----------------------------------------------------------------------
    for p in S.post:
        for s in STEMS:
            x = stems[s]
            if p[0] == "tapestop":
                i0, i1 = L.f2s(p[1]), L.f2s(p[2])
                seg = x[:, i0:i1 + SR].astype(np.float64)
                u = np.arange(i1 - i0) / (i1 - i0)
                pos = np.cumsum((1 - u) ** 1.6)
                y = np.vstack([np.interp(pos, np.arange(seg.shape[1]), seg[c]) for c in range(2)]) * (1 - u ** 3)
                x[:, i0:i1] = y.astype(np.float32)
                x[:, i1:L.f2s(p[2] + 30)] = 0
            elif p[0] == "rewind":
                i0, i1 = L.f2s(p[1]), L.f2s(p[2])
                s0, s1 = L.f2s(p[3]), L.f2s(p[4])
                src = x[:, s0:s1][:, ::-1].astype(np.float64)
                k = i1 - i0
                pos = np.linspace(0, src.shape[1] - 1, k) ** 1.0
                y = np.vstack([np.interp(pos, np.arange(src.shape[1]), src[c]) for c in range(2)])
                y = L.butter(y, "bp", [250, 5000], 2) * np.sin(np.pi * np.linspace(0, 1, k)) ** 0.5 * 0.8
                x[:, i0:i1] += y.astype(np.float32)
            elif p[0] == "crush":
                i0, i1 = L.f2s(p[1]), L.f2s(p[2])
                seg = x[:, i0:i1].astype(np.float64)
                hold = 12
                idx = (np.arange(seg.shape[1]) // hold) * hold
                cr = np.round(seg[:, idx] * 24) / 24
                w = np.clip(np.minimum(np.arange(seg.shape[1]), seg.shape[1] - np.arange(seg.shape[1])) / (0.03 * SR), 0, 1)
                x[:, i0:i1] = (seg * (1 - w) + cr * w).astype(np.float32)
            elif p[0] == "stutter":
                i = L.f2s(p[1])
                g = int(0.045 * SR)
                grain = x[:, i:i + g].copy()
                for r in range(1, 4):
                    x[:, i + r * g:i + (r + 1) * g] = grain * (0.9 ** r)
            elif p[0] == "pingpong" and s in ("pulse", "motif"):
                i0, i1 = L.f2s(p[1]), L.f2s(p[2])
                seg = x[:, i0:i1 + 2 * SR].astype(np.float64)
                y = Y.pingpong(seg, 0.3, fb=0.45, wet=0.5)
                x[:, i0:i1 + 2 * SR] = y.astype(np.float32)

    # stem processing: chorus + halls, speech-band-aware EQ, gentle glue --------------------------------------------------------------
    hall = L.reverb_ir(4.6, seed=31, pre_ms=24, damp_hz=3800)
    hall_b = L.reverb_ir(3.2, seed=32, pre_ms=18, damp_hz=5200)
    room = L.reverb_ir(0.9, seed=33, pre_ms=6, damp_hz=6000)
    proc = {
        "pads": dict(chorus=True, ir=hall, wet=-5.0, eq=[("hp", 60, 0.7, 0), ("peak", 2500, 0.8, -3.0), ("highshelf", 6000, 0.7, -4.0)]),
        "pulse": dict(chorus=False, ir=hall_b, wet=-9.0, eq=[("hp", 150, 0.7, 0), ("peak", 2400, 0.9, -2.0)]),
        "bass": dict(chorus=False, ir=None, wet=None, eq=[("lp", 160, 0.7, 0), ("hp", 28, 0.7, 0)]),
        "perc": dict(chorus=False, ir=room, wet=-14.0, eq=[("peak", 2500, 0.7, -6.0)]),
        "motif": dict(chorus=False, ir=hall, wet=-7.0, eq=[("hp", 180, 0.7, 0), ("peak", 2600, 0.8, -2.0)]),
        "hits": dict(chorus=False, ir=hall_b, wet=-6.0, eq=[("hp", 25, 0.7, 0), ("peak", 2500, 0.7, -3.0)]),
    }
    os.makedirs(OUT, exist_ok=True)
    meta = {"bpm": 100, "key": "D minor (Aeolian; Dorian / Phrygian colours)", "anchors": ANCHORS, "mutes": S.mutes,
            "marks": sorted(S.marks), "post": [list(p) for p in S.post], "events": len(S.ev), "stems": {}}
    for s in STEMS:
        x = stems[s].astype(np.float64)
        c = proc[s]
        if c["chorus"]:
            x = Y.chorus(x, mix=0.4)
        if c["ir"] is not None:
            y = L.convolve(x, c["ir"])[:, :N]
            x = x + L.undb(c["wet"]) * y
        x = L.eq(x, c["eq"])
        for (f0, f1) in S.mutes:                                    # the drop-outs are part of the composition
            i0, i1 = L.f2s(f0), L.f2s(f1)
            r = int(0.012 * SR)
            x[:, i0:i1] = 0.0
            x[:, max(0, i0 - r):i0] *= np.linspace(1, 0, r)[None, -min(r, i0):]
        fade_n = L.f2s(36)
        x[:, N - fade_n:] *= np.cos(0.5 * np.pi * np.arange(fade_n) / fade_n) ** 2    # end cleanly at 612.23 s
        pk = float(np.max(np.abs(x)))
        if pk > 0.98:
            x *= 0.98 / pk
        p = L.kpower(x)
        meta["stems"][s] = {"integrated_lufs": round(L.integrated(p), 2), "peak_db": round(float(L.db(np.max(np.abs(x)))), 2)}
        L.write_wav(os.path.join(OUT, f"{s}.wav"), x.astype(np.float32), bits=32)
        print(s, meta["stems"][s])
    L.save_json(os.path.join(OUT, "score_meta.json"), meta)
    print(f"done in {time.time() - t_start:.0f}s")


if __name__ == "__main__":
    render()
