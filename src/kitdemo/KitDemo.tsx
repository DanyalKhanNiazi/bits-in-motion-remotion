/**
 * KitDemo: every kit component, on dark and light grounds, with every skin.
 * Five 150-frame segments with the same choreography (local frame t = 0..149):
 *   f0–149    dark      · clean skin
 *   f150–299  light     · clean skin
 *   f300–449  light     · ink skin
 *   f450–599  lightCool · clear-line skin
 *   f600–749  dark      · lit skin
 * Components: Bit, LandingRipple (via Bit), SignalRoute, LensRing, KeyedTag, TimeChip, StatePill, StateGlyph (all
 * states), AlertHatch, EyeBadge (solid + analogy), ApproxChip, AnalogyFrame, VisitedMark, EnergyChannel (main fill +
 * standby shimmer), PoweredWash, Brackets.
 * Review frames per segment: t = 33 (Bit mid-run, Lens open), t = 100 (everything held), t = 125 (settled).
 */
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {resolveTheme, type Theme, type ThemeLike} from '../shared/brand';
import {MONO} from '../shared/fonts';
import {rectPath, routePath, type Pt} from '../shared/geom';
import {bitRun} from '../shared/motion';
import {cleanSkin, clearLineSkin, inkSkin, litSkin, type Skin} from '../shared/skin';
import {KitLayer, KitProvider} from '../shared/context';
import {
  AlertHatch,
  AnalogyFrame,
  ApproxChip,
  Bit,
  Brackets,
  EnergyChannel,
  EyeBadge,
  KeyedTag,
  LensRing,
  PoweredWash,
  SignalRoute,
  StateGlyph,
  StatePill,
  TimeChip,
  VisitedMark,
  type GlyphState,
} from '../shared/components';

export const SEGMENT = 150;
const SEGMENTS: Array<{theme: ThemeLike; skin: Skin}> = [
  {theme: 'dark', skin: cleanSkin},
  {theme: 'light', skin: cleanSkin},
  {theme: 'light', skin: inkSkin()},
  {theme: 'lightCool', skin: clearLineSkin},
  {theme: 'dark', skin: litSkin()},
];
export const KITDEMO_DURATION = SEGMENT * SEGMENTS.length;

/* geometry ------------------------------------------------------------------------------------- */
const BUTTON = {x: 180, y: 470, w: 120, h: 72};
const LOOKOUT = {x: 720, y: 560, w: 110, h: 60};
const QBOX = {x: 900, y: 560, w: 110, h: 60};
const PSU = {x: 180, y: 700, w: 200, h: 110};
const VISITED = {x: 1060, y: 660, w: 160, h: 70};
const ROUTE_A: Pt[] = [
  [300, 506],
  [480, 506],
  [480, 590],
  [775, 590],
];
const ROUTE_A_D = routePath(ROUTE_A);
const ROUTE_B: Pt[] = [
  [775, 590],
  [955, 590],
];
const ROUTE_B_D = routePath(ROUTE_B);
const STANDBY: Pt[] = [
  [380, 760],
  [775, 760],
  [775, 620],
];
const MAIN: Pt[] = [
  [1000, 880],
  [1250, 880],
  [1250, 800],
  [1700, 800],
];
const LENS = {cx: 1520, cy: 560};

const RUN_A = bitRun({path: ROUTE_A_D, depart: 20, land: 46, label: 'demo A'});
const HOP_1 = bitRun({path: ROUTE_B_D, depart: 60, land: 74, label: 'demo hop'});

const GLYPHS: Array<{state: GlyphState; name: string}> = [
  {state: 'OFF', name: 'OFF'},
  {state: 'ON', name: 'ON'},
  {state: 'ALWAYS_ON', name: 'ALWAYS'},
  {state: 'RESET', name: 'RESET'},
  {state: 'WAITING', name: 'WAIT'},
  {state: 'LIMIT', name: 'LIMIT'},
  {state: 'FAULT', name: 'FAULT'},
  {state: 'UNNAMED', name: '?'},
];

const Box: React.FC<{b: {x: number; y: number; w: number; h: number}; active?: boolean; theme: Theme; skin: Skin; seed: string; fill?: string}> = ({
  b,
  active,
  theme,
  skin,
  seed,
  fill,
}) => {
  const frame = useCurrentFrame();
  const d = rectPath(b.x, b.y, b.w, b.h, 10);
  return (
    <>
      {skin.fill({d, color: fill ?? (active ? theme.activeFill : theme.panel), role: 'plate', seed: `${seed}:f`, frame})}
      {skin.stroke({d, color: active ? theme.ink : theme.structure, width: active ? 4 : 3, role: active ? 'active' : 'part', seed, frame, join: 'round'})}
    </>
  );
};

const Segment: React.FC<{theme: ThemeLike; skin: Skin}> = ({theme: themeLike, skin}) => {
  const t = useCurrentFrame();
  const theme = resolveTheme(themeLike);
  return (
    <AbsoluteFill style={{background: theme.surface}}>
      <KitProvider theme={theme} skin={skin}>
        <KitLayer>
          {/* board plate for the scene, panel tone under the specimens */}
          {skin.fill({d: rectPath(150, 372, 1110, 548, 16), color: theme.board, role: 'plate', seed: 'board', frame: t})}
          {skin.fill({d: rectPath(150, 222, 1110, 130, 12), color: theme.panel, role: 'plate', seed: 'panel', frame: t})}

          {/* glyph specimens */}
          {GLYPHS.map((g, i) => {
            const x = 170 + i * 136;
            const b = {x, y: 262, w: 92, h: 52};
            return (
              <g key={g.state}>
                <Box b={b} theme={theme} skin={skin} seed={`gbox${i}`} />
                {g.state === 'LIMIT' ? <AlertHatch x={b.x + 6} y={b.y + 6} w={b.w - 12} h={b.h - 12} opacity={0.8} /> : null}
                {g.state === 'OFF' ? (
                  <StateGlyph x={b.x + b.w} y={b.y} timeline={[{at: 0, state: 'OFF'}, {at: 80, state: 'ON'}]} />
                ) : g.state === 'UNNAMED' ? (
                  <StateGlyph x={b.x + b.w / 2} y={b.y + b.h / 2} dock="center" state="UNNAMED" fillAt={120} />
                ) : (
                  <StateGlyph x={b.x + b.w} y={b.y} state={g.state} />
                )}
                <text x={b.x + b.w / 2} y={346} textAnchor="middle" style={{fontFamily: MONO, fontWeight: 500, fontSize: 30}} fill={theme.textMuted}>
                  {g.name}
                </text>
              </g>
            );
          })}

          {/* eye badges and the ≈ chip */}
          <EyeBadge x={1390} y={292} variant="solid" />
          <EyeBadge x={1530} y={292} variant="analogy" />
          <ApproxChip x={1660} y={292} />

          {/* scene: wash (S11), routes lit behind the Bit, parts, channels */}
          <PoweredWash box={{x: 692, y: 534, w: 166, h: 112, r: 14}} at={100} ground={theme.board} />
          <SignalRoute path={ROUTE_A_D} runs={RUN_A} seed="routeA" />
          <SignalRoute path={ROUTE_B_D} runs={HOP_1} seed="routeB" />
          <AnalogyFrame x={1040} y={400} w={200} h={110} inAt={40} />
          <EnergyChannel kind="standby" path={STANDBY} full shimmer={{from: 100, to: 150}} seed="standby" />
          <EnergyChannel kind="main" path={MAIN} fillFrom={70} fillTo={88} seed="main" />
          <Box b={BUTTON} active theme={theme} skin={skin} seed="button" />
          <Box b={LOOKOUT} active theme={theme} skin={skin} seed="lookout" />
          <Box b={QBOX} theme={theme} skin={skin} seed="qbox" />
          <Box b={PSU} theme={theme} skin={skin} seed="psu" />
          <Box b={VISITED} theme={theme} skin={skin} seed="visitedbox" />
          <StateGlyph x={LOOKOUT.x + LOOKOUT.w} y={LOOKOUT.y} state="ALWAYS_ON" />
          <StateGlyph x={QBOX.x + QBOX.w} y={QBOX.y} timeline={[{at: 0, state: 'OFF'}, {at: 74, state: 'ON'}]} />
          <StateGlyph x={QBOX.x + QBOX.w / 2} y={QBOX.y - 30} dock="center" state="UNNAMED" />
          <EyeBadge x={LOOKOUT.x + LOOKOUT.w / 2} y={LOOKOUT.y + LOOKOUT.h / 2} variant="analogy" inAt={50} width={72} />
          <VisitedMark x={VISITED.x} y={VISITED.y} w={VISITED.w} h={VISITED.h} at={30} outset={6} />
          <StatePill x={PSU.x + PSU.w} y={PSU.y} timeline={[{at: 0, label: 'Main rails: OFF'}, {at: 90, label: 'Main rails: ON'}]} />

          {/* the Bit: run A absorbed into its ripple; hop 1 parks */}
          <Bit runs={RUN_A} />
          <Bit runs={HOP_1} park restFrom={56} />

          {/* tags */}
          <KeyedTag anchor={[240, BUTTON.y]} elbow={[240, 420]} end={[290, 420]} text="Power button" role="part" land={10} />
          <KeyedTag
            anchor={[580, 760]}
            elbow={[580, 850]}
            end={[540, 850]}
            side="left"
            text="Standby power"
            secondary="+5VSB · ATX"
            role="energy"
            land={50}
          />

          {/* header */}
          <TimeChip
            timeline={[
              {at: 2, label: 'After the press'},
              {at: 60, label: 'Soft-off'},
              {at: 88, label: 'When pressed'},
              {at: 118, label: 'Now'},
            ]}
            shrinkAt={40}
          />
          <text x={1150} y={150} style={{fontFamily: MONO, fontWeight: 500, fontSize: 30}} fill={theme.textMuted}>
            {`${theme.name} · ${skin.name} · t${String(t).padStart(3, '0')}`}
          </text>

          {/* lens: magnify the "?" box ×4, settle (D24) at 112, "?" fills at 120 */}
          <LensRing
            cx={LENS.cx}
            cy={LENS.cy}
            openAt={22}
            settleAt={112}
            chip="×4"
            mode="magnify"
            target={[QBOX.x + QBOX.w / 2, QBOX.y + QBOX.h / 2]}
            interior={theme.panel}
          >
            {skin.stroke({d: rectPath(LENS.cx - 210, LENS.cy - 110, 420, 220, 26), color: theme.structure, width: 3, role: 'part', seed: 'lensbox', frame: t})}
            {skin.stroke({d: rectPath(LENS.cx - 150, LENS.cy - 64, 120, 128, 12), color: theme.structure, width: 3, role: 'part', seed: 'lensb1', frame: t})}
            {skin.stroke({d: rectPath(LENS.cx + 30, LENS.cy - 64, 120, 128, 12), color: theme.structure, width: 3, role: 'part', seed: 'lensb2', frame: t})}
            <StateGlyph x={LENS.cx + 90} y={LENS.cy} dock="center" state="UNNAMED" fillAt={120} />
          </LensRing>

          {/* lock-on */}
          <Brackets box={BUTTON} lockAt={96} fadeAt={140} />
        </KitLayer>
      </KitProvider>
    </AbsoluteFill>
  );
};

export const KitDemo: React.FC = () => (
  <AbsoluteFill>
    {SEGMENTS.map((s, i) => (
      <Sequence key={i} from={i * SEGMENT} durationInFrames={SEGMENT} layout="none">
        <Segment theme={s.theme} skin={s.skin} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
