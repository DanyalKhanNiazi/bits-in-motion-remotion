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
