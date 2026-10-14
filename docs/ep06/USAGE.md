# Episode 06 token usage (cloud session)

Hard cap from the run brief: **14M tokens**. Agent figures are the totals each agent or workflow reported (mostly cached input).
Main-session figures are read from the session's own token counter at each checkpoint.

| Phase | Work | Tokens | Running total |
|---|---|---:|---:|
| 0 | Asset mapping + verification workflow (2 agents) | 362,748 | 0.36M |
| 0/4 | Mixer port to audio_build/ep06 (1 agent, Sonnet) | 191,705 | 0.55M |
| 1 | Direction critics workflow (3 agents) | 538,017 | 1.09M |
| 0–1 | Main session (environment, hook, timeline, scaffolding, direction) | ~285,000 | 1.38M |
| 2 | Kit agent B: UI and props kit (Windows UI, KeyCap, verdicts, quote strip, scanner, TRIM note, key, scramble, passport) | 388,507 | 1.77M |
| 2 | Kit agent A: core kit (Archive, presets, framings, SplitCompare, PhotoBits, DriveDive, envs, text roles) | 559,432 | 2.33M |
| 2 | Kit agent A: post-gate look fixes (photo-box glow, split framing, strike, tilt) | 40,510 | 2.37M |
| 3 | Builder S1 (cold open, signature image) | 353,322 | 2.72M |
| 3 | Builder S2 (bin, the picture, NTFS) | 372,645 | 3.09M |
| 3 | Builder S3 (card, emptying the bin) | 344,747 | 3.44M |
| 3 | Builder S4 (recovery works/fails) | 378,904 | 3.82M |
| 3 | Builder S5 (turn to the SSD, TRIM) | 366,957 | 4.18M |
| 3 | Builder S6 (mid-film hero race) | 333,871 | 4.52M |
| 3 | Builder S7 (the twist) | 405,739 | 4.92M |
| 3 | Builder S8 (reversal, sanitize, encryption) | 480,426 | 5.40M |
| 3 | Builder S9 (callback ending) | 443,712 | 5.85M |
| 3 | Kit agent A: PhotoBits/SwapVariant fixes | 15,303 | 5.86M |
| 0–3 | Main session through Phase 3 (orchestration, reviews of sheets, tool fixes) | 132,000 | 5.99M |

Builder figures are the peak token counts their notifications reported; agents whose context was compacted reported smaller numbers afterwards, so the true cumulative use is somewhat higher.
