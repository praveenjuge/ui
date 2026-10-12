/**
 * Runs figures on the site. It loads a figure's module only when a page shows
 * it, mounts it into a stage, and plays its lesson on a loop:
 *
 *   the fix, held · a quick reset to the mistake, held · the fix, applied
 *   slowly and held
 *
 * The lap is 8 seconds and the video is one lap, so it starts and ends on
 * the fix.
 *
 * Time moves t linearly between those holds; each figure eases its own parts
 * (see `ease` and `stagger` in ./index). One requestAnimationFrame loop runs
 * every figure on the page and skips the ones off screen. Under reduced
 * motion the figure stays on the fix, unless someone presses play.
 *
 * A stage can hold the figure's still (see ./still), drawn at build time; the
 * live figure takes its place while mounted and gives it back when it goes.
 */
import { createDraw } from "./draw";
import { LAP_MS, VIEW, type Figure } from "./index";

const NS = "http://www.w3.org/2000/svg";

/**
 * The lap, as [ms, t] keyframes; t is linear between them. The reset to the
 * mistake is quick and the fix is slow: the fix is the part worth watching.
 */
const LAP: [number, number][] = [
  [0, 1],
  [1600, 1],
  [2100, 0],
  [4200, 0],
  [5700, 1],
  [LAP_MS, 1],
];

function tAt(ms: number): number {
  const m = ((ms % LAP_MS) + LAP_MS) % LAP_MS;
  for (let i = 1; i < LAP.length; i++) {
    const [b, tb] = LAP[i]!;
    const [a, ta] = LAP[i - 1]!;
    if (m <= b) return ta + (tb - ta) * ((m - a) / (b - a));
  }
  return 1;
}

/** The first point in the lap's slow fix that shows `t`, or its start for the fix itself. */
function lapAt(t: number): number {
  if (!(t < 1)) return 0;
  const [a, ta] = LAP[3]!;
  const [b, tb] = LAP[4]!;
  return a + (b - a) * ((Math.max(0, t) - ta) / (tb - ta));
}

const modules = import.meta.glob<{ default: Figure }>("../../figures/*.ts");

/** Loads src/figures/<name>.ts. */
export async function loadFigure(name: string): Promise<Figure> {
  const load = modules[`../../figures/${name}.ts`];
  if (!load) throw new Error(`No figure named "${name}" in src/figures`);
  return (await load()).default;
}

// The loop, shared by every figure on the page.

interface Board {
  tick(dt: number): void;
  /** Back to the fix, for reduced motion. */
  rest(): void;
  visible: boolean;
  playing: boolean;
  /** Someone pressed play: run the loop even under reduced motion. */
  chosen: boolean;
}

const boards = new Map<Element, Board>();
let raf = 0;
let last = 0;
let observer: IntersectionObserver | undefined;
let reducedQuery: MediaQueryList | undefined;

const reduced = () => (reducedQuery ??= matchMedia("(prefers-reduced-motion: reduce)")).matches;

function frame(now: number) {
  const dt = Math.min(50, Math.max(0, now - last));
  last = now;
  let any = false;
  for (const board of boards.values()) {
    if (!board.visible || !board.playing) continue;
    if (reduced() && !board.chosen) {
      board.rest();
      continue;
    }
    board.tick(dt);
    any = true;
  }
  raf = any ? requestAnimationFrame(frame) : 0;
}

function wake() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function watch(el: Element, board: Board) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const b = boards.get(entry.target);
        if (!b) continue;
        b.visible = entry.isIntersecting;
        if (b.visible) wake();
      }
    },
    { rootMargin: "80px" },
  );
  boards.set(el, board);
  observer.observe(el);
}

function unwatch(el: Element) {
  boards.delete(el);
  observer?.unobserve(el);
}

export interface MountOptions {
  /** Play the lap on a loop (the default), or hold still at `at`. */
  play?: boolean;
  /** Where the figure holds when it isn't playing: 1 the fix (the default), 0 the mistake. */
  at?: number;
  /** Called with t whenever the figure shows a new one. */
  onShow?: (t: number) => void;
}

export interface Mounted {
  figure: Figure;
  svg: SVGSVGElement;
  /** Where the figure is: 0 the mistake, 1 the fix. */
  readonly t: number;
  /** Whether the loop is running. */
  readonly playing: boolean;
  /** Starts the lap from its first frame. */
  play(): void;
  /** Runs the loop again from where it stopped; `chosen` plays it even under reduced motion. */
  resume(options?: { chosen?: boolean }): void;
  /** Stops the loop where it is. */
  pause(): void;
  /** Stops the loop and shows `t`. */
  seek(t: number): void;
  destroy(): void;
}

/** Whether the figures should hold still: the system asks for reduced motion. */
export const prefersReducedMotion = reduced;

/** Mounts a loaded figure into an empty stage. */
export function mountFigure(stage: HTMLElement, figure: Figure, options: MountOptions = {}): Mounted {
  const { play = true, at = 1, onShow } = options;
  const still = stage.querySelector<SVGSVGElement>(":scope > svg[data-still]");
  still?.remove();
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VIEW.width} ${VIEW.height}`);
  svg.setAttribute("class", "figure-svg");
  svg.setAttribute("aria-hidden", "true");
  stage.append(svg);
  stage.setAttribute("role", "img");
  stage.setAttribute("aria-label", figure.means);

  const showFigure = figure.build(createDraw(svg));
  let shown = NaN;
  const show = (t: number) => {
    if (t === shown) return;
    shown = t;
    showFigure(t);
    onShow?.(t);
  };
  show(at);

  let elapsed = 0;
  const board: Board = {
    visible: false,
    playing: play,
    chosen: false,
    tick(dt) {
      elapsed = (elapsed + dt) % LAP_MS;
      show(tAt(elapsed));
    },
    rest() {
      elapsed = 0;
      show(at);
    },
  };
  watch(stage, board);

  return {
    figure,
    svg,
    get t() {
      return shown;
    },
    get playing() {
      return board.playing;
    },
    play() {
      elapsed = 0;
      board.playing = true;
      show(1);
      wake();
    },
    resume({ chosen = false } = {}) {
      board.chosen ||= chosen;
      // Pick the lap up at the point that shows the current t, so play continues from the scrubber.
      elapsed = lapAt(shown);
      board.playing = true;
      wake();
    },
    pause() {
      board.playing = false;
    },
    seek(t) {
      board.playing = false;
      show(t);
    },
    destroy() {
      unwatch(stage);
      svg.remove();
      if (still) stage.append(still);
    },
  };
}
