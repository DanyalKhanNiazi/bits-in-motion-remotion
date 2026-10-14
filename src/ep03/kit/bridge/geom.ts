/**
 * Ep03 kit, the Bridge: a tiny 3D projector for SVG (orbit camera, near-plane clipping, box faces, lighting).
 * World units: x right, y up, z toward the default camera. The floor is y = 0.
 */
export type V3 = readonly [number, number, number];
export type Cam3 = {tx: number; ty: number; tz: number; yaw: number; pitch: number; dist: number; fov: number};
export type Basis = {pos: V3; r: V3; u: V3; f: V3; focal: number; cx: number; cy: number};

const DEG = Math.PI / 180;
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const m = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / m, a[1] / m, a[2] / m];
};

export const basis = (c: Cam3, W = 1920, H = 1080): Basis => {
  const yaw = c.yaw * DEG;
  const pitch = c.pitch * DEG;
  const cp = Math.cos(pitch);
  const pos: V3 = [c.tx + c.dist * cp * Math.sin(yaw), c.ty + c.dist * Math.sin(pitch), c.tz + c.dist * cp * Math.cos(yaw)];
  const f = norm(sub([c.tx, c.ty, c.tz], pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return {pos, r, u, f, focal: H / 2 / Math.tan((c.fov * DEG) / 2), cx: W / 2, cy: H / 2};
};

export const NEAR = 0.35;
export const toCam = (b: Basis, p: V3): V3 => {
  const d = sub(p, b.pos);
  return [dot(d, b.r), dot(d, b.u), dot(d, b.f)];
};
export const projC = (b: Basis, c: V3): [number, number] => [b.cx + (b.focal * c[0]) / c[2], b.cy - (b.focal * c[1]) / c[2]];
export const project = (b: Basis, p: V3): [number, number] | null => {
  const c = toCam(b, p);
  return c[2] < NEAR ? null : projC(b, c);
};
/** Screen px per world unit at a point (for sizing strokes and labels). */
export const pxPerUnit = (b: Basis, p: V3): number => {
  const z = toCam(b, p)[2];
  return z < NEAR ? 0 : b.focal / z;
};

/** Sutherland–Hodgman clip of a camera-space polygon against z ≥ NEAR. */
export const clipNear = (cs: readonly V3[]): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    const c = cs[(i + 1) % cs.length];
    const ain = a[2] >= NEAR;
    const cin = c[2] >= NEAR;
    if (ain) out.push(a);
    if (ain !== cin) {
      const t = (NEAR - a[2]) / (c[2] - a[2]);
      out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, NEAR]);
    }
  }
  return out;
};

const fx = (v: number) => (Math.abs(v) > 1e5 ? Math.sign(v) * 1e5 : v).toFixed(1);
/** SVG path d for a world polygon ('' when fully behind the camera). */
export const polyD = (b: Basis, pts: readonly V3[]): string => {
  const cl = clipNear(pts.map((p) => toCam(b, p)));
  if (cl.length < 3) return '';
  return `M${cl.map((c) => projC(b, c).map(fx).join(' ')).join(' L')} Z`;
};
/** Projected 2D points of a world polygon (clipped). */
export const polyPts = (b: Basis, pts: readonly V3[]): Array<[number, number]> => clipNear(pts.map((p) => toCam(b, p))).map((c) => projC(b, c));
/** A clipped world segment → [x1, y1, x2, y2] or null. */
export const seg = (b: Basis, p: V3, q: V3): [number, number, number, number] | null => {
  let a = toCam(b, p);
  let c = toCam(b, q);
  if (a[2] < NEAR && c[2] < NEAR) return null;
  if (a[2] < NEAR) {
    const t = (NEAR - a[2]) / (c[2] - a[2]);
    a = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, NEAR];
  } else if (c[2] < NEAR) {
    const t = (NEAR - c[2]) / (a[2] - c[2]);
    c = [c[0] + (a[0] - c[0]) * t, c[1] + (a[1] - c[1]) * t, NEAR];
  }
  const A = projC(b, a);
  const C = projC(b, c);
  return [A[0], A[1], C[0], C[1]];
};

export type Box = {x0: number; y0: number; z0: number; x1: number; y1: number; z1: number};
export type FaceKey = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
export type Face = {key: FaceKey; pts: V3[]; n: V3; c: V3};
/** The six faces of a box (corner order: counter-clockwise seen from outside, starting bottom-left / back-left). */
export const boxFaces = (bx: Box): Face[] => {
  const {x0, y0, z0, x1, y1, z1} = bx;
  const F = (key: FaceKey, pts: V3[], n: V3): Face => ({key, pts, n, c: mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length)});
  return [
    F('pz', [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]),
    F('nz', [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]),
    F('nx', [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]),
    F('px', [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]),
    F('py', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]),
    F('ny', [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]),
  ];
};
export const isVisible = (b: Basis, f: Face): boolean => dot(f.n, sub(b.pos, f.c)) > 0;
export const visibleFaces = (b: Basis, bx: Box): Face[] => boxFaces(bx).filter((f) => isVisible(b, f));
export const boxCorners = (bx: Box): V3[] => [
  [bx.x0, bx.y0, bx.z0],
  [bx.x1, bx.y0, bx.z0],
  [bx.x1, bx.y1, bx.z0],
  [bx.x0, bx.y1, bx.z0],
  [bx.x0, bx.y0, bx.z1],
  [bx.x1, bx.y0, bx.z1],
  [bx.x1, bx.y1, bx.z1],
  [bx.x0, bx.y1, bx.z1],
];

/** Key light from upper-left-front. Returns a brightness multiplier ~0.45..1.1. */
const LIGHT = norm([-0.5, 0.82, 0.55]);
export const lightOf = (n: V3): number => 0.46 + 0.64 * Math.max(0, dot(n, LIGHT));

/** A point on a box face from face coordinates (u along the face's first edge, v up), in world units. */
export const facePoint = (f: Face, u: number, v: number): V3 => {
  const [p0, p1, , p3] = f.pts;
  const eu = norm(sub(p1, p0));
  const ev = norm(sub(p3, p0));
  return add(add(p0, mul(eu, u)), mul(ev, v));
};
export const faceQuad = (f: Face, u0: number, v0: number, u1: number, v1: number, lift = 0.004): V3[] => {
  const off = mul(f.n, lift);
  return [add(facePoint(f, u0, v0), off), add(facePoint(f, u1, v0), off), add(facePoint(f, u1, v1), off), add(facePoint(f, u0, v1), off)];
};

/** Convex hull (monotone chain) of 2D points. */
export const hull = (pts: Array<[number, number]>): Array<[number, number]> => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: [number, number], a: [number, number], c: [number, number]) => (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  const lo: Array<[number, number]> = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Array<[number, number]> = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

export const lerpCam = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  tx: a.tx + (b.tx - a.tx) * t,
  ty: a.ty + (b.ty - a.ty) * t,
  tz: a.tz + (b.tz - a.tz) * t,
  yaw: a.yaw + (b.yaw - a.yaw) * t,
  pitch: a.pitch + (b.pitch - a.pitch) * t,
  dist: Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * t),
  fov: a.fov + (b.fov - a.fov) * t,
});
