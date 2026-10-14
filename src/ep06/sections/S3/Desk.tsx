// S3 shot D: "Windows reads the card, then goes to those boxes": the copied Bits arrive on the reader's monitor and
// reassemble into the photo in a plain dark viewer window (kit WinDesktop + WinFrame; PhotoBits dissolve, run backwards).
import React from 'react';
import {MONO, PhotoBits, REGIONS, ScreenSlot, Stage, WIN, WinDesktop, WinFrame, assetBox, type KenBurns} from '../../kit';
import {T} from './t';

export const ASSEMBLE = {at: T.boxes6 + 4, dur: 22};
const WINDOW = {x: 281, y: 14, w: 470, h: 490};
const S = 1.1; // title-bar factor: "passport.jpg" is 25 slot px → ≥ 45 px on screen at the widest (slot scale ≥ 1.79)
const TH = 50 * S;
const PHOTO_RECT = (() => {
  const b = assetBox('fictional-passport_b');
  const bodyH = WINDOW.h - TH;
  const h = bodyH * 0.9;
  const w = (b.cw * h) / b.ch;
  return {x: WINDOW.x + WINDOW.w / 2 - w / 2, y: WINDOW.y + TH + (bodyH - h) / 2, w, h};
})();

export const DESK_KB: KenBurns = {from: {s: 1.9, x: 0, y: 214}, to: {s: 1.56, x: 0, y: 176}, start: T.boxes6 - 6, end: T.limit + 22};

export const DeskShot: React.FC<{f: number}> = ({f}) => {
  const {at, dur} = ASSEMBLE;
  // the dissolve played backwards: the cloud of Bits pulls together into the photo
  const fr = f <= at ? at + dur : at + dur - (f - at);
  const done = Math.max(0, Math.min(1, (f - at - dur + 2) / 10));
  return (
    <Stage
      frame={f}
      drift={0.5}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: DESK_KB,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen} glow={1 + 0.6 * done}>
            <WinDesktop frame={f} w={1032} h={547}>
              <div style={{position: 'absolute', left: WINDOW.x, top: WINDOW.y}}>
                <WinFrame w={WINDOW.w} h={WINDOW.h} s={S} body="#0C111B" title={<span style={{fontFamily: MONO, fontWeight: 500, color: WIN.text}}>passport.jpg</span>}>
                  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 45%, #1A2335, #0C111B 75%)'}} />
                </WinFrame>
              </div>
              <PhotoBits frame={fr} at={at} dur={dur} mode="dissolve" from={PHOTO_RECT} image="fictional-passport_b" grid={[12, 16]} />
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
    />
  );
};
