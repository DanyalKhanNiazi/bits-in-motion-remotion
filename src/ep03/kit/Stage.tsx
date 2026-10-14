/**
 * Ep03 kit: <Stage>, the full-frame wrapper every shot sits in.
 *
 *   <Stage frame={frame} env="night" cam={[{f: 0, zoom: 1}, {f: 90, zoom: 1.25, x: 1100}]} hud={<KineticText …/>}>
 *     {world content in 1920×1080 world px; moves with the camera}
 *   </Stage>
 *
 * Layers, back to front: environment (parallax) → world (camera) → hud (screen space) → grade (vignette, grain).
 * Bloom on cyan is applied to everything under the grade. Fast camera moves get a directional blur automatically.
 */
import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {PAL} from './look';
import {CameraContext, camCss, stagePose, type CamInput, type Hit, type Pose} from './camera';
import {BloomFilter, DirBlurFilter, Grain, Vignette, dirBlurStd, gradeOpts, type GradeOpts} from './grade';
import {ChipEnv, NightEnv, PhotoPlate, VoidEnv, parallaxCss, type PhotoOpts} from './envs';
import {safeId} from './util';

export type EnvSpec =
  | 'night'
  | 'chip'
  | 'void'
  | 'none'
  | {kind: 'night'; parallax?: number; grid?: boolean; dust?: number; warm?: number}
  | {kind: 'chip'; parallax?: number; pulses?: number; dust?: number}
  | {kind: 'void'; parallax?: number; dust?: number}
  | ({kind: 'photo'; parallax?: number} & PhotoOpts);

export type StageProps = {
  frame: number;
  env?: EnvSpec;
  /** camera keys, a pose, or a function of frame */
  cam?: CamInput;
  /** micro drift amount (1 = default ≈ 0.3 px/frame; 0 = off) */
  drift?: number;
  /** impact shakes */
  shake?: readonly Hit[];
  /** grade overrides, or false for none */
  grade?: Partial<GradeOpts> | false;
  /** directional blur on fast camera moves (1 = default strength, 0 = off) */
  motionBlur?: number;
  /** screen-space overlay (text), drawn above the world */
  hud?: React.ReactNode;
  /** world content */
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const EnvLayer: React.FC<{frame: number; env: EnvSpec; pose: Pose}> = ({frame, env, pose}) => {
  const e = typeof env === 'string' ? ({kind: env} as {kind: string}) : env;
  switch (e.kind) {
    case 'night': {
      const o = e as {parallax?: number; grid?: boolean; dust?: number; warm?: number};
      const p = {...pose, x: 960 + (pose.x - 960) * (o.parallax ?? 1), y: 540 + (pose.y - 540) * (o.parallax ?? 1)};
      return <NightEnv frame={frame} pose={p} grid={o.grid} dust={o.dust} warm={o.warm} />;
    }
    case 'chip': {
      const o = e as {parallax?: number; pulses?: number; dust?: number};
      const p = {...pose, x: 960 + (pose.x - 960) * (o.parallax ?? 1), y: 540 + (pose.y - 540) * (o.parallax ?? 1)};
      return <ChipEnv frame={frame} pose={p} pulses={o.pulses} dust={o.dust} />;
    }
    case 'void': {
      const o = e as {dust?: number};
      return <VoidEnv frame={frame} pose={pose} dust={o.dust} />;
    }
    case 'photo': {
      const o = e as unknown as {parallax?: number} & PhotoOpts;
      const f = o.parallax ?? 1;
      // the view this layer sees (same maths as parallaxCss), so the plate can overscan to cover it
      const view = {x: 960 + (pose.x - 960) * f, y: 540 + (pose.y - 540) * f, zoom: Math.pow(pose.zoom, f), rot: pose.rot * f};
      return (
        <AbsoluteFill style={{transform: parallaxCss(pose, f), transformOrigin: '0 0'}}>
          <PhotoPlate frame={frame} {...o} view={view} />
        </AbsoluteFill>
      );
    }
    default:
      return null;
  }
};

export const Stage: React.FC<StageProps> = ({frame, env = 'night', cam, drift = 1, shake, grade, motionBlur = 1, hud, children, style}) => {
  const id = safeId(useId());
  const g = gradeOpts(grade);
  const pose = stagePose(cam, frame, drift, shake);
  const prev = stagePose(cam, frame - 1, drift, shake);
  // screen-space velocity of the frame centre, plus the zoom's radial speed at mid-radius
  const vx = (prev.x - pose.x) * pose.zoom;
  const vy = (prev.y - pose.y) * pose.zoom;
  const vz = Math.abs(Math.log(pose.zoom / prev.zoom)) * 520;
  const std = motionBlur > 0 ? dirBlurStd(Math.hypot(vx, vz * 0.7) * Math.sign(vx || 1) * motionBlur, Math.hypot(vy, vz * 0.5) * motionBlur) : null;
  const bloomId = `${id}-bloom`;
  const mbId = `${id}-mb`;
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden', ...style}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {g.bloom > 0 ? <BloomFilter id={bloomId} strength={g.bloom} radius={g.bloomRadius} /> : null}
          {std ? <DirBlurFilter id={mbId} std={std} /> : null}
        </defs>
      </svg>
      <AbsoluteFill style={{filter: g.bloom > 0 ? `url(#${bloomId})` : undefined}}>
        <AbsoluteFill style={{filter: std ? `url(#${mbId})` : undefined}}>
          <EnvLayer frame={frame} env={env} pose={pose} />
          <AbsoluteFill style={{transform: camCss(pose), transformOrigin: '0 0'}}>
            <CameraContext.Provider value={{zoom: pose.zoom, rot: pose.rot}}>{children}</CameraContext.Provider>
          </AbsoluteFill>
        </AbsoluteFill>
        {hud ? (
          <AbsoluteFill>
            <CameraContext.Provider value={{zoom: 1, rot: 0}}>{hud}</CameraContext.Provider>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <Vignette strength={g.vignette} />
      <Grain frame={frame} opacity={g.grain} />
    </AbsoluteFill>
  );
};

/** The pose a Stage would use at a frame (for placing hud items over world points). */
export const poseAt = (frame: number, cam?: CamInput, drift = 1, shake?: readonly Hit[]): Pose => stagePose(cam, frame, drift, shake);
