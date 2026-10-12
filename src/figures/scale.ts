/**
 * #003 Use one type scale and stick to it.
 * A page of text beside its list of text styles, as a design tool shows them.
 * At the mistake the page uses seven sizes that are nearly the same, and the
 * list runs 13 to 21. At the fix every line takes one of three sizes from one
 * scale (32, 20, 14), and the list holds just those three.
 */
import { defineFigure, ease, lerp, stagger } from "../lib/figure";

/** Each line of the page: its length, its thickness at the mistake and at the fix, and whether it is a heading. */
const LINES: [number, number, number, boolean][] = [
  [128, 10, 16, true],
  [150, 6, 5, false],
  [138, 5.5, 5, false],
  [116, 6.5, 5, false],
  [96, 8.5, 9, true],
  [146, 5, 5, false],
  [128, 6, 5, false],
  [140, 5.5, 5, false],
  [84, 7, 9, true],
  [150, 6.5, 5, false],
  [108, 5, 5, false],
];
/** The style list: sizes at the mistake, and the three that stay at the fix. */
const MISTAKE = [21, 18, 17, 16, 15, 14, 13];
const SCALE = [32, 20, 14];
const ROW = 24;

export default defineFigure({
  name: "scale",
  means: "A page whose text goes from seven near-identical sizes to three sizes from one scale, with its list of text styles shrinking to match.",
  build(d) {
    d.box({ x: 48, y: 40, w: 200, h: 240, r: 14, cls: "frame" });
    const lines = LINES.map(([w, , , heading]) => d.text({ x: 72, y: 0, w, size: 5, cls: heading ? "ink" : "" }));
    d.box({ x: 264, y: 40, w: 88, h: 240, r: 14, cls: "frame" });
    d.text({ x: 280, y: 60, w: 34, size: 4 });
    const rows = MISTAKE.map(() => {
      const g = d.group();
      const chip = g.draw.box({ x: 278, y: 0, w: 60, h: 18, r: 6, cls: "accent" });
      const value = g.draw.label({ x: 308, y: 0, text: "" });
      return { g, chip, value };
    });

    return (t) => {
      let y = 62;
      lines.forEach((line, i) => {
        const [, from, to, heading] = LINES[i]!;
        const size = lerp(from, to, ease(stagger(t, i, LINES.length, 0.7)));
        line.set({ y: y + size / 2, size });
        const next = LINES[i + 1];
        y += size + (heading ? 11 : next?.[3] ? 18 : 9);
      });
      rows.forEach(({ g, chip, value }, i) => {
        const kept = i < SCALE.length;
        const e = ease(stagger(t, i, MISTAKE.length, 0.6));
        const size = kept ? lerp(MISTAKE[i]!, SCALE[i]!, e) : MISTAKE[i]!;
        const top = 74 + i * ROW;
        chip.set({ y: top });
        value.set({ y: top + 9, text: String(Math.round(size)) });
        g.set({ opacity: kept ? 1 : 1 - e });
      });
    };
  },
});
