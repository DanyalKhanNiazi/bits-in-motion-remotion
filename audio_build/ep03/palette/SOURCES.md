# Episode 03 sound palette: sources and cue conventions

Built by `build_palette.py` (deterministic: seeded RNGs). 48 kHz stereo 24-bit WAVs; `palette.json` holds each file's anchor, duration, peak, loudness and spectrum.
Nobody listened: every judgement is by measurement (peaks, loudness, spectra, spectrogram plots).

## Licensing

- Everything is **synthesized in numpy** for this project (no credit needed) except `tick_1.wav`.
- `tick_1.wav` is the licence-checked Signal Atlas kit click `audio_build/sfx/style6/button_press_f0.wav` (sha256 `907c3ef0d015fd376eeb7f104048ceac3907611037fc9cf8d5d781c5da604c2d`), itself cut from the library file `D:/Assets/01 Audio/Sound Effects/06 UI, Clicks & Camera/rm click (3).wav` (plain name, no pack metadata, origin unknown, as recorded in `audio_build/CREDITS.md`).
- No other library audio is used. Nothing here is from Ocular Sounds, BOOM Library, The Chris Alan 8-Bit SFX, Muctau, CSFX, an `AM - ` file or Epidemic Sound, and no UCS-style name (DSGN..., COMCam_, MAGShim_, B00M) is involved. Library audio, where used, is only decoded; nothing from the library is executed.

## Cue timing conventions (for the section builders)

`build_mix.py` aligns each sound's **anchor** to the cue frame (`frame / 30` s). Put the cue where the event lands:

| kind | anchor (what sits on the cue frame) | length |
|---|---|---|
| `whoosh` | the peak of the move (about 35-55% into the sound, so it starts 0.15-0.6 s earlier) | 0.45-1.15 s |
| `tick`, `pop` | the onset | 40-110 ms |
| `impact`, `sting` | the onset (the hit / the first note) | 1.0-3.0 s |
| `riser` | the **arrival** (the end of the build); it starts 1.2 / 2.0 / 3.2 s before | 1.4-3.4 s |
| `swell` | the **peak** of the swell; it starts 1.5-2.8 s before | 2.2-4.0 s |
| `dial`, `rewind`, `type`, `glitch` | the start of the turn / scrub / typing / glitch | 0.2-1.6 s |
| `crate` | the **thump** (the crate lands); its heavy whoosh starts 0.34-0.52 s before | 0.95-1.3 s |

Variants rotate deterministically by the n-th cue of that kind in time order. Strength 0..1 sets the level (an 8-12 dB range, by kind).
Never more than 3 sounds start within 100 ms (the weakest are dropped).

## Files

| file | kind | how it was made |
|---|---|---|
| `whoosh_1.wav` | whoosh | pass-by whoosh: pink noise through a swept band-pass 250 Hz -> 2.0 kHz -> 700 Hz (Q 1.8) plus a 2x formant band and a half-frequency body layer, swept 3.5 -> 0.6 ms flanger, cosine rise 0.30 s then 0.16 s decay, L->R pan, faint 5.5 kHz air |
| `whoosh_2.wav` | whoosh | quick swish: band-pass 0.7 -> 3.6 -> 1.5 kHz (Q 2.0) plus formant band, 0.15 s rise, 0.09 s decay, R->L pan |
| `whoosh_3.wav` | whoosh | long heavy pass-by: band-pass 180 Hz -> 1.5 kHz -> 380 Hz (Q 1.4) with a strong half-frequency body layer and a light flanger, 0.5 s rise, wide pan |
| `whoosh_4.wav` | whoosh | inbound zoom whoosh: band-pass 300 Hz -> 3.2 kHz (Q 1.8), slow rise to 0.62 s then a quick 0.07 s fall, near-centre wide noise, light flanger |
| `tick_1.wav` | tick | licence-checked Signal Atlas kit click: audio_build/sfx/style6/button_press_f0.wav (derived from the library file '06 UI, Clicks & Camera/rm click (3).wav'); the main transient sits on the cue |
| `tick_2.wav` | tick | token-commit click: 0.5 ms band-limited noise burst (3.2-9 kHz) + 2.4 kHz ping (tau 3 ms) + 620 Hz knock + a faint release click at 22 ms |
| `tick_3.wav` | tick | token-commit click, as tick_2 with a 1.9 kHz ping (slightly rounder) |
| `tick_4.wav` | tick | token-commit click, as tick_2 with a 3.1 kHz ping (slightly brighter) |
| `pop_1.wav` | pop | bloop: sine chirp ending on 523 Hz (starts at 0.5x, 7 ms glide), decay tau 16 ms, 2nd harmonic -12 dB, faint HP air puff, low-passed 5 kHz (A-minor pentatonic pitch) |
| `pop_2.wav` | pop | bloop: sine chirp ending on 659 Hz (starts at 0.5x, 7 ms glide), decay tau 16 ms, 2nd harmonic -12 dB, faint HP air puff, low-passed 5 kHz (A-minor pentatonic pitch) |
| `pop_3.wav` | pop | bloop: sine chirp ending on 784 Hz (starts at 0.5x, 7 ms glide), decay tau 16 ms, 2nd harmonic -12 dB, faint HP air puff, low-passed 5 kHz (A-minor pentatonic pitch) |
| `pop_4.wav` | pop | bloop: sine chirp ending on 880 Hz (starts at 0.5x, 7 ms glide), decay tau 16 ms, 2nd harmonic -12 dB, faint HP air puff, low-passed 5 kHz (A-minor pentatonic pitch) |
| `impact_1.wav` | impact | heavy cinematic hit: 110 -> 46 Hz sine drop (tau 75 ms, decay 0.55 s), low-passed noise thump, 170/262 Hz body, 1.4 kHz mid slap, HP crack, soft saturation, dark synthetic hall (RT60 1.9 s) |
| `impact_2.wav` | impact | tight slam: 130 -> 68 Hz drop (decay 0.22 s), body 210/330 Hz, mid slap, crack, saturation, small room (RT60 0.55 s) |
| `impact_3.wav` | impact | glass-metal hit: sub drop 100 -> 52 Hz plus inharmonic bell partials on A4 (x1, 2.32, 4.18, 6.7), hall RT60 1.6 s |
| `riser_1.wav` | riser | 1.2 s riser: pink noise band-pass swept 250 Hz -> 9 kHz (Q 1 -> 4), detuned saw stack A3 -> E4 rising a fifth under an opening low-pass, sine sub 55 -> 110 Hz, accelerating tremolo 5 -> 18 Hz, t^2.6 build with the noise rising a further 3.5x in level; the anchor is the end of the build |
| `riser_2.wav` | riser | 2.0 s riser, same recipe |
| `riser_3.wav` | riser | 3.2 s riser, same recipe |
| `swell_1.wav` | swell | pad swell on Am(add9): 3 detuned band-limited saws per note, low-pass opening 500 Hz -> 3.2 kHz, sin^2.4 rise to the peak at 1.5 s, hall reverb RT60 1.8 s |
| `swell_2.wav` | swell | pad swell on Fmaj7(add9), peak at 2.1 s |
| `swell_3.wav` | swell | pad swell on Cmaj9, peak at 2.8 s, hall RT60 2.2 s |
| `dial_1.wav` | dial | ratcheting dial: 14 detent clicks slowing 24 -> 60 ms apart, falling hum 200 -> 110 Hz, 50 Hz-modulated electrical fizz; 0.7 s |
| `dial_2.wav` | dial | ratcheting dial, 1.0 s, 20 clicks, hum 220 -> 98 Hz |
| `dial_3.wav` | dial | ratcheting dial, 1.4 s, 26 clicks, hum 240 -> 90 Hz |
| `crate_1.wav` | crate | heavy whoosh-thump: low-passed pink noise swept 120 Hz -> 1 kHz building for 0.42 s, then a sine-drop thump 82 -> 46 Hz, wood-box modes (185/412/731 Hz and a 301-1480 Hz rattle), a noise grain, small room; anchor = the thump |
| `crate_2.wav` | crate | crate_1 recipe, shorter build (0.34 s), thump 92 -> 52 Hz, rattle pitched up |
| `crate_3.wav` | crate | crate_1 recipe, longer build (0.52 s), thump 74 -> 42 Hz, rattle pitched down |
| `sting_1.wav` | sting | glass-pixel chord stab A4 E5 A5 (additive bell partials 1, 2, 3.01, 4.17, 5.43; 28 ms strum), warm A2 root, 55 Hz sine boom, hall RT60 2.0 s |
| `sting_2.wav` | sting | chord stab C5 G5 C6 over a C3 root |
| `sting_3.wav` | sting | chord stab D5 A5 E6 over a D3 root (suspended, question-like) |
| `glitch_1.wav` | glitch | digital stutter: gated square/fifth/noise slices at stepped pitches (620-3300 Hz), 4-6 bit crush, 3-7x sample-and-hold decimation, repeated 1-3x, plus a 6 ms HF zzt; 0.24 s |
| `glitch_2.wav` | glitch | digital stutter: gated square/fifth/noise slices at stepped pitches (620-3300 Hz), 4-6 bit crush, 3-7x sample-and-hold decimation, repeated 1-3x, plus a 6 ms HF zzt; 0.32 s, shorter slices |
| `glitch_3.wav` | glitch | digital stutter: gated square/fifth/noise slices at stepped pitches (620-3300 Hz), 4-6 bit crush, 3-7x sample-and-hold decimation, repeated 1-3x, plus a 6 ms HF zzt; 0.18 s, longer slices |
| `rewind_1.wav` | rewind | tape rewind: sawtooth whine 150 Hz -> 1.2 kHz with wow/flutter (7.5 and 23 Hz), 150-240 Hz motor rumble, band-pass hiss, 38 Hz-modulated gear noise, 0.2 s spool-up, slow-down and clunk at the end; 0.9 s |
| `rewind_2.wav` | rewind | tape rewind: sawtooth whine 150 Hz -> 1.2 kHz with wow/flutter (7.5 and 23 Hz), 150-240 Hz motor rumble, band-pass hiss, 38 Hz-modulated gear noise, 0.2 s spool-up, slow-down and clunk at the end; 1.2 s |
| `rewind_3.wav` | rewind | tape rewind: sawtooth whine 150 Hz -> 1.2 kHz with wow/flutter (7.5 and 23 Hz), 150-240 Hz motor rumble, band-pass hiss, 38 Hz-modulated gear noise, 0.2 s spool-up, slow-down and clunk at the end; 1.6 s |
| `type_1.wav` | type | soft keyboard burst, synthesized: per key a soft HP top click, a 1.4 kHz band-noise thock, a 190 Hz case resonance (tau 12 ms) and a faint key-up tick, low-passed 5.5 kHz, +-12% pitch, 0 to -4 dB per key, keys 58-108 ms apart; 9 keys |
| `type_2.wav` | type | soft keyboard burst, synthesized: per key a soft HP top click, a 1.4 kHz band-noise thock, a 190 Hz case resonance (tau 12 ms) and a faint key-up tick, low-passed 5.5 kHz, +-12% pitch, 0 to -4 dB per key, keys 58-108 ms apart; 12 keys |
| `type_3.wav` | type | soft keyboard burst, synthesized: per key a soft HP top click, a 1.4 kHz band-noise thock, a 190 Hz case resonance (tau 12 ms) and a faint key-up tick, low-passed 5.5 kHz, +-12% pitch, 0 to -4 dB per key, keys 58-108 ms apart; 6 keys |
