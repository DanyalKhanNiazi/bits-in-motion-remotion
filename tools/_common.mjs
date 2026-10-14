// Shared helpers for tools/stills.mjs and tools/render.mjs (not a CLI).
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Split argv into positionals and --flags (a flag may take the next token as its value). */
export const parseArgs = (argv, valueFlags = []) => {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split('=', 2);
      if (inline !== undefined) flags[k] = inline;
      else if (valueFlags.includes(k)) {
        if (i + 1 >= argv.length) throw new Error(`--${k} needs a value`);
        flags[k] = argv[++i];
      } else flags[k] = true;
    } else pos.push(a);
  }
  return {pos, flags};
};

/** "0,8,33 100-200:10 300-310" → sorted unique frame numbers. */
export const parseFrames = (tokens) => {
  const out = new Set();
  for (const tok of tokens.join(',').split(',')) {
    const s = tok.trim();
    if (!s) continue;
    const m = s.match(/^(\d+)(?:-(\d+))?(?::(\d+))?$/);
    if (!m) throw new Error(`bad frame spec "${s}" (use 12 or 10-90 or 10-90:5)`);
    const a = Number(m[1]);
    const b = m[2] !== undefined ? Number(m[2]) : a;
    const step = m[3] !== undefined ? Number(m[3]) : 1;
    if (step <= 0) throw new Error(`bad step in "${s}"`);
    if (b < a) throw new Error(`bad range "${s}"`);
    for (let f = a; f <= b; f += step) out.add(f);
  }
  return [...out].sort((x, y) => x - y);
};

/**
 * Bundle one entry file. Each entry gets its own webpack cache name, so parallel builders
 * bundling different styles never share (and corrupt) a cache.
 */
export const bundleEntry = async (entryArg) => {
  const entry = path.resolve(ROOT, entryArg);
  if (!fs.existsSync(entry)) throw new Error(`entry not found: ${entry}`);
  const key = path.basename(entry).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const t0 = Date.now();
  const serveUrl = await bundle({
    entryPoint: entry,
    rootDir: ROOT,
    enableCaching: true,
    webpackOverride: (config) => {
      if (config.cache && typeof config.cache === 'object' && config.cache.name) {
        return {...config, cache: {...config.cache, name: `${config.cache.name}-${key}`}};
      }
      return config;
    },
  });
  console.log(`bundled ${path.relative(ROOT, entry)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  // Each bundle copies public/ (hundreds of MB) into the temp folder; delete it when this process exits.
  if (path.basename(serveUrl).startsWith('remotion-webpack-bundle-')) {
    process.on('exit', () => fs.rmSync(serveUrl, {recursive: true, force: true}));
  }
  return serveUrl;
};

/** Browser-log handler: prints each distinct [kit] warning / error once. */
export const makeLogHandler = () => {
  const seen = new Set();
  return (log) => {
    const text = String(log.text ?? '');
    const important = text.includes('[kit]') || log.type === 'error';
    if (!important) return;
    const key = `${log.type}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    console.log(`  browser ${log.type}: ${text}`);
  };
};

export const pad4 = (n) => String(n).padStart(4, '0');
