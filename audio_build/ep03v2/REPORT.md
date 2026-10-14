# Episode 03 sound design v2: measured self-check

**Nobody listened to this mix — not the author, not anyone else.** Every number below is a measurement of the rendered files, and every judgement is design reasoning backed by those numbers. The owner should audition it before release.

Files: `F:/YouTube Channels/Bits in Motion/Claude Work/Episode 03 - AI Answers/audio/ep03_mix_v2.wav`; measurements `measure_v2.json`; credits `CREDITS_v2.md`; figures `report_spectrograms.png`, `report_balance.png`.

## 1. Loudness and true peak

| metric | measured | target |
|---|---|---|
| integrated loudness (ffmpeg ebur128) | -14.1 LUFS | -14 ±0.5 |
| true peak (ffmpeg, 4x) / numpy 8x | -1.3 / -1.29 dBTP | ≤ -1.0 |
| loudness range (LRA) | 2.3 LU | 4-8 |
| LRA of the narration alone (fixed gain) | 2.34 LU | locked |
| narration alignment, mixed voice vs raw decode | lag 0 samples, r = 0.99432 | 0 |
| narration alignment, final mix vs raw decode | lag 0 samples, r = 0.977253 | 0 |
| narration processing | fixed gain +8.01 dB, true-peak limiter (max GR -5.25 dB, 2.31% of samples reduced by > 1 dB) | gain + limiter only |

**LRA is below target, and this is a property of the locked narration.** The voice is spoken almost without pause: only 34 pauses of 0.4 s or more in 612 s, none longer than about 0.5 s. Its own short-term loudness spans only 2.34 LU. Music must stay at least 18 LU under the voice wherever it speaks, so it cannot move a 3-second loudness window. Simulation on the mixed stems: raising every effect by +4 dB moves the LRA only from 2.29 to 2.39 LU, and +6 dB moves it to 2.62 LU, with effects then louder than the words they land on. Reaching 4 LU would mean riding the narration's level, which the brief forbids, or burying words under effects. The mix keeps its dynamics *inside* the music and effects instead: drop-outs before reveals, a silent suck-out before the Bridge, hits in the pauses, and swells in every pause of 0.4 s or more.

## 2. Music against the voice

| window class (speech share) | windows | min gap | 5th pct | median |
|---|---|---|---|---|
| 400ms (≥95% speech) | 5396 | 19.04 LU | 20.19 LU | 24.01 LU |
| 1s (≥90% speech) | 2489 | 19.29 LU | 21.01 LU | 23.69 LU |
| 3s (≥50% speech) | 2437 | 19.07 LU | 20.21 LU | 22.82 LU |
| integrated over all speech | | | | 23.99 LU |

Requirement: ≥ 18 LU wherever the voice speaks. Closed-loop trims: up to 13.9 dB on the loudest score moments. In the 34 pauses of 0.4 s or more, the music rises toward about 9.5 LU under the voice (an attack of 0.14 s after the voice stops, and back down 60 ms before it returns).

**Spectral balance (Welch long-term spectra, speech-only stretches):**

| band (Hz) | voice dB | music dB | voice − music | voice − (effects + ambience) |
|---|---|---|---|---|
| 31-63 | -67.3 | -57.7 | -9.6 | -21.0 |
| 63-125 | -44.9 | -54.5 | 9.6 | 2.3 |
| 125-250 | -33.1 | -58.9 | 25.7 | 20.7 |
| 250-500 | -30.2 | -59.7 | 29.5 | 26.0 |
| 500-1000 | -33.8 | -63.1 | 29.2 | 24.4 |
| 1000-2000 | -38.8 | -74.1 | 35.2 | 20.1 |
| 2000-4000 | -50.6 | -84.8 | 34.2 | 8.8 |
| 4000-8000 | -48.0 | -91.0 | 42.9 | 13.9 |
| 8000-16000 | -53.1 | -91.7 | 38.6 | 12.9 |

In the speech band (1-4 kHz) the voice sits **35.1 dB** above the music. That band holds 7% of the voice's energy but only 0.5% of the music's. The carve is dynamic: −7 dB at 2.5 kHz, −3 dB at 1.2 kHz and −2 dB at 4.2 kHz while the voice speaks, and −2 dB in pauses. The arrangement itself also stays out of the band: pads are low-passed at 0.45-2 kHz, the percussion lives below 260 Hz or above 6 kHz, and the stems carry a static −2 to −6 dB dip near 2.5 kHz. See `report_balance.png`.

## 3. Effects: density, stacking, sync

- Placed sounds: 479 sounds on 453 sync points. 165 are the builders' cues; the rest are extra foley, transitions and crate rhythms.
- **Density, raw sync points per minute:** 64, 56, 41, 41, 43, 47, 25, 44, 37, 42, 13 (mean 41.2).
- **Density, designed cues per minute** (a run of the same sound within 0.5 s, such as a tile run or a chop run, counts as one): 30, 28, 25, 30, 27, 30, 18, 32, 26, 31, 5 (mean 25.6; target about 10-20).
- **Stacking:** at most **3** sync points start within any 100 ms window (rule: ≤ 3). The stack rule dropped 0 extras.
- **Sync method:** every sound is placed sample-exactly. Its anchor sample sits on `frame × 1600`. The anchor is the onset for hits and clicks, the peak for whooshes and pass-bys, and the end for risers. Builder whoosh cues mark the *start* of the whip, which the picture confirms: scene-change energy begins at cue +1 and peaks at cue +6 to +8. So each whoosh starts on its cue and peaks on the detected cut. Risers start on their cue and end exactly on the next hero cue.

**The top visual events.** Here 'isolated' is the sync point measured in an isolated render of the event's main sound, and 'in mix' is the onset found in the effects stem around the cue (other sounds can bias that one).

| cue | event | picture shows it at | main sound | isolated Δ (frames) | in mix Δ (frames) | how measured |
|---|---|---|---|---|---|---|
| 532 | x200 slams in | 532 (text arrives, motion-blurred) / 534 crisp | impact_big_2 | 0.0 | 0.0 | onset detected in an isolated render |
| 991 | the 16 GB crate hits the math | 990-994 (crate merges into the die) | crate_land_1 | 1.86 | -0.9 | onset detected in an isolated render |
| 1027 | the monumental crate lands | 1026-1028 (landed, stamp crisp) | impact_big_3 | -0.57 | 1.95 | onset detected in an isolated render |
| 1097 | 'piece!' - the tiny tile | 1097-1100 (4-frame steps) | tile_seat_1 | 0.0 | 0.0 | onset detected in an isolated render |
| 1279 | the '?' tile seats (title) | see hero_sheet2 | tile_seat_1 | 0.0 | 0.0 | onset detected in an isolated render |
| 2094 | '11' lands hard | 2091-2094 | impact_big_1 | 0.18 | -1.17 | onset detected in an isolated render |
| 3600 | THE LOOP slams | 3600 | impact_big_1 | 0.18 | -1.17 | onset detected in an isolated render |
| 4917 | the rewind starts | see hero_sheet2 | tape_rewind_1 | 0.0 | -6.0 | file start (start-anchored) |
| 4959 | Enter key pressed | see hero_sheet2 | key_enter_1 | 0.0 | 0.0 | onset detected in an isolated render |
| 6300 | x1000 burst | see hero_sheet2 | impact_big_3 | -0.57 | -0.66 | onset detected in an isolated render |
| 7874 | THE BRIDGE reveal | 7874 (title arriving) / 7876 crisp | impact_big_3 | -0.57 | -0.0 | onset detected in an isolated render |
| 8886 | ~300x slams | 8886 (blurred) / 8889 crisp | impact_big_1 | 0.18 | -1.17 | onset detected in an isolated render |
| 10077 | payoff: reading slowed | 10079 (needle drops) | impact_big_2 | 0.0 | -0.03 | onset detected in an isolated render |
| 10731 | verdict: 'memory' | 10731 | impact_big_3 | -0.57 | -1.26 | onset detected in an isolated render |
| 14633 | x60 | see hero_sheet2 | impact_big_1 | 0.18 | -1.17 | onset detected in an isolated render |
| 15843 | 40% faster | see hero_sheet2 | impact_big_2 | 0.0 | -0.21 | onset detected in an isolated render |
| 16783 | the big model's own token | see hero_sheet2 | impact_big_3 | -0.57 | -0.66 | onset detected in an isolated render |
| 17850 | 'It's the trip' - crate hits the die | 17850-17852 | impact_big_2 | 0.0 | -0.03 | onset detected in an isolated render |

**The music's arc, as mixed** (integrated loudness of the music bus per section, relative to the voice in the same section). The score's own dynamics survive the ducking:

| section | frames | music − voice (LU) | music short-term range in the section (P10-P95, LU) |
|---|---|---|---|
| S1 cold open + title | 0-1582 | -22.2 | -39.1 to -34.6 |
| S2 tokens | 1582-2811 | -22.6 | -37.8 to -34.8 |
| S3 scoring, loop, streaming | 2811-4897 | -23.9 | -40.3 to -36.1 |
| S4 reading vs writing | 4897-6524 | -23.1 | -38.4 to -35.0 |
| S5 weights + THE BRIDGE | 6524-9507 | -23.3 | -39.2 to -35.3 |
| S6 experiment + bandwidth | 9507-11907 | -22.6 | -39.5 to -34.8 |
| S7 three waits | 11907-15091 | -23.0 | -38.9 to -34.6 |
| S8 tricks | 15091-17080 | -23.3 | -40.5 to -36.0 |
| S9 close + finale | 17080-18367 | -23.2 | -39.7 to -36.0 |

## 4. Hero moments (spectrograms)

`report_spectrograms.png` shows the full mix on a log-frequency axis, with cyan lines on the cue frames:

1. **Cold-open crate:** the build, the crate impact at 991, an 8-frame suck-out, then the monument at 1027 (broadband hit plus sub), and the high bell 'piece!' at 1097.
2. **Bridge reveal:** the riser energy climbs into 7862, then 12 frames of silence (only the voice's own pause), then the hit and the full theme at 7874.
3. **Finale:** theme bars 5-8 (Gm, Bb, C) build into the D-major resolve on the sign-off at 18295, then the music fades to digital silence at the last frame.

## 5. Score (rubric)

(score_judgement.json not written yet)

## 6. Rebuild

```
cd remotion/audio_build/ep03v2
python -I compose_score.py        # only if hero frames moved
python -I make_cues_extra.py      # after refreshing work/v4_framestats.json for a new picture (see below)
python -I build_mix_v2.py
python -I report_v2.py
```

Refresh the picture stats for v5 (writes per-frame scene score and luma). Then convert them with the snippet in `make_cues_extra.py`'s docstring, or keep the file name and re-run:

```
ffmpeg -i <picture.mp4> -an -vf "scale=192:108:flags=fast_bilinear,select='gte(scene\,0)',signalstats,metadata=mode=print:file=work/v4_framestats.txt" -f null -
```
