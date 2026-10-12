/**
 * #010 Give every action instant feedback.
 * A Save button, tapped, and a timeline under it from the tap to the first
 * response. At the mistake nothing shows for a full second. At the fix the
 * button answers within 100ms: it presses in and a progress bar runs.
 */
import { defineFigure, ease, lerp, phase } from "../lib/figure";

const TL = { x0: 88, x1: 312, y: 244 };
const at = (ms: number) => lerp(TL.x0, TL.x1, ms / 1000);

export default defineFigure({
  name: "press",
  means: "A Save button that goes from no response for a second after a tap to pressing in with a progress bar within 100ms.",
  build(d) {
    d.box({ x: 72, y: 36, w: 256, h: 164, r: 16, cls: "frame" });
    d.text({ x: 96, y: 62, w: 104, size: 8, cls: "ink" });
    d.box({ x: 96, y: 78, w: 208, h: 26, r: 7 });
    d.text({ x: 108, y: 91, w: 96, size: 4, cls: "ink" });
    const button = d.box({ x: 96, y: 120, w: 208, h: 34, r: 10 });
    const label = d.label({ x: 200, y: 137, text: "", cls: "sans ink" });
    d.circle({ cx: 200, cy: 137, r: 22, cls: "guide" });
    const track = d.box({ x: 96, y: 170, w: 208, h: 6, r: 3, cls: "fill" });
    const bar = d.box({ x: 96, y: 170, w: 0, h: 6, r: 3, cls: "fill accent" });

    d.line({ x1: TL.x0, y1: TL.y, x2: TL.x1, y2: TL.y });
    for (const ms of [0, 100, 1000]) d.line({ x1: at(ms), y1: TL.y - 4, x2: at(ms), y2: TL.y + 4 });
    d.label({ x: at(0), y: TL.y + 14, text: "tap", cls: "muted" });
    d.label({ x: at(1000), y: TL.y + 14, text: "1s", cls: "muted" });
    const wait = d.dim({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const reply = d.circle({ cx: 0, cy: TL.y, r: 4, cls: "fill accent" });

    return (t) => {
      const e = ease(t);
      const ms = lerp(1000, 100, e);
      wait.set({ x1: at(0), y1: TL.y - 14, x2: at(ms), y2: TL.y - 14, text: `${Math.round(ms)}ms` });
      reply.set({ cx: at(ms) });
      const pressed = ease(phase(t, 0.4, 0.9));
      button.set({ cls: pressed > 0.5 ? "accent" : "", x: 96 + 3 * pressed, y: 120 + 2 * pressed, w: 208 - 6 * pressed, h: 34 - 4 * pressed });
      label.set({ text: pressed > 0.5 ? "Saving…" : "Save", cls: pressed > 0.5 ? "sans" : "sans ink" });
      track.set({ opacity: pressed });
      bar.set({ w: lerp(0, 140, pressed), opacity: pressed });
    };
  },
});
