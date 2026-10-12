/**
 * What a tip figure imports. A figure is one interface, drawn flat as a
 * wireframe in a 400 × 320 viewBox, and one number, t: 0 is the mistake the
 * tip warns about, 1 is the fix. The figure builds its drawing once and
 * returns a function that shows it at any t. Everything else (the pointer,
 * the spring, the tour, the frame loop, themes) belongs to the host.
 *
 * The rules for drawing one live in .claude/skills/tip-figure.
 */
import type { Draw } from "./draw";

export type { Draw, Shape } from "./draw";

export const VIEW = { width: 400, height: 320 } as const;

/**
 * The band a drawing stays inside. The stage around it is margin, and the
 * images set the tip's words right under it.
 */
export const SAFE = { x: 24, y: 32, width: 352, height: 256 } as const;

/** One lap of the tour, in ms: the lesson played once. The video is one lap. */
export const LAP_MS = 8000;

export interface Figure {
  /** Lowercase, matching the file name: src/figures/<name>.ts. */
  name: string;
  /** One sentence for screen readers: what the drawing shows. */
  means: string;
  /** Draws the interface into `d` once, and returns how to show it at t (0 the mistake, 1 the fix). */
  build(d: Draw): (t: number) => void;
}

export const defineFigure = (figure: Figure): Figure => figure;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth in and out, for motion that should start and land softly. */
export const ease = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/**
 * Where t is inside [from, to], as 0 to 1. Gives parts their own window of
 * the scrub, so they move one after another: phase(t, 0.2, 0.6).
 */
export const phase = (t: number, from: number, to: number) => clamp((t - from) / (to - from));

/** Part i of n's window of the scrub, overlapping its neighbours by `overlap`: a stagger. */
export const stagger = (t: number, i: number, n: number, overlap = 0.5) => {
  const width = 1 / (n - (n - 1) * overlap);
  const from = i * width * (1 - overlap);
  return phase(t, from, from + width);
};
