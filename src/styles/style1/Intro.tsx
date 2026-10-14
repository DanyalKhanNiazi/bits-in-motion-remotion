/**
 * Style 1, Bench Notebook: the Episode 01 intro (f0–f1889), as an engineer's bench notebook open at a
 * two-page spread that RUNS. The left page is the real machine in nib ink (the present, soft-off, never
 * wiped); the right page holds the black screen and a growing column of filed result notes.
 * Tracing paper is "when": the flash-forward and the S06 preview are sheets laid over the unchanged
 * present and slid away again. The camera is locked at 1.0 for all 1,890 frames.
 *
 * Layers, bottom to top: paper → notes → screen → machine (+ Bits) → marker swipe → cards →
 * flash-forward sheet → list sheet → pencil analogy → Lens → tags/pills/headers → brackets.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Brackets, EASE, KitProvider, bitRun, progress} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Spread, WitnessScreen} from './spread';
import {LitRoute, Machine, RouteBit, cruiseRun, pageChip, sheetChip} from './machine';
import {TracingSheet} from './sheet';
import {ChainList} from './chain';
import {Notes, RuledLines} from './notes';
import {Cards} from './cards';
import {Labels} from './labels';
import {DomainSwipe, Lenses, SignInAnalogy} from './overlays';
import {nibSkin} from './nib';
import {TH} from './parts';

/** The three runs along the one real route (contacts → lead → end-tick → header → trace → lookout). */
export const FF_RUN = bitRun({path: L.BTN_ROUTE, depart: F.ffDepart, land: F.ffLand, label: 'flash-forward'});
export const S04_RUN = bitRun({path: L.BTN_ROUTE, depart: F.s04Depart, land: F.s04Land, label: 'S04'});
/** The documented exception to the 30-frame run limit: ≈ 12.5 px/frame, still travelling at f1889 (lands f1891, next section). */
export const S12_RUN = cruiseRun(L.BTN_ROUTE_TO_EDGE, F.s12Depart, F.s12Land, 'S12');

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const cpuName = progress(frame, F.cpuNameIn, 6, EASE.arrive);
  const readout = progress(frame, F.readout, 4, EASE.arrive);
  return (
    <AbsoluteFill style={{backgroundColor: L.PAPER}}>
      <Spread />
      <KitProvider theme={TH} skin={nibSkin}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Notes frame={frame} />
          <WitnessScreen frame={frame} />
          <Machine
            frame={frame}
            set="page"
            chip={pageChip(frame)}
            routeLayer={<LitRoute runs={[S04_RUN, S12_RUN]} />}
            bitLayer={
              <>
                <RouteBit runs={S04_RUN} />
                <RouteBit runs={S12_RUN} />
              </>
            }
          />
          <DomainSwipe frame={frame} />
          <Cards frame={frame} />
          <TracingSheet
            frame={frame}
            box={L.SHEET}
            tab={L.SHEET_TAB}
            tabLabel="After the press"
            inAt={F.sheetIn}
            outAt={F.sheetOut}
            out={{dx: 0, dy: 900}}
            ghost={<Machine frame={frame} set="page" chip={pageChip(frame)} />}
          >
            <Machine
              frame={frame}
              set="traced"
              chip={sheetChip(frame)}
              cpuName={cpuName}
              readout={readout}
              routeLayer={<LitRoute runs={FF_RUN} />}
              bitLayer={<RouteBit runs={FF_RUN} />}
            />
          </TracingSheet>
          <ChainList
            frame={frame}
            ghost={<RuledLines />}
          />
          <SignInAnalogy frame={frame} />
          <Lenses frame={frame} />
          <Labels frame={frame} />
          <Brackets box={{x: L.BTN.housing.x, y: L.BTN.housing.y, w: 78, h: L.BTN.housing.h}} lockAt={F.lock} fadeAt={F.lockOut} />
        </svg>
      </KitProvider>
    </AbsoluteFill>
  );
};

export default Intro;
