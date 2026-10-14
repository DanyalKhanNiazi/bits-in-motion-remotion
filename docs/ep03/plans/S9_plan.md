# S9 plan: Close, the callback (P21–P22, frames 17080–18367)

Anchors are `at(p, phrase).start` (absolute). Numbers: none on screen (nothing numeric is spoken in P21–P22).

| # | Frames | Env / assets | Camera / move | On-screen strings | Hero / re-hook |
|---|---|---|---|---|---|
| 1 LOOP | 17050→17370 | (c) chip floor, as S3's loop: perspective ring, model chip BIM141 at 12 o'clock (the Bit runs through it), answer strip with the newest piece under 6 o'clock; tricks BIM181 (left) + BIM185 (right) | slow push 0.94→1.18, roll drift; whip **up** at 17358 | "How long each run takes" @`at(21,'how long')`; "How many pieces per run" @`at(21,'how many')`; in-loop slam "One after another" @`at(21,'one after another')` | Bit laps the loop, GPU flashes per lap, one tile per lap. `changes` → tricks plug in, Bit speeds up; `pieces` → 3 tiles per lap; `None` → tricks dim and sink, loop flares; `loop` → ring pulse |
| 2 QUESTION | 17358→17507 | (c) chip world, 11 white question tiles (2 rows) | push-in on row 1, glide with the Bit, settle wide at `time?` | the 11 tiles (snap on each spoken word) | `question` → 11 ghost slots, "?" slot rims magenta; tiles snap word-synced; the Bit hops tile to tile |
| 3 CHAIN | 17507→17685 | same world | tilt down to answer rows (zoom 0.9), then push onto the answer | answer tiles "Because each piece depends on the ones before it" (on the words), caption "Made in order" @`at(22,'made')` | each new tile pulls glowing threads from **every** earlier tile (question + answer); `in order` → chain links light left→right |
| 4 BRIDGE | 17682→17874 | Bridge (side, own world), idle die, slow crates; footnote | LensDive (magenta ring) on the newest tile @`at(22,'and')`; wide → die → 3/4 crates; whip left @17862 | footnote "A single conversation, on a GPU" @`at(22,'single')`; Label "The math" → die @`at(22,'math')`; pop "It's the trip." @`at(22,"it's the trip")` | **Bridge hero:** die waits (coral breathing, pause mark), math blinks on each arrival; a huge crate thunders across and hits the die on `trip` (shake) |
| 5 RACE | 17862→18045 | (a) reader-desk plate, screen fills frame, chat UI | slow push 1.0→1.06; ZoomThrough into the caret @18027 | prompt = the question; answer "Because each piece depends on the ones before it, the answer is made one piece at a time."; lanes "Read" / "Write" (S1's race words) | callback to the opening race: 11 tiles fly in from the camera **all at once** and slam into the prompt (flash) @`at(22,'all at once')`; "Read" fills instantly, "Write" crawls token by token; "one piece at a time" streams on `exactly the way it describes`, underlined on `describes` |
| 6 FINALE | 18027→18366 | Bridge inside the desk monitor's screen, glass chat overlay, desk plate, sign-off | inside: 3D dolly crates→wide (18045→18200); then 2D pull-back out through the glass to the whole desk (18170→18330), ease-out, drift to the end | chat continues "For each one, gigabytes of numbers cross a bridge, again and again, piece after piece." (one token per crate arrival, last six on the spoken words ±5 f); sign-off "Bits in Motion" (B monogram, three pixels) | crates cross again and again (one every 13 f), each arrival = one new word on the screen; calm final hold with motion: crates, caret, dust, lamp |

## Pacing check (meaningful change every 3–6 s)
17080 loop · 17112 tricks land · 17134 speed-up · 17213 3-per-lap · 17275 tricks dim · 17313 slam · 17358 whip · 17393 ghosts · 17419–17494 tiles · 17507–17600 threads · 17650 order · 17682 lens · 17705 bridge · 17762 die waits · 17814 hero crate · 17862 whip · 17890 volley · 17956 stream · 18027 dive · 18045–18200 dolly · 18190 glass · 18300 sign-off.

## Transitions
Whip up (1→2) · same stage (2→3) · LensDive through the newest tile (3→4) · whip left (4→5) · ZoomThrough the caret (5→6) · film ends on the hold.

## Sound cues (S9.cues.json, 10 cues ≈ 14/min)
17134 whoosh · 17313 pop · 17358 whoosh · 17672 riser · 17854 impact (hero) · 17918 pop · 17956 type · 18027 whoosh · 18190 swell · 18305 sting.

## Honesty
- No numbers. Footnote keeps "a single conversation, on a GPU" (C86/C87 scope). The math/trip contrast is shown qualitatively (blink vs crossing).
- Chat text is an illustrative paraphrase of P22.
