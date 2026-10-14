/**
 * The set renderer: draws the one ep01 set through a camera (far plane + stage plane), with constant
 * on-screen strokes and a level of detail per setup. State comes in as plain numbers (light is state).
 */
import React from 'react';
import {EnergyChannel, polyPath, routePath, circlePath, SENTENCES, type Pt} from '../../shared';
import {F} from './timeline';
import {apply, type Cam, type Lod} from './camera';
import {SET, ROOM, ROUTE_MM, LEAD_MM, STANDBY_BOARD_MM, STUB_A, STUB_B, STANDBY_HIDDEN_MM, WAKE_STUB_MM, wp, mb, type MBox} from './set';
import {Part, LitPart, Glass, Contact, srect, frect, sp, spts, rad, mmpx, rp, type SRect} from './draw';
import {TONE, SW, T} from './tones';

export interface SetState {
  frame: number;
  /** 0..1 light on the lookout body (always 1: it is powered in every present frame and in "later"). */
  lookoutLight: number;
  /** 0..1 faked glow on the lookout (moves to the "?" in the flash-forward f294–f334). */
  lookoutGlow: number;
  /** 0..1 the "?" lit (flash-forward only). */
  qLight: number;
  qGlow: number;
  /** Breathing factor 0.7..1 (always-on). */
  breath: number;
  /** 0..1 the lead pointed at (structure -> textMuted step; never ink or info). */
  point: number;
  /** 0..1 end-tick at the header pins. */
  endTick: number;
  /** 0..1 powered-domain wash (S11). */
  wash: number;
  /** 0..1 wake-source badges (S11), and their exit. */
  wake: number;
  /** Cap travel in mm (0..4). */
  cap: number;
}

const ink = T.ink;
/** The trickle "keeps flowing": slow low-contrast dashes toward the board while the voice talks flow (S10b–S11). */
const SHIMMER = {from: F.shimmerOn, to: SENTENCES.S11.end};

/* ------------------------------------------------------------------ far plane */

export const FarPlane: React.FC<{cam: Cam; lod: Lod}> = ({cam}) => {
  const scr = frect(cam, ROOM.monitorScreen);
  const bz = ROOM.monitorBezel * cam.k;
  const bezel: SRect = {x: scr.x - bz, y: scr.y - bz, w: scr.w + 2 * bz, h: scr.h + 2 * bz};
  const neck = frect(cam, ROOM.monitorNeck);
  const base = frect(cam, ROOM.monitorBase);
  const desk = frect(cam, ROOM.deskTop);
  const legs = ROOM.deskLegs.map((l) => frect(cam, l));
  const floorY = apply(cam, [0, ROOM.farFloorY])[1];
  const sock = frect(cam, ROOM.socket);
  const r = (v: number) => Math.max(2, v * cam.k);
  return (
    <g>
      <rect x={-50} y={-50} width={2020} height={1180} fill={TONE.room} />
      <rect x={-50} y={floorY} width={2020} height={1200} fill={TONE.desk} />
      <path d={`M-50 ${floorY}H1970`} stroke={T.structure} strokeWidth={SW.inactive} strokeOpacity={0.55} />
      {/* desk */}
      {legs.map((l, i) => (
        <Part key={i} r={l} fill={TONE.desk} contact={false} />
      ))}
      <Part r={desk} fill={TONE.desk} radius={r(3)} />
      {/* monitor */}
      <Part r={neck} fill={TONE.mass} contact={false} />
      <Part r={base} fill={TONE.mass} radius={r(3)} />
      <Part r={bezel} fill={TONE.mass} radius={r(6)} />
      <path d={rp(scr, r(2))} fill={TONE.void} />
      {/* wall socket */}
      <Part r={sock} fill={TONE.mass} radius={r(8)} />
      <path d={rp({x: sock.x + sock.w * 0.3, y: sock.y + sock.h * 0.28, w: sock.w * 0.12, h: sock.h * 0.2}, 1)} fill={TONE.near} />
      <path d={rp({x: sock.x + sock.w * 0.58, y: sock.y + sock.h * 0.28, w: sock.w * 0.12, h: sock.h * 0.2}, 1)} fill={TONE.near} />
    </g>
  );
};

/** Screen rect of the monitor's screen (for the match cut and the M overlay). */
export const monitorScreenRect = (cam: Cam): SRect => frect(cam, ROOM.monitorScreen);

/* ------------------------------------------------------------------ stage plane */

const wakeGlyph = (r: SRect, kind: 'jack' | 'clock'): React.ReactNode => {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const s = r.w / 32;
  if (kind === 'clock') {
    return (
      <g fill="none" stroke={T.structure} strokeWidth={2.5} strokeLinecap="round">
        <path d={circlePath(cx, cy, 8.5 * s)} />
        <path d={`M${cx} ${cy}V${cy - 6 * s}M${cx} ${cy}H${cx + 4.5 * s}`} />
      </g>
    );
  }
  // network jack: a port with the latch notch
  const w = 18 * s;
  const h = 14 * s;
  const x = cx - w / 2;
  const y = cy - h / 2 + 1 * s;
  return (
    <path
      d={`M${x} ${y}H${x + w}V${y + h}H${x + w * 0.68}V${y + h + 3 * s}H${x + w * 0.32}V${y + h}H${x}Z`}
      fill="none"
      stroke={T.structure}
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  );
};

export const StagePlane: React.FC<{cam: Cam; lod: Lod; st: SetState}> = ({cam, lod, st}) => {
  const R = (b: MBox) => srect(cam, b);
  const mm = mmpx(cam);
  const caseR = R(SET.caseOuter);
  const interior = R(mb(6, 350, 8, 452));
  const board = R(SET.board);
  const psu = R(SET.psu);
  const pin24 = R(SET.pin24);
  const heat = R(SET.heatsink);
  const pch = R(SET.pch);
  const coolerC = sp(cam, SET.cooler.cx, SET.cooler.cy);
  const coolerR = SET.cooler.r * mm;
  const washOn = st.wash > 0;
  const inWash = (c: string) => (washOn ? T.textMuted : c);
  const eLod = lod === 'E';
  const showDetails = mm > 1.2 && !eLod; // E drops grommet detail, pins, regulators, header and the lead (P4)
  const capOff = st.cap * mm;

  // the button's route (lead + trace) as screen points
  const routeD = routePath(spts(cam, ROUTE_MM), 8);
  const leadD = routePath(spts(cam, LEAD_MM), 8);

  // channels
  const chan = (pts: ReadonlyArray<readonly [number, number]>) => routePath(spts(cam, pts), 10);

  // wash polygon (mm): the standby domain only, stopping at the chipset package's edge
  const washPts: Pt[] = spts(cam, [
    [230, 358],
    [261, 358],
    [261, 296],
    [252, 296],
    [252, 157.5],
    [224.5, 157.5],
    [224.5, 173],
    [233, 173],
    [233, 240],
    [230, 240],
  ]);

  return (
    <g>
      {/* case: interior tray, walls, top and floor bands, bezel */}
      <path d={rp(caseR, rad(cam, 3))} fill={TONE.mass} />
      <path d={rp(interior)} fill={TONE.tray} />
      <path d={rp({x: caseR.x + 1.5, y: caseR.y + 1.5, w: caseR.w - 3, h: caseR.h - 3}, rad(cam, 3))} fill="none" stroke={T.structure} strokeWidth={SW.inactive} />
      <path d={`M${interior.x} ${interior.y}V${interior.y + interior.h}`} stroke={T.structure} strokeWidth={2} />
      <path d={`M${interior.x + interior.w} ${interior.y}V${interior.y + interior.h}`} stroke={T.structure} strokeWidth={2} />
      <path d={`M${interior.x} ${interior.y}H${interior.x + interior.w}`} stroke={T.structure} strokeWidth={2} />

      {/* the hidden standby run, drawn only where the tray reads as dark glass (E) */}
      {lod === 'E' ? <EnergyChannel kind="standby" path={chan(STANDBY_HIDDEN_MM)} full walls shimmer={SHIMMER} frame={st.frame} /> : null}

      {/* shroud plate with grommet A */}
      <Part r={R(mb(2, 150, 100, 104))} fill={TONE.mass} width={2} contact={false} />
      <Part r={R(mb(174, 190, 100, 104))} fill={TONE.mass} width={2} contact={false} />
      <path d={rp(R(SET.grommetA), rad(cam, 1.5))} fill={TONE.far} stroke={T.structure} strokeWidth={2} />

      {/* power supply, feet, inlet, rocker, plug */}
      {SET.psuFeet.map((f, i) => (
        <Part key={i} r={R(f)} fill={TONE.mass} width={2} contact={false} />
      ))}
      <Part r={psu} radius={rad(cam, 2)} />
      <Part r={R(SET.inlet)} radius={rad(cam, 1)} width={2} contact={false} />
      <Part r={R(SET.rocker)} radius={rad(cam, 1)} width={2} contact={false} />
      {/* rocker tilt at "I": its upper face pressed in */}
      {(() => {
        const rk = R(SET.rocker);
        return <path d={`M${rk.x - 0.6 * mm} ${rk.y + rk.h * 0.15}L${rk.x + rk.w * 0.2} ${rk.y + rk.h * 0.85}`} stroke={T.textMuted} strokeWidth={2} />;
      })()}
      <Part r={R(SET.plug)} radius={rad(cam, 2.5)} />

      {/* main and standby stubs: PSU -> grommet A */}
      {!eLod ? <EnergyChannel kind="main" path={chan(STUB_A.main)} emptyColor={TONE.far} frame={st.frame} /> : null}
      <EnergyChannel kind="standby" path={chan(STUB_A.standby)} full shimmer={SHIMMER} frame={st.frame} />

      {/* motherboard */}
      <Contact r={board} />
      <path d={rp(board, rad(cam, 2))} fill={TONE.stage} />
      {washOn ? <path d={polyPath(washPts, true)} fill={TONE.wash} opacity={st.wash} /> : null}
      <path d={rp({x: board.x + 1.5, y: board.y + 1.5, w: board.w - 3, h: board.h - 3}, rad(cam, 2))} fill="none" stroke={T.structure} strokeWidth={SW.inactive} />
      {SET.holes.map(([X, Y], i) => {
        const c = sp(cam, X, Y);
        return <circle key={i} cx={c[0]} cy={c[1]} r={Math.max(2, 1.7 * mm)} fill={TONE.tray} stroke={T.structure} strokeWidth={1.5} />;
      })}
      {lod !== 'C'
        ? SET.ioCluster.map((b, i) => <Part key={i} r={R(b)} radius={rad(cam, 1)} width={2} />)
        : null}
      <Part r={R(SET.x16)} radius={rad(cam, 1)} width={2} />
      <Part r={R(SET.ssd)} radius={rad(cam, 1.5)} />
      {showDetails ? <Part r={R(SET.ssdCtrl)} radius={rad(cam, 1)} width={2} contact={false} /> : null}
      {SET.dimmSlots.map((b, i) => (
        <Part key={i} r={R(b)} radius={rad(cam, 1)} width={2} />
      ))}
      {SET.dimms.map((b, i) => (
        <Part key={i} r={R(b)} radius={rad(cam, 1)} contact={false} />
      ))}

      {/* cooler (dark glass) over the CPU; blades 2 px structure at 50% under the package */}
      <path d={circlePath(coolerC[0] + 1.5, coolerC[1] + 1.5, coolerR)} fill="none" stroke={TONE.near} strokeWidth={SW.contact} />
      <Glass d={circlePath(coolerC[0], coolerC[1], coolerR - 1.5)} />
      {lod !== 'C' && lod !== 'E' ? (
        <g stroke={T.structure} strokeOpacity={0.5} strokeWidth={2} fill="none">
          <path d={circlePath(coolerC[0], coolerC[1], SET.cooler.hub * mm)} />
          {Array.from({length: 7}, (_, i) => {
            const a0 = (i / 7) * Math.PI * 2;
            const r0 = SET.cooler.hub * mm;
            const r1 = (SET.cooler.r - 5) * mm;
            const p0: Pt = [coolerC[0] + Math.cos(a0) * r0, coolerC[1] + Math.sin(a0) * r0];
            const a1 = a0 + 0.55;
            const p1: Pt = [coolerC[0] + Math.cos(a1) * r1, coolerC[1] + Math.sin(a1) * r1];
            const am = a0 + 0.12;
            const rm = (r0 + r1) * 0.55;
            const c: Pt = [coolerC[0] + Math.cos(am) * rm, coolerC[1] + Math.sin(am) * rm];
            return <path key={i} d={`M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`} />;
          })}
        </g>
      ) : null}
      {/* the CPU package renders above the glass: dark, never lit */}
      <Part r={R(SET.cpuPkg)} radius={rad(cam, 1)} contact={false} />
      {(() => {
        // LGA1700 lid: a rectangle with a notch in each long side, and the pin-1 triangle on the substrate
        const ih = R(SET.cpuIhs);
        const n = 3.2 * mm;
        const ny = ih.y + ih.h * 0.5;
        const d =
          `M${ih.x} ${ih.y}H${ih.x + ih.w}V${ny - n}H${ih.x + ih.w - n}V${ny + n}H${ih.x + ih.w}V${ih.y + ih.h}` +
          `H${ih.x}V${ny + n}H${ih.x + n}V${ny - n}H${ih.x}Z`;
        const pk = R(SET.cpuPkg);
        const t = 3 * mm;
        // SMD capacitors on the exposed substrate (close-up detail only)
        const caps: React.ReactNode[] = [];
        if (mm > 4) {
          for (let i = 0; i < 7; i++) {
            const cx0 = pk.x + pk.w * (0.2 + i * 0.1);
            caps.push(<rect key={`t${i}`} x={cx0 - 0.5 * mm} y={pk.y + 1.4 * mm} width={1.0 * mm} height={0.6 * mm} fill={T.structure} fillOpacity={0.55} />);
            caps.push(<rect key={`b${i}`} x={cx0 - 0.5 * mm} y={pk.y + pk.h - 2.0 * mm} width={1.0 * mm} height={0.6 * mm} fill={T.structure} fillOpacity={0.55} />);
          }
        }
        return (
          <g>
            {caps}
            <path d={d} fill={TONE.mass} stroke={T.structure} strokeWidth={2} strokeLinejoin="round" />
            <path d={`M${pk.x + 1.2 * mm} ${pk.y + pk.h - 1.2 * mm}h${t}l${-t} ${-t}Z`} fill={T.structure} />
          </g>
        );
      })()}

      {/* 24-pin, grommet B, stubs into the 24-pin */}
      <path d={rp(R(SET.grommetB), rad(cam, 1.5))} fill={TONE.far} stroke={T.structure} strokeWidth={2} />
      {!eLod ? <EnergyChannel kind="main" path={chan(STUB_B.main)} emptyColor={TONE.far} frame={st.frame} /> : null}
      <EnergyChannel kind="standby" path={chan(STUB_B.standby)} full shimmer={SHIMMER} frame={st.frame} />
      <Part r={pin24} radius={rad(cam, 1)} stroke={inWash(T.structure)} />
      {showDetails
        ? Array.from({length: 24}, (_, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const c = sp(cam, 254.5 + col * 5, 304 + row * 4.1);
            const s = 2.4 * mm;
            return <rect key={i} x={c[0] - s / 2} y={c[1] - s / 2} width={s} height={s} fill={TONE.near} />;
          })
        : null}

      {/* standby regulators */}
      {showDetails
        ? SET.regs.map((b, i) => <Part key={i} r={R(b)} radius={rad(cam, 0.8)} width={2} stroke={inWash(T.structure)} />)
        : null}
      {/* firmware flash */}
      {showDetails ? <Part r={R(SET.flash)} radius={rad(cam, 0.8)} width={2} /> : null}
      {/* front-panel header */}
      {showDetails ? <Part r={R(SET.header)} radius={rad(cam, 0.8)} width={2} /> : null}

      {/* chipset: heatsink as dark glass; the package and its blocks render above it */}
      <Glass d={rp(heat, rad(cam, 3))} contact={heat} />
      <path d={rp(pch, rad(cam, 1))} fill={TONE.far} stroke={T.structure} strokeWidth={2} />

      {/* the button's route: lead (pointable) + board trace, 4 px structure; the end-tick at the header */}
      {!eLod ? <path d={routeD} fill="none" stroke={T.structure} strokeWidth={SW.route} strokeLinejoin="round" /> : null}
      {st.point > 0 ? <path d={leadD} fill="none" stroke={T.textMuted} strokeWidth={SW.route} strokeOpacity={st.point} strokeLinejoin="round" /> : null}
      {st.endTick > 0
        ? (() => {
            const e = sp(cam, 242, 120);
            const w = 12 * st.endTick;
            return <path d={`M${e[0] - w} ${e[1]}H${e[0] + w}`} stroke={T.annotation} strokeWidth={3} />;
          })()
        : null}

      {/* standby on the board: 24-pin -> regulators -> lookout (enters from the right) */}
      <EnergyChannel kind="standby" path={chan(STANDBY_BOARD_MM)} full shimmer={SHIMMER} frame={st.frame} />

      {/* the two blocks inside the chipset (positions illustrative; shapes differ) */}
      <LitPart r={R(SET.qblock)} radius={rad(cam, 1.2, 4)} light={st.qLight} glow={st.qGlow} />
      <LitPart r={R(SET.lookout)} radius={rad(cam, 1.2, 4)} light={st.lookoutLight} glow={st.lookoutGlow} breath={st.breath} />

      {/* wake sources (S11): dim, unlabelled badges with one short shared stub into the lookout */}
      {st.wake > 0 ? (
        <g opacity={st.wake}>
          <path d={polyPath(spts(cam, WAKE_STUB_MM))} stroke={T.structure} strokeWidth={3} fill="none" />
          {(['jack', 'clock'] as const).map((kind) => {
            const b = R(kind === 'jack' ? SET.wakeJack : SET.wakeClock);
            return (
              <g key={kind}>
                <path d={rp(b, 6)} fill={TONE.mass} />
                <path d={rp({x: b.x + 1.5, y: b.y + 1.5, w: b.w - 3, h: b.h - 3}, 5)} fill="none" stroke={T.structure} strokeWidth={3} />
                {wakeGlyph(b, kind)}
              </g>
            );
          })}
        </g>
      ) : null}

      {/* front bezel and the button (cap travels only on f0 and f1837) */}
      <Part r={R(SET.bezel)} fill={TONE.mass} radius={rad(cam, 2)} contact={false} />
      <Part r={R(SET.buttonBody)} width={2} contact={false} />
      {(() => {
        const c = R(SET.buttonCap);
        return <Part r={{...c, x: c.x - capOff}} radius={rad(cam, 1.5)} fill={TONE.mass} stroke={ink} width={3} contact={false} />;
      })()}
      {/* outer case outline above everything inside */}
      <path d={rp({x: caseR.x + 1.5, y: caseR.y + 1.5, w: caseR.w - 3, h: caseR.h - 3}, rad(cam, 3))} fill="none" stroke={T.structure} strokeWidth={SW.inactive} />
    </g>
  );
};

/** The PSU plug's free end and the socket's plug, joined by the cord (crosses the two planes). */
export const Cord: React.FC<{stage: Cam; far: Cam}> = ({stage, far}) => {
  const a = sp(stage, SET.plug.x0, (SET.plug.y0 + SET.plug.y1) / 2);
  const sock = frect(far, ROOM.socket);
  const b: Pt = [sock.x + sock.w * 0.5, sock.y + sock.h * 0.62];
  const sag = Math.max(10, Math.abs(a[0] - b[0]) * 0.06);
  const mid: Pt = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag];
  const w = Math.max(6, Math.min(16, 3.2 * S_Wk(stage)));
  const d = `M${a[0]} ${a[1]}Q${mid[0]} ${mid[1]} ${b[0]} ${b[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={T.structure} strokeWidth={w + 4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={TONE.mass} strokeWidth={w - 1} strokeLinecap="round" />
    </g>
  );
};
const S_Wk = (cam: Cam) => mmpx(cam);

/** Route geometry in W px (for the Bit runs; mapped through the camera at draw time). */
export const ROUTE_W: Pt[] = ROUTE_MM.map(([X, Y]) => wp(X, Y));
