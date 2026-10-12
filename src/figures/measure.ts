/**
 * #008 Limit line length to ~45–75 characters.
 * A browser window with one paragraph. At the mistake the text runs the full
 * width of the window, about 120 characters a line. At the fix it sits in a
 * centred column of about 65, inside dashed guides at 45 and 75 characters,
 * with the margins left empty. The paragraph rewraps as it narrows.
 */
import { defineFigure, ease, lerp } from "../lib/figure";

const CX = 200;
/** Units per character at this zoom: 300 units hold 120 characters. */
const CH = 2.5;
const LENGTH = 560;
const LINE = 12;
const ROWS = 9;

export default defineFigure({
  name: "measure",
  means: "A browser window whose paragraph narrows from full-width lines of 120 characters to a centred column of 65.",
  build(d) {
    d.box({ x: 32, y: 48, w: 336, h: 224, r: 12, cls: "frame" });
    d.line({ x1: 32, y1: 72, x2: 368, y2: 72, cls: "frame" });
    [48, 60, 72].forEach((x) => d.circle({ cx: x, cy: 60, r: 3 }));
    d.box({ x: 132, y: 54, w: 136, h: 12, r: 6 });
    for (const chars of [45, 75]) {
      for (const side of [-1, 1]) {
        const x = CX + (side * chars * CH) / 2;
        d.line({ x1: x, y1: 84, x2: x, y2: 262, cls: "guide" });
      }
    }
    const lines = Array.from({ length: ROWS }, () => d.text({ x: 0, y: 0, w: 0, size: 5 }));
    const width = d.dim({ x1: 0, y1: 0, x2: 0, y2: 0 });

    return (t) => {
      const chars = lerp(120, 65, ease(t));
      const w = chars * CH;
      const rows = Math.ceil(LENGTH / chars);
      const top = 172 - (rows * LINE) / 2 + 8;
      lines.forEach((line, i) => {
        const last = i === rows - 1;
        const len = last ? ((LENGTH - chars * (rows - 1)) / chars) * w : w;
        line.set({ x: CX - w / 2, y: top + i * LINE, w: Math.max(8, len), opacity: i < rows ? 1 : 0 });
      });
      width.set({ x1: CX - w / 2, y1: top - 14, x2: CX + w / 2, y2: top - 14, text: `${Math.round(chars)}ch` });
    };
  },
});
