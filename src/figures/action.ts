/**
 * #005 Label buttons with verbs, not "OK".
 * A confirm dialog about three files. At the mistake its buttons say "OK" and
 * "Cancel", so you have to reread the dialog to know which one deletes. At the
 * fix they say what they do: "Delete 3 files" and "Keep files".
 */
import { defineFigure, ease, lerp, phase } from "../lib/figure";

const RIGHT = 300;
const BY = 226;
const BH = 28;
const GAP = 8;

export default defineFigure({
  name: "action",
  means: "A confirm dialog whose buttons change from OK and Cancel to Delete 3 files and Keep files.",
  build(d) {
    d.box({ x: 72, y: 44, w: 256, h: 232, r: 16, cls: "frame plate" });
    d.text({ x: 98, y: 72, w: 128, size: 9, cls: "ink" });
    d.text({ x: 98, y: 94, w: 196 });
    [0, 1, 2].forEach((i) => {
      const y = 112 + i * 30;
      d.box({ x: 98, y, w: 204, h: 24, r: 6 });
      d.box({ x: 106, y: y + 6, w: 12, h: 12, r: 3, cls: "fill" });
      d.text({ x: 126, y: y + 12, w: [92, 70, 104][i]!, size: 4 });
    });
    const keep = d.box({ x: 0, y: BY, w: 0, h: BH, r: 8 });
    const keepLabel = d.label({ x: 0, y: BY + BH / 2, text: "", cls: "sans ink" });
    const go = d.box({ x: 0, y: BY, w: 0, h: BH, r: 8, cls: "accent" });
    const goLabel = d.label({ x: 0, y: BY + BH / 2, text: "", cls: "sans" });

    return (t) => {
      const e = ease(phase(t, 0.15, 0.85));
      const words = t < 0.5;
      // The labels fade out, swap at the middle, and fade back in.
      const fade = Math.abs(phase(t, 0.3, 0.7) - 0.5) * 2;
      const goW = lerp(44, 104, e);
      const keepW = lerp(64, 76, e);
      go.set({ x: RIGHT - goW, w: goW });
      goLabel.set({ x: RIGHT - goW / 2, text: words ? "OK" : "Delete 3 files", opacity: fade });
      keep.set({ x: RIGHT - goW - GAP - keepW, w: keepW });
      keepLabel.set({ x: RIGHT - goW - GAP - keepW / 2, text: words ? "Cancel" : "Keep files", opacity: fade });
    };
  },
});
