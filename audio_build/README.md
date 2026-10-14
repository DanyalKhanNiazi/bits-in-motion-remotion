# Audio build for the five intro tests (Episode 01, "What Happens When You Press Power")

Everything the five 63-second intro tests need for sound: one locked narration stem, five music beds, five effect kits, and a mixer that turns a builder's `cues.json` into a finished, measured mix.

**Nobody has listened to any of this.** The agents that built it can't hear audio. Every choice was made from the Stage A notes, the owner's licence ruling and measurements, and every result below is a measurement. The owner should listen to all five mixes, starting with the Lands, the Lens and the button, before Stage D.

## 1. What is where

| Path | What it is |
|---|---|
| `../public/audio/voice_intro.wav` | The locked narration stem, identical for all five (48 kHz, 24-bit, stereo, exactly 63.000 s). |
| `music/styleN_bed.wav` | Music bed per style, mix-ready at unity gain (48 kHz, 24-bit, stereo, exactly 63.000 s). |
| `sfx/styleN/*.wav`, `sfx/styleN/kit.json` | Effect kit per style (48 kHz, 24-bit, stereo). `kit.json` holds each cue's source, processing, measurements and mix level, and the mixer reads its levels from it. |
| `scripts/mix.py` | The mixer. |
| `scripts/build_voice.py`, `build_music.py`, `build_sfx.py`, `build_all.py` | Rebuild the stem, the beds and the kits. `build_all.py` runs all three, then the five provisional mixes. |
| `scripts/common.py` | Shared helpers: decoding and writing through ffmpeg, a BS.1770-4 loudness meter, the true-peak limiter, filters and synthesis. |
| `scripts/scan_library.py`, `scripts/probe.py` | The licence scan of the effects library, and the probe used to measure candidates. |
| `src/voice/`, `src/music/`, `src/sfx/` | Copies of every source file used. The library and downloads were only read, never modified. |
| `cues_provisional/styleN.json` | Provisional cue lists taken from each `sfx_styleN.md` cue table. |
| `mixes/styleN_provisional_mix.wav`, `mixes/styleN_provisional_report.json` | The five test mixes and their measurement reports. |
| `work/` | Scan and build reports: `library_scan.json`, `voice_report.json`, `music_report.json` and `sfx_sources.json` (library path, copy and SHA-256 of each effect source). |

## 2. Running the mixer

Run it from `audio_build/scripts`:

```
python -I mix.py --style N --cues <cues.json> --out <wav> --report <json>
```

For example, for Style 3 once its builder has written `src/styles/style3/cues.json`:

```
python -I mix.py --style 3 --cues "../../src/styles/style3/cues.json" --out "../mixes/style3_mix.wav" --report "../mixes/style3_report.json"
```

There are three optional arguments: `--voice`, `--bed` and `--kit`. By default they point to the files above.

**Exit codes:**
- `0`: every measured value is in spec.
- `1`: a value is out of spec. The WAV and report are still written, and the failing check is printed.
- `2`: bad input, such as an unknown cue, a missing note, a malformed span or a file of the wrong length.
- `3`: unexpected error.

### The cue vocabulary (Part A, A7)

```json
{ "style": N, "cues": [
  {"cue": "button", "frame": 0},
  {"cue": "land", "frame": 59, "note": "A"},
  {"cue": "standby", "start": 1475, "end": 1817},
  {"cue": "lens_open", "frame": 191},
  {"cue": "lens_close", "frame": 331},
  {"cue": "lock", "frame": 1798},
  {"cue": "button", "frame": 1837}
]}
```

Every cue starts at `frame / 30` seconds. Each kit file is trimmed so its attack begins about 1 ms in. Measured onsets in the final mixes fall 0.1 to 2.6 ms after the frame time.

| Cue | What the mixer does |
|---|---|
| `button` | Plays the press at the frame and the release 140–200 ms later; the delay is set per style in `kit.json`. Part A allows only f0 and f1837; any other frame is mixed with a warning. f0 is the flash-forward press and plays quieter. In Style 2 it is also muffled (separate `_f0` files). |
| `land` | Needs `note`: A, C, D, E or G. It plays `land_<note>.wav`; the S06 chain steps A-C-D-E-G. |
| `standby` | Needs `start` and `end` frames. It loops `standby_loop.wav` from start to end, with 0.4 s fades inside the span, at −26 dB relative to the typical narration peak (the spec allows at most −24). A warning is printed if the span runs outside S10–S11. |
| `lock` | A single file that already holds the double tick, 40 ms apart. |
| `lens_open`, `lens_close`, `energize`, `dive`, `alert` | Single hits at the frame. |

- An optional `"gain_db"` on any cue (−20 to +3) trims that cue. Unknown keys are ignored.
- **Levels.** Each cue's peak is set relative to the narration's local peak, the highest sample within ±1 s of the cue, using `level_db` from `kit.json`. The narration's peaks sit at its limiter ceiling (about −1.7 dBFS) almost everywhere, so a Land at −12 dB peaks at about −13.7 dBFS.

### What the mixer checks (exit 1 if any fails)

| Check | Spec |
|---|---|
| Integrated loudness, ffmpeg `ebur128` on the written file | −14 ± 0.5 LUFS |
| True peak, ffmpeg `ebur128 peak=true` | ≤ −1.0 dBTP |
| Music under the voice, per sentence S01–S12 (BS.1770 gated, on the stems) | ≥ 18 LU in every sentence |
| Music under the voice, over all speech (0–61.66 s) | ≥ 18 LU |
| Loudest cue peak | below the narration's typical speech peak (the median of 1 s window peaks) |
| Standby peak | ≤ −24 dB relative to the narration peak |
| File | 48 kHz, 24-bit PCM, stereo, exactly 3,024,000 samples |

LRA is measured and reported. The spec sets no limit for it, so it is not gated.

**The report JSON also lists:**
- every placed cue: time, file, gain, peak, peak relative to the local narration peak, and an audibility indicator ("loudness_rel_voice_400ms_LU");
- the final limiter's largest gain reduction;
- the per-sentence music gaps.

**The mix chain:** voice stem + bed (unity gain) + cue bus. A look-ahead true-peak safety limiter follows: 4× oversampled detection, threshold −1.15 dB on the 4× peak so the measured result is ≤ −1.0 dBTP, 1.5 ms attack, 80 ms release. The output is written as 24-bit with no dither.

## 3. The narration stem (`public/audio/voice_intro.wav`)

- **Source:** `F:/YouTube Channels/Bits in Motion/Videos/01 What Happens When You Press Power/Voiceover/Full Voiceover.mp3`.
  - Copied to `src/voice/`.
  - SHA-256 `61b25ffec42cbe4dcd093a9cfdf6fa32e01c4d7b6a50c4475d68d91d66692f6c`.
- **Processing, the same for all five styles:**
  1. Decode 0–62.000 s, resampled to 48 kHz stereo.
  2. A 20 ms half-cosine fade-out ending at 62.000 s.
  3. **One fixed gain of +7.865 dB.**
  4. A look-ahead true-peak limiter at −1.5 dBTP: 4× oversampled detection, threshold −1.65 dB, 1.5 ms attack, 80 ms release.
  5. Padded with digital silence to exactly 63.000 s.
  6. No EQ and no compression.
- **The limiter's work:** it trims the loudest peaks by up to 4.3 dB, as section 6.4 of the Creative Direction predicted (about 4 dB), and acts on 30% of samples.
- **Measurements:**
  - raw excerpt: −21.8 LUFS, −5.2 dBTP;
  - stem: **−14.3 LUFS integrated, −1.6 dBTP, LRA 2.0 LU** (ffmpeg `ebur128`);
  - speech starts at 0.103 s;
  - last non-zero sample at 61.9996 s.

## 4. Music beds (`music/styleN_bed.wav`)

**Common to all five:**
- The source is decoded to float and attenuated 6 dB before any processing, because several masters are hot.
- The brand's 1–4 kHz dip is applied: −3.5 dB, centred on 2 kHz, two octaves wide.
- A slow **level rider** follows: 1 s loudness windows, 1.5 s smoothing, at most ±4 dB. It keeps the bed steady under speech and is held after 61.66 s.
- A short fade-in.
- A gentle rise after the speech ends (61.66 → 62.40 s).
- A clean fade-out ending at 63.000 s.
- The static level is then set so that **the loudest-music sentence sits 19.5 LU under the narration**, a 1.5 LU margin over the 18 LU rule. No side-chain ducking is used, so the bed stays steady as section 6.7 asks.

| Style | Track (copy in `src/music/`) | Processing | Bed level | Gap: min sentence / all speech | Rider range | Bands below 300 Hz / 300 Hz–1 kHz / 1–4 kHz / above 4 kHz |
|---|---|---|---|---|---|---|
| 1 | "Engineering Graphics", bearstockmusic | **4-bar loop** of the marimba+bass block. Period 8.7272 s and seam point 20.05 s found by correlation (seam spectral match 0.995, level steps ≤ 0.3 dB); 30 ms cross-fades. **rubberband pitch ×0.8909 (−2 st, D major → C major, tempo kept at 110 BPM)**; measured 293.3 → 261.2 Hz. 0.25 s fade-in, +3 dB rise, 0.30 s fade-out. | −34.4 LUFS | 19.5 / 20.1 LU | −1.3 to +1.4 dB | 92.6 / 5.6 / 1.6 / 0.1 % |
| 2 | "Enter the realm – no Piano", SamuelFJohanns | Starts at **track 7.00 s**, so the track's own swell lands on the press. The rider tames the +4–5 dB bump at intro 57.1–57.5 s and is released at 61.66 s so the natural swell carries the hand-off; +1.5 dB rise, 0.30 s fade-out. | −35.3 LUFS | 19.5 / 21.2 LU | ±4.0 dB | 76.1 / 23.0 / 0.8 / 0.0 % |
| 3 | "Minimal Idm Ambient Works – Loop", Musinova | Starts at 0.00 s. **High-pass 120 Hz, 24 dB/oct**, which removes the A1 sub so the 55 Hz standby tone is the only low tone. A 50 ms anti-click fade-in (the notes say no fade-in), +2 dB rise, a 2-frame (67 ms) fade-out. | −34.3 LUFS | 19.5 / 20.0 LU | −2.3 to +3.9 dB | 34.6 / 54.8 / 8.3 / 2.3 % |
| 4 | "Stay the Course", Kevin MacLeod | Starts at 0.00 s (the pulse falls on whole seconds, every 30 frames). From 61.66 s, a 0.30 s cross-fade into a **synthesized held sine on the bed's root C2 (65.4 Hz, + C3 at −12 dB)**, matched to the bed's low band, as `music_style4.md` suggests for the press; +3 dB rise, 0.30 s fade-out. | −34.3 LUFS | 19.5 / 19.9 LU | −1.5 to +2.5 dB | 97.7 / 2.1 / 0.2 / 0.0 % |
| 5 | "Soft Vibraphone Ambient Loop_012", VelvetKeys | Starts at **1.33 s**, so its re-attack lands on the press (f1838). High-pass 85 Hz, low-pass 2 kHz; +3 dB rise, 0.30 s fade-out. | −34.5 LUFS | 19.5 / 20.3 LU | −2.8 to +4.0 dB | 47.1 / 52.3 / 0.6 / 0.0 % |

**Not done:** two optional bed events in the Stage A notes were left out:
- Style 3's f860 A1 root and f1830 "pulse thins" stem crossfade. The stem was never downloaded.
- Style 2's sub pulse and air layer.

These are musical additions for the owner to decide after listening.

## 5. Effect kits (`sfx/styleN/`)

- **Trims:** every cue is trimmed so its attack starts about 1 ms into the file.
- **Fades:** each is faded (0.3–0.5 ms in for transients; the fade-outs are listed below).
- **Peaks:** each is peak-normalised to −1.0 dBFS. The mixer sets the playback level.
- **Pitch:** pitched notes were checked by FFT; every Land is within 0.2 Hz of its target.
- **Paths:** all library paths below are under `D:/Assets/01 Audio/Sound Effects/`.
- **Levels:** a "Level" is the cue's peak relative to the narration's local peak.

### Style 1, Bench Notebook (wood and paper); release 180 ms after the press

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press / button_release | `06 UI, Clicks & Camera/Mouse Click 1.wav` (a real micro-switch) | Press: cut 0.105–0.150 s. Release: cut 0.200–0.245 s. 0.5 ms in, 10 ms out. | Press −15 dB at f1837, −18 dB at f0; release 3 dB under |
| land_A, C, D, E, G | **Synthesized** marimba-like tone, plus a real wood attack from `09 Mechanical & Objects/Wood_39.wav` | A4 440, C5 523.3, D5 587.3, E5 659.3 and G5 784.0 Hz. Partials 1× (τ 28 ms), 4× −23 dB, 10× −44 dB. Wood_39's first knock is varispeeded to each note and sits 10 dB under as the attack. 85 ms, 25 ms cos² fade. 100% of energy in 300 Hz–1 kHz. | −12 dB |
| lens_open / lens_close | **Synthesized** paper-slide breath | Noise with slow grain, 120 Hz–1 kHz (24 dB/oct both sides), 220 ms, 140 ms rise, 60 ms fall. Close = the exact reverse. 7.6% in 1–4 kHz. | −13 / −14 dB |
| lock | `09 Mechanical & Objects/Wood_38.wav` | First knock (0.172–0.190 s) as a dry tap at 0 and +40 ms; the second copy −2 dB, +50 cents. 60 ms. | −15 dB |
| standby_loop | **Synthesized** | A1 55 Hz drone with partials 2× −2, 3× −20, 4× −7, 8× −14 dB (the measured profile of the excluded Ocular drone), slow bow motion, faint air. HP 40 Hz, LP 1.2 kHz. **Exactly periodic 20.0 s loop.** | −26 dB |
| energize | **Synthesized** | A2/E3/A3 swell, 400 ms, LP 1 kHz. | −11 dB |
| dive | **Synthesized** | Noise breath with a rising low-pass from 400 Hz to 3 kHz, 500 ms. | −11 dB |
| alert | `09 Mechanical & Objects/door knock hard.mp3` | Knock 1 (0–85 ms) at 0; knock 2 (190–275 ms) at −300 cents and +110 ms. HP 50 Hz, LP 1.5 kHz. | −9 dB |

### Style 2, Night Signal (low and airy); release 160 ms after the press

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press / button_release | `06 UI, Clicks & Camera/rm click (1).wav` | Press: cut 0.040–0.090 s, a bright click. Release: cut 0.286–0.336 s, a low thock (61% below 300 Hz). | Press −10 dB at f1837 (crisp); release 3 dB under |
| button_press_f0 / button_release_f0 | The same file | The same cuts, low-passed at 1.2 kHz, 24 dB/oct: the muffled flash-forward press. | −20 / −23 dB |
| land_A, C, D, E, G | **Synthesized** soft sine pluck | **Body at A4–G5 (440–784 Hz), inside 300 Hz–1 kHz, per the owner's ruling.** Sub-octave −9 dB for weight, 2× −16 dB, 4 ms attack, τ 45 ms, LP 1.6 kHz (muffled), 110 ms. | −12 dB |
| lens_open / lens_close | `02 Whooshes & Transitions/Reverse_FX_High_02.wav` (the notes' alternate) | 0.700–0.930 s, the rise into its first peak. HP 60 Hz, LP 6 kHz, 150 ms rise, 25 ms fall. Close = the reverse. | −13 dB |
| lock | `06 UI, Clicks & Camera/Keyboard one key press.wav` | The key's two release ticks (86.5–98.5 ms and 100.5–112.5 ms), re-spaced to 40 ms, LP 7 kHz. 66% of its energy is in 1–4 kHz, but it lasts only 60 ms. | −15 dB |
| standby_loop | **Synthesized** | A1 55 Hz + A2 −4 dB + E3 −24 dB, LP 250 Hz, exactly periodic 20.0 s. | −26 dB |
| energize | **Synthesized** | A1/A2/E3 swell, 450 ms, LP 400 Hz. | −11 dB |
| dive | `02 Whooshes & Transitions/Reverse_FX_High_02.wav` | 0.420–0.930 s crescendo, HP 60 Hz, LP 6 kHz. | −11 dB |
| alert | **Synthesized** | Two dull sine thunks, C3 then A2, 100 ms apart, LP 600 Hz. | −9 dB |

### Style 3, Living Schematic (dry synthesized ticks); release 150 ms after the press

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press / button_release | `06 UI, Clicks & Camera/rm click (3).wav` | Press: cut 0.110–0.150 s. Release: cut 0.325–0.365 s, its own and naturally softer. | Press −12 dB at f1837, −16 dB at f0; release 4 dB under |
| land_A, C, D, E, G | **Synthesized** dry tick | A 2 ms noise click above 4 kHz (−8 dB) plus a sine body at **A4–G5 (440–784 Hz), inside 300 Hz–1 kHz**. τ 16 ms, 60 ms total, no room. | −12 dB |
| lens_open / lens_close | `06 UI, Clicks & Camera/Shutter.wav` | Very short shutter, 0.050–0.270 s. HP 300 Hz, −4 dB at 2.5 kHz, 50 ms swell-in, 60 ms fall. Close = the reverse. Its energy is mostly in 1–4 kHz (43%) and above 4 kHz (56%); it sits in the f191 and f331 pauses. | −13 dB |
| lock | **Synthesized** | Two ticks 40 ms apart, each a 2 ms click above 4 kHz plus a 3 ms 220 Hz body. | −15 dB |
| standby_loop | **Synthesized** 55.00 Hz sine + 110 Hz at −14 dB | Exactly periodic 20.0 s. This is the spec's own tone. See section 6 for why `Drones_01.wav` was dropped. | −26 dB |
| energize | `05 Glitch & Digital/Analog Synth Hit Deep.wav` | Sustain 0.50–0.98 s, varispeed to A1 (51.9 → 55 Hz), LP 400 Hz, 250 ms rise, 150 ms fall. | −11 dB |
| dive | **Synthesized** | Band-passed noise rising from 1.5–4 kHz to 5–12 kHz over 500 ms. | −11 dB |
| alert | **Synthesized** | Two dry low blips, E3 then C3, 100 ms apart, LP 800 Hz. | −9 dB |

### Style 4, Signal Score (clean sine and square); release 200 ms after the press

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press / button_release | `06 UI, Clicks & Camera/mouse click.wav` | Press: cut 0.190–0.250 s, a low thock plus a click (62% below 300 Hz). Release: the switch's own faint release, 0.265–0.300 s, HP 60 Hz. | Press −8 dB at f1837 (the notes' "full level", capped below the narration), −18 dB at f0; release 9 dB under |
| land_A, C, D, E, G | **Synthesized** | Sine plus soft-square partials (3× −14 dB, 5× −24 dB) at **A3 220, C4 261.6, D4 293.7, E4 329.6 and G4 392.0 Hz** (the owner's 220–392 Hz register). 2 ms attack, τ 35 ms, 85 ms. | −12 dB |
| lens_open / lens_close | **Synthesized** | Rising sine glide A3 → E4 over 220 ms, 3× partial −18 dB. Close = the falling reverse. | −13 dB |
| lock | `06 UI, Clicks & Camera/Mouse Click 1.wav` (the Stage A primary; clean, kept) | Its two clicks re-spaced to exactly 40 ms. | −15 dB |
| standby_loop | `11 Cinematic & Drones/Bass_Atmospheric_09.wav` (the Stage A primary; clean, kept) | 0.05–20.60 s summed to mono, varispeed ×0.9214 (59.69 → 55.0 Hz), band-pass 46–64 Hz then 53.6–56.4 Hz. Looped with a 1 s cross-fade aligned by correlation (50 ms level range 0.8 dB). 20.01 s. | −26 dB |
| energize | `11 Cinematic & Drones/Bass_Atmospheric_09.wav` | Varispeed ×1.843 (→ 110 Hz), band 80–200 Hz, 400 ms swell. | −11 dB |
| dive | **Synthesized** | Exponential sine sweep 110 → 440 Hz over 500 ms. | −11 dB |
| alert | **Synthesized** | Two low square-ish pulses on A2, 100 ms apart, LP 1 kHz. | −9 dB |

### Style 5, Live Panels (celesta and vibraphone); release 140 ms after the press

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press / button_release | `06 UI, Clicks & Camera/mouse-click-153941.mp3` | Press: cut 0.068–0.115 s. Release: cut 0.158–0.205 s. | Press −12 dB at f1837, −16 dB at f0; release 2.7 dB under |
| land_A, C, D, E, G | **Synthesized soft celesta-like tone (by design)** | A4–G5 (440–784 Hz). 1× (τ 160 ms), 2× −14, 3× −26, 4× −22 dB, 3 ms attack, 300 ms. | −14 dB (between the notes' −16 preview and −12 now levels) |
| lens_open / lens_close | **Synthesized** | A bowed-vibraphone-like swell on C4 (+4× −24 dB): 150 ms rise, 30 ms hold, 70 ms release. Close = the reverse. Style 5's intro uses no close. | −14 dB |
| lock | **Synthesized** | Two dry celesta ticks on E6 (1318.5 Hz), 40 ms apart, HP 700 Hz. Like the Stage A pick, its energy is in 1–4 kHz (99%), but each tick rings only about 20 ms. | −15 dB |
| standby_loop | **Synthesized** | Held A2 110 Hz + octave −11 dB, a slow ±1 dB swell, LP 250 Hz, exactly periodic 20.0 s. | −26 dB |
| energize | **Synthesized** | A1/A2/E3 swell, 450 ms, LP 400 Hz. | −11 dB |
| dive | **Synthesized** | A glide from C4 to C5 over 520 ms that peaks at its end. | −11 dB |
| alert | **Synthesized** | Two dull C3 thumps, 105 ms apart, LP 600 Hz. | −9 dB |

`sfx/styleN/kit.json` holds the full per-file processing strings and these measurements for each file:
- duration;
- peak;
- onset;
- band shares;
- f0 for Lands;
- loop metrics for the standby loops.

## 6. What the licence ruling replaced, and why

**The ruling (owner, 9 October 2026):** no file from Ocular Sounds, BOOM Library or The Chris Alan 8-Bit SFX. Also avoided: Muctau, CSFX/CSFX-2, files starting "AM - ", and anything Epidemic.

**How excluded files were found.** `scripts/scan_library.py` read the filename, folder and embedded metadata of all 20,443 library files with ffprobe:
- 7,591 were excluded by name;
- 7,203 were flagged by metadata tag.

The scan found three families with no tell-tale filename:
- **Muctau.** 967 files tagged `album_artist=Muctau.Com`, including every snake_case UI file the Stage A notes picked (`click_marimba_1`, `click_pop_up_8`, `keyboard_cougar_enter`, `mouse_left_click_1/2`, `click_tick2_4`, `pencil_3`, `error_tonal*` and others).
- **"Delta Leaks x Editing Lair".** These carry the leak group's discord link: `Interface_*`, `UI_*`, `Denied_*` and `8Bit_Retro_*`.
- **"SFX Producer".** These are Epidemic Sound files.

The same caution was applied to two more sources, as commercial packs of unknown licence:
- `ALSFX_*` files;
- the Epic Stock Media `beep.wav`.

`build_sfx.py` checks every source against the scan and stops if one is flagged.

| Style · cue | Stage A pick (and alternate) | Why it is out | Replacement |
|---|---|---|---|
| 1 · button | `mouse_left_click_1` (alternate `click_plastic_5`) | Muctau | `Mouse Click 1.wav`, re-measured: press and release 94 ms apart, 98.5% above 4 kHz |
| 1 · land | `click_marimba_1` (alternate `Wood_39`) | Muctau | Synthesized marimba, with the alternate's wood knock as its attack |
| 1 · lens | Ocular "Paper Drag" (alternate `AM - PAPER WOOSH`) | Ocular; "AM -" | Synthesized breath. The clean paper files (`Paper Flip 01/02`, `paper1–3`, `Paper Crumple 0x`) were measured: they are erratic flips and crumples with 30–80% of their energy in 1–4 kHz |
| 1 · lock | `pencil_3` (alternate `click_23`) | Muctau | `Wood_38.wav` tap, doubled |
| 1 · standby, energize, dive | Ocular drones and whoosh | Ocular | Synthesized |
| 1 · alert | `ALSFX_Foley_Knock on wooden door_11` | ALSFX pack of unknown licence | The notes' alternate, `door knock hard.mp3`, re-measured |
| 2 · button | `keyboard_cougar_enter` (alternate `mouse_left_click_1`) | Muctau | `rm click (1).wav` |
| 2 · land | `click_pop_up_8` + `CSFX-2_Select_056` air (alternate `JUG POP UP (1).mp3`) | Muctau; CSFX-2. The alternate's 189 Hz body also breaks the owner's 300 Hz–1 kHz rule | Synthesized pluck at 440–784 Hz. The air layer was dropped: every intro Land is muffled |
| 2 · lens, dive | Ocular "Air Pump" | Ocular | The alternate, `Reverse_FX_High_02.wav` |
| 2 · lock | `keyboard_macbook_enter` (alternate `keyboard_logitech_spacebar`) | Muctau | `Keyboard one key press.wav` release ticks |
| 2 · standby, energize | Ocular drone and air pump | Ocular | Synthesized |
| 2 · alert | `error_tonal_3` | Muctau | Synthesized |
| 3 · button | `click_plastic_3` (alternate `mouse_left_click_1`) | Muctau | `rm click (3).wav` |
| 3 · land | Chris Alan "Click Deep Tonal 3" + `click_digital_9` | Chris Alan; Muctau | Synthesized dry tick, body at 440–784 Hz |
| 3 · lens | Ocular `COMCam_Very Short Shutter 3` | Ocular | `Shutter.wav` |
| 3 · lock | `click_digital_9` (alternate `AM - SCI FI CLICK 6`) | Muctau; "AM -" | Synthesized double tick |
| 3 · standby | `Drones_01.wav` (clean) | **Not a licence issue.** Rendered and measured: after the shift to 55 Hz it beats at about 1.8 Hz with 10–12 dB level swings, against a "steady 55 Hz sine" spec | Synthesized 55 Hz sine, the notes' own fallback |
| 3 · dive, alert | Ocular "Air Pressure"; `Denied_71` | Ocular; Delta Leaks | Synthesized |
| 4 · button | `keyboard_cougar_enter` (alternate `mouse_left_click_1`) | Muctau | `mouse click.wav` |
| 4 · land | `click_pop_up_8` (alternate `error_tonal3_1`; raised-register Chris Alan) | Muctau; Chris Alan | Synthesized at 220–392 Hz |
| 4 · lens, dive | `8Bit_Retro_034` (alternate `beep.wav`) | Delta Leaks; Epic Stock Media | Synthesized glide and sweep |
| 4 · alert | `error_tonal_buzz3_3` | Muctau | Synthesized |
| 5 · button | `mouse_left_click_2` (alternate `mouse_right_click_2`) | Muctau | `mouse-click-153941.mp3` |
| 5 · land | `marimba_notification_2` (alternate `click_marimba_2`) | Muctau | Synthesized celesta-like tone, the owner's design |
| 5 · lens, dive | `Interface_Neutral_039`, BOOM `MAGShim_*` | Delta Leaks; BOOM | Synthesized |
| 5 · lock | `click_tick2_4` (alternate `click_tick2_2`) | Muctau | Synthesized celesta ticks |
| 5 · standby, energize | Ocular drones | Ocular | Synthesized |
| 5 · alert | `Interface_Denied_023` (alternate `UI_Denied_71`) | Delta Leaks | Synthesized |

**Kept from Stage A:**
- Style 4: lock `Mouse Click 1.wav`, standby and energize `Bass_Atmospheric_09.wav`.
- Style 3: energize `Analog Synth Hit Deep.wav`.

**Provenance of the plain-named replacements.** They carry no pack tag. Their origin is unknown, as the owner accepted for plain-named library files. `mouse-click-153941.mp3` follows Pixabay's download naming, but that is not verified.

## 7. Provisional mixes: measurements

The cue lists are `cues_provisional/styleN.json`, taken from each `sfx_styleN.md` cue table:
- buttons at f0 and f1837;
- Lands A at f59 and f498, plus the S06 chain A-C-D-E-G at f748, f781, f808, f832 and f860;
- each style's Lens frames;
- standby f1475–f1817;
- lock f1798.

| Style | Integrated (ffmpeg) | True peak | LRA | Music gap, min sentence | Music gap, all speech | Loudest cue peak | Final limiter max reduction | Length | Result |
|---|---|---|---|---|---|---|---|---|---|
| 1 | −14.3 LUFS | −1.2 dBTP | 2.0 LU | 19.5 LU | 20.1 LU | −13.7 dBFS | 0.02 dB | 3,024,000 samples | PASS |
| 2 | −14.3 LUFS | −1.2 dBTP | 2.0 LU | 19.5 LU | 21.2 LU | −11.7 dBFS | 0.00 dB | 3,024,000 samples | PASS |
| 3 | −14.3 LUFS | −1.2 dBTP | 2.0 LU | 19.5 LU | 20.0 LU | −13.7 dBFS | 0.22 dB | 3,024,000 samples | PASS |
| 4 | −14.2 LUFS | −1.2 dBTP | 2.0 LU | 19.5 LU | 19.9 LU | −9.7 dBFS | 0.12 dB | 3,024,000 samples | PASS |
| 5 | −14.3 LUFS | −1.1 dBTP | 2.0 LU | 19.5 LU | 20.3 LU | −13.7 dBFS | 0.51 dB | 3,024,000 samples | PASS |

- **Narration's typical speech peak:** −1.7 dBFS. Every cue peak sits at least 8 dB below it.
- **Spread:** the five mixes fall within 0.1 LU of each other.
- **Timing:** the cue bus was recovered from each final file (mix − voice − bed). Each cue's audio begins at its frame time; the measured attacks fall 0.1–2.6 ms later.
- **Every cue type through the mixer:** a separate test mixed button, energize, dive, alert, lens open and close, land, standby and lock for each style, and all five passed.
- **Failure paths:** an unknown cue returned exit 2, and a bed raised 8 dB returned exit 1 with the two music-gap checks named.

## 8. What was checked, and what was not

**Measured:**
- loudness, true peak and LRA (ffmpeg `ebur128`);
- per-sentence music gaps (BS.1770-4 in numpy; it matches ffmpeg within 0.05 LU on the stem);
- peaks, onsets, pitch (FFT), band shares and loop continuity;
- file format and length (ffprobe).

**Seen:** one spectrogram image of the Style 2 S06 region, which was not very informative under speech.

**Not done: listening.** Nobody can hear these files. Open questions only the owner can settle:
- whether the synthesized Lands sound musical rather than like UI beeps (Style 1's marimba, Style 5's celesta);
- whether the Style 1 paper breath reads as paper;
- whether the Style 2 and Style 5 locks (energy in 1–4 kHz) compete with "like" at f1798;
- whether Style 4's −8 dB press is too prominent;
- whether the pitched Style 1 marimba loop sounds natural (rubberband, quality mode);
- how the Style 4 hand-off into the held C2 sine sounds.

**Audibility indicator (in each report).** For each cue, its loudness over its first 400 ms is compared with the narration's:
- Lands: 7–21 LU under the voice (Style 5's longer celesta notes read loudest);
- short clicks: 19–33 LU under.

These are subordinate by design. Whether the Lands are "clearly audible" on a phone needs a listen.

**Two small departures:**
- **Style 5 limiter.** The final safety limiter takes up to 0.5 dB off a few Style 5 peaks, where a 300 ms celesta Land overlaps a narration peak. Elsewhere it is idle or under 0.25 dB.
- **Overall loudness.** The mixes land at −14.2 to −14.3 LUFS, because the voice was set to −14.3 as instructed. They are inside the ±0.5 LU window, but slightly under −14.0.

## 9. Style 6, Signal Atlas (added 10 October 2026)

Style 6 is the hybrid of 02 Night Signal, 03 Living Schematic and 05 Live Panels (`docs/style6/STYLE_BIBLE.md`). Its sound grammar is §12 of the bible: sound marks causes, not edits, and the timbre is "glass pixel". **Nobody has listened to it.** Every choice below comes from the bible and from measurements.

**Running it:**

```
python -I mix.py --style 6 --cues "../../src/styles/style6/cues.json" --out "../mixes/style6_mix.wav" --report "../mixes/style6_report.json"
```

- `build_sfx.py 6` rebuilds the kit and `build_music.py 6` rebuilds the bed. `build_all.py` now builds and mixes all six styles.
- **Mixer changes, backward compatible:**
  - `--style` accepts 6;
  - a new cue, `surface`, is the reverse of `dive` (the bible's dive and surface pair, T7, long-form only);
  - a cue that a kit lacks now exits 2 with a message (before, it raised exit 3).
- **Unchanged:** the Style 1–5 provisional mixes re-rendered byte-identical for Styles 2 and 5, which were the two tested.
- **Previews:** previews and demonstrations carry `"gain_db": -4` in `cues.json`. These are the f0 press, the Lands at f59 and f498, and the S06 chain. The kit sets no separate f0 level.

### 9.1 The bed (`music/style6_bed.wav`)

**Pick:** "Minimal Idm Ambient Works – Loop" by Musinova (Pixabay), the Stage A Style 3 primary. All ten licence-verified candidates were measured over the intro window, and this track had the best measured fit to the bible's "dark ambient pulse, A minor / C major, no melody under speech":
- **Key:** its four strongest pitch classes are A, C, E and D, exactly the Land scale. It has the most in-scale energy of the pulse candidates: 81% on A-C-D-E-G and 88% on A minor.
- **Clashes:** only 15–22% of its energy is out of scale around the Land cues and the S06 chain. "Enter the realm" (Style 2) reaches 22–46% there, and "Stay the Course" 16–27%.
- **Steadiness:** its 1 s loudness varies by 1.6 dB (standard deviation), against 2.6 for "Enter the realm".
- **Pulse:** about 93 BPM, a real pulse. "Enter the realm" is beatless.
- **Licence:** clean. Pixabay, no Content ID registration, no AI label, no credit required. "Stay the Course" is registered with Content ID and needs a credit line.
- **Phones:** its mid-range ostinato carries on phone speakers. The pad candidates sit 72–98% below 300 Hz.

**Processing:**
1. Start at 0.00 s.
2. High-pass at 90 Hz, 24 dB/oct. Style 3 cut at 120 Hz; 90 Hz keeps the A2 weight for a darker bed but still removes the A1 sub, so the 55 Hz standby hum stays the only sub tone.
3. A −3 dB high shelf at 5 kHz.
4. The brand's 1–4 kHz dip (−3.5 dB).
5. The rider: −2.1 to +3.4 dB.
6. A 0.15 s fade-in.
7. A +2 dB rise from 61.66 to 62.40 s.
8. A 0.30 s fade-out ending at 63.000 s.

**Result:** −34.4 LUFS, true peak −17.9 dBTP. The loudest-music sentence sits 19.5 LU under the voice, and all speech 20.1 LU under. Band shares: 54 / 39 / 5.5 / 1.0 % (below 300 Hz / 300 Hz–1 kHz / 1–4 kHz / above 4 kHz).

**Not included:** the bible asks for no musical event at the press, so no hand-off tone was added. Pixabay also hosts the track's "Drumless Loop" stem, which would allow a thinner pulse from "Now" (f1830). It was not downloaded.

### 9.2 The kit (`sfx/style6/`); release 200 ms after the press

The release delay matches the picture: the cap releases six frames after the press frame.

| Cue | Source | Processing | Level |
|---|---|---|---|
| button_press (f1837) | `06 UI, Clicks & Camera/rm click (3).wav` + synthesized body | The Style 3 press cut (0.110–0.150 s) plus **a 90 Hz sine body** (2 ms attack, τ 22 ms), 5 dB under the click. The click still sets the peak; the body peaks 12 dB lower. 110 ms. | −9 dB (the loudest effect, 7.3 dB under the narration's typical peak) |
| button_press_f0 | the same file | The click alone, with no body (bible §12). The cue's `gain_db −4` makes it a preview. | −9 dB, −13 dB in use |
| button_release | the same file | The switch's own release, 0.325–0.365 s. | −13 dB (−17 at f0) |
| land_A, C, D, E, G | **Synthesized "glass-pixel" bell** | A sine at A4 440, C5 523.3, D5 587.3, E5 659.3 and G5 784.0 Hz (FFT-checked to 0.1 Hz). The attack adds the 3rd harmonic (−10 dB, τ 5 ms) and the 5th (−16 dB, τ 3 ms), a nod to sine-to-square. The fundamental has τ 28 ms, so the note is about 70 ms to −22 dB. 120 ms file. 100% of energy in 300 Hz–1 kHz. | −12 dB (−16 dB as previews) |
| lens_open / lens_close | **Synthesized** | Airy noise, 220 ms. The band-pass sweeps from 1.2–5 kHz to 2.8–10 kHz, with −3 dB at 2 kHz. A faint glass glide (E5 → A5) sits 16 dB under. 170 ms rise, 45 ms fall. Close = the exact reverse. | −16 dB (see below) |
| lock | **Synthesized** | Two dry ticks 40 ms apart. Each is a 1.5 ms click, high-passed at 3.5 kHz, plus an A5 880 Hz body (τ 4 ms). The second tick is −2 dB and +50 cents. 60 ms. 79% of energy in 300 Hz–1 kHz. | −13 dB (see below) |
| standby_loop | **Synthesized** | A1 55 Hz plus A2 110 Hz at −6 dB, both with a 0.25 Hz ±1 dB swell. Exactly periodic 20.0 s loop. The mixer's 0.4 s fades end it within 1 s of the span's end. | −26 dB |
| energize (long-form) | **Synthesized** | An A2/E3/A3/E4/A4 chord under a low-pass that opens from 350 Hz to 2.4 kHz over 450 ms: the fill-front rising from a hum into the phone band. | −11 dB |
| dive / **surface** (long-form) | **Synthesized** | The Lens air, 500 ms, rising from 0.6–2.5 kHz to 3–11 kHz, plus a glass octave glide A4 → A5 9 dB under. 420 ms rise, 50 ms fall. Surface = the exact reverse. | −11 dB |
| alert (long-form) | **Synthesized** | The Land's bell turned square: C5 then A4, a falling minor third, 100 ms apart. Each is 85 ms with the 3×, 5× and 7× harmonics held, then low-passed at 3 kHz. 86% of energy in 300 Hz–1 kHz. | −9 dB |

**Two levels depart from `tokens.ts` `SOUND.levelsDb`:**
- **Lens: −16, not −13.** Dense noise reads louder than a click or bell of the same peak. At −13, its 400 ms loudness was 3–4 LU above the Style 1 and 2 lenses, and louder than the Lands, which carry the information.
- **Lock: −13, not −15.** It lands on the stressed "like". At −15, its phone-band loudness (350 Hz–8 kHz) was 19 LU under that word.

If the engine's tokens should match, change the two values there.

### 9.3 Provisional mix (`mixes/style6_provisional_mix.wav`)

The cue list is `cues_provisional/style6.json`, copied from `docs/style6/STORYBOARD.md` §7: 15 cues, 17 placements.

| Integrated (ffmpeg) | True peak | LRA | Music gap, min sentence / all speech | Loudest cue peak | Final limiter max reduction | Length | Result |
|---|---|---|---|---|---|---|---|
| −14.3 LUFS | −1.2 dBTP | 1.9 LU | 19.5 / 20.1 LU | −10.7 dBFS (voice typical −1.7) | 0.2 dB | 3,024,000 samples, 48 kHz, 24-bit, stereo | PASS |

**Phone-band audibility (measured, not heard).** The narration and each cue were filtered to 350 Hz–8 kHz, and their loudness compared over the cue's first 100 ms:
- **Lands:** 0.9–8.1 LU under the narration in the same 100 ms.
- **Real press:** 0.6 LU under.
- **Lens cues:** they fall in narration pauses.

**Timing:** the cue bus was recovered from the final file (mix − voice − bed). Every click and bell begins 0.2–1.0 ms after its frame. The Lens swells reach −24 dB of their peak 10–36 ms in, by design.

**Also tested:** a test list with energize, dive, surface and alert passed on Style 6, and `surface` on Style 3 exits 2.

**For the owner to judge by ear:**
- whether the 70 ms bells read as musical glass rather than UI beeps;
- whether the IDM pulse feels "dark" enough after the 5 kHz shelf;
- whether the 90 Hz body makes the real press feel heavier on headphones.
