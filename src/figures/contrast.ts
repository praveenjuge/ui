/**
 * #004 Check text contrast at 4.5:1 or more.
 * An article card with a dark heading. At the mistake its body text is light
 * grey on white, the ratio reads 1.6:1 and the text nearly disappears; at the
 * fix the body darkens to real text, and the ratio passes at 7:1.
 */
import { defineFigure, ease, lerp } from "../lib/figure";

const BODY = [196, 208, 184, 200, 132];
const X = 104;

export default defineFigure({
  name: "contrast",
  means: "An article card whose body text darkens from faint grey to legible text as its contrast ratio rises from 1.6:1 to 7:1.",
  build(d) {
    d.box({ x: 80, y: 40, w: 240, h: 240, r: 16, cls: "frame" });
    d.box({ x: X, y: 64, w: 192, h: 64, r: 8, cls: "fill" });
    d.text({ x: X, y: 152, w: 150, size: 9, cls: "ink" });
    const ys = BODY.map((_, i) => 176 + i * 16);
    BODY.forEach((w, i) => d.text({ x: X, y: ys[i]!, w, size: 5 }));
    const dark = d.group();
    BODY.forEach((w, i) => dark.draw.text({ x: X, y: ys[i]!, w, size: 5, cls: "ink" }));
    const ratio = d.label({ x: 296, y: 152, text: "", anchor: "end" });

    return (t) => {
      const e = ease(t);
      dark.set({ opacity: e });
      ratio.set({ text: `${lerp(1.6, 7, e).toFixed(1)}:1` });
    };
  },
});
