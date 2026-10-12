/**
 * A figure drawn once, at build time, as svg markup: the fix at rest. The
 * page ships it inside the figure's stage, so the drawing is there before
 * any script runs (or when none does), and the live figure replaces it when
 * it mounts. The kit only ever creates elements, sets attributes and text,
 * and appends, so a few lines of stand-in DOM are enough to draw into.
 */
import { createDraw } from "./draw";
import { VIEW, type Figure } from "./index";

const modules = import.meta.glob<{ default: Figure }>("../../figures/*.ts", { eager: true });

/** src/figures/<name>.ts, loaded at build time. */
export function getFigure(name: string): Figure {
  const figure = modules[`../../figures/${name}.ts`]?.default;
  if (!figure) throw new Error(`No figure named "${name}" in src/figures`);
  return figure;
}

class Node {
  readonly attrs = new Map<string, string>();
  readonly children: Node[] = [];
  textContent = "";
  constructor(
    readonly ownerDocument: { createElementNS(ns: string, tag: string): Node },
    readonly tag: string,
  ) {}
  append(child: Node) {
    this.children.push(child);
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string) {
    this.attrs.delete(name);
  }
  toString(): string {
    const attrs = [...this.attrs].map(([name, value]) => ` ${name}="${escape(value)}"`).join("");
    return `<${this.tag}${attrs}>${escape(this.textContent)}${this.children.join("")}</${this.tag}>`;
  }
}

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The shapes inside the figure's svg at `t`, as markup. */
export function stillMarkup(figure: Figure, t = 1): string {
  const doc = { createElementNS: (_ns: string, tag: string): Node => new Node(doc, tag) };
  const svg = doc.createElementNS("", "svg");
  figure.build(createDraw(svg as unknown as SVGSVGElement))(t);
  return svg.children.join("");
}

export const STILL_VIEWBOX = `0 0 ${VIEW.width} ${VIEW.height}`;
