/**
 * The drawing kit. Each call adds one element, back to front, and returns a
 * handle whose set() moves or changes it; a handle only touches the DOM for
 * attributes that changed. Colour, stroke and fill come from classes styled
 * in global.css, so a figure never sets a colour of its own.
 *
 * Classes, combined freely:
 *   frame   the device or window outline        (none)  controls and containers
 *   guide   a dashed guide                      accent  the subject of the tip: the one bright thing
 *   ink     the page's text colour, for text that has to read as real, dark text
 *   plate   filled with the page colour, so it hides what is behind it
 *   fill    a solid block (in the text tone, or the accent or ink with those classes)
 * On label(): the accent by default; `ink` or `muted` for other words, and
 * `sans` for words that belong to the interface, like a button's label.
 */
const NS = "http://www.w3.org/2000/svg";
const r2 = (n: number) => Math.round(n * 100) / 100;

type Attrs = Record<string, string | number | undefined>;

export interface Shape<P> {
  el: SVGElement;
  /** The current props. Read them; change them with set(). */
  readonly props: Readonly<P>;
  set(props: Partial<P>): void;
}

interface Common {
  cls?: string;
  opacity?: number;
}

export interface BoxProps extends Common {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius; cut to half the shorter side, so a large one makes a pill. */
  r?: number;
}

export interface LineProps extends Common {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextProps extends Common {
  /** Left edge of the line of text. */
  x: number;
  /** Its middle, vertically. */
  y: number;
  /** Its length. */
  w: number;
  /** Its thickness: the type size. 5 is body text. */
  size?: number;
}

export interface CircleProps extends Common {
  cx: number;
  cy: number;
  r: number;
}

export interface LabelProps extends Common {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
}

export interface DimProps extends Common {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** The measured value, e.g. "44pt". */
  text?: string;
  /** Where the label sits, off the line's middle, toward its left (negative) or right side. */
  offset?: number;
}

export interface PathProps extends Common {
  d: string;
}

export interface GroupProps extends Common {
  x?: number;
  y?: number;
}

export interface Draw {
  svg: SVGSVGElement;
  /** A rounded rectangle: screens, cards, buttons, fields. */
  box(p: BoxProps): Shape<BoxProps>;
  line(p: LineProps): Shape<LineProps>;
  /** A line of skeleton text, as a round-capped bar `size` thick. */
  text(p: TextProps): Shape<TextProps>;
  circle(p: CircleProps): Shape<CircleProps>;
  /** A short value in mono, in the accent: "44pt", "65ch". Two words at most. */
  label(p: LabelProps): Shape<LabelProps>;
  /** A dimension line with end ticks and its value, as a design spec marks a size or a gap. */
  dim(p: DimProps): Shape<DimProps>;
  path(p: PathProps): Shape<PathProps>;
  /** A group, to move or fade several shapes together. Draw into it with the returned kit. */
  group(p?: GroupProps): Shape<GroupProps> & { draw: Draw };
}

function shape<P extends object>(parent: Element, tag: string, props: P, attrs: (p: P) => Attrs): Shape<P> {
  // The parent's document, not the global one, so ./still can draw a figure at build time.
  const el = parent.ownerDocument.createElementNS(NS, tag) as SVGElement;
  parent.append(el);
  const state = { ...props };
  const written: Record<string, string> = {};
  const write = () => {
    for (const [key, value] of Object.entries(attrs(state))) {
      const text = value === undefined ? "" : typeof value === "number" ? String(r2(value)) : value;
      if (written[key] === text) continue;
      written[key] = text;
      if (value === undefined) el.removeAttribute(key);
      else el.setAttribute(key, text);
    }
  };
  write();
  return {
    el,
    props: state,
    set(next) {
      Object.assign(state, next);
      write();
    },
  };
}

const common = (p: Common): Attrs => ({ class: p.cls, opacity: p.opacity === undefined || p.opacity >= 1 ? undefined : Math.max(0, p.opacity) });

/** The kit, drawing into `root`: the svg, or a group inside it. */
export function createDraw(svg: SVGSVGElement, root: Element = svg): Draw {
  const draw: Draw = {
    svg,
    box: (p) =>
      shape(root, "rect", p, (q) => {
        const w = Math.max(0, q.w), h = Math.max(0, q.h);
        return { ...common(q), x: q.x, y: q.y, width: w, height: h, rx: Math.min(q.r ?? 0, w / 2, h / 2) };
      }),
    line: (p) => shape(root, "line", p, (q) => ({ ...common(q), x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2 })),
    text: (p) =>
      shape(root, "line", p, (q) => {
        const size = q.size ?? 5, half = Math.min(size / 2, q.w / 2);
        return {
          ...common({ ...q, cls: q.cls ? `text ${q.cls}` : "text" }),
          // A style, not an attribute: the stylesheet's stroke-width would beat an attribute.
          x1: q.x + half, y1: q.y, x2: q.x + q.w - half, y2: q.y, style: `stroke-width:${size}`,
        };
      }),
    circle: (p) => shape(root, "circle", p, (q) => ({ ...common(q), cx: q.cx, cy: q.cy, r: Math.max(0, q.r) })),
    label: (p) => {
      const handle = shape(root, "text", p, (q) => ({
        ...common({ ...q, cls: q.cls ? `label ${q.cls}` : "label" }),
        x: q.x, y: q.y, "text-anchor": q.anchor ?? "middle", "dominant-baseline": "central",
      }));
      const write = handle.set;
      const sync = () => {
        if (handle.el.textContent !== handle.props.text) handle.el.textContent = handle.props.text;
      };
      sync();
      return { ...handle, set: (next) => (write(next), sync()) };
    },
    dim: (p) => {
      const g = shape(root, "g", p, (q) => common({ ...q, cls: q.cls ? `dim accent ${q.cls}` : "dim accent" }));
      const kit = createDraw(svg, g.el);
      const ticks = kit.path({ d: "" });
      const value = kit.label({ x: 0, y: 0, text: "" });
      const sync = () => {
        const { x1, y1, x2, y2, text = "", offset = 9 } = g.props;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = -(y2 - y1) / len, ny = (x2 - x1) / len; // normal: the label's side
        const t = 3.5;
        ticks.set({
          d:
            `M${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}` +
            `M${r2(x1 - nx * t)} ${r2(y1 - ny * t)}L${r2(x1 + nx * t)} ${r2(y1 + ny * t)}` +
            `M${r2(x2 - nx * t)} ${r2(y2 - ny * t)}L${r2(x2 + nx * t)} ${r2(y2 + ny * t)}`,
        });
        value.set({ x: (x1 + x2) / 2 - nx * offset, y: (y1 + y2) / 2 - ny * offset, text });
      };
      sync();
      return { ...g, set: (next) => (g.set(next), sync()) };
    },
    path: (p) => shape(root, "path", p, (q) => ({ ...common(q), d: q.d })),
    group: (p = {}) => {
      const g = shape(root, "g", p, (q) => ({
        ...common(q),
        transform: q.x || q.y ? `translate(${r2(q.x ?? 0)} ${r2(q.y ?? 0)})` : undefined,
      }));
      return { ...g, draw: createDraw(svg, g.el) };
    },
  };
  return draw;
}
