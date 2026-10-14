/**
 * Style 2: Night Signal. A short film shot inside a sleeping PC: nothing glows unless it is powered or
 * carrying a signal; every cut, push and iris follows that light. Letterbox = "later"; full frame = now.
 * One set (set.ts), many cameras (camera.ts). All timing is absolute (timeline.ts, from the word JSON).
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {bitRun, routePath, breathe, progress, EASE, StateGlyph, EyeBadge, StatePill, Brackets, MONO, kitWarn, type Pt} from '../../shared';
import {F, CUES, shotAt} from './timeline';
import cuesFile from './cues.json';
import {cameraAt, apply, planeCam, SHOT_CAMS, type Cam} from './camera';
import {FarPlane, StagePlane, Cord, monitorScreenRect, ROUTE_W, type SetState} from './SetView';
import {CamBit, CamRouteLight} from './BitLayer';
import {Iris} from './Iris';
import {Slate, type SlateKey, type SizeKey} from './Slate';
import {Tag, PartName} from './Tag';
import {StopAMD, StopLaptop, STOP_AMD, STOP_LAPTOP} from './Stops';
import {Relay, relayCam} from './Relay';
import {ScreenFork} from './ScreenFork';
import {AnalogyArc} from './Analogy';
import {SET, wx, wp, PCH_C, ROOM} from './set';
import {srect} from './draw';
import {TONE, T} from './tones';

/* ------------------------------------------------------------------ the cue list cannot drift from the picture */

if (JSON.stringify((cuesFile as {cues: unknown}).cues) !== JSON.stringify(CUES)) {
  // eslint-disable-next-line no-console
  console.warn('[kit] style2 cues.json differs from timeline.ts CUES: regenerate cues.json');
}

/* ------------------------------------------------------------------ runs (W px) */

const ROUTE_D = routePath(ROUTE_W, 8);
const FF_RUN = bitRun({path: ROUTE_D, depart: F.ffDepart, land: F.ffLand, label: 'ff'});
const S04_RUN = bitRun({path: ROUTE_D, depart: F.s04Depart, land: F.s04Land, label: 'S04'});
// S12: leaves 2 frames after contact; it would land on "power" at f1891 (outside the intro). A documented
// long run (52 frames): the camera leans in, the brand's "the view tightens" for a run over 30 frames.
const REAL_RUN = bitRun({path: ROUTE_D, depart: F.realDepart, land: F.nextLand, allowLong: true, label: 'S12'});

/* ------------------------------------------------------------------ slate */

// Rolls that carry a word ("When pressed", "Intel desktop", "Now") start 5 frames early so the word is
// readable on its anchor frame (f441, f1321, f1830), as the proposal times them.
const SLATE: SlateKey[] = [
  {at: F.chipIn, label: 'After the press'},
  {at: F.returnStart, label: 'Soft-off'},
  {at: F.whenPressedRoll, label: 'When pressed'},
  {at: F.whenPressedOut, label: 'Soft-off'},
  {at: F.cutP, label: 'After the press', cut: true},
  {at: F.cutW2, label: 'Soft-off', cut: true},
  {at: F.intelRoll, label: 'Intel desktop'},
  {at: F.slateSoftOff2, label: 'Soft-off'},
  {at: F.nowRoll, label: 'Now'},
];
const SIZES: SizeKey[] = [
  {at: 0, size: 44},
  {at: F.slateSmall1, size: 34},
  {at: F.whenPressedRoll, size: 44},
  {at: F.whenPressedOut, size: 34},
  {at: F.slateBig1, size: 44},
  {at: F.slateSmall2, size: 34},
  {at: F.cutP, size: 44, cut: true},
  {at: F.slateSmall3, size: 34},
  {at: F.intelRoll, size: 44},
  {at: F.slateSmall4, size: 34},
  {at: F.nowRoll, size: 44},
];

/* ------------------------------------------------------------------ state of the machine */

const capMM = (f: number): number => {
  const one = (a: number, inEnd: number, outS: number, outE: number) =>
    f < a || f > outE ? 0 : f <= inEnd ? 4 * progress(f, a, inEnd - a, EASE.outCubic) : f < outS ? 4 : 4 * (1 - progress(f, outS, outE - outS, EASE.inOutCubic));
  return Math.max(one(F.press, F.capInEnd, F.capOutStart, F.capOutEnd), one(F.realPress, F.realCapInEnd, F.realCapOutStart, F.realCapOutEnd));
};

const machine = (f: number): SetState => {
  // flash-forward only: the "?" works f294–f334 and the glow moves to it; the relight lands on f335
  const qOn = f >= F.qWakes && f < F.relight ? progress(f, F.qWakes, 6, EASE.arrive) : f >= F.relight && f < F.relight + 2 ? 1 - progress(f, F.relight, 2) : 0;
  return {
    frame: f,
    lookoutLight: 1,
    lookoutGlow: 1 - qOn,
    qLight: qOn,
    qGlow: qOn,
    breath: breathe(f),
    point: f >= F.pointOn && f < F.pointOff ? 1 : 0,
    endTick: f >= F.endTick && f < F.pointOff ? progress(f, F.endTick, 4, EASE.arrive) : 0,
    wash: f >= F.wash ? progress(f, F.wash, 8, EASE.arrive) : 0,
    wake: f >= F.wakeBadges ? progress(f, F.wakeBadges, 6, EASE.arrive) * (1 - progress(f, F.s11TagsOut, 6, EASE.exit)) : 0,
    cap: capMM(f),
  };
};

/* ------------------------------------------------------------------ the iris (canonical: on the chipset) */

const IRIS_C: Pt = wp(PCH_C.X, PCH_C.Y);
const IRIS_D = 300;
const ZOOM = 4;
const detailCam = (stage: Cam): Cam => {
  // x4 about the chipset centre, drawn natively (strokes stay constant on screen)
  const c = apply(stage, IRIS_C);
  const k = stage.k * ZOOM;
  return {k, T: [c[0] - k * IRIS_C[0], c[1] - k * IRIS_C[1]]};
};
const DCAM_W = detailCam({k: 1, T: [0, 0]});
const LOOKOUT_D = srect(DCAM_W, SET.lookout); // the magnified lookout in W (for the f714 match cut)
const LOOKOUT_D_C: Pt = [LOOKOUT_D.x + LOOKOUT_D.w / 2, LOOKOUT_D.y + LOOKOUT_D.h / 2];

const Letterbox: React.FC<{h: number}> = ({h}) =>
  h <= 0 ? null : (
    <g>
      <rect x={0} y={0} width={1920} height={h} fill={TONE.void} />
      <rect x={0} y={1080 - h} width={1920} height={h} fill={TONE.void} />
    </g>
  );

const barsAt = (f: number): number => {
  const s = shotAt(f);
  if (!s.letterbox) return 0;
  if (s.id === 'W' && f >= F.returnStart) return 138 * (1 - progress(f, F.returnStart, F.barsFrames, EASE.move));
  return 138;
};

/** K-designed screen points -> W px (so K's labels ride their parts through the K -> W pull-back). */
const KC = planeCam(SHOT_CAMS.K, 1);
const fromK = (p: Pt): Pt => [(p[0] - KC.T[0]) / KC.k, (p[1] - KC.T[1]) / KC.k];
const EC = planeCam(SHOT_CAMS.E, 1);
const fromE = (p: Pt): Pt => [(p[0] - EC.T[0]) / EC.k, (p[1] - EC.T[1]) / EC.k];

/** The "0 instructions" readout (mono numerals, only for what the narration says). */
const Readout: React.FC<{x: number; y: number; op: number; dy?: number}> = ({x, y, op, dy = 0}) =>
  op <= 0 ? null : (
    <foreignObject x={x} y={y} width={420} height={140}>
      <div style={{opacity: op, transform: `translateY(${dy}px)`, display: 'flex', flexDirection: 'column'}}>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 64, lineHeight: 1.0, color: T.ink}}>0</div>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 38, lineHeight: 1.2, color: T.textMuted}}>instructions</div>
      </div>
    </foreignObject>
  );

/* ------------------------------------------------------------------ composition */

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotAt(f);
  const cam = cameraAt(f);
  const st = machine(f);
  const S = cam.stage;
  const m = (p: Pt): Pt => apply(S, p); // W px -> screen
  const dcam = detailCam(S);
  const ic = m(IRIS_C);
  const qBox = srect(S, SET.qblock);
  const qBoxD = srect(dcam, SET.qblock);
  const lkD = srect(dcam, SET.lookout);
  const psu = srect(S, SET.psu);
  const cap = srect(S, SET.buttonCap);
  const capAnchor: Pt = [cap.x + 6, cap.y + cap.h / 2];

  // ---- shot-specific layers
  let content: React.ReactNode = null;
  if (shot.id === 'P') {
    const rc = relayCam(f, LOOKOUT_D_C, LOOKOUT_D.w);
    content = <Relay frame={f} cam={rc} />;
  } else {
    const scr = monitorScreenRect(cam.far);
    const bz = ROOM.monitorBezel * cam.far.k;
    content = (
      <g>
        <FarPlane cam={cam.far} lod={cam.lod} />
        <Cord stage={S} far={cam.far} />
        <StagePlane cam={S} lod={cam.lod} st={st} />
        <CamRouteLight frame={f} cam={S} runs={[FF_RUN, S04_RUN, REAL_RUN]} />
        <CamBit frame={f} cam={S} runs={FF_RUN} />
        <CamBit frame={f} cam={S} runs={S04_RUN} />
        <CamBit frame={f} cam={S} runs={REAL_RUN} />
        {/* the "?" badge, docked above the "?" block's top-right (outlined; fills only on "hidden"). Drawn in K
            too (the chipset is in K's frame), so it no longer pops on when the K -> W pull-back starts (f1681). */}
        {cam.lod === 'W' || cam.lod === 'K' ? <StateGlyph x={qBox.x + qBox.w} y={qBox.y} state="UNNAMED" fillAt={F.hiddenTag} unfillAt={F.qUnfill} /> : null}

        {/* iris 1 (S02): opens on "smaller"; the "?" wakes inside it on "already". At x4 the blocks are big enough
            for their pips (proposal: "in the iris its pip breathes"): the lookout's ALWAYS-ON pip, and the "?"'s
            ON pip only while it works in the flash-forward (f294–f334). Docked inside: outside would sit in the
            gap between the two blocks. */}
        <Iris frame={f} cx={ic[0]} cy={ic[1]} d={IRIS_D} openAt={F.iris1Open} closeAt={F.iris1Close} chip="×4" chipDeg={90} interior={TONE.glass} clipId="iris1">
          <StagePlane cam={dcam} lod="W" st={st} />
          <StateGlyph x={qBoxD.x + qBoxD.w} y={qBoxD.y} state="UNNAMED" />
          <StateGlyph x={lkD.x + lkD.w} y={lkD.y} dock="inside" state="ALWAYS_ON" />
          {f >= F.qWakes ? <StateGlyph x={qBoxD.x + qBoxD.w} y={qBoxD.y} dock="inside" state="ON" inAt={F.qWakes} outAt={F.relight} /> : null}
        </Iris>
        {/* iris 2 (S04–S05): opens on "circuit"; D24: grey rim f663–f669, the "?" fills on "not" (f671) */}
        <Iris frame={f} cx={ic[0]} cy={ic[1]} d={IRIS_D} openAt={F.iris2Open} settleAt={F.settle} endAt={F.cutP} chip="×4" chipDeg={90} interior={TONE.glass} clipId="iris2">
          <StagePlane cam={dcam} lod="W" st={st} />
          <StateGlyph x={qBoxD.x + qBoxD.w} y={qBoxD.y} state="UNNAMED" fillAt={F.qFill} />
          <StateGlyph x={lkD.x + lkD.w} y={lkD.y} dock="inside" state="ALWAYS_ON" />
          <EyeBadge x={lkD.x + lkD.w * 0.5} y={lkD.y + lkD.h * 0.44} width={60} inAt={F.eyeIn} />
        </Iris>

        {/* ---- S07: the imagined link from one tap to a sign-in screen (outside the black monitor) */}
        <AnalogyArc f={f} from={[cap.x + cap.w / 2, cap.y - 4]} arcIn={F.arcIn} cardIn={F.cardIn} out={F.signInOut} />

        {/* ---- M: the fork */}
        {shot.id === 'M' ? <ScreenFork f={f} bezelRight={scr.x + scr.w + bz} cy={scr.y + scr.h / 2} /> : null}

        {/* ---- E: the stops, side by side above the desk (unlit, flat) */}
        {shot.id === 'E' ? (
          <g>
            <StopAMD frame={f} at={F.stopAMDReveal} out={F.stopsOut} clipId="stopA" />
            <StopLaptop frame={f} at={F.stopLaptopReveal} out={F.stopsOut} clipId="stopL" />
            <Tag frame={f} anchor={[STOP_AMD.x + 12, STOP_AMD.y + 160]} lines={['Stop: AMD']} role="muted" land={F.stopAMD} exitAt={F.stopsOut} plate={TONE.room} />
            <Tag frame={f} anchor={[STOP_LAPTOP.x + 12, STOP_LAPTOP.y + 160]} lines={['Stop: laptops']} role="muted" land={F.stopLaptop} exitAt={F.stopsOut} plate={TONE.room} />
          </g>
        ) : null}
      </g>
    );
  }

  // ---- labels on the hardware (positions in W px, mapped through the camera)
  const W1 = shot.id === 'W' && f < F.cutC;
  const W2 = shot.id === 'W' && f >= F.cutW1 && f < F.cutP;
  const W3 = shot.id === 'W' && f >= F.cutW2 && f < F.cutM;
  const W4 = shot.id === 'W' && f >= F.pullKW;
  const C = shot.id === 'C';
  const E = shot.id === 'E';
  const K = shot.id === 'K' || (W4 && f < F.rearOut + 6);
  const tag = (props: Omit<React.ComponentProps<typeof Tag>, 'frame'>) => <Tag frame={f} {...props} />;

  return (
    <AbsoluteFill style={{background: TONE.room}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {content}

        {/* S01 + S03: the button */}
        {W1 ? tag({anchor: capAnchor, end: [1500, capAnchor[1]], lines: ['Power', 'button'], land: F.powerButtonTag, exitAt: F.powerButtonTagOut, plate: TONE.room}) : null}
        {W2 && f >= F.powerButtonTag2 - 6 ? tag({anchor: capAnchor, end: [1500, capAnchor[1]], lines: ['Power', 'button'], land: F.powerButtonTag2, exitAt: F.powerButtonTag2Out, plate: TONE.room}) : null}

        {/* S01: the main processor, big and dark (left rail) */}
        {W1 || (W2 && f < F.returnStart + 6)
          ? tag({anchor: [wx(79.25) + 6, 322], end: [560, 322], side: 'left', lines: ['Main processor'], land: W1 ? F.mainProcTag : F.cutW1, instant: !W1, exitAt: W2 ? F.returnTagsOut : undefined, plate: TONE.room})
          : null}
        {W1 ? tag({anchor: [wx(79.25) + 8, 412], elbow: [wx(79.25) + 8, 437], end: [560, 437], side: 'left', lines: ['Not first'], land: F.notFirstTag, plate: TONE.room}) : null}

        {/* S02a: the CPU insert (package x 723–1097, y 315–765; the cooler's disc centred (910, 540), r 475).
            Both tags sit 25 px or more inside the disc's rim (they touched it before the review). */}
        {C ? (
          <g>
            {tag({anchor: [850, 322], end: [850, 254], lines: ['Main processor'], land: F.cutC, instant: true, plate: TONE.glass})}
            {tag({anchor: [1090, 440], end: [1130, 440], lines: ['Not first'], land: F.cutC, instant: true, exitAt: F.notFirstOut, plate: TONE.glass})}
            <Readout x={742} y={790} op={progress(f, F.readoutIn - 6, 6, EASE.arrive)} dy={(1 - progress(f, F.readoutIn - 6, 6, EASE.arrive)) * 8} />
          </g>
        ) : null}
        {W2 ? <Readout x={190} y={430} op={1 - progress(f, F.returnTagsOut, 6, EASE.exit)} /> : null}

        {/* S02b: the iris tags (left of the ring, leaders cross it) */}
        {W2 ? tag({anchor: [qBoxD.x + 4, qBoxD.y + qBoxD.h / 2], elbow: [924, qBoxD.y + qBoxD.h / 2 + 36], end: [884, qBoxD.y + qBoxD.h / 2 + 36], side: 'left', lines: ['Smaller', 'processor'], land: F.smallerTag, exitAt: F.iris1Close, plate: TONE.stage}) : null}
        {W2 && f >= F.alwaysOnTag - 6 ? tag({anchor: [lkD.x + 4, lkD.y + lkD.h * 0.5], elbow: [930, lkD.y + lkD.h * 0.5 - 30], end: [890, lkD.y + lkD.h * 0.5 - 30], side: 'left', lines: ['Always-on', 'logic'], land: F.alwaysOnTag, plate: TONE.stage}) : null}

        {/* S03: main power OFF, docked inside the supply's body */}
        {(W2 || W1) && f >= F.mainPowerPill ? <StatePill x={psu.x + 16} y={psu.y + 16} dock="none" label="Main power: OFF" inAt={F.mainPowerPill} outAt={F.mainPowerPillOut} /> : null}

        {/* S07 */}
        {W3 ? tag({anchor: [qBox.x + 4, qBox.y + qBox.h / 2], end: [976, qBox.y + qBox.h / 2], side: 'left', lines: ['Hidden', 'processor?'], land: F.hiddenTag, exitAt: F.s07TagsOut, plate: TONE.stage}) : null}
        {W3 ? tag({anchor: capAnchor, end: [1500, capAnchor[1]], lines: ['One tap'], land: F.oneTapTag, exitAt: F.s07TagsOut, plate: TONE.room}) : null}
        {W3 ? tag({anchor: [1540, 426], end: [1540, 506], lines: ['Sign-in', 'screen'], land: F.signInTag, exitAt: F.signInOut, plate: TONE.room}) : null}

        {/* S10a (E): standby power, anchored at the 24-pin end, set in the case's top space */}
        {E && f >= F.standbyTag - 6
          ? tag({anchor: [820, 517], end: [820, 350], side: 'left', lines: ['Standby power'], secondary: '+5VSB · ATX', role: 'standby', land: F.standbyTag, plate: TONE.tray})
          : null}

        {/* S10b–c (K): the supply's rear end; labels ride their parts into the pull-back and exit by f1691 */}
        {K
          ? (() => {
              const mk = (p: Pt) => m(fromK(p));
              return (
                <g>
                  {tag({anchor: mk([1204, 562]), end: mk([1330, 562]), lines: ['Standby power'], secondary: '+5VSB · ATX', role: 'standby', land: F.cutK, instant: true, exitAt: F.kTagsOut, plate: TONE.tray})}
                  {f >= F.psuName - 6 ? <PartName frame={f} cx={mk([880, 800])[0]} cy={mk([880, 800])[1]} lines={['Power supply']} land={F.psuName} exitAt={F.kTagsOut} /> : null}
                  {f >= F.mainRailsPill ? <StatePill x={mk([768, 598])[0]} y={mk([768, 598])[1]} dock="none" label="Main rails: OFF" inAt={F.mainRailsPill} outAt={F.kTagsOut} /> : null}
                  {/* 12 px higher than built: its plate cut the K floor line (y 833) */}
                  {tag({anchor: mk([440, 737]), elbow: mk([440, 788]), end: mk([430, 788]), side: 'left', lines: ['Plugged in'], land: F.pluggedTag, exitAt: F.kTagsOut, plate: TONE.room})}
                  {tag({anchor: mk([486, 618]), elbow: mk([486, 470]), end: mk([466, 470]), side: 'left', lines: ['Rear switch'], land: F.rearTag, exitAt: F.rearOut, plate: TONE.room})}
                  {f >= F.rearTag ? <StatePill x={mk([472.6, 601.3])[0]} y={mk([472.6, 601.3])[1]} dock="top-left" label="ON" inAt={F.rearTag} outAt={F.kTagsOut} /> : null}
                </g>
              );
            })()
          : null}

        {/* S11 (W): standby-powered domain, wake sources, the brackets */}
        {W4 && f >= F.railsPillBack ? <StatePill x={m([599.8, 850.8])[0]} y={m([599.8, 850.8])[1]} dock="none" label="Main rails: OFF" inAt={F.railsPillBack} /> : null}
        {W4 ? tag({anchor: [1200, 244], end: [1200, 160], side: 'left', lines: ['Standby-powered'], role: 'standby', land: F.standbyPoweredTag, exitAt: F.s11TagsOut, plate: TONE.tray}) : null}
        {W4 ? tag({anchor: [972, 673], end: [930, 673], side: 'left', lines: ['Wake', 'sources'], land: F.wakeTag, exitAt: F.s11TagsOut, plate: TONE.stage}) : null}
        {W4 ? <Brackets box={{x: cap.x - 2, y: cap.y - 2, w: cap.w + 4, h: cap.h + 4}} lockAt={F.lock} fadeAt={F.bracketsFade} /> : null}

        <Letterbox h={barsAt(f)} />
        <Slate frame={f} labels={SLATE} sizes={SIZES} />
      </svg>
    </AbsoluteFill>
  );
};

export default Intro;
void fromE;
void kitWarn;
