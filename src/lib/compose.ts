/**
 * Draws a tip as an image: its figure, title, body and credit line, in one of
 * the four formats. The tip page uses it to make image downloads in the
 * browser, and scripts/render.ts uses it frame by frame for the videos and the
 * share image, so both come from this one layout.
 *
 * Colours come from the tokens in global.css, read off an element pinned to
 * the theme. The figure is the live svg, copied with its computed strokes and
 * fills written onto each shape, so the copy draws the same outside the page.
 * Its labels are drawn with the canvas instead, since an svg drawn as an
 * image cannot load the page's fonts.
 */
import { SAFE, VIEW, type Figure } from "./figure";
import { mountFigure } from "./figure/host";
import { SIZES, pad, type Size, type Theme } from "./media";
import { SITE } from "./site";

export interface Words {
  number: number;
  title: string;
  body: string;
}

const SANS = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, Menlo, monospace';
/** The figure's 5:4 stage, and the band of it a drawing stays inside, so the words can sit close. */
const STAGE = VIEW.height / VIEW.width;
const INK_TOP = SAFE.y / VIEW.height;
const INK_BOTTOM = (SAFE.y + SAFE.height) / VIEW.height;

interface Spec {
  pad: number;
  figure: number;
  title: number;
  body: number;
  credit: number;
  gap: number;
}

const SPECS: Record<Size, Spec> = {
  "1x1": { pad: 80, figure: 700, title: 50, body: 29, credit: 22, gap: 20 },
  "4x5": { pad: 88, figure: 904, title: 58, body: 33, credit: 23, gap: 24 },
  "9x16": { pad: 96, figure: 960, title: 68, body: 38, credit: 25, gap: 28 },
  "16x9": { pad: 96, figure: 1040, title: 62, body: 34, credit: 23, gap: 26 },
};

interface Palette {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
}

/** Draws the tip into a canvas of the format's exact size. */
export async function compose(options: {
  svg: SVGSVGElement;
  words: Words;
  size: Size;
  theme: Theme;
}): Promise<HTMLCanvasElement> {
  const { svg, words, size, theme } = options;
  const { width: W, height: H } = SIZES[size];
  const spec = SPECS[size];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const colors = palette(theme);

  await Promise.all(
    [`560 ${spec.title}px ${SANS}`, `400 ${spec.body}px ${SANS}`, `400 ${spec.credit}px ${MONO}`, `500 ${spec.credit}px ${MONO}`].map(
      (font) => document.fonts.load(font, words.title + words.body + pad(words.number)),
    ),
  );

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  const figW = spec.figure;
  const figH = figW * STAGE;
  const creditTop = H - spec.pad - spec.credit;
  let figX: number, figY: number, textX: number, textY: number, textW: number;
  let text: TextBlock;

  if (size === "16x9") {
    figX = spec.pad - 56;
    figY = (H - figH) / 2;
    textX = figX + figW + 24;
    textW = W - textX - spec.pad;
    text = layoutText(ctx, words, spec, textW, creditTop - spec.pad);
    // Level with the drawing, whose middle sits a little above the stage's.
    textY = Math.max(spec.pad, figY + figH * 0.52 - text.height / 2);
  } else {
    textX = spec.pad;
    textW = W - spec.pad * 2;
    text = layoutText(ctx, words, spec, textW, creditTop - spec.pad - figH * INK_BOTTOM - spec.gap);
    // The drawing and the words as one group, centred in the space above the credit.
    const group = figH * (INK_BOTTOM - INK_TOP) + spec.gap + text.height;
    figX = (W - figW) / 2;
    figY = Math.max(spec.pad / 2 - figH * INK_TOP, (creditTop - spec.gap - group) / 2 - figH * INK_TOP);
    textY = figY + figH * INK_BOTTOM + spec.gap;
  }

  await drawFigure(ctx, svg, figX, figY, figW, figH);
  drawText(ctx, text, textX, textY, colors);
  drawCredit(ctx, words.number, spec, colors, H);
  return canvas;
}

interface Line {
  text: string;
  font: string;
  color: keyof Palette;
  /** Line height in px. */
  leading: number;
  /** Space after the line, in px. */
  after: number;
  tracking: number;
}

interface TextBlock {
  lines: Line[];
  height: number;
}

/** Wraps the title (balanced) and body into lines, shrinking both a little at a time if they would not fit. */
function layoutText(ctx: CanvasRenderingContext2D, words: Words, spec: Spec, width: number, room: number): TextBlock {
  for (let scale = 1; ; scale *= 0.94) {
    const title = Math.round(spec.title * scale);
    const body = Math.round(spec.body * scale);
    const lines: Line[] = [];
    const titleFont = `560 ${title}px ${SANS}`;
    for (const text of balance(ctx, words.title, width, titleFont, -0.03 * title)) {
      lines.push({ text, font: titleFont, color: "ink", leading: title * 1.12, after: 0, tracking: -0.03 * title });
    }
    lines[lines.length - 1]!.after = spec.gap * scale;
    const bodyFont = `400 ${body}px ${SANS}`;
    for (const text of wrap(ctx, words.body, width, bodyFont, 0)) {
      lines.push({ text, font: bodyFont, color: "muted", leading: body * 1.5, after: 0, tracking: 0 });
    }
    const height = lines.reduce((sum, line) => sum + line.leading + line.after, 0);
    if (height <= room || scale < 0.6) return { lines, height };
  }
}

function setFont(ctx: CanvasRenderingContext2D, font: string, tracking: number) {
  ctx.font = font;
  ctx.letterSpacing = `${tracking}px`;
}

/** Greedy word wrap, keeping at least two words on the last line when there is more than one line. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, font: string, tracking: number): string[] {
  setFont(ctx, font, tracking);
  const words = text.split(/\s+/);
  const lines: string[][] = [[]];
  for (const word of words) {
    const line = lines[lines.length - 1]!;
    if (line.length && ctx.measureText([...line, word].join(" ")).width > width) lines.push([word]);
    else line.push(word);
  }
  const last = lines[lines.length - 1]!;
  const prev = lines[lines.length - 2];
  if (prev && last.length === 1 && prev.length > 2) last.unshift(prev.pop()!);
  return lines.map((line) => line.join(" "));
}

/** The narrowest wrap that takes no more lines than the full width does, so a two-line title splits evenly. */
function balance(ctx: CanvasRenderingContext2D, text: string, width: number, font: string, tracking: number): string[] {
  const count = wrap(ctx, text, width, font, tracking).length;
  let lo = width / 2;
  let hi = width;
  while (hi - lo > 4) {
    const mid = (lo + hi) / 2;
    if (wrap(ctx, text, mid, font, tracking).length > count) lo = mid;
    else hi = mid;
  }
  return wrap(ctx, text, hi, font, tracking);
}

function drawText(ctx: CanvasRenderingContext2D, block: TextBlock, x: number, y: number, colors: Palette) {
  ctx.textBaseline = "alphabetic";
  let top = y;
  for (const line of block.lines) {
    setFont(ctx, line.font, line.tracking);
    ctx.fillStyle = colors[line.color];
    const m = ctx.measureText(line.text);
    const half = (line.leading - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
    ctx.fillText(line.text, x, top + half + m.fontBoundingBoxAscent);
    top += line.leading + line.after;
  }
}

function drawCredit(ctx: CanvasRenderingContext2D, number: number, spec: Spec, colors: Palette, H: number) {
  setFont(ctx, `400 ${spec.credit}px ${MONO}`, spec.credit * 0.02);
  ctx.textBaseline = "alphabetic";
  const y = H - spec.pad + spec.credit * 0.2;
  const tag = `#${pad(number)}`;
  ctx.fillStyle = colors.accent;
  ctx.fillText(tag, spec.pad, y);
  ctx.fillStyle = colors.muted;
  ctx.fillText(` · ${SITE.host}`, spec.pad + ctx.measureText(tag).width, y);
}

/** The theme's colours, read from global.css's tokens. */
function palette(theme: Theme): Palette {
  const probe = document.createElement("div");
  probe.dataset.theme = theme;
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const colors = { bg: read("--bg"), ink: read("--ink"), muted: read("--muted"), accent: read("--accent") };
  probe.remove();
  return colors;
}

const SHAPES = "path, ellipse, circle, line, rect";

/** The figure: its shapes as a standalone svg image with their computed paint, then its labels in canvas text. */
async function drawFigure(ctx: CanvasRenderingContext2D, svg: SVGSVGElement, x: number, y: number, w: number, h: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", String(w));
  copy.setAttribute("height", String(h));
  const live = svg.querySelectorAll<SVGElement>(SHAPES);
  const copies = copy.querySelectorAll<SVGElement>(SHAPES);
  live.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const out = copies[i]!;
    out.removeAttribute("class");
    for (const [name, value] of [
      ["fill", cs.fill],
      ["stroke", cs.stroke],
      ["stroke-width", cs.strokeWidth],
      ["stroke-linecap", cs.strokeLinecap],
      ["stroke-linejoin", cs.strokeLinejoin],
      ["stroke-dasharray", cs.strokeDasharray],
    ] as const) {
      if (value && value !== "none") out.setAttribute(name, value);
      else if (name !== "stroke-dasharray") out.setAttribute(name, "none");
    }
  });
  // An element's own opacity attribute is kept by the copy; a group's is too.
  for (const text of copy.querySelectorAll("text")) text.remove();
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  await image.decode();
  ctx.drawImage(image, x, y, w, h);

  const scale = w / VIEW.width;
  const toSvg = svg.getScreenCTM()?.inverse();
  for (const label of svg.querySelectorAll<SVGTextElement>("text")) {
    const cs = getComputedStyle(label);
    const opacity = effectiveOpacity(label, svg);
    if (!label.textContent || cs.display === "none" || opacity <= 0) continue;
    const at = new DOMPoint(Number(label.getAttribute("x")), Number(label.getAttribute("y")));
    const matrix = toSvg && label.getScreenCTM() ? toSvg.multiply(label.getScreenCTM()!) : new DOMMatrix();
    const p = at.matrixTransform(matrix);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * scale}px ${cs.fontFamily}`;
    ctx.letterSpacing = `${(parseFloat(cs.letterSpacing) || 0) * scale}px`;
    ctx.fillStyle = cs.fill;
    ctx.textAlign = ({ start: "left", middle: "center", end: "right" } as const)[cs.textAnchor as "start"] ?? "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.textContent, x + p.x * scale, y + p.y * scale);
    ctx.restore();
  }
}

/** An element's opacity times every group's above it, up to the svg. */
function effectiveOpacity(el: Element, svg: SVGSVGElement) {
  let opacity = 1;
  for (let node: Element | null = el; node && node !== svg; node = node.parentElement) {
    opacity *= Number(getComputedStyle(node).opacity);
  }
  return opacity;
}

/** The tip at rest, drawn from a fresh copy of its figure that nobody can see. */
export async function composeRest(figure: Figure, words: Words, size: Size, theme: Theme): Promise<HTMLCanvasElement> {
  const host = document.createElement("div");
  host.dataset.theme = theme;
  host.style.cssText = "position:fixed;left:0;top:0;width:400px;visibility:hidden;pointer-events:none";
  const stage = document.createElement("div");
  stage.style.aspectRatio = "5 / 4";
  host.append(stage);
  document.body.append(host);
  const mounted = mountFigure(stage, figure, { interactive: false });
  try {
    return await compose({ svg: stage.querySelector("svg")!, words, size, theme });
  } finally {
    mounted.destroy();
    host.remove();
  }
}
