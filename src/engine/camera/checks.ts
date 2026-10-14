/**
 * Camera checks (ENGINE.md §5.1, STYLE_BIBLE §7.4, §13.1): zoom rate, pan speed and the caption band at holds.
 * They print through kitWarn (never throw).
 */
import {CAMERA, DUR, LAYOUT} from '../tokens';
import {kitWarn} from '../../shared/motion';
import {routePath, flattenPath} from '../../shared/geom';
import type {Pt} from '../core/types';
import {GROUND_TYPES, iconFor} from '../world/icons';
import type {WorldSpec} from '../world/types';
import {cameraAt, keySpans, project, screenRect, referenceShot, type CameraTrack} from './camera';

/** Peak zoom ratio per 12 frames for each key (sampled at 1/8 frame); warns above CAMERA.maxZoomPer12 (1.8). */
export const zoomRateReport = (track: CameraTrack): Array<{key: number; peakPer12: number}> =>
  keySpans(track).map(({index, at, end}) => {
    let peak = 1;
    if (end > at) {
      for (let f = at - 12; f <= end; f += 1 / 8) {
        const a = cameraAt(f, track).zoom;
        const b = cameraAt(f + 12, track).zoom;
        peak = Math.max(peak, a / b, b / a);
      }
    }
    if (peak > CAMERA.maxZoomPer12 + 1e-6) kitWarn(`camera key ${index} (f${at}): zoom ×${peak.toFixed(2)} per 12 frames exceeds ×${CAMERA.maxZoomPer12}`);
    if (end > at && end - at < DUR.cameraMin) kitWarn(`camera key ${index} (f${at}): ${end - at} frames is shorter than the ${DUR.cameraMin}-frame minimum`);
    return {key: index, peakPer12: peak};
  });

/** Peak pan speed of the frame centre's world point, screen px/frame; warns above CAMERA.maxPanPerFrame (48). */
export const panSpeedReport = (track: CameraTrack): Array<{key: number; peakPx: number}> =>
  keySpans(track).map(({index, at, end}) => {
    let peak = 0;
    const step = 1 / 8;
    for (let f = at; f < end; f += step) {
      const a = cameraAt(f, track);
      const b = cameraAt(f + step, track);
      const s = project(b, a.center);
      peak = Math.max(peak, Math.hypot(s[0] - 960, s[1] - 540) / step);
    }
    if (peak > CAMERA.maxPanPerFrame + 1e-6) kitWarn(`camera key ${index} (f${at}): pan ${peak.toFixed(1)} px/frame exceeds ${CAMERA.maxPanPerFrame}`);
    return {key: index, peakPx: peak};
  });

/**
 * At hold frames (no key active), warns if any part TOP FACE (2.5D sides excluded), route or channel projects below
 * LAYOUT.meaningBottom (932) while on screen. Grounds (case tray, board) and side faces may cross it.
 * (Labels, Bits and plates are checked by checkSafeAreas.)
 */
export const captionBandReport = (track: CameraTrack, world: WorldSpec, frames: ReadonlyArray<number>): string[] => {
  const lines: string[] = [];
  const seen = new Set<string>();
  const ref = referenceShot(track);
  const routePts = new Map<string, Pt[]>();
  for (const r of world.routes) routePts.set(`route ${r.id}`, flattenPath(routePath(r.points, r.bend ?? 8))[0]?.pts ?? []);
  for (const c of world.channels) routePts.set(`channel ${c.id}`, flattenPath(routePath(c.points, 10))[0]?.pts ?? []);
  for (const f of frames) {
    const cam = cameraAt(f, track);
    if (cam.moving) continue;
    for (const p of world.parts) {
      if (GROUND_TYPES.has(p.type)) continue;
      const r = screenRect(cam, p.rect, p.depth ?? 1, ref);
      const onScreen = r.x < 1920 && r.x + r.w > 0 && r.y < 1080 && r.y + r.h > 0;
      if (onScreen && r.y + r.h > LAYOUT.meaningBottom + 0.5) {
        const m = `caption band: part "${p.id}" (${iconFor(p.type).type}) top face reaches y ${Math.round(r.y + r.h)} at hold f${f}`;
        if (!seen.has(`p:${p.id}`)) {
          seen.add(`p:${p.id}`);
          lines.push(m);
        }
      }
    }
    for (const [name, pts] of routePts) {
      if (world.routes.find((r) => `route ${r.id}` === name)?.hidden) continue;
      for (const q of pts) {
        const s = project(cam, q);
        if (s[0] >= 0 && s[0] <= 1920 && s[1] > LAYOUT.meaningBottom + 0.5 && s[1] <= 1080) {
          if (!seen.has(name)) {
            seen.add(name);
            lines.push(`caption band: ${name} reaches y ${Math.round(s[1])} at hold f${f}`);
          }
          break;
        }
      }
    }
  }
  for (const l of lines) kitWarn(l);
  return lines;
};
