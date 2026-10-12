/**
 * #006 Align to one edge and keep it.
 * A card of a heading, two lines of text, an input and a button. At the
 * mistake each starts somewhere else, and every left edge draws its own
 * guide: five lines of noise. At the fix they all hang from one edge, and
 * the guides merge into one.
 */
import { defineFigure, ease, lerp, stagger } from "../lib/figure";

const EDGE = 104;
const TOP = 52;
const BOTTOM = 268;

/** Each element: kind, width, its middle y, and its left edge at the mistake. */
const PARTS = [
  { kind: "text", w: 132, y: 78, size: 10, from: 134 },
  { kind: "text", w: 184, y: 104, size: 5, from: 116 },
  { kind: "text", w: 150, y: 120, size: 5, from: EDGE },
  { kind: "field", w: 192, y: 164, size: 30, from: 92 },
  { kind: "button", w: 80, y: 222, size: 30, from: 212 },
] as const;

export default defineFigure({
  name: "align",
  means: "A card whose heading, text, input and button slide from five different left edges onto one shared edge.",
  build(d) {
    const guides = PARTS.map(() => d.line({ x1: 0, y1: TOP, x2: 0, y2: BOTTOM, cls: "guide" }));
    const shared = d.line({ x1: EDGE, y1: TOP, x2: EDGE, y2: BOTTOM, cls: "guide accent" });
    d.box({ x: 80, y: 40, w: 240, h: 240, r: 16, cls: "frame" });
    const parts = PARTS.map((p) => {
      if (p.kind === "text") return d.text({ x: p.from, y: p.y, w: p.w, size: p.size, cls: p.size > 5 ? "ink" : "" });
      return d.box({ x: p.from, y: p.y - p.size / 2, w: p.w, h: p.size, r: p.kind === "button" ? 15 : 8, cls: p.kind === "button" ? "fill" : "" });
    });
    const count = d.label({ x: 296, y: 268, text: "", anchor: "end" });

    return (t) => {
      const xs = PARTS.map((p, i) => lerp(p.from, EDGE, ease(stagger(t, i, PARTS.length, 0.6))));
      xs.forEach((x, i) => {
        parts[i]!.set({ x });
        guides[i]!.set({ x1: x, x2: x, opacity: Math.min(1, Math.abs(x - EDGE) / 6) });
      });
      shared.set({ opacity: ease(t) });
      const edges = new Set(xs.map((x) => Math.round(x / 3))).size;
      count.set({ text: edges === 1 ? "1 edge" : `${edges} edges` });
    };
  },
});
