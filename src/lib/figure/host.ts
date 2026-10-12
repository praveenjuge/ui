/**
 * Runs figures on the site. It loads a figure's module only when a page shows
 * it, mounts it into a stage, and owns everything around the drawing:
 *
 * - The pointer: its x across the stage sets t, from the mistake at the left
 *   to the fix at the right. When the pointer leaves, t goes back to 1.
 * - The spring: t follows its target on a spring, critically damped, so it
 *   never overshoots.
 * - The tour: one 8-second lap of the lesson (fix, mistake, halfway, fix) that
 *   plays until a hand arrives and resumes after it leaves. The video is one lap.
 * - The loop: one requestAnimationFrame loop for every figure on the page. It
 *   sleeps when nothing moves, skips figures off screen, and under reduced
 *   motion lands every change at once and keeps the tour still.
 */
import { createDraw } from "./draw";
import { LAP_MS, VIEW, clamp, type Figure } from "./index";

const NS = "http://www.w3.org/2000/svg";

/** Where the tour sends t along its lap. */
const TOUR = [
  { at: 700, t: 0 },
  { at: 3400, t: 0.5 },
  { at: 5300, t: 1 },
];
/** How long after a hand leaves the tour starts its lap again. */
const RESUME_MS = 1500;
/** The pointer's x maps to t between these fractions of the stage's width. */
const SCRUB = [0.15, 0.85] as const;
const K = 90;
const C = 19;

const modules = import.meta.glob<{ default: Figure }>("../../figures/*.ts");

/** Loads src/figures/<name>.ts. */
export async function loadFigure(name: string): Promise<Figure> {
  const load = modules[`../../figures/${name}.ts`];
  if (!load) throw new Error(`No figure named "${name}" in src/figures`);
  return (await load()).default;
}

// The loop, shared by every figure on the page.

interface Board {
  tick(dt: number): boolean;
  visible: boolean;
  awake: boolean;
}

const boards = new Map<Element, Board>();
let raf = 0;
let last = 0;
let observer: IntersectionObserver | undefined;
let reducedQuery: MediaQueryList | undefined;

const reduced = () => (reducedQuery ??= matchMedia("(prefers-reduced-motion: reduce)")).matches;

function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  let any = false;
  for (const board of boards.values()) {
    if (!board.visible || !board.awake) continue;
    board.awake = board.tick(dt);
    any ||= board.awake;
  }
  raf = any ? requestAnimationFrame(frame) : 0;
}

function wake(board: Board) {
  board.awake = true;
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
        if (b.visible) wake(b);
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
  /** Play the tour until a hand arrives. */
  play?: boolean;
  /** Let the pointer scrub the figure. */
  interactive?: boolean;
  /** Hold the figure at this t instead of resting at the fix (1), for a picture of the mistake. */
  at?: number;
}

export interface Mounted {
  figure: Figure;
  svg: SVGSVGElement;
  /** Starts the tour from the top of its lap. */
  play(): void;
  destroy(): void;
}

/** Mounts a loaded figure into an empty stage. */
export function mountFigure(stage: HTMLElement, figure: Figure, options: MountOptions = {}): Mounted {
  const { play = false, interactive = true, at = 1 } = options;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VIEW.width} ${VIEW.height}`);
  svg.setAttribute("class", "figure-svg");
  svg.setAttribute("aria-hidden", "true");
  stage.append(svg);
  stage.setAttribute("role", "img");
  stage.setAttribute("aria-label", figure.means);

  const show = figure.build(createDraw(svg));
  const spring = { x: at, v: 0, target: at };
  let shown = NaN;
  const render = () => {
    if (spring.x !== shown) show((shown = spring.x));
  };
  render();

  const tour = { on: play, elapsed: 0, hand: false, resumeIn: 0 };
  const tourTarget = (ms: number) => TOUR.reduce((t, stop) => (ms >= stop.at ? stop.t : t), 1);

  const board: Board = {
    visible: false,
    awake: true,
    tick(dt) {
      const touring = tour.on && !reduced();
      if (touring && !tour.hand) {
        if (tour.resumeIn > 0) tour.resumeIn -= dt * 1000;
        else {
          tour.elapsed = (tour.elapsed + dt * 1000) % LAP_MS;
          spring.target = tourTarget(tour.elapsed);
        }
      }
      const moving = stepSpring(spring, dt);
      render();
      return moving || (touring && !tour.hand);
    },
  };
  watch(stage, board);

  const toward = (target: number) => {
    spring.target = target;
    wake(board);
  };
  const point = (event: PointerEvent) => {
    const box = stage.getBoundingClientRect();
    const fx = (event.clientX - box.left) / box.width;
    tour.hand = true;
    toward(clamp((fx - SCRUB[0]) / (SCRUB[1] - SCRUB[0])));
  };
  const leave = () => {
    tour.hand = false;
    tour.elapsed = 0;
    tour.resumeIn = RESUME_MS;
    toward(at);
  };
  if (interactive) {
    stage.addEventListener("pointermove", point);
    stage.addEventListener("pointerdown", point);
    stage.addEventListener("pointerleave", leave);
    stage.addEventListener("pointercancel", leave);
  } else {
    stage.style.pointerEvents = "none";
  }

  return {
    figure,
    svg,
    play() {
      Object.assign(tour, { on: true, elapsed: 0, hand: false, resumeIn: 0 });
      wake(board);
    },
    destroy() {
      unwatch(stage);
      stage.removeEventListener("pointermove", point);
      stage.removeEventListener("pointerdown", point);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("pointercancel", leave);
      svg.remove();
    },
  };
}

/** Moves the spring by dt seconds; returns whether it is still moving. Under reduced motion it lands at once. */
function stepSpring(s: { x: number; v: number; target: number }, dt: number): boolean {
  if (reduced()) {
    s.x = s.target;
    s.v = 0;
    return false;
  }
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (-K * (s.x - s.target) - C * s.v) * h;
    s.x += s.v * h;
  }
  if (Math.abs(s.x - s.target) < 1e-3 && Math.abs(s.v) < 1e-2) {
    s.x = s.target;
    s.v = 0;
    return false;
  }
  return true;
}
