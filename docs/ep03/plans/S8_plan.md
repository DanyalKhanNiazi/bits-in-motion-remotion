# S8 "The tricks" (P19–P20), frames 15091–17080 (66.3 s). Built in `src/ep03/sections/S8.tsx` + `S8/`.
Anchors are `at(p, 'phrase').start` (see `S8/T.ts`). Every shot moves (camera drift or push, crates, the Bit, sweeps).
On screen the voice's "waits" is always written "weights".

## A. Two levers on the Bridge (15061–15465), Bridge world, threeQuarter orbit (`S8/Levers.tsx`)
- Pre-roll: close on the set (it fills the frame), crates crossing. `AtlasOpener` "The tricks" (no index) lands on
  `at(19,'tricks')` in the clear top band; on `at(19,'cheaper')` the camera pulls back to reveal the floor for the levers.
- Each crate arrival flies one blank piece from the die into an answer strip (top right, inside the safe frame).
- `at(19,'two')`: two physical levers spring up from the floor in front of the tower (A) and the die (B), cabled to them.
- `at(19,'fewer bytes')`: nameplate "Fewer bytes per token", cable pulse, tower outlined. `at(19,'more tokens')`: "More tokens per trip", die outlined.
- `at(19,'batching')`: lever B snaps ON (LED, shake), tag "Batching"; every trip now lands a piece in 3 strips (3 chats).
- `at(19,'8 bit version')`: lever A clicks to its 8 notch, tag "8-bit", crates shrink (crateScale 1 → 0.72).
- Transition: `ZoomThrough` into the deck on `at(19,'the first')`. Sound: whoosh, pop, dial ×2, whoosh.

## B. One weight: 16 → 8 → 4 bits (15449–15610), hardware stage, BIM181 trays (`S8/Trays.tsx`)
- `at(19,'store')`: the 16-cell tray lights cell by cell (cyan bits, 0/1); Label "One weight".
- `at(19,'8',2)`: 8-cell tray lights, "8 bits"; `at(19,'4')`: 4-cell tray, "4 bits"; `at(19,'16')`: "16 bits". Camera pans L → R.
- Whip left on `at(19,"and there's")`.

## C. Less to carry; squeezing too hard (15600–15750), Bridge close on the crates, lever A large (`S8/Squeeze.tsx`)
- Lever A has a gate scale 16 · 8 · 4 + a coral zone. `at(19,'less')`/`at(19,'carry',2)`: clicks 16 → 8 → 4; crates shrink 1 → 0.72 → 0.5, stamped 16-bit/8-bit/4-bit.
- `at(19,'squeezing')`/`'too hard'`: forced into the coral zone, crates crushed (coral outlines), Accuracy meter drains (re-hook).
- `at(19,'cost')`: "Costs accuracy" (coral slam). Whip up on `at(19,"in nvidia's")`. Sound: glitch.

## D. The single-user test (15738–16048), a tilted test bench (`S8/Race.tsx`)
- "NVIDIA's single-user test". Lanes "16-bit"/"8-bit": each run is a big capsule (cyan = moving the weights, silver = other
  work); the Bit runs it; each finished run drops a blank piece into the lane's row. 8-bit cyan is half, silver equal: 1.44×.
- `at(19,'more than')`/`at(19,'40')`: "More than / 40% faster" (hero). `at(19,'not twice')`: dashed ×2 slots the 8-bit row never
  reaches, "×2" struck, "not ×2" (coral). Push in: `at(19,'moving')` "Moving the weights", `at(19,'work')` "Other work".
- Footnote "Split of each run: illustrative". Whip right on `at(20,'another')`. Sound: riser, impact on 40.

## E. Another way: speculative decoding; the rule bends (16036–16250)
- Bridge + levers again, set low in frame; "Batching" fades; `at(20,'speculative')` "Speculative decoding" slams in the top band.
- Whip to a dark stage: a steel ruler engraved ONE AT A TIME, caption "The trick that bends the rule" (S3's teaser called back).
  `at(20,'bends')`: the ruler flexes into an arc with overshoot (re-hook). Sound: sting ×2.

## F. Guess, check, keep (16242–16809), one 3D world: big Bridge behind, draft-target rail BIM186 in front (`S8/Spec.tsx`)
- `at(20,'small')`: close on a mini bridge (thin deck, tiny crates zipping) = "Small, fast model". Labels here are 60 px.
- `at(20,'guesses')` → `'ahead'`: 4 dashed guess tiles race into the rail's holders: "the" "ones" "before" "that".
- `at(20,'big model')`: pull back, "Big model"; `at(20,'checks')`: one big crate crosses; on arrival a light sweep from the die
  scans the guesses: ✓ ✓ ✓ on a 4-frame tick, then a hard coral stop on ✗ at `at(20,'in')` (shake). "All in one run";
  `at(20,'reads a prompt')`: the four guesses pulse side by side (S4 callback). Guess tiles race out 7 frames apart, with streaks.
- `at(20,'deliver')`: the 3 ✓ tiles fly up as a bundle into the answer; "One trip → / several pieces" (top right, clear of the set).
- `at(20,'keeps')`: underline "Kept"; `at(20,'first one')` the ✗ tile shakes, `at(20,'disagrees')` it drops into the bin ("Dropped").
- `at(20,'adds')`: the big model's own token "it" slams into the target holder (ring, shake; "Its own token"); it lands on `at(20,'own')`:
  "Each piece depends on / the ones before it" (the film's thesis). Hero beat: impact. Whip left on `at(20,'when the guesses')`.

## G. ×2–3 faster, same answer (16797–17110), reader world (reader-desk plate) (`S8/Payoff.tsx`)
- The screen shows "Normal" (one piece per trip) and "Speculative" (bursts of 2–4) streaming live with trip lights and a slow push.
- `at(20,'two to three times')`: "×2–3" slams at 200 px, "faster" on `at(20,'faster')`. `at(20,'one request')`: "One request at a time".
- `at(20,'without changing')`: "✓ Same odds as the big model" chip (52 px). Footnote "Google's original paper" (40 px).
- Exit: last 22 frames push through the screen (zoom + motion blur) into a light flash. Sound: impact, whoosh out.
