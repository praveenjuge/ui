/**
 * #002 Space by relationship: closer means related.
 * A sign-up form of three labelled fields. At the mistake every gap is the
 * same, so each label sits as close to the field above it as to its own. At
 * the fix each label hugs its field and the pairs stand apart, and the two
 * gaps are measured beside the second pair.
 */
import { defineFigure, ease, lerp } from "../lib/figure";

const X = 112;
const W = 176;
const TOP = 62;
const LABEL = 4;
const FIELD = 26;
/** Label-to-field and field-to-next-label gaps: equal at the mistake, 5 and 22 at the fix (same total, so nothing else moves). */
const EVEN = 13.5;
const NEAR = 5;
const FAR = 22;
const PICK = 1;

export default defineFigure({
  name: "proximity",
  means: "A form whose labels move from evenly spaced to sitting close to their own fields, so each pair reads as a group.",
  build(d) {
    d.box({ x: 88, y: 36, w: 224, h: 248, r: 16, cls: "frame" });
    const pairs = [0, 1, 2].map((i) => ({
      label: d.text({ x: X, y: 0, w: [38, 54, 46][i]!, size: LABEL, cls: i === PICK ? "accent" : "ink" }),
      field: d.box({ x: X, y: 0, w: W, h: FIELD, r: 7, cls: i === PICK ? "accent" : "" }),
    }));
    d.box({ x: X, y: TOP + 3 * (LABEL + EVEN + FIELD + EVEN), w: 74, h: 26, r: 13, cls: "fill" });
    const near = d.dim({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const far = d.dim({ x1: 0, y1: 0, x2: 0, y2: 0 });

    return (t) => {
      const e = ease(t);
      const gin = lerp(EVEN, NEAR, e);
      const gout = lerp(EVEN, FAR, e);
      let y = TOP;
      const tops: number[] = [];
      pairs.forEach(({ label, field }) => {
        label.set({ y: y + LABEL / 2 });
        field.set({ y: y + LABEL + gin });
        tops.push(y);
        y += LABEL + gin + FIELD + gout;
      });
      const x = X + W + 16;
      const label = tops[PICK]!;
      const above = tops[PICK - 1]! + LABEL + gin + FIELD;
      far.set({ x1: x, y1: above, x2: x, y2: label, text: `${Math.round(lerp(16, 24, e))}`, offset: 10 });
      near.set({ x1: x, y1: label + LABEL, x2: x, y2: label + LABEL + gin, text: `${Math.round(lerp(16, 8, e))}`, offset: 10 });
    };
  },
});
