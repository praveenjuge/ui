/**
 * #001 Make touch targets at least 44×44pt.
 * An app screen with a tab bar of four icons. A fingertip-sized circle sits
 * over the second. At the mistake each icon's hit area hugs its 24pt glyph,
 * far smaller than the finger; at the fix every hit area grows to 44pt and
 * the finger fits inside it.
 */
import { defineFigure, ease, lerp, stagger } from "../lib/figure";

const SLOTS = [92, 164, 236, 308];
const CY = 238;
const GLYPH = 22;
/** 1pt is 54/44 units here, so 24pt and 44pt draw at these sizes. */
const SMALL = 29;
const LARGE = 54;
const PICK = 1;

export default defineFigure({
  name: "target",
  means: "A tab bar whose tap areas grow from the size of their icons to 44 points, as big as a fingertip.",
  build(d) {
    d.box({ x: 56, y: 36, w: 288, h: 248, r: 30, cls: "frame plate" });
    d.text({ x: 84, y: 66, w: 112, size: 8 });
    d.text({ x: 84, y: 86, w: 208 });
    d.text({ x: 84, y: 100, w: 168 });
    d.box({ x: 84, y: 114, w: 232, h: 44, r: 10 });
    d.line({ x1: 56, y1: 178, x2: 344, y2: 178 });

    const areas = SLOTS.map((cx, i) => {
      const area = d.box({ x: cx, y: CY, w: 0, h: 0, r: 10, cls: i === PICK ? "accent" : "guide" });
      d.box({ x: cx - GLYPH / 2, y: CY - GLYPH / 2, w: GLYPH, h: GLYPH, r: 6 });
      return area;
    });
    d.circle({ cx: SLOTS[PICK]!, cy: CY, r: LARGE / 2, cls: "guide" });
    const size = d.dim({ x1: 0, y1: 0, x2: 0, y2: 0 });

    return (t) => {
      areas.forEach((area, i) => {
        const s = lerp(SMALL, LARGE, ease(stagger(t, i, SLOTS.length)));
        area.set({ x: SLOTS[i]! - s / 2, y: CY - s / 2, w: s, h: s, r: lerp(7, 12, s / LARGE) });
        if (i !== PICK) return;
        const top = CY - s / 2 - 9;
        size.set({ x1: SLOTS[i]! - s / 2, y1: top, x2: SLOTS[i]! + s / 2, y2: top, text: `${Math.round(lerp(24, 44, (s - SMALL) / (LARGE - SMALL)))}pt` });
      });
    };
  },
});
