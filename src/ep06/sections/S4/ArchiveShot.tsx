// S4 archive shots: P08's mechanism (read the unused card, follow its directions, copy out; reused → scan for the
// header) and P09 (the three writes; after the slot stage, the race). One Archive, one camera track; the recovery
// scanner stands in the right foreground (hud layer) with its beam aimed at world anchors.
import React from 'react';
import {
  Archive,
  EASE,
  Footnote,
  KineticText,
  Label,
  PAL,
  PHOTO,
  QuoteStrip,
  ScannerProp,
  Stage,
  archiveAnchors,
  archiveCam,
  boxC,
  boxXY,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  scannerAnchors,
  toScreen,
  win,
  type ArchiveEvent,
  type CamKey,
  type Pose,
} from '../../kit';
import {CUT, T} from './t';
import {BeamCore, Ground, HeaderRing, LostRing} from './fx';
import {Tally, TALLY_EXIT} from './Tally';

/* ---------------------------------------------------------------- camera */
const CARDZ = {x: 380, y: 330, zoom: 2.3};
const PW = {x: 1010, y: 520, zoom: 0.9};
const PW2 = {x: 992, y: 514, zoom: 0.95};
const DR = archiveCam('drawer');
const PS = {x: 1240, y: 560, zoom: 1.15};
const HD = archiveCam('header');
const PR = {x: 1370, y: 520, zoom: 1.4};
const PR2 = {x: 1360, y: 516, zoom: 1.5};
const PR3 = {x: 1352, y: 524, zoom: 1.42};
const WL = archiveCam('wall');
export const ARCH_CAM: CamKey[] = [
  {f: CUT.zt, ...CARDZ},
  {f: T.aTool - 2, ...PW, ease: 'cam'},
  {f: T.ifACard + 2, ...PW2, ease: 'inOut'},
  {f: T.reused - 6, ...DR, dur: 30, ease: 'cam'},
  {f: T.someTools - 6, x: DR.x + 10, y: DR.y + 4, zoom: DR.zoom * 1.05},
  {f: T.scan - 2, ...PS, dur: 20, ease: 'whip'},
  {f: T.looking + 6, x: PS.x - 20, y: PS.y, zoom: PS.zoom * 1.03},
  {f: T.header + 2, ...HD, dur: 30, ease: 'cam'},
  {f: T.p9 + 4, x: HD.x, y: HD.y + 2, zoom: HD.zoom * 1.06},
  {f: T.fail + 18, ...PR, dur: 40, ease: 'cam'},
  {f: T.next, x: PR.x - 6, y: PR.y, zoom: PR.zoom * 1.01},
  {f: CUT.whip2 + 12, ...PR2, ease: 'inOut'},
  {f: CUT.whip3, ...PR3, dur: 1},
  {f: T.to - 20, x: PR3.x - 8, y: PR3.y, zoom: PR3.zoom * 1.02, ease: 'inOut'},
  {f: T.to, ...WL, ease: 'inOut'},
  {f: T.to + 40, ...WL},
];
export const archPose = (f: number) => poseAt(f, ARCH_CAM);
const fromScreen = (p: Pose, sx: number, sy: number) => {
  const r = (-p.rot * Math.PI) / 180;
  const dx = sx - 960;
  const dy = sy - 540;
  return {x: p.x + (dx * Math.cos(r) - dy * Math.sin(r)) / p.zoom, y: p.y + (dx * Math.sin(r) + dy * Math.cos(r)) / p.zoom};
};

/* ---------------------------------------------------------------- the scanner in the foreground (screen px) */
const SC_A = {x: 1600, y: 842, w: 640};
const SC_B = {x: 1612, y: 838, w: 640};
/** the race: closer, so the tray's missing bands read */
const SC_R = {x: 1585, y: 872, w: 720};
const scannerAt = (f: number, pose: Pose, base: {x: number; y: number; w: number}, ref: {x: number; y: number}) => {
  const zp = clamp01((Math.log(pose.zoom) - Math.log(1.15)) / (Math.log(HD.zoom) - Math.log(1.15)));
  const px = clamp01(1 - zp) * -(pose.x - ref.x) * pose.zoom * 0.1;
  const py = clamp01(1 - zp) * -(pose.y - ref.y) * pose.zoom * 0.1;
  return {x: base.x + px + 150 * zp, y: base.y + py + 90 * zp + 3 * Math.sin(f / 23), w: base.w * (1 + 0.22 * zp)};
};

/* ---------------------------------------------------------------- the race schedule (copies in order, tray partial) */
const LOST = [1, 4, 7];
export const RACE = (() => {
  const trayAt = T.so + 12;
  const fillDur = 116;
  const F: number[] = [];
  for (let i = 0; i < 9; i++) {
    const target = (i + 0.55) / 9;
    let fr = trayAt;
    while (fr < trayAt + fillDur && EASE.inOut((fr - trayAt) / fillDur) < target) fr++;
    F.push(fr);
  }
  const copy = F.map((x) => x - 17);
  const missing = LOST.map((i) => ({at: F[i] - 2, y0: i / 9 + 0.012, y1: (i + 1) / 9 - 0.012}));
  return {trayAt, fillDur, F, copy, missing};
})();

/* ---------------------------------------------------------------- tray targets (world) for copyOut */
const trayWorld = (f: number, base: {x: number; y: number; w: number}, ref: {x: number; y: number}) => {
  const pose = archPose(f);
  const s = scannerAt(f, pose, base, ref);
  const a = scannerAnchors({x: s.x, y: s.y, w: s.w});
  return fromScreen(pose, a.trayCardTop.x, a.trayCardTop.y + 30);
};
const REF_A = {x: PW.x, y: PW.y};
const REF_B = {x: PR.x, y: PR.y};
const SCAN_DUR = 96;
const HIT = {download: T.download - 5, update: T.update - 5, temp: T.temp - 5};

export const EVENTS: ArchiveEvent[] = [
  {at: T.follow, op: 'readPulse', dur: 34},
  {at: T.copy, op: 'copyOut', target: 'photo', dur: 30, to: trayWorld(T.copy + 22, SC_A, REF_A)},
  {at: T.reused, op: 'reuse'},
  {at: T.scan, op: 'scan', dur: SCAN_DUR},
  {at: HIT.download, op: 'overwrite', target: 59},
  {at: HIT.update, op: 'overwrite', target: 99},
  {at: HIT.temp, op: 'overwrite', target: 22},
  ...PHOTO.map((id, i): ArchiveEvent => ({at: RACE.copy[i], op: 'copyOut', target: id, dur: 18, to: trayWorld(RACE.copy[i] + 14, SC_R, REF_B)})),
];

/* ---------------------------------------------------------------- shot */
export const ArchiveShot: React.FC<{f: number}> = ({f}) => {
  const A = {frame: f, state: 'HDD_DELETED' as const, light: 'scan' as const, events: EVENTS};
  const pose = archPose(f);
  const an = archiveAnchors(A, f, pose);
  const S = (p: {x: number; y: number}) => toScreen(pose, p.x, p.y);
  const race = f >= CUT.whip3;
  const hud: React.ReactNode[] = [];

  /* ---- P08: scanner A reads the unused card, follows its directions, copies out */
  if (!race && f < T.ifACard + 26) {
    const s = scannerAt(f, pose, SC_A, REF_A);
    const card = S(an.card);
    let tgt = {x: card.x, y: card.y, rx: 150 * pose.zoom, ry: 96 * pose.zoom};
    if (f >= T.follow) {
      const runs = an.runs.map(S);
      const u = clamp01((f - T.follow) / (T.copy - 6 - T.follow)) * 3;
      const i = Math.min(2, Math.floor(u));
      const k = EASE.inOut(u - i);
      const from = i === 0 ? card : runs[i - 1];
      const r0 = i === 0 ? 150 : 70;
      tgt = {x: lerp(from.x, runs[i].x, k), y: lerp(from.y, runs[i].y, k), rx: lerp(r0, 70, k) * pose.zoom, ry: lerp(r0 * 0.64, 40, k) * pose.zoom};
    }
    if (f >= T.copy - 6) {
      const c = S({x: 1176, y: 520});
      const k = EASE.inOut(prog(f, T.copy - 6, 12));
      tgt = {x: lerp(tgt.x, c.x, k), y: lerp(tgt.y, c.y, k), rx: lerp(tgt.rx, 330 * pose.zoom, k), ry: lerp(tgt.ry, 240 * pose.zoom, k)};
    }
    hud.push(<Ground key="gA" s={s} f={f} on={prog(f, T.aTool - 4, 14) * (1 - prog(f, T.ifACard + 4, 14))} />);
    hud.push(<BeamCore key="bcA" s={s} tgt={tgt} op={win(f, T.read - 4, T.ifACard + 2, 6, 6)} f={f} />);
    hud.push(
      <ScannerProp
        key="scA"
        frame={f}
        {...s}
        enter={{kind: 'slide', at: T.aTool - 4, from: 'right', dist: 760}}
        exit={{kind: 'slide', at: T.ifACard + 4, to: 'right', dur: 18}}
        shadow={false}
        rim={{color: '#DCE6F7', strength: 0.6}}
        sweep={{at: [T.aTool + 14], dur: 30}}
        beam={{at: T.read - 4, until: T.ifACard + 2}}
        beamTo={tgt}
        scan={{at: T.read, dur: 22, every: 32, until: T.ifACard}}
        tray="photo"
        trayAt={T.copy + 12}
        fillDur={34}
        copyBits={false}
      />,
    );
  }

  /* ---- P08 second half + P09 first half: scanner B scans for the header, then waits on 021 */
  if (!race && f >= T.scan - 10) {
    const s = scannerAt(f, pose, SC_B, REF_B);
    const u = clamp01((f - T.scan) / SCAN_DUR);
    const bandX = lerp(712 - 140, 712 + 1144 + 140, EASE.inOut(u));
    const band = S({x: bandX, y: 560});
    const h = S(an.header);
    const b21 = S(boxC(21));
    const kH = EASE.inOut(prog(f, T.header - 14, 14));
    const kB = EASE.inOut(prog(f, T.p9 + 10, 30));
    const hx = lerp(h.x, b21.x, kB);
    const hy = lerp(h.y, b21.y, kB);
    const tgt = {x: lerp(band.x, hx, kH), y: lerp(band.y, hy, kH), rx: lerp(70, 34 * pose.zoom, kH), ry: lerp(250, lerp(12, 26, kB) * pose.zoom, kH)};
    hud.push(<Ground key="gB" s={s} f={f} on={prog(f, T.scan - 10, 14)} />);
    hud.push(<BeamCore key="bcB" s={s} tgt={tgt} op={win(f, T.scan + 2, undefined, 6, 6) * (1 - 0.5 * prog(f, T.p9 + 10, 30))} f={f} />);
    hud.push(
      <ScannerProp
        key="scB"
        frame={f}
        {...s}
        enter={{kind: 'slide', at: T.scan - 10, from: 'right', dist: 760}}
        shadow={false}
        rim={{color: '#DCE6F7', strength: 0.6}}
        sweep={{at: [T.scan + 20, T.next + 10], dur: 30}}
        beam={{at: T.scan + 2}}
        beamTo={tgt}
        scan={{at: T.scan + 4, dur: 26, every: 44, until: T.p9}}
      />,
    );
  }

  /* ---- the race: scanner B copies the boxes in order */
  if (race) {
    const s = scannerAt(f, pose, SC_R, REF_B);
    let i = 0;
    for (let k = 0; k < 9; k++) if (f >= RACE.copy[k] - 4) i = k;
    const b = S(boxC(PHOTO[i]));
    const bPrev = S(boxC(PHOTO[Math.max(0, i - 1)]));
    const k = EASE.inOut(prog(f, RACE.copy[i] - 4, 5));
    const tgt = {x: lerp(bPrev.x, b.x, k), y: lerp(bPrev.y, b.y, k), rx: 40 * pose.zoom, ry: 26 * pose.zoom};
    hud.push(<Ground key="gR" s={s} f={f} on={1 - prog(f, T.to - 22, 14)} />);
    hud.push(<BeamCore key="bcR" s={s} tgt={tgt} op={win(f, CUT.whip3 - 4, T.to - 22, 6, 6)} f={f} />);
    hud.push(
      <ScannerProp
        key="scR"
        frame={f}
        {...s}
        exit={{kind: 'slide', at: T.to - 22, to: 'right', dur: 16}}
        shadow={false}
        rim={{color: '#DCE6F7', strength: 0.6}}
        beam={{at: CUT.whip3 - 4, until: T.to - 22}}
        beamTo={tgt}
        tray="partial"
        trayAt={RACE.trayAt}
        fillDur={RACE.fillDur}
        missing={RACE.missing}
        copyBits={false}
      />,
    );
  }

  /* ---- world overlays: the card under the reading beam, the unused tab, lost rings in the race */
  const cardGlow = prog(f, T.read - 2, 8) * (1 - prog(f, T.follow + 14, 12));
  const flagGlow = f >= T.flagged && f < T.flagged + 40 ? Math.sin(((f - T.flagged) / 40) * Math.PI) : 0;
  const world = (
    <>
      <Archive {...A} />
      {cardGlow > 0.01 ? (
        <div style={{position: 'absolute', left: an.card.x - 260, top: an.card.y - 170, width: 520, height: 340, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.3 * cardGlow)}, rgba(255,255,255,0))`}} />
      ) : null}
      {flagGlow > 0.01 ? (
        <div style={{position: 'absolute', left: an.flag.x - 90, top: an.flag.y - 60, width: 180, height: 120, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.loss, 0.55 * flagGlow)}, rgba(0,0,0,0))`}} />
      ) : null}
      <HeaderRing f={f} at={T.header} x={an.header.x} y={an.header.y - 9} />
      {race
        ? LOST.map((i) => {
            const p = boxXY(PHOTO[i]);
            return <LostRing key={i} f={f} at={RACE.copy[i] + 1} x={p.x} y={p.y} />;
          })
        : null}
    </>
  );

  /* ---- hud text */
  if (!race) {
    hud.push(<QuoteStrip key="q" frame={f} at={T.fileData} exitAt={T.recoveredEnd + 15} source="Microsoft · Windows File Recovery page" quote="…the file data can still exist and be recovered." />);
    // "Reused" stamp rides on the card
    const c = S(an.card);
    if (f >= T.reused - 2 && f < T.scan + 10)
      hud.push(
        <div key="reused" style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${c.x + 200}px ${c.y + 150}px`, transform: 'rotate(-7deg)'}}>
          <KineticText frame={f} at={T.reused} text="Reused" x={c.x + 200} y={c.y + 150} size={104} mode="slam" exitAt={T.someTools + 2} backing="plate" />
        </div>,
      );
    hud.push(<KineticText key="some" frame={f} at={T.someTools} text="Some tools scan the boxes" x={960} y={104} size={80} mode="rise" stagger={4} exitAt={T.p9 + 8} />);
    const hn = S({x: an.header.x, y: an.header.y - 9});
    hud.push(<Label key="hdr" frame={f} at={T.header} text="Distinctive header" x={hn.x - 150} y={hn.y - 120} to={{x: hn.x, y: hn.y}} side="left" size={52} exitAt={T.p9 + 8} />);
    hud.push(<KineticText key="free" frame={f} at={T.free1} text="Free means free" x={960} y={118} size={110} mode="pop" stagger={Math.round((T.free2 - T.free1) / 2)} exitAt={T.freeEnd + 18} />);
    // the three writes
    const tag = (key: string, at: number, id: number, text: string, dx: number, dy: number) => {
      const c0 = boxC(id);
      const top = S({x: c0.x, y: c0.y + (dy < 0 ? -34 : 34)});
      hud.push(<Label key={key} frame={f} at={at} text={text} x={top.x + dx} y={top.y + dy} to={top} side="right" size={50} accent={PAL.loss} />);
    };
    tag('dl', T.download, 59, 'download', 46, -92);
    tag('up', T.update, 99, 'update', 56, -96);
    tag('tmp', T.temp, 22, 'temporary file', 40, -84);
  } else {
    hud.push(<KineticText key="race" frame={f} at={T.race} text="Recovery is a race" x={960} y={112} size={100} mode="pop" stagger={10} exitAt={T.to - 24} />);
    hud.push(<Footnote key="fn" frame={f} at={T.race + 12} text="Illustrative" exitAt={TALLY_EXIT} />);
  }
  if (f >= T.download - 12) hud.push(<Tally key="tally" f={f} />);

  const shakes = [
    {at: T.download + 1, strength: 0.5},
    {at: T.update + 1, strength: 0.5},
    {at: T.temp + 1, strength: 0.6},
    {at: T.reused + 2, strength: 0.25},
  ];
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'scan'}} cam={ARCH_CAM} shake={shakes} hud={<>{hud}</>}>
      {world}
    </Stage>
  );
};
