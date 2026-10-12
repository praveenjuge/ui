/**
 * What a tip figure imports. A figure is one interface, drawn flat as a
 * wireframe in a 400 × 320 viewBox, and one number, t: 0 is the mistake the
 * tip warns about, 1 is the fix. The figure builds its drawing once and
 * returns a function that shows it at any t. Everything else (the loop that
 * plays the lesson, the frame loop, themes) belongs to the host.
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

/** A CSS cubic-bezier as a function of progress, solved for x by Newton's method with a bisection fallback. */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (u: number) => ((ax * u + bx) * u + cx) * u;
  const y = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const err = x(u) - t;
      if (Math.abs(err) < 1e-6) return y(u);
      const slope = dx(u);
      if (Math.abs(slope) < 1e-6) break;
      u -= err / slope;
    }
    let lo = 0, hi = 1;
    u = t;
    for (let i = 0; i < 30; i++) {
      if (x(u) < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return y(u);
  };
}

/**
 * The curve for movement on screen: a strong ease-in-out, from Emil
 * Kowalski's rules (.claude/skills/emil-design-eng). Clamped to 0–1.
 */
export const ease: (t: number) => number = bezier(0.77, 0, 0.175, 1);

/**
 * Where t is inside [from, to], as 0 to 1. Gives parts their own window of
 * the change, so they move one after another: phase(t, 0.2, 0.6).
 */
export const phase = (t: number, from: number, to: number) => clamp((t - from) / (to - from));

/** Part i of n's window of the change, overlapping its neighbours by `overlap`: a stagger. */
export const stagger = (t: number, i: number, n: number, overlap = 0.5) => {
  const width = 1 / (n - (n - 1) * overlap);
  const from = i * width * (1 - overlap);
  return phase(t, from, from + width);
};
