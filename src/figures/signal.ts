/**
 * #009 Never use color as the only signal.
 * A line chart of two series. At the mistake they differ only by colour: two
 * plain lines and a legend of two coloured swatches. At the fix the second
 * series is dashed, each point carries a marker shaped by its series, and
 * the lines are named at their ends, so the chart still reads in grayscale.
 */
import { defineFigure, ease, phase } from "../lib/figure";

const XS = [72, 124, 176, 228, 280];
const A = [214, 178, 190, 142, 118];
const B = [236, 222, 200, 204, 176];
const points = (ys: number[]) => "M" + XS.map((x, i) => `${x} ${ys[i]}`).join("L");

export default defineFigure({
  name: "signal",
  means: "A line chart whose two series gain a dashed line, shaped markers and direct labels, so colour is no longer the only way to tell them apart.",
  build(d) {
    d.box({ x: 40, y: 40, w: 320, h: 240, r: 16, cls: "frame" });
    [104, 152, 200, 248].forEach((y) => d.line({ x1: 64, y1: y, x2: 288, y2: y, cls: "guide" }));
    // The legend: a swatch and a name for each series.
    d.line({ x1: 64, y1: 64, x2: 80, y2: 64, cls: "accent" });
    d.text({ x: 86, y: 64, w: 40, size: 4 });
    const plainKey = d.line({ x1: 140, y1: 64, x2: 156, y2: 64 });
    const dashedKey = d.line({ x1: 140, y1: 64, x2: 156, y2: 64, cls: "guide ink" });
    d.text({ x: 162, y: 64, w: 40, size: 4 });

    d.path({ d: points(A), cls: "accent" });
    const plain = d.path({ d: points(B) });
    const dashed = d.path({ d: points(B), cls: "guide ink" });
    const dots = XS.map((x, i) => d.circle({ cx: x, cy: A[i]!, r: 3.5, cls: "fill accent" }));
    const squares = XS.map((x, i) => d.box({ x, y: B[i]!, w: 7, h: 7, r: 1, cls: "plate ink" }));
    const nameA = d.label({ x: 296, y: A[4]!, text: "2026", anchor: "start" });
    const nameB = d.label({ x: 296, y: B[4]!, text: "2025", anchor: "start", cls: "ink" });

    return (t) => {
      const line = ease(phase(t, 0, 0.5));
      const marks = ease(phase(t, 0.35, 0.85));
      const names = ease(phase(t, 0.6, 1));
      plain.set({ opacity: 1 - line });
      plainKey.set({ opacity: 1 - line });
      dashed.set({ opacity: line });
      dashedKey.set({ opacity: line });
      // Markers grow in from 60% of their size as they fade in, never from nothing.
      const grow = 0.6 + 0.4 * marks;
      dots.forEach((dot) => dot.set({ r: 3.5 * grow, opacity: marks }));
      squares.forEach((sq, i) => {
        const s = 7 * grow;
        sq.set({ x: XS[i]! - s / 2, y: B[i]! - s / 2, w: s, h: s, opacity: marks });
      });
      nameA.set({ opacity: names });
      nameB.set({ opacity: names });
    };
  },
});
