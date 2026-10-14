"""Step 3: the extra cue design -> cues_extra.json (owned by the sound build; the builders' S*.cues.json stay untouched).

python -I make_cues_extra.py

What it writes:
- overrides: how specific builder cues are realised (which real sound, pan), matched by kind within a few frames, so small v5
  re-timings still match;
- events: foley the builders' cues miss (tile clicks on every spoken word in tile shots, blade chops, card riffle, crate rhythms on
  the bridge, servo, stopwatch, data chatter, camera moves) - word-synced events come from TRANSCRIPT.md (locked narration);
- transitions: whoosh lead-ins for picture transitions that have no builder whoosh, found from the picture itself
  (work/<picture>_framestats.json: per-frame scene score; refresh it for a new picture with the ffmpeg line in REPORT.md);
- ambience regions per environment (desk at night, data centre, chip world, studio stage) and the glass-deck hum on bridge shots;
- silences: the one full-mix suck-out (before the Bridge reveal).
"""
import json
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L  # noqa: E402

TRANSCRIPT = os.path.join(L.REMOTION, "docs", "ep03", "TRANSCRIPT.md")


def words():
    out = {}
    para = None
    for line in open(TRANSCRIPT, encoding="utf-8"):
        m = re.match(r"^### P(\d+)", line)
        if m:
            para = int(m.group(1))
            out[para] = []
            continue
        if para is not None and "@" in line:
            for tok in line.split():
                if "@" in tok:
                    w, f = tok.rsplit("@", 1)
                    try:
                        out[para].append((re.sub(r"[^\w%,.'?-]", "", w).lower(), int(f)))
                    except ValueError:
                        pass
    return out


W = words()


def at(p, word, nth=1):
    k = 0
    for w, f in W[p]:
        if w.strip(".,?!") .startswith(word.lower()):
            k += 1
            if k == nth:
                return f
    raise KeyError((p, word, nth))


EV = []
OV = []
RIDES = [[0, 21.0], [846, 20.0], [991, 19.0], [1124, 21.5], [1270, 19.5], [1440, 22.0], [1582, 25.0], [2800, 24.0], [3100, 21.5],
         [3436, 23.0], [3600, 20.5], [3967, 23.0], [4234, 25.0], [4897, 24.0], [5425, 21.5], [5600, 24.0], [5954, 21.0], [6300, 19.5],
         [6524, 24.5], [7300, 22.0], [7444, 23.0], [7700, 20.5], [7874, 19.0], [8300, 20.0], [8479, 22.5], [8886, 20.5], [9191, 24.0],
         [9257, 22.5], [9507, 22.0], [9910, 21.0], [10077, 19.0], [10250, 23.0], [10731, 20.0], [10789, 24.0], [11346, 24.5],
         [11565, 21.5], [11907, 23.5], [12604, 21.0], [12845, 24.0], [13607, 21.5], [13873, 23.0], [14633, 20.0], [14866, 24.0],
         [15091, 22.0], [15843, 20.5], [16044, 22.0], [16783, 20.5], [16897, 20.0], [17080, 24.0], [17494, 22.5], [17850, 19.5],
         [18000, 20.0], [18100, 19.0], [18367, 19.0]]
# whip directions from the section plans (frame of the builder cue or of the picture transition) -> on-screen motion of objects:
# a whip LEFT moves the content to the right, so its whoosh sweeps left -> right ("L"); a whip RIGHT sweeps right -> left ("R").
WHIPS = {146: "L", 2404: "L", 4369: "L", 6252: "L", 6736: "L", 7440: "L", 8281: "L", 8479: "L", 8814: "L", 9489: "L", 9686: "L",
         10438: "L", 11016: "R", 12024: "R", 12160: "L", 13347: "R", 13865: "L", 14344: "L", 14874: "L", 15607: "L", 16044: "R",
         16804: "L", 17880: "L", 1943: "L", 2420: "L"}


def whip_dir(f, tol=10):
    best = None
    for k, v in WHIPS.items():
        if abs(k - f) <= tol and (best is None or abs(k - f) < abs(best[0] - f)):
            best = (k, v)
    return best[1] if best else None


def ev(frame, role, strength=0.5, pan=0.0, note="", pan_to=None, anchor="default", group=None):
    d = {"frame": int(round(frame)), "role": role, "strength": round(float(strength), 2), "pan": round(float(pan), 2), "note": note}
    if group:
        d["group"] = group
    if pan_to is not None:
        d["pan_to"] = round(float(pan_to), 2)
    if anchor != "default":
        d["anchor"] = anchor
    EV.append(d)


def ov(frame, kind, roles, note, pan=0.0, pan_to=None, gain_db=0.0, tol=6, anchor="default", drop=False):
    d = {"frame": frame, "kind": kind, "tol": tol, "roles": roles, "pan": pan, "gain_db": gain_db, "note": note}
    if pan_to is not None:
        d["pan_to"] = pan_to
    if anchor != "default":
        d["anchor"] = anchor
    if drop:
        d["drop"] = True
    OV.append(d)


def row(frames, role, strength, pan0, pan1, note, group=None):
    """A run of one sound across a row of objects: one designed cue (one group)."""
    n = len(frames)
    g = group or f"run{int(frames[0])}"
    for i, f in enumerate(frames):
        ev(f, role, strength, pan0 + (pan1 - pan0) * (i / max(1, n - 1)), note, group=g)


def build():
    # ---------------- overrides of builder cues --------------------------------------------------------------------------------
    ov(1, "impact", ["impact_big", "sub_drop"], "cold-open wall slam", gain_db=-3)
    ov(172, "tick", ["stopwatch_click"], "read clock armed", pan=-0.4)
    ov(177, "pop", ["impact_small"], "the 750-word wall slams into the chat", gain_db=-4)
    ov(292, "tick", ["stopwatch_click"], "the clock freezes inside the blink", pan=0.0)
    ov(532, "impact", ["impact_big"], "x200 slams", gain_db=-2)
    ov(721, "glitch", ["glitch"], "words materialise into tiles", gain_db=-4)
    ov(891, "crate", ["crate_pass"], "the giant crate leaves memory and thunders across (L to R)", pan=-0.7, pan_to=0.6, anchor="start")
    ov(991, "impact", ["crate_land", "sub_drop"], "the crate hits the math (die, right)", pan=0.35)
    ov(1027, "impact", ["impact_big", "crate_land", "sub_drop"], "the monumental crate lands")
    ov(1086, "sting", ["glass_shimmer"], "For ONE", gain_db=-6)
    ov(1097, "impact", ["tile_seat"], "piece! - the tiny tile (music carries the sting)", gain_db=0)
    ov(1282, "swell", ["glass_shimmer"], "title moment sweep", gain_db=-3)
    ov(1375, "dial", ["dial_clunk", "dial_ratchet"], "power dial capped to half")
    ov(1706, "type", ["blade_snip"], "first chop of the tokenizer blade", pan=-0.6)
    ov(1790, "tick", ["tile_click"], "flip wave starts (IDs)", pan=-0.6)
    ov(2693, "tick", ["tile_click"], "first character cell clicks onto the ruler", pan=-0.3)
    ov(3252, "pop", ["tile_click"], "wheel settles on 'Because'", gain_db=-2)
    ov(4917, "rewind", ["tape_rewind"], "the rewind (tape scrubs back)", anchor="start")
    ov(4959, "pop", ["key_enter"], "Enter key pressed", gain_db=0)
    ov(5190, "pop", ["tile_seat"], "piece 4 lands", gain_db=-2)
    ov(6385, "tick", ["crate_land"], "wait block 1 (heavy)", gain_db=-10)
    ov(6397, "tick", ["crate_land"], "wait block 2 (heavy)", gain_db=-9)
    ov(6409, "tick", ["crate_land"], "wait block 3 (x4)", gain_db=-7)
    ov(7164, "tick", ["tile_click"], "bit tiles arc into the BF16 holder", gain_db=-3)
    ov(7429, "crate", ["crate_pass"], "callback: the opening crate thunders across", pan=-0.6, pan_to=0.6)
    ov(7638, "crate", ["crate_land"], "crate slams above the tiny cache", pan=0.1)
    ov(7774, "riser", ["riser"], "build into the Bridge (ends at the suck-out)", tol=4)
    ov(7876, "swell", ["glass_shimmer_2"], "Bridge reveal: glass gleam after the hit", anchor="start", gain_db=-2)
    ov(8454, "crate", ["crate_land"], "every token: crate lands at the die", pan=0.45, gain_db=-3)
    ov(8989, "tick", ["stopwatch_click"], "math stopwatch: one turn", pan=0.3)
    ov(9028, "dial", ["stopwatch_run", "dial_ratchet"], "delivery clock hands spin", pan=-0.2, anchor="start")
    ov(9257, "dial", ["servo"], "gauge needle springs to 150", pan=0.0)
    ov(9482, "crate", ["crate_pass"], "crate leaves (exit)", pan=-0.5, pan_to=0.6)
    ov(9910, "dial", ["dial_clunk", "dial_ratchet"], "every GPU capped to half power", pan=-0.3)
    ov(10328, "crate", ["crate_land"], "crate arrival: all the prompt's tiles at once", pan=0.2)
    ov(12464, "crate", ["crate_pass", "crate_land"], "giant '?' crate thunders across (shake)", pan=-0.4, pan_to=0.5)
    ov(13816, "crate", ["crate_pass"], "crate hauls a taller pile of notes", pan=-0.6, pan_to=0.6)
    ov(15355, "dial", ["dial_clunk"], "lever B snaps ON", pan=0.35)
    ov(15418, "dial", ["dial_clunk", "dial_ratchet"], "lever A clicks to its 8 notch", pan=-0.35)
    ov(16379, "crate", ["crate_pass", "crate_land"], "one big crate crosses and arrives", pan=-0.5, pan_to=0.4)
    ov(16406, "tick", ["tile_click"], "check 1", pan=-0.3)
    ov(16410, "tick", ["tile_click"], "check 2", pan=-0.1)
    ov(16414, "tick", ["tile_click"], "check 3", pan=0.1)
    ov(16418, "impact", ["impact_small"], "hard coral stop on the cross", pan=0.3, gain_db=-3)
    ov(16728, "crate", ["tile_seat"], "the rejected guess drops into the bin", pan=0.4)
    ov(16753, "pop", ["tile_seat"], "the big model's own token slams in", pan=0.2)
    ov(17958, "type", ["data_chatter"], "the answer streams out (token chatter)", anchor="start", gain_db=-4)
    ov(18277, "crate", ["crate_pass"], "crates cross again and again", pan=-0.6, pan_to=0.6, gain_db=-4)

    # ---------------- extra foley ----------------------------------------------------------------------------------------------
    ev(3, "stopwatch_click", 0.6, -0.5, "read clock freezes at 0.03 s (left screen)", group="cold_open_clocks")
    ev(8, "stopwatch_run", 0.35, 0.5, "write clock runs (right screen)", anchor="start", group="cold_open_clocks")
    ev(401, "stopwatch_run", 0.3, 0.2, "write clock crawls to 6.5 s", anchor="start")
    row([721, 727, 733, 739, 745], "tile_click", 0.3, -0.5, 0.5, "each word becomes a token tile")
    q = [at(2, "why"), at(2, "do"), at(2, "ai"), at(2, "answers"), at(2, "arrive"), at(2, "one", 2), at(2, "piece"), at(2, "at"), at(2, "a", 2),
         at(2, "time")]
    row(q[:5], "tile_click", 0.5, -0.55, 0.55, "question tiles snap in, row 1 (word-synced)", group="title_tiles")
    row(q[5:], "tile_click", 0.5, -0.55, 0.35, "question tiles snap in, row 2 (word-synced)", group="title_tiles")
    ev(1279, "tile_seat", 0.55, 0.55, "the '?' tile seats")
    for i in range(1, 10):                                                                    # the remaining 9 chops, every 5 frames
        ev(1706 + 5 * i, "blade_snip", 0.4, -0.6 + 1.2 * i / 9, "tokenizer blade chop", group="chops")
    for i in range(11):
        ev(1710 + 5 * i, "tile_click", 0.35, -0.6 + 1.2 * i / 10, "severed piece clicks into its slot", group="chops")
    for i in range(1, 11):
        ev(1790 + 2 * i, "tile_click", 0.22, -0.6 + 1.2 * i / 10, "flip wave (IDs)", group="flip1")
    ev(1852, "card_riffle", 0.6, -0.2, "vocabulary drawer: cards riffle forward", anchor="start")
    ev(1886, "tile_click", 0.45, 0.1, "the riffle stops on 'Why 13903'")
    row([2020 + 2 * i for i in range(11)], "tile_click", 0.2, -0.6, 0.6, "wave flips back to words")
    row([2204 + 2 * i for i in range(11)], "tile_click", 0.22, -0.6, 0.6, "Llama pieces lock onto the same tiles")
    row([2693 + 4 * i for i in range(1, 4)], "tile_click", 0.35, -0.1, 0.3, "character cells click onto the ruler")
    ev(2728, "tile_seat", 0.4, 0.1, "cells fuse into one token")
    ev(3495, "tile_seat", 0.5, 0.3, "'Because' tacked onto the end")
    laps = [3620, 3640, 3657, 3671, 3683, 3693, 3701]
    row(laps, "tile_click", 0.3, -0.4, 0.4, "a tile per lap as the loop accelerates")
    ev(3826, "data_chatter", 0.45, 0.0, "100 runs: tiles fill the grid", anchor="start")
    ev(3955, "tile_seat", 0.45, -0.3, "counter reaches 100")
    ev(4250, "data_chatter", 0.35, 0.2, "answer streams word by word (desk)", anchor="start")
    ev(4952, "dial_clunk", 0.6, 0.0, "the rewind lands with a clunk")
    ev(4893, "tape_stop", 0.6, 0.0, "tape-stop deceleration into the rewind")
    row([5250 + 2 * i for i in range(11)], "tile_click", 0.18, -0.6, 0.6, "ready ticks under every tile")
    ev(5320, "glass_shimmer", 0.5, 0.0, "all eleven tiles flare at once")
    ev(5350, "cam_swish", 0.4, 0.0, "crane down to the die")
    row([5506, 5524, 5546], "tile_seat", 0.35, -0.4, 0.4, "chunks drop one by one")
    ev(5638, "tile_seat", 0.4, 0.3, "'Because' drops onto the belt")
    ev(6122, "data_chatter", 0.4, -0.5, "a wall of 1,000 tiles sweeps in", anchor="start")
    row([6170, 6192, 6214, 6236 - 3], "tile_click", 0.35, 0.3, 0.6, "four runs, one tile each (right die)")
    ev(6618, "cam_swish", 0.4, 0.0, "push into the loose weight")
    ev(6668, "whoosh_slow", 0.45, 0.0, "hard pull-back into the field of trays", anchor="start")
    ev(6705, "glass_shimmer", 0.4, -0.4, "a light wave runs through the field", pan_to=0.4)
    row([7164 + 2.5 * i for i in range(1, 8)], "tile_click", 0.25, -0.5, 0.6, "bit tiles arc into the slots")
    ev(7465, "crate_land", 0.45, 0.0, "the GPU module drops and lands")
    row([7486, 7494, 7502, 7510], "tile_click", 0.25, -0.5, 0.5, "weight pellets fall into the HBM stacks")
    ev(7978, "crate_pass", 0.45, -0.7, "first crates start across the bridge", pan_to=0.6)
    ev(8018, "crate_land", 0.4, 0.5, "crates reach the math: waves on the die")
    row([8057, 8063, 8069, 8075, 8081, 8087, 8093, 8099], "tile_seat", 0.3, -0.6, 0.6, "32 layer plates snap in")
    ev(8360, "crate_pass", 0.4, -0.7, "one hero crate per token (1)", pan_to=0.5, group="token_crates")
    ev(8382, "crate_land", 0.45, 0.5, "arrival: a token flies to the answer", group="token_crates")
    ev(8420, "crate_pass", 0.4, -0.7, "one hero crate per token (2)", pan_to=0.5, group="token_crates")
    for f in (8575, 8603, 8631, 8667, 8697):
        ev(f, "whoosh_fast", 0.3, -0.5, "fast crates on the H100 deck (speed streaks)", pan_to=0.5, group="h100_deck")
    ev(9032, "servo", 0.35, -0.2, "delivery hands sweep")
    ev(9120, "crate_pass", 0.3, -0.6, "a few crates on the narrow bridge", pan_to=0.5, group="narrow_crates")
    ev(9300, "crate_pass", 0.3, -0.6, "a few crates on the narrow bridge", pan_to=0.5, group="narrow_crates")
    for f in (9575, 9620, 9665):
        ev(f, "crate_pass", 0.3, -0.6, "crates flow on the bridge (prediction)", pan_to=0.6, group="prediction_crates")
    row([9840, 9852, 9864, 9876], "tile_click", 0.22, -0.4, 0.4, "request cards stream into the drawers")
    ev(9955, "impact_small", 0.45, -0.3, "'Half power' slams")
    ev(10072, "servo", 0.45, -0.5, "reading gauge needle drops (left lane)")
    for k, f in enumerate(range(10232, 10440, 24)):
        if abs(f - 10328) > 6:
            ev(f, "crate_land", 0.22, 0.25, "crates arrive every 24 frames (reading)", group="crate_rhythm_read")
    for f in range(10472, 10680, 48):
        ev(f, "crate_land", 0.2, 0.25, "crates keep arriving (writing): one token per row", group="crate_rhythm_write")
    ev(10633, "impact_small", 0.35, 0.5, "a 9th conversation bounces off the full rack")
    for f in (11170, 11230, 11290):
        ev(f, "crate_pass", 0.25, -0.5, "H100 lane crates", pan_to=0.5, group="lanes_crates")
    ev(11200, "crate_pass", 0.2, -0.5, "RTX lane: half the crates", pan_to=0.5, group="lanes_crates")
    ev(11752, "cam_swish", 0.3, -0.6, "door 1 swings ajar (left)", group="doors")
    ev(11804, "cam_swish", 0.3, 0.0, "door 2 swings ajar", group="doors")
    ev(11858, "cam_swish", 0.3, 0.6, "door 3 swings ajar (right)", group="doors")
    row([12100, 12118], "tile_seat", 0.3, 0.2, 0.3, "the queue steps forward one slot")
    for f in (12350, 12400):
        ev(f, "crate_pass", 0.3, -0.6, "crates stamped 'Ours' cross", pan_to=0.5, group="ours_crates")
    ev(12640, "data_chatter", 0.35, -0.6, "40 chips light in a wave", anchor="start", pan_to=0.6)
    row([13023 + 6 * i for i in range(6)], "tile_seat", 0.22, -0.4, 0.4, "earlier tokens drop note cards into the tray")
    for f in (13170, 13230, 13290):
        ev(f, "crate_pass", 0.3, -0.6, "crates carry note cards across", pan_to=0.6, group="note_crates")
    ev(13770, "crate_pass", 0.28, -0.6, "taller piles of notes", pan_to=0.6)
    ev(13940, "data_chatter", 0.35, 0.0, "28 chat windows streaming", anchor="start")
    for f in (14060, 14098, 14136):
        ev(f, "tile_seat", 0.3, -0.5, "three tiles drop into three bins at once (L)", group="bins")
        ev(f + 1, "tile_seat", 0.3, 0.5, "three tiles drop into three bins at once (R)", group="bins")
    for f in (15130, 15180, 15230, 15290):
        ev(f, "crate_pass", 0.25, -0.6, "crates cross; a piece flies to the answer strip", pan_to=0.6, group="lever_crates")
    row([15466 + 3 * i for i in range(6)], "tile_click", 0.2, -0.6, 0.0, "16-cell tray lights cell by cell", group="trays")
    ev(15514, "tile_seat", 0.3, 0.0, "8-bit tray", group="trays")
    ev(15539, "tile_seat", 0.3, 0.4, "4-bit tray", group="trays")
    ev(15623, "whoosh_fast", 0.3, -0.5, "smaller crates cross", pan_to=0.5, group="small_crates")
    ev(15653, "whoosh_fast", 0.28, -0.5, "smaller crates cross", pan_to=0.5, group="small_crates")
    row([16300, 16307, 16314, 16321], "tile_click", 0.35, -0.5, 0.4, "4 guess tiles race into the holders")
    ev(16547, "whoosh_fast", 0.35, 0.0, "the 3 good tiles fly up as a bundle")
    q2 = [at(22, "why"), at(22, "do"), at(22, "ai"), at(22, "answers"), at(22, "arrive"), at(22, "one"), at(22, "piece"), at(22, "at"),
          at(22, "a"), at(22, "time")]
    row(q2[:5], "tile_click", 0.45, -0.55, 0.55, "question tiles snap in again, row 1 (word-synced)", group="close_tiles")
    row(q2[5:], "tile_click", 0.45, -0.55, 0.35, "question tiles snap in again, row 2 (word-synced)", group="close_tiles")
    ev(q2[-1] + 6, "tile_seat", 0.5, 0.55, "the '?' seats")
    ev(17830, "crate_pass", 0.55, -0.7, "the huge crate thunders across to the die", pan_to=0.5)
    ev(17918, "tile_seat", 0.55, -0.2, "11 tiles slam into the prompt at once")
    for i, f in enumerate(range(18060, 18270, 26)):
        ev(f, "crate_pass", 0.18, -0.6, "crates cross again and again (finale)", pan_to=0.6, group="finale_crates")

    # ---------------- transitions with no builder whoosh: from the picture -----------------------------------------------------
    trans = []
    fs_path = os.path.join(L.HERE, "work", "v4_framestats.json")
    if os.path.exists(fs_path):
        d = json.load(open(fs_path))
        sc = np.array(d["scene"])
        w = np.convolve(sc, np.ones(6), "same")
        peaks = [i for i in range(3, len(w) - 3) if w[i] == w[i - 3:i + 4].max() and w[i] > 0.30]
        builder = []
        for i in range(1, 10):
            builder += [(c["frame"], c["kind"]) for c in json.load(open(os.path.join(L.SECTIONS_DIR, f"S{i}.cues.json")))]
        mine = [e["frame"] for e in EV] + [o["frame"] for o in OV]
        for p in peaks:
            if any(abs(f - p) <= 9 for f, _ in builder) or any(abs(f - p) <= 4 for f in mine):
                continue
            flash = bool(np.max(np.abs(np.diff(np.array(d["yavg"][max(0, p - 7):p + 4])))) > 18) if p > 7 else False
            trans.append({"peak": int(p), "score": round(float(w[p]), 2), "flash": flash, "dir": whip_dir(p)})
        trans_src = "work/v4_framestats.json (scene score, 6-frame window peaks > 0.30)"
    else:
        trans_src = "none (no picture stats)"

    # ---------------- ambience regions ------------------------------------------------------------------------------------------
    desk = [(146, 509), (591, 735), (1844, 1943), (1943, 2412), (4234, 4369), (4369, 4548), (4548, 4970), (11346, 11689), (11877, 12029),
            (12160, 12330), (13347, 13537), (14866, 15091), (16797, 17080), (17862, 18027), (18170, 18367)]
    dc = [(6736, 7109), (9692, 10050), (12029, 12160)]
    chip = [(862, 1018), (3436, 4234), (4968, 5082), (5214, 5945), (7612, 8054), (8274, 8479), (8549, 8814), (9072, 9511), (9552, 9692),
            (10200, 11023), (12330, 12823), (13141, 13347), (13754, 13853), (13932, 14344), (15061, 15465), (15600, 15750), (16036, 16804),
            (17050, 17862), (18027, 18170)]
    amb = []
    marks = sorted([(a, b, "desk") for a, b in desk] + [(a, b, "datacenter") for a, b in dc] + [(a, b, "chip") for a, b in chip])
    t = 0
    for a, b, k in marks:
        if a > t:
            amb.append({"from": t, "to": a, "bed": "stage"})
        a = max(a, t)
        if b > a:
            amb.append({"from": a, "to": b, "bed": k})
        t = max(t, b)
    if t < L.TOTAL_FRAMES:
        amb.append({"from": t, "to": L.TOTAL_FRAMES, "bed": "stage"})
    bridge_hum = [(7874, 8054), (8274, 8479), (8549, 8814), (9072, 9511), (9552, 9692), (10200, 11023), (12330, 12554), (13141, 13347),
                  (13754, 13853), (15061, 15465), (15600, 15750), (16036, 16804), (17682, 17862), (18045, 18200)]

    out = {
        "version": 2,
        "about": __doc__.strip().splitlines()[0],
        "conventions": {
            "frame": "absolute film frame at 30 fps; sample = frame * 1600",
            "anchor": "default = each palette file's own anchor (onset for hits and clicks, peak for whooshes and pass-bys, end for risers); "
                      "'start' = the file's first sample sits on the frame",
            "pan": "-1 left .. +1 right; pan_to makes it a sweep across the sound",
            "builder whooshes": "a builder whoosh cue marks the START of the whip; the whoosh starts there and peaks on the picture's transition "
                                "peak (found within +3..+12 frames), i.e. 6-10 frames later",
            "builder risers": "start on the cue and end exactly on the next hero cue (impact / sting / crate / swell within 200 frames)",
        },
        "overrides": OV,
        "events": sorted(EV, key=lambda e: e["frame"]),
        "transitions": {"source": trans_src, "items": trans},
        "ambience": {"regions": amb, "glass_hum": [{"from": a, "to": b} for a, b in bridge_hum],
                     "beds": {"desk": "ambience/amb_desk_night.wav", "datacenter": "ambience/amb_datacenter.wav", "chip": "ambience/amb_chip.wav",
                              "stage": "ambience/amb_stage.wav", "glass_hum": "palette_lib/glass_hum_1.wav"}},
        "silences": [{"from": 7862, "to": 7874, "note": "suck-out before the Bridge reveal (the voice pauses here too)"}],
        "whip_directions": {str(k): v for k, v in sorted(WHIPS.items())},
        "music_rides": {"about": "the music's arc: target gap (LU) of the music under the voice, interpolated between these frames; the mixer's "
                                 "closed loop still enforces >= 18.6 LU wherever the voice speaks",
                        "points": RIDES},
    }
    L.save_json(os.path.join(L.HERE, "cues_extra.json"), out)
    print("overrides", len(OV), "events", len(EV), "transitions", len(trans), "ambience regions", len(amb))


if __name__ == "__main__":
    build()
