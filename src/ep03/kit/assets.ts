/**
 * Ep03 kit: the asset table (public/ep03/assets) and measured coordinates.
 * Sizes and alpha bounding boxes were measured from the PNGs (tools: PIL/OpenCV, 14 Oct 2026).
 * All region coordinates are NATIVE asset pixels (the PNG's own pixel grid).
 */
import {staticFile} from 'remotion';

/** [width, height, alpha x0, y0, x1, y1] (x1/y1 exclusive). */
export const ASSET_INFO = {
  'BIM129_T03_datacenter-gpu_a': [1536, 1024, 152, 43, 1383, 971],
  'BIM130_T03_datacenter-gpu_b': [1536, 1024, 224, 62, 1311, 959],
  'BIM131_T03_datacenter-gpu_c': [1774, 887, 90, 42, 1707, 884],
  'BIM132_T03_datacenter-gpu_d': [1536, 1024, 127, 18, 1428, 1006],
  'BIM133_T03_home-graphics-card_a': [1536, 1024, 22, 97, 1517, 951],
  'BIM134_T03_home-graphics-card_b': [1672, 941, 23, 84, 1633, 916],
  'BIM135_T03_home-graphics-card_c': [1536, 1024, 48, 38, 1510, 1019],
  'BIM136_T03_home-graphics-card_d': [1536, 1024, 133, 9, 1409, 1017],
  'BIM137_T03_hbm-stack_a': [1536, 1024, 64, 150, 1472, 930],
  'BIM138_T03_hbm-stack_b': [1536, 1024, 114, 161, 1423, 880],
  'BIM139_T03_hbm-stack_c': [1254, 1254, 65, 213, 1198, 1101],
  'BIM140_T03_hbm-stack_d': [1536, 1024, 60, 42, 1473, 1004],
  'BIM141_T03_compute-cache_a': [1536, 1024, 78, 30, 1473, 1007],
  'BIM142_T03_compute-cache_b': [1536, 1024, 159, 58, 1381, 963],
  'BIM143_T03_compute-cache_c': [1536, 1024, 111, 27, 1461, 999],
  'BIM144_T03_compute-cache_d': [1536, 1024, 112, 10, 1462, 1023],
  'BIM145_T03_eight-gpu-server_a': [1145, 1374, 146, 57, 997, 1347],
  'BIM146_T03_eight-gpu-server_b': [1024, 1536, 99, 62, 925, 1497],
  'BIM147_T03_eight-gpu-server_c': [2172, 724, 111, 191, 2064, 578],
  'BIM148_T03_eight-gpu-server_d': [1145, 1374, 36, 36, 1113, 1364],
  'BIM149_T03_reader-monitor_a': [1374, 1145, 106, 45, 1282, 1094],
  'BIM150_T03_reader-monitor_b': [1536, 1024, 110, 63, 1427, 972],
  'BIM151_T03_reader-monitor_c': [1536, 1024, 115, 47, 1430, 985],
  'BIM152_T03_reader-monitor_d': [1374, 1145, 67, 62, 1320, 1113],
  'BIM153_T03_token-bench_a': [1774, 887, 25, 112, 1751, 793],
  'BIM154_T03_token-bench_b': [1774, 887, 29, 194, 1747, 820],
  'BIM155_T03_token-bench_c': [1374, 1145, 121, 94, 1316, 1067],
  'BIM156_T03_token-bench_d': [1774, 887, 44, 38, 1738, 858],
  'BIM157_T03_vocabulary-drawer_a': [1254, 1254, 55, 113, 1221, 1177],
  'BIM158_T03_vocabulary-drawer_b': [1254, 1254, 222, 70, 1033, 1182],
  'BIM159_T03_vocabulary-drawer_c': [1254, 1254, 110, 214, 1162, 1175],
  'BIM160_T03_vocabulary-drawer_d': [1536, 1024, 125, 44, 1436, 1017],
  'BIM161_T03_weight-field_a': [1536, 1024, 70, 51, 1498, 966],
  'BIM162_T03_weight-field_b': [1374, 1145, 181, 29, 1198, 1121],
  'BIM163_T03_weight-field_c': [1254, 1254, 78, 188, 1197, 1107],
  'BIM164_T03_weight-field_d': [1536, 1024, 138, 9, 1453, 985],
  'BIM165_T03_bf16-holder_a': [1774, 887, 105, 47, 1706, 864],
  'BIM166_T03_bf16-holder_b': [1774, 887, 115, 110, 1661, 811],
  'BIM167_T03_bf16-holder_c': [1774, 887, 90, 125, 1733, 879],
  'BIM168_T03_bf16-holder_d': [1774, 887, 45, 97, 1728, 816],
  'BIM169_T03_logical-layer_a': [1254, 1254, 22, 153, 1234, 1128],
  'BIM170_T03_logical-layer_b': [1536, 1024, 114, 27, 1446, 992],
  'BIM171_T03_logical-layer_c': [1254, 1254, 26, 331, 1233, 996],
  'BIM172_T03_logical-layer_d': [1254, 1254, 17, 101, 1242, 1205],
  'BIM173_T03_kv-tray_a': [1536, 1024, 73, 23, 1476, 947],
  'BIM174_T03_kv-tray_b': [1536, 1024, 80, 45, 1444, 986],
  'BIM175_T03_kv-tray_c': [1185, 1327, 89, 85, 1130, 1270],
  'BIM176_T03_kv-tray_d': [1536, 1024, 48, 16, 1501, 987],
  'BIM177_T03_batch-station_a': [1448, 1086, 122, 64, 1331, 1035],
  'BIM178_T03_batch-station_b': [1448, 1086, 181, 50, 1261, 1032],
  'BIM179_T03_batch-station_c': [1254, 1254, 96, 82, 1216, 1205],
  'BIM180_T03_batch-station_d': [1448, 1086, 116, 47, 1351, 1074],
  'BIM181_T03_quantized-weight_a': [2058, 764, 53, 128, 2007, 603],
  'BIM182_T03_quantized-weight_b': [2058, 764, 47, 113, 2016, 641],
  'BIM183_T03_quantized-weight_c': [1297, 1212, 98, 161, 1200, 1050],
  'BIM184_T03_quantized-weight_d': [2058, 764, 70, 69, 1988, 692],
  'BIM185_T03_draft-target_a': [1774, 887, 29, 142, 1747, 783],
  'BIM186_T03_draft-target_b': [1774, 887, 39, 272, 1735, 637],
  'BIM187_T03_draft-target_c': [1774, 887, 55, 51, 1721, 859],
  'BIM188_T03_draft-target_d': [1774, 887, 31, 114, 1750, 873],
  'BIM189_T03_gpu-power-limit_a': [1536, 1024, 10, 88, 1509, 924],
  'BIM190_T03_gpu-power-limit_b': [1774, 887, 24, 54, 1740, 796],
  'BIM191_T03_gpu-power-limit_c': [1254, 1254, 248, 40, 1085, 1217],
  'BIM192_T03_gpu-power-limit_d': [1536, 1024, 7, 90, 1511, 897],
} as const;

export type AssetName = keyof typeof ASSET_INFO;
export const assetUrl = (name: AssetName): string => staticFile(`ep03/assets/${name}.png`);

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
