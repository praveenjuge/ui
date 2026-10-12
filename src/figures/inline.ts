/**
 * #007 Show the error next to the field that caused it.
 * A form whose second field is wrong. At the mistake the error is a banner at
 * the top of the form, far from the field. At the fix it sits right under the
 * field, and the form makes room for it. The field keeps what was typed.
 */
import { defineFigure, ease, phase } from "../lib/figure";

const X = 112;
const W = 176;
const BANNER = 26;
const MESSAGE = 14;

export default defineFigure({
  name: "inline",
  means: "A form whose error message moves from a banner at the top to just under the field that caused it.",
  build(d) {
    d.box({ x: 88, y: 32, w: 224, h: 256, r: 16, cls: "frame" });
    d.text({ x: X, y: 56, w: 96, size: 8, cls: "ink" });
    const fields = [0, 1, 2].map((i) => ({
      label: d.text({ x: X, y: 0, w: [40, 56, 46][i]!, size: 4 }),
      field: d.box({ x: X, y: 0, w: W, h: 26, r: 7, cls: i === 1 ? "accent" : "" }),
      typed: i < 2 ? d.text({ x: X + 12, y: 0, w: [84, 64][i]!, size: 4, cls: "ink" }) : null,
    }));
    const button = d.box({ x: X, y: 0, w: 74, h: 26, r: 13, cls: "fill" });
    // The banner at the top, and the same message under the field: one fades as the other arrives.
    const banner = d.group();
    banner.draw.box({ x: X, y: 68, w: W, h: BANNER, r: 7, cls: "accent" });
    banner.draw.circle({ cx: X + 13, cy: 68 + BANNER / 2, r: 3.5, cls: "fill accent" });
    banner.draw.text({ x: X + 24, y: 68 + BANNER / 2, w: 110, size: 4, cls: "accent" });
    const inline = d.group();
    inline.draw.circle({ cx: X + 4, cy: MESSAGE / 2, r: 3.5, cls: "fill accent" });
    inline.draw.text({ x: X + 13, y: MESSAGE / 2, w: 104, size: 4, cls: "accent" });

    return (t) => {
      const e = ease(t);
      // The banner's room at the top closes as the message's room under field 2 opens.
      let y = 72 + (1 - e) * (BANNER + 10);
      const tops: number[] = [];
      fields.forEach(({ label, field, typed }, i) => {
        label.set({ y: y + 2 });
        field.set({ y: y + 9 });
        typed?.set({ y: y + 22 });
        tops.push(y + 9);
        y += 9 + 26 + 14 + (i === 1 ? e * (MESSAGE + 4) : 0);
      });
      button.set({ y: y - 4 });
      banner.set({ opacity: 1 - ease(phase(t, 0, 0.6)) });
      inline.set({ y: tops[1]! + 26 + 5, opacity: ease(phase(t, 0.4, 1)) });
    };
  },
});
