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
 * motion the figure stays on the fix.
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
    if (reduced()) {
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
}

export interface Mounted {
  figure: Figure;
  svg: SVGSVGElement;
  /** Starts the lap from its first frame. */
  play(): void;
  destroy(): void;
}

/** Mounts a loaded figure into an empty stage. */
export function mountFigure(stage: HTMLElement, figure: Figure, options: MountOptions = {}): Mounted {
  const { play = true, at = 1 } = options;
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
  };
  show(at);

  let elapsed = 0;
  const board: Board = {
    visible: false,
    playing: play,
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
    play() {
      elapsed = 0;
      board.playing = true;
      show(1);
      wake();
    },
    destroy() {
      unwatch(stage);
      svg.remove();
    },
  };
}
