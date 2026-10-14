/**
 * EPISODE TEMPLATE — the beats as data. Every time is DERIVED from the narration: w('W0123') (a word's start),
 * w('W0123', -4) (with an offset), wEnd, sentence('S04').end, pauseAfter('W0042'), or a shared deadline. Never type a
 * frame number: `node src/styles/style6/lint-times.mjs` rejects them (ENGINE_NOTES "Episode workflow").
 *
 * The word IDs below are Ep01's (the engine reads the episode's word JSON through src/shared/timing); a new episode
 * points that module at its own words file and re-derives every frame by re-reading this file. Nothing here moves.
 *
 * Round 3: the reusable devices are one call each. A sequence is `chainRow` (plates that carry their part out of the
 * world, a rail, the chain Bit); its scenes are cut from the world with `sceneFrom` and framed with `stageShot`; a tag
 * with no `slot` is placed from intent; the chip carries a scope line under its time word.
 *
 * Round 4: take every on-screen name from the episode's glossary (`Videos/<NN Title>/glossary.md`; style guide §7.6):
 * one name per object, a technical name only as a tag's `secondary` (mono subline), a rename only as a `step` on the
 * narration's word (pre-roll it 3 frames). A plate with a `hero` flies home as its hero alone (the card dissolves in its
 * slot); another machine slides in from the right edge (`lift: 'slide'`); a twin plate slides out from behind its
 * sibling (`enterFrom` / `returnInto`); a split may `carry` the world's parts into its centre band; the closing real
 * press's Bit may re-form the logo's pixels (`trailSignature: true`). Register the compositions under
 * `episodeIds('NN')` (src/entries/style6.tsx). ENGINE §24 lists the APIs.
 */
import {buildScript, bit, cam, chainRow, point, sceneFrom, sentence, stageShot, tag, w, type ScriptInput} from '../../../engine';
import {WORLD} from './world';
import {SHOTS} from './shots';

// a three-stage sequence, every stage cut from the world (a world change re-draws its plates by itself)
const RECV = sceneFrom(WORLD, ['receiver'], {id: 't-receiver'});
const FLASH = sceneFrom(WORLD, [{part: 'flash', scale: 3}], {id: 't-flash'});
const BUTTON = sceneFrom(WORLD, ['button'], {id: 't-button'});
const CHAIN = chainRow({
  id: 'seq',
  peelAt: w('W0013'),
  backAt: w('W0021'),
  restFrom: w('W0014', 2),
  lands: [w('W0017'), w('W0019')],
  stages: [
    {source: 'receiver', scene: RECV, shot: stageShot(RECV, 'receiver', 170), name: 'Always-on\nlogic', hero: {scenePart: 'receiver', worldPart: 'receiver'}},
    {source: 'flash', scene: FLASH, shot: stageShot(FLASH, 'flash', 150), name: 'Firmware', hero: {scenePart: 'flash', worldPart: 'flash'}, quiet: true},
    {source: 'button', scene: BUTTON, shot: stageShot(BUTTON, 'button', 120), name: 'Button', hero: {scenePart: 'button', worldPart: 'button'}},
  ],
});

const input: ScriptInput = {
  camera: {
    start: 'wide',
    reference: 'wide',
    shots: SHOTS,
    // one move per clause at most; a carry follows a Bit (at/dur derived from its run when omitted)
    keys: [cam('close', {ease: 'carry', carry: 'demo', note: 'follow the signal to its receiver'})],
  },
  bits: [
    // the signature landing: the receiver's outline ripples and the Bit sheds the monogram's three pixels; an episode's
    // first press may give its Bit the signature birth (`birth: 'signature'`)
    bit('demo', {scope: 'world', kind: 'demo', restFrom: w('W0001', 3), birth: 'signature', hops: [{route: 'link', depart: w('W0004'), land: w('W0006'), receiver: {part: 'receiver'}}]}),
    CHAIN.bit,
  ],
  tags: [
    // a tag lands on its word and holds until 0.5 s after its sentence (the hold rule); with no `slot` it is placed from
    // intent (the clearest side of its anchor at its landing frame) and rides with its anchor
    tag('source', 'Power button', {role: 'part', anchor: 'button.right', word: 'W0004', exitAt: sentence('S01').end + 15}),
    tag('receiver', 'Always-on logic', {role: 'part', anchor: 'receiver.top', word: 'W0006', exitAt: sentence('S01').end + 15}),
  ],
  // Other reusable devices (see ep01/script.ts for full examples):
  //  - plates: two-way comparisons (`pairWide`, with scoped glyphs 'loopArrow', 'powerRing', 'problem' and its hedges),
  //    variants (`pairRight`, `lift: 'slide'` for another machine, inner `tags` and 44 px `names`), a twin plate
  //    (`enterFrom` / `returnInto`), hedge captions (`names` with `tone: 'ink'`);
  //  - splits: a triptych what-if with a `source` region, `carry` / `carryChannels` (the world's parts travel into the
  //    centre band and home again), band `outcome`s, cause `marks` ('cross', 'ring') and eyes that close;
  //  - glyphs: 'eye' (with `look` glances and `closeAt`), 'mark' ("First", with `sub` and `leader`), 'stage' ('code',
  //    'file'), 'qFill', 'scopeLine' (four L-brackets), 'brackets'.
  chip: [
    {at: w('W0001', 2), text: 'Example', size: 'active', underline: 'single', scope: 'Template desktop'},
    {at: w('W0013'), text: 'After the press', size: 'active', underline: 'double'},
    {at: w('W0021', 6), text: 'Example', size: 'rest', underline: 'single'},
  ],
  // "pointed at": an outline tone step on its word (never light); keeps the foreground moving with the voice
  props: [...point('receiver', w('W0010'), sentence('S01').end)],
  plates: CHAIN.plates,
  rows: [CHAIN.row],
  scrims: [{at: w('W0013', -4), outAt: w('W0021'), inDur: 12}],
};

export const SCRIPT = buildScript(input, WORLD);
