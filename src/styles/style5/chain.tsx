/**
 * S06 (page P3): the present page steps back into a held thumbnail, and T opens beneath it: a double-ruled row of
 * six small schematic views, one per stage's actor, joined by one 4 px route that crosses every 24 px gutter at a
 * right angle through ports. The Bit (the schematic's control token) crosses five gutters; each name lands with it.
 * The real PC, held small above, stays in soft-off throughout.
 */
import React from 'react';
import {Bit, SignalRoute, StateGlyph, VisitedMark, EyeBadge, bitState, squarePath, BIT, type Pt} from '../../shared';
import {CX, HOPS, P_CPU4, P_CPU5, P_CPU6, P_LOOK, P_Q, RY, T_BOT, T_TOP, XS} from './runs';
import {D, TONE, W, poly, circ, type Box} from './look';
import {DiagramChip, Fil, Plate, Rules, Stk} from './panel';
import {Channel5} from './devices';
import {StationName} from './labels';
import {F} from './T';
import {EASE, progress} from '../../shared';

export const CELLS: Box[] = XS.map(([a, b]) => ({x: a, y: T_TOP, w: b - a, h: T_BOT - T_TOP}));

const ROUTE_D = poly([P_LOOK, P_CPU6]);
const NAME_Y = 800;
const [c1, c2, c3, c4, c5, c6] = CX;

const rr = (c: Pt, w: number, h: number, r: number): string => {
  const x = c[0] - w / 2;
  const y = c[1] - h / 2;
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
};

/** which cell the Bit is driving (the rim follows the chain) */
const activeCell = (frame: number): number => {
  let c = 0;
  F.chain.forEach((land, i) => {
    if (frame >= land) c = i + 1;
  });
  return c;
};

const Cpu: React.FC<{c: Pt}> = ({c}) => (
  <>
    <Fil d={rr([c[0] + 5, c[1] + 5], 84, 94, 8)} c={TONE.shadow} />
    <Fil d={rr(c, 84, 94, 8)} c={TONE.body} />
    <Stk d={rr(c, 84, 94, 8)} c={D.structure} w={W.inactive} />
    <Stk d={rr(c, 58, 68, 5)} c={D.structure} w={W.detail} />
  </>
);

export const TRow: React.FC<{frame: number; /** 0..1 frame-first open */ open: number; /** 0..1 fold */ fold: number}> = ({frame, open, fold}) => {
  if (open <= 0 || fold >= 1) return null;
  // contents fade in f717–f723 (frames draw from f713); on the exit they vanish over 4 frames (f912–f916) while the
  // plates are still near full height, so no drawing, name or Bit floats above a folding plate
  const vanish = 1 - progress(frame, F.s06Out, 4, EASE.linear);
  const content = Math.min(progress(frame, F.tOpen + 4, 6, EASE.arrive), vanish);
  const ac = activeCell(frame);
  const qOn = progress(frame, F.chain[1], 5, EASE.arrive);
  const fillFront = progress(frame, F.chain[0], 4, EASE.linear);
  // fold toward the bottom edge
  const cells = CELLS.map((b) => ({...b, y: b.y + b.h * fold, h: b.h * (1 - fold)}));
  const portOpen = (i: number): number => {
    const r = HOPS[i];
    const xg = XS[i][1] + 12;
    let fa = r.land;
    let fb = r.land;
    for (let f = r.depart; f <= r.land; f++) {
      const p = r.at(f);
      if (p.x >= xg - 50 && fa === r.land) fa = f;
      if (p.x >= xg + 50) {
        fb = f;
        break;
      }
    }
    return Math.min(progress(frame, fa - 4, 4, EASE.arrive), 1 - progress(frame, fb + 6, 4, EASE.exit));
  };
  const rim = (i: number): number => {
    const inT = i === ac ? progress(frame, i === 0 ? F.starts : F.chain[i - 1], 6, EASE.arrive) : 0;
    const outT = i === ac - 1 ? 1 - progress(frame, F.chain[i], 6, EASE.arrive) : 0;
    return Math.max(0, Math.min(1, inT + outT)) * (1 - fold);
  };
  return (
    <g>
      {cells.map((b, i) => (
        <Plate key={i} box={b} polarity="schem" opacity={open} />
      ))}
      <g opacity={content}>
        {/* the route (idle structure) across all six cells and five gutters */}
        <path d={ROUTE_D} stroke={D.structure} strokeWidth={W.route} fill="none" />

        {/* 1 · always-on logic: a small lit block in a chipset outline, wearing the ≈ eye */}
        <Fil d={rr([c1 + 4, RY + 5], 172, 140, 12)} c={TONE.shadow} />
        <Fil d={rr([c1 - 1, RY], 172, 140, 12)} c={TONE.body} />
        <Stk d={rr([c1 - 1, RY], 172, 140, 12)} c={D.structure} w={W.inactive} />
        <Fil d={rr([c1 + 9, RY], 92, 64, 16)} c={D.activeFill} />
        <Stk d={rr([c1 + 9, RY], 92, 64, 16)} c={D.ink} w={W.active} />
        <StateGlyph x={c1 + 55} y={RY - 32} state="ALWAYS_ON" />
        <EyeBadge x={c1 - 9} y={RY + 2} width={48} variant="analogy" />

        {/* 2 · power: a power-supply outline and a short energy segment (a power phase, no code) */}
        <Fil d={rr([c2 - 25, RY + 47], 140, 90, 10)} c={TONE.shadow} />
        <Fil d={rr([c2 - 30, RY + 42], 140, 90, 10)} c={TONE.body} />
        <Stk d={rr([c2 - 30, RY + 42], 140, 90, 10)} c={D.structure} w={W.inactive} />
        {[c2 + 6, c2 + 16, c2 + 26].map((x) => (
          <Stk key={x} d={poly([[x, RY + 16], [x, RY + 68]])} c={D.structure} w={W.detail} />
        ))}
        <Stk d={rr([c2 - 66, RY + 46], 40, 40, 5)} c={D.structure} w={W.detail} />
        <Channel5 pts={[[c2 + 40, RY + 58], [c2 + 112, RY + 58]]} kind="main" front={fillFront} frame={frame} />

        {/* 3 · the "?": its own block (wide, small corners) */}
        <Fil d={rr([P_Q[0] + 5, RY + 5], 104, 70, 4)} c={TONE.shadow} />
        <Fil d={rr(P_Q, 104, 70, 4)} c={qOn > 0 ? D.activeFill : TONE.body} />
        <Stk d={rr(P_Q, 104, 70, 4)} c={qOn > 0.5 ? D.ink : D.structure} w={qOn > 0.5 ? W.active : W.inactive} />
        <StateGlyph x={P_Q[0] + 52} y={RY - 35} timeline={[{at: -1, state: 'OFF'}, {at: F.chain[1], state: 'ON'}]} />

        {/* 4 · firmware on the CPU: a flash chip feeding the CPU package */}
        <Cpu c={P_CPU4} />
        <Fil d={rr([c4 - 81, RY + 76], 52, 32, 3)} c={TONE.body} />
        <Stk d={rr([c4 - 81, RY + 76], 52, 32, 3)} c={D.structure} w={W.inactive} />
        {[c4 - 97, c4 - 86, c4 - 75, c4 - 64].map((x) => (
          <React.Fragment key={x}>
            <Stk d={poly([[x, RY + 60], [x, RY + 54]])} c={D.structure} w={W.detail} />
            <Stk d={poly([[x, RY + 92], [x, RY + 98]])} c={D.structure} w={W.detail} />
          </React.Fragment>
        ))}
        <Stk d={poly([[c4 - 55, RY + 76], [c4 - 17, RY + 76], [c4 - 17, RY + 47]])} c={D.structure} w={W.inactive} />

        {/* 5 · the loader: a drive feeding the CPU package */}
        <Cpu c={P_CPU5} />
        <Fil d={rr([c5, RY + 92], 172, 30, 4)} c={TONE.body} />
        <Stk d={rr([c5, RY + 92], 172, 30, 4)} c={D.structure} w={W.inactive} />
        <Stk d={rr([c5 - 39, RY + 92], 40, 16, 2)} c={D.structure} w={W.detail} />
        <Stk d={rr([c5 + 19, RY + 92], 40, 16, 2)} c={D.structure} w={W.detail} />
        <Stk d={circ(c5 + 67, RY + 92, 5)} c={D.structure} w={W.detail} />
        <Stk d={poly([[c5, RY + 77], [c5, RY + 47]])} c={D.structure} w={W.inactive} />

        {/* 6 · Windows: the CPU package beside a memory stick */}
        <Cpu c={P_CPU6} />
        <Fil d={rr([c6 + 71, RY + 18], 28, 150, 4)} c={TONE.body} />
        <Stk d={rr([c6 + 71, RY + 18], 28, 150, 4)} c={D.structure} w={W.inactive} />
        {[-48, -16, 16, 48].map((dy) => (
          <Stk key={dy} d={rr([c6 + 71, RY + 18 + dy], 14, 22, 2)} c={D.structure} w={W.detail} />
        ))}
        <Stk d={poly([[c6 + 15, RY + 18], [c6 + 57, RY + 18]])} c={D.structure} w={W.inactive} />

        {/* visited marks after the hand-offs (D24: 3 px annotation outline, hollow pip) */}
        <VisitedMark x={P_CPU4[0] - 42} y={RY - 47} w={84} h={94} outset={9} r={12} at={F.chain[3]} />
        <VisitedMark x={P_CPU5[0] - 42} y={RY - 47} w={84} h={94} outset={9} r={12} at={F.chain[4]} />
      </g>

      {/* rules: double (another time), the rim follows the chain, ports in every gutter */}
      {cells.map((b, i) => (
        <Rules
          key={i}
          box={b}
          plate={TONE.plateSchem}
          polarity="schem"
          active={rim(i)}
          double={1}
          open={open}
          ports={[
            ...(i > 0 ? [{side: 'left' as const, at: RY, open: portOpen(i - 1)}] : []),
            ...(i < 5 ? [{side: 'right' as const, at: RY, open: portOpen(i)}] : []),
          ]}
        />
      ))}
      <DiagramChip box={cells[5]} opacity={content} />

      {/* the control token */}
      {content > 0 ? (
        <g opacity={vanish}>
          <SignalRoute path={ROUTE_D} runs={HOPS} idle={false} />
          <Bit runs={HOPS} park restFrom={F.starts} render={(s) => <ChainBit s={s} frame={frame} />} />
        </g>
      ) : null}

      {/* names land with their Bits */}
      <g opacity={vanish}>
        <StationName frame={frame} cx={c1} y={NAME_Y} lines={['Always-on', 'logic']} inAt={F.starts} outAt={F.s06Out} />
        <StationName frame={frame} cx={c2} y={NAME_Y} lines={['Power']} inAt={F.chain[0]} outAt={F.s06Out} />
        {frame >= F.chain[1] && frame < F.s06Out + 6 ? (
          <g opacity={1 - progress(frame, F.s06Out, 6, EASE.exit)}>
            <StateGlyph x={c3} y={NAME_Y + 26} dock="center" state="UNNAMED" inAt={F.chain[1]} />
          </g>
        ) : null}
        <StationName frame={frame} cx={c4} y={NAME_Y} lines={['Firmware', 'on CPU']} inAt={F.chain[2]} outAt={F.s06Out} />
        <StationName frame={frame} cx={c5} y={NAME_Y} lines={['Loader']} inAt={F.chain[3]} outAt={F.s06Out} />
        <StationName frame={frame} cx={c6} y={NAME_Y} lines={['Windows']} inAt={F.chain[4]} outAt={F.s06Out} />
      </g>
    </g>
  );
};

/** The kit Bit, except that it rests at the Power inlet WITHOUT breathing (Power never "has control"). */
const ChainBit: React.FC<{s: ReturnType<typeof bitState>; frame: number}> = ({s, frame}) => {
  const atPower = frame >= F.chain[0] && frame < F.hopDepart[1];
  const core = s.core ? {...s.core, scale: atPower ? 1 : s.core.scale} : null;
  const r = (sz: number) => (BIT.radius * sz) / BIT.size;
  return (
    <g>
      {s.trail
        .slice()
        .reverse()
        .map((t, i) => (
          <path key={`t${i}`} d={squarePath(t.x, t.y, t.size, r(t.size))} fill={D.info} fillOpacity={t.opacity} />
        ))}
      {core
        ? BIT.halo
            .slice()
            .reverse()
            .map(([hs, ho], i) => {
              const boost = !atPower && (s.status === 'parked' || s.status === 'waiting' || s.status === 'resting') ? (core.scale - 1) / BIT.breatheScale : 0;
              const size = hs * core.scale;
              return <path key={`h${i}`} d={squarePath(core.x, core.y, size, r(size) * 1.2)} fill={D.info} fillOpacity={(ho + (hs === 40 ? 0.1 * boost : 0)) * core.opacity} />;
            })
        : null}
      {core ? <path d={squarePath(core.x, core.y, core.size * core.scale, r(core.size * core.scale))} fill={D.info} fillOpacity={core.opacity} /> : null}
      {s.ripples.map((rp, i) => (
        <path key={`r${i}`} d={squarePath(rp.x, rp.y, rp.size, r(rp.size))} fill="none" stroke={D.info} strokeWidth={rp.stroke} strokeOpacity={rp.opacity} />
      ))}
    </g>
  );
};
