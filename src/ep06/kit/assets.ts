/**
 * Ep06 kit: the asset table (public/ep06/assets, canonical names from docs/ep06/ASSET_MAP.md) and measured coordinates.
 * Sizes and alpha bounding boxes (alpha > 8) were measured from the PNGs with PIL (14 Oct 2026). Photo plates are
 * reused from public/ep03/assets. The Ep03 REGIONS below are legacy until the kit agent replaces them.
 * All region coordinates are NATIVE asset pixels (the PNG's own pixel grid).
 */
import {staticFile} from 'remotion';

/** [width, height, alpha x0, y0, x1, y1] (x1/y1 exclusive). */
export const ASSET_INFO = {
  'allocation-map_a': [1254, 1254, 61, 192, 1228, 1091],
  'allocation-map_b': [1254, 1254, 56, 204, 1221, 1097],
  'allocation-map_c': [1254, 1254, 88, 219, 1172, 1137],
  'allocation-map_d': [1254, 1254, 87, 84, 1176, 1179],
  'cluster-wall_a': [1254, 1254, 67, 131, 1204, 1170],
  'cluster-wall_b': [1254, 1254, 57, 170, 1199, 1124],
  'cluster-wall_c': [1254, 1254, 68, 200, 1187, 1056],
  'cluster-wall_d': [1254, 1254, 38, 120, 1226, 1098],
  'cluster-wall_d_alt1': [1254, 1254, 58, 67, 1193, 1145],
  'encryption-key_a': [1254, 1254, 65, 71, 1210, 1190],
  'encryption-key_b': [1536, 1024, 250, 28, 1318, 989],
  'encryption-key_b_alt1': [1254, 1254, 172, 42, 1208, 1200],
  'encryption-key_c': [1254, 1254, 20, 53, 1243, 1250],
  'encryption-key_d': [1254, 1254, 123, 68, 1125, 1233],
  'erase-block-tray_a': [1254, 1254, 68, 97, 1219, 1189],
  'erase-block-tray_a_alt1': [1254, 1254, 67, 60, 1227, 1213],
  'erase-block-tray_b': [1254, 1254, 60, 150, 1194, 1135],
  'erase-block-tray_c': [1254, 1254, 22, 192, 1237, 1151],
  'erase-block-tray_d': [1254, 1254, 44, 28, 1217, 1228],
  'fictional-passport_a': [1254, 1254, 66, 107, 1203, 1190],
  'fictional-passport_a_alt1': [1254, 1254, 67, 91, 1227, 1192],
  'fictional-passport_a_alt2': [1536, 1024, 243, 34, 1259, 978],
  'fictional-passport_b': [1254, 1254, 208, 82, 1052, 1170],
  'fictional-passport_d': [1254, 1254, 90, 120, 1218, 1107],
  'ftl-map_a': [1254, 1254, 21, 209, 1237, 1109],
  'ftl-map_b': [1254, 1254, 52, 243, 1221, 1088],
  'ftl-map_c': [1254, 1254, 48, 40, 1225, 1239],
  'ftl-map_d': [1254, 1254, 43, 120, 1225, 1186],
  'ftl-map_d_alt1': [1254, 1254, 8, 92, 1254, 1194],
  'hard-drive_a': [1254, 1254, 64, 79, 1196, 1181],
  'hard-drive_b': [1254, 1254, 170, 63, 1084, 1200],
  'hard-drive_c': [1254, 1254, 63, 169, 1209, 1105],
  'hard-drive_d': [1254, 1254, 108, 32, 1221, 1238],
  'index-drawer_a': [1254, 1254, 82, 144, 1197, 1142],
  'index-drawer_b': [1254, 1254, 193, 128, 1066, 1125],
  'index-drawer_c': [1254, 1254, 39, 244, 1225, 1098],
  'index-drawer_d': [1254, 1254, 58, 72, 1204, 1204],
  'mft-record_a': [1254, 1254, 74, 205, 1201, 1133],
  'mft-record_b': [1254, 1254, 62, 257, 1206, 1014],
  'mft-record_c': [1254, 1254, 209, 103, 1136, 1168],
  'mft-record_d': [1254, 1254, 64, 216, 1210, 1083],
  'overwrite-slot_a': [1254, 1254, 54, 253, 1216, 1033],
  'overwrite-slot_a_alt1': [1254, 1254, 47, 184, 1209, 1089],
  'overwrite-slot_b': [1536, 1024, 186, 130, 1352, 893],
  'overwrite-slot_b_alt1': [1254, 1254, 8, 228, 1246, 1028],
  'overwrite-slot_c': [1254, 1254, 74, 202, 1232, 1144],
  'overwrite-slot_d': [1254, 1254, 64, 151, 1221, 1165],
  'recovery-scanner_a': [1254, 1254, 22, 121, 1236, 1171],
  'recovery-scanner_a_alt1': [1254, 1254, 42, 130, 1216, 1092],
  'recovery-scanner_b': [1254, 1254, 27, 120, 1229, 1140],
  'recovery-scanner_c': [1254, 1254, 18, 70, 1240, 1241],
  'recovery-scanner_d': [1254, 1254, 26, 74, 1236, 1229],
  'recycle-folder_a': [1254, 1254, 108, 115, 1160, 1180],
  'recycle-folder_a_alt1': [1254, 1254, 78, 71, 1204, 1227],
  'recycle-folder_b': [1254, 1254, 109, 122, 1147, 1124],
  'recycle-folder_c': [1254, 1254, 137, 95, 1156, 1189],
  'recycle-folder_d': [1254, 1254, 147, 59, 1130, 1219],
  'spare-flash_a': [1254, 1254, 36, 200, 1217, 1028],
  'spare-flash_b': [1254, 1254, 99, 316, 1162, 1007],
  'spare-flash_c': [1254, 1254, 68, 74, 1209, 1215],
  'spare-flash_d': [1254, 1254, 18, 125, 1230, 1057],
  'ssd-board_a': [1254, 1254, 50, 296, 1235, 1055],
  'ssd-board_a_alt1': [1254, 1254, 50, 291, 1237, 1060],
  'ssd-board_b': [1254, 1254, 51, 521, 1223, 829],
  'ssd-board_c': [1254, 1254, 74, 260, 1221, 1093],
  'ssd-board_d': [1254, 1254, 49, 233, 1243, 1143],
  'trim-notice_a': [1254, 1254, 88, 133, 1225, 1116],
  'trim-notice_b': [1254, 1254, 96, 163, 1188, 1109],
  'trim-notice_c': [1254, 1254, 51, 51, 1241, 1216],
  'trim-notice_c_alt1': [1536, 1024, 76, 44, 1484, 992],
  'trim-notice_d': [1254, 1254, 159, 47, 1225, 1240],
} as const;

export type AssetName = keyof typeof ASSET_INFO;
export const assetUrl = (name: AssetName): string => staticFile(`ep06/assets/${name}.png`);

export type AssetBox = {w: number; h: number; x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; cw: number; ch: number};
export const assetBox = (name: AssetName): AssetBox => {
  const [w, h, x0, y0, x1, y1] = ASSET_INFO[name];
  return {w, h, x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cw: x1 - x0, ch: y1 - y0};
};

/** Photo plates: 1672×941, cover-fit to 1920×1080 at ×1.1483. */
export const PLATES = ['reader-desk', 'server-room', 'gpu-macro', 'home-gpu'] as const;
export type PlateName = (typeof PLATES)[number];
export const PLATE_W = 1672;
export const PLATE_H = 941;
export const plateUrl = (p: PlateName): string => staticFile(`ep03/assets/${p}.png`);

/* ------------------------------------------------------------------------------------------------
 * Regions (native px). Use with <Prop highlight/spotlight> or propPoint().
 * ---------------------------------------------------------------------------------------------- */
export type Region =
  | {shape: 'rect'; x: number; y: number; w: number; h: number; r?: number}
  | {shape: 'ellipse'; cx: number; cy: number; rx: number; ry: number}
  | {shape: 'poly'; pts: ReadonlyArray<readonly [number, number]>};

const rect = (x0: number, y0: number, x1: number, y1: number, r = 10): Region => ({shape: 'rect', x: x0, y: y0, w: x1 - x0, h: y1 - y0, r});
const poly = (...pts: Array<[number, number]>): Region => ({shape: 'poly', pts});

export const REGIONS = {
  /** BIM150 reader-monitor_b: the active screen (flat, front-on). Glass edge is 120–1416 × 74–712. */
  monitorScreen: rect(138, 91, 1398, 706, 4),
  /** reader-desk plate: the monitor's active screen (flat, front-on), plate px. Glass 314–1356 × 92–647. */
  deskScreen: rect(320, 98, 1352, 645, 4),

  /** BIM129 datacenter-gpu_a (3/4 view): the silicon die (inside the silver frame). */
  gpuA_die: poly([662, 219], [1063, 360], [916, 656], [467, 496]),
  /** BIM129: the 8 HBM stacks' top faces, clockwise from top-left. */
  gpuA_hbm: [
    poly([499, 110], [589, 156], [490, 282], [395, 238]),
    poly([655, 115], [705, 48], [948, 110], [898, 182]),
    poly([915, 190], [955, 118], [1200, 205], [1150, 287]),
    poly([1189, 358], [1313, 399], [1236, 552], [1111, 507]),
    poly([1090, 544], [1216, 589], [1130, 764], [1001, 715]),
    poly([649, 622], [887, 711], [835, 804], [594, 707]),
    poly([314, 597], [377, 515], [601, 602], [540, 687]),
    poly([467, 317], [354, 462], [239, 421], [353, 278]),
  ] as Region[],
  /** BIM130 datacenter-gpu_b (top view): the silicon die and its silver frame. */
  gpuB_die: rect(520, 301, 1004, 673, 6),
  gpuB_dieFrame: rect(467, 242, 1069, 738, 16),
  /** BIM130: the 8 HBM stacks (top faces), clockwise from top-left. */
  gpuB_hbm: [
    rect(457, 78, 725, 185),
    rect(809, 78, 1078, 185),
    rect(1138, 251, 1266, 451),
    rect(1138, 510, 1266, 715),
    rect(809, 763, 1079, 883),
    rect(457, 762, 725, 883),
    rect(269, 513, 396, 716),
    rect(270, 251, 397, 451),
  ] as Region[],
  /** BIM137 hbm-stack_a: the whole HBM tower silhouette, and the compute die's top face. */
  hbmA_stack: poly([207, 305], [502, 151], [930, 236], [930, 420], [680, 690], [207, 560]),
  hbmA_stackTop: poly([210, 305], [502, 151], [927, 236], [679, 431]),
  hbmA_die: poly([866, 644], [1052, 487], [1347, 555], [1152, 721]),
  /** BIM191 gpu-power-limit_c (the dial alone): the knob face and the display window. */
  dialKnob: {shape: 'ellipse', cx: 915, cy: 819, rx: 169, ry: 211} as Region,
  dialWindow: poly([562, 336], [1022, 290], [1020, 472], [560, 536]),
} as const;

/** Display window of BIM191 as a quad [TL, TR, BR, BL] (native px) for quadMatrix(). */
export const DIAL_WINDOW_QUAD = [
  [562, 336],
  [1022, 290],
  [1020, 472],
  [560, 536],
] as const;
