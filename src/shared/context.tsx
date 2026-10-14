/**
 * Kit context: a default theme and skin for a subtree, the frame source, unique SVG ids and a
 * full-frame SVG layer.
 */
import React, {createContext, useContext, useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {DARK, resolveTheme, type Theme, type ThemeLike} from './brand';
import {cleanSkin, type Skin} from './skin';

interface KitCtx {
  theme: Theme;
  skin: Skin;
}

const Ctx = createContext<KitCtx>({theme: DARK, skin: cleanSkin});

/** Set the theme and skin for every kit component below (props still win). */
export const KitProvider: React.FC<{theme?: ThemeLike; skin?: Skin; children: React.ReactNode}> = ({theme, skin, children}) => {
  const parent = useContext(Ctx);
  const value: KitCtx = {theme: theme ? resolveTheme(theme) : parent.theme, skin: skin ?? parent.skin};
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** Props every kit component accepts. */
export interface KitBaseProps {
  /** 'dark' | 'light' | 'lightCool' or a Theme object (e.g. {...THEMES.lightCool, ink: '#1B2A44'}). */
  theme?: ThemeLike;
  /** Line quality: cleanSkin (default), clearLineSkin, inkSkin(), litSkin() or your own. */
  skin?: Skin;
  /** Seed for jittering skins (defaults to a per-component constant). */
  seed?: string;
  /**
   * Absolute frame override. Kit components read useCurrentFrame(); inside a <Sequence from={N}> that
   * frame is relative. Pass `frame` (or don't offset Sequences) to keep the kit's absolute timing.
   */
  frame?: number;
}

/** Resolve theme, skin and frame for a component. */
export const useKit = (p: KitBaseProps): {theme: Theme; skin: Skin; frame: number} => {
  const ctx = useContext(Ctx);
  const f = useCurrentFrame();
  return {
    theme: p.theme ? resolveTheme(p.theme) : ctx.theme,
    skin: p.skin ?? ctx.skin,
    frame: p.frame ?? f,
  };
};

/** A stable id usable in url(#id) (React's useId contains colons). */
export const useSvgId = (prefix: string): string => `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** A full-frame 1920x1080 SVG layer, absolutely positioned. Put kit components inside. */
export const KitLayer: React.FC<{children: React.ReactNode; style?: React.CSSProperties; width?: number; height?: number}> = ({
  children,
  style,
  width = 1920,
  height = 1080,
}) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}
  >
    {children}
  </svg>
);
