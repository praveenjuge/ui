/**
 * Draws a tip as an image, in one of the four formats, two ways:
 *
 *   still   the mistake beside the fix, each on its own plate, with the tip's
 *           words. The share image and the image downloads.
 *   frame   the live figure as it is now, with a track under it from the
 *           mistake to the fix. scripts/render.ts draws one per video frame.
 *
 * Both carry the same header: the cube, "UI Tip #012", and the site's host.
 *
 * Colours and type come from the tokens in global.css, read off an element
 * pinned to the theme, so an image looks like the site in Geist on every
 * computer. The figure is the live svg, copied with its computed strokes and
 * fills written onto each shape, so the copy draws the same outside the page.
 * Its labels are drawn with the canvas instead, since an svg drawn as an
 * image cannot load the page's fonts.
 */
import { SAFE, VIEW, type Figure } from "./figure";
import { mountFigure } from "./figure/host";
import { LOGO_FACES, LOGO_VIEW } from "./logo";
import { SIZES, pad, type Size, type Theme } from "./media";
import { SITE } from "./site";

export interface Words {
  number: number;
  title: string;
  body: string;
}

/** The figure's 5:4 stage, and the band of it a drawing stays inside, so the words can sit close. */
const STAGE = VIEW.height / VIEW.width;
const INK_TOP = SAFE.y / VIEW.height;
const INK_BOTTOM = (SAFE.y + SAFE.height) / VIEW.height;

interface Spec {
  pad: number;
  /** The figure's width in a video frame. */
  figure: number;
  title: number;
  body: number;
  /** The header's type size. */
  credit: number;
  gap: number;
  /** Whether a still carries the body; the 16:9 share image leaves it out, so the title can be big. */
  stillBody: boolean;
}

const SPECS: Record<Size, Spec> = {
  "1x1": { pad: 80, figure: 700, title: 50, body: 29, credit: 24, gap: 20, stillBody: true },
  "4x5": { pad: 88, figure: 880, title: 58, body: 33, credit: 26, gap: 24, stillBody: true },
  "9x16": { pad: 96, figure: 940, title: 68, body: 38, credit: 28, gap: 28, stillBody: true },
  "16x9": { pad: 88, figure: 1040, title: 76, body: 34, credit: 28, gap: 26, stillBody: false },
};

interface Look {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  sans: string;
  mono: string;
}

interface Frame {
  W: number;
  H: number;
  spec: Spec;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  look: Look;
}

/** A blank canvas of the format's exact size, in the theme, with its fonts loaded. */
async function begin(words: Words, size: Size, theme: Theme): Promise<Frame> {
  const { width: W, height: H } = SIZES[size];
  const spec = SPECS[size];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const look = readLook(theme);
  const text = words.title + words.body + header(words.number) + SITE.host + "MistakeFix";
  // Load Geist itself, not the whole list: a fallback face made from a local font the computer lacks
  // (Arial on Linux) fails to load, and would fail the image with it.
  const sans = primary(look.sans);
  const mono = primary(look.mono);
  await Promise.allSettled(
    [`600 ${spec.title}px ${sans}`, `400 ${spec.body}px ${sans}`, `500 ${spec.body}px ${sans}`, `500 ${spec.credit}px ${mono}`].map((font) =>
      document.fonts.load(font, text),
    ),
  );
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, W, H);
  return { W, H, spec, ctx, canvas, look };
}

const header = (number: number) => `UI Tip #${pad(number)}`;

/** The first family in a font-family list. */
const primary = (families: string) => families.split(",")[0]!.trim();

/** The mistake beside the fix, with the tip's words. `mistake` and `fix` are the figure's svg at t 0 and 1. */
export async function composeStill(options: {
  mistake: SVGSVGElement;
  fix: SVGSVGElement;
  words: Words;
  size: Size;
  theme: Theme;
}): Promise<HTMLCanvasElement> {
  const { mistake, fix, words, size, theme } = options;
  const f = await begin(words, size, theme);
  const { W, H, spec, ctx } = f;
  const top = drawHeader(f, words.number);
  const inner = W - spec.pad * 2;
  const gap = spec.gap * 1.6;

  // The words take what they need, up to two fifths of the room; the plates take the rest.
  const room = H - spec.pad - top - gap;
  const shown = spec.stillBody ? words : { ...words, body: "" };
  const between = gap * 0.75;
  let text = layoutText(ctx, f.look, shown, spec, inner, room * 0.4);
  let plates = arrange(inner, room - text.height - gap, between);
  // Room the plates can't use goes to the words: set them larger, up to 1.25 times.
  const spare = room - text.height - gap - plates.height;
  if (spare > spec.title) {
    text = layoutText(ctx, f.look, shown, spec, inner, text.height + spare * 0.6, 1.25);
    plates = arrange(inner, room - text.height - gap, between);
  }

  // The words and the plates as one block, centred in the room under the header, all from one left edge.
  const block = text.height + gap + plates.height;
  const y = top + Math.max(0, (room - block) / 2);
  drawText(ctx, text, spec.pad, y, f.look);
  const platesY = y + text.height + gap;
  await drawPlate(f, mistake, "mistake", spec.pad, platesY, plates.w, plates.stage);
  const [dx, dy] = plates.side ? [plates.w + between, 0] : [0, plates.h + between];
  await drawPlate(f, fix, "fix", spec.pad + dx, platesY + dy, plates.w, plates.stage);
  return f.canvas;
}

/** Two plates across the full width, side by side or one above the other, whichever gives the figure more room. */
function arrange(width: number, height: number, gap: number) {
  const side = Math.floor(Math.min((width - gap) / 2, height / STAGE));
  const stacked = Math.floor(Math.min(width, (height - gap) / 2 / STAGE));
  if (side >= stacked) {
    const w = (width - gap) / 2;
    return { side: true, stage: side, w, h: side * STAGE, height: side * STAGE };
  }
  return { side: false, stage: stacked, w: width, h: stacked * STAGE, height: stacked * STAGE * 2 + gap };
}

/** One state of the figure, centred on a plate `w` wide, captioned in its top left corner with a mark and a word. */
async function drawPlate(f: Frame, svg: SVGSVGElement, state: "mistake" | "fix", x: number, y: number, w: number, stage: number) {
  const { ctx, look } = f;
  const h = stage * STAGE;
  const r = stage * 0.04;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = look.bg;
  ctx.fill();
  ctx.lineWidth = Math.max(2, w / 300);
  ctx.strokeStyle = state === "fix" ? look.accent : look.line;
  ctx.globalAlpha = state === "fix" ? 0.45 : 1;
  ctx.stroke();
  ctx.restore();

  await drawFigure(ctx, svg, x + (w - stage) / 2, y, stage, h);

  // The caption sits in the stage's empty top margin, above anything a figure draws.
  const size = Math.round(Math.min(30, Math.max(17, h * 0.055)));
  const cx = x + stage * 0.045;
  const cy = y + h * (INK_TOP / 2) + size * 0.1;
  const color = state === "fix" ? look.accent : look.muted;
  drawMark(ctx, state, cx, cy, size * 0.62, color);
  setFont(ctx, `500 ${size}px ${look.sans}`, 0);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(state === "fix" ? "Fix" : "Mistake", cx + size * 0.95, cy);
}

/** A cross for the mistake and a tick for the fix, so the plates differ by more than colour. */
function drawMark(ctx: CanvasRenderingContext2D, state: "mistake" | "fix", x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (state === "fix") {
    ctx.moveTo(x, y);
    ctx.lineTo(x + s * 0.36, y + s * 0.36);
    ctx.lineTo(x + s, y - s * 0.4);
  } else {
    const h = s * 0.42;
    ctx.moveTo(x + s / 2 - h, y - h);
    ctx.lineTo(x + s / 2 + h, y + h);
    ctx.moveTo(x + s / 2 + h, y - h);
    ctx.lineTo(x + s / 2 - h, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

/** A video frame: the live figure as it is now, the track under it at `t`, then the words. */
export async function composeFrame(options: {
  svg: SVGSVGElement;
  t: number;
  words: Words;
  size: Size;
  theme: Theme;
}): Promise<HTMLCanvasElement> {
  const { svg, t, words, size, theme } = options;
  const f = await begin(words, size, theme);
  const { W, H, spec, ctx } = f;
  const top = drawHeader(f, words.number);
  const track = spec.credit * 3.2;

  const figW = spec.figure;
  const figH = figW * STAGE;
  let figX: number, figY: number, textX: number, textY: number;
  let text: TextBlock;

  if (size === "16x9") {
    figX = spec.pad - 56;
    figY = top + (H - spec.pad - top - figH - track) / 2;
    textX = figX + figW + 24;
    const textW = W - textX - spec.pad;
    text = layoutText(ctx, f.look, words, spec, textW, H - spec.pad - top);
    textY = Math.max(top, figY + figH * 0.52 - text.height / 2);
  } else {
    textX = spec.pad;
    const textW = W - spec.pad * 2;
    text = layoutText(ctx, f.look, words, spec, textW, H - spec.pad - top - figH * (INK_BOTTOM - INK_TOP) - track - spec.gap);
    // The drawing, its track and the words as one group, centred under the header.
    const group = figH * (INK_BOTTOM - INK_TOP) + track + spec.gap + text.height;
    figX = (W - figW) / 2;
    figY = top + Math.max(0, (H - spec.pad - top - group) / 2) - figH * INK_TOP;
    textY = figY + figH * INK_BOTTOM + track + spec.gap;
  }

  await drawFigure(ctx, svg, figX, figY, figW, figH);
  drawTrack(f, t, figX + figW * 0.2, figX + figW * 0.8, figY + figH * INK_BOTTOM + track * 0.55);
  drawText(ctx, text, textX, textY, f.look);
  return f.canvas;
}

/** The scrubber from the tip page, still: Mistake, a line filled to t with a dot on it, Fix. */
function drawTrack(f: Frame, t: number, x0: number, x1: number, y: number) {
  const { ctx, look, spec } = f;
  const size = Math.round(spec.credit * 0.8);
  setFont(ctx, `500 ${size}px ${look.mono}`, 0);
  ctx.textBaseline = "middle";
  ctx.fillStyle = look.muted;
  ctx.textAlign = "right";
  ctx.fillText("Mistake", x0 - size * 0.8, y);
  ctx.fillStyle = look.accent;
  ctx.textAlign = "left";
  ctx.fillText("Fix", x1 + size * 0.8, y);
  ctx.textAlign = "left";

  const at = x0 + (x1 - x0) * Math.min(1, Math.max(0, t));
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, size * 0.14);
  ctx.strokeStyle = look.line;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.strokeStyle = look.accent;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(at, y);
  ctx.stroke();
  ctx.fillStyle = look.accent;
  ctx.beginPath();
  ctx.arc(at, y, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The cube, "UI Tip #012" and the host along the top. Returns where the content below it starts. */
function drawHeader(f: Frame, number: number): number {
  const { ctx, look, spec, W } = f;
  const size = spec.credit;
  const cube = Math.round(size * 1.6);
  const y = spec.pad + cube / 2;
  drawLogo(ctx, spec.pad, y - cube / 2, cube);
  setFont(ctx, `500 ${size}px ${look.mono}`, size * 0.01);
  ctx.textBaseline = "middle";
  ctx.fillStyle = look.accent;
  ctx.fillText(header(number), spec.pad + cube + size * 0.6, y);
  ctx.fillStyle = look.muted;
  ctx.textAlign = "right";
  ctx.fillText(SITE.host, W - spec.pad, y);
  ctx.textAlign = "left";
  return spec.pad + cube + spec.gap * 2;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / LOGO_VIEW, size / LOGO_VIEW);
  ctx.lineWidth = 0.6;
  ctx.lineJoin = "round";
  for (const face of LOGO_FACES) {
    const path = new Path2D(face.d);
    ctx.fillStyle = ctx.strokeStyle = face.fill;
    ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();
}

interface Line {
  text: string;
  font: string;
  color: "ink" | "muted";
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

/** Wraps the title (balanced) and body into lines, from `start` times their size down a little at a time until they fit. */
function layoutText(
  ctx: CanvasRenderingContext2D,
  look: Look,
  words: Pick<Words, "title" | "body">,
  spec: Spec,
  width: number,
  room: number,
  start = 1,
): TextBlock {
  for (let scale = start; ; scale *= 0.96) {
    const title = Math.round(spec.title * scale);
    const body = Math.round(spec.body * scale);
    const lines: Line[] = [];
    const titleFont = `600 ${title}px ${look.sans}`;
    for (const text of balance(ctx, words.title, width, titleFont, -0.025 * title)) {
      lines.push({ text, font: titleFont, color: "ink", leading: title * 1.12, after: 0, tracking: -0.025 * title });
    }
    if (words.body) {
      lines[lines.length - 1]!.after = spec.gap * scale;
      const bodyFont = `400 ${body}px ${look.sans}`;
      for (const text of wrap(ctx, words.body, width, bodyFont, 0)) {
        lines.push({ text, font: bodyFont, color: "muted", leading: body * 1.5, after: 0, tracking: 0 });
      }
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

function drawText(ctx: CanvasRenderingContext2D, block: TextBlock, x: number, y: number, look: Look) {
  ctx.textBaseline = "alphabetic";
  let top = y;
  for (const line of block.lines) {
    setFont(ctx, line.font, line.tracking);
    ctx.fillStyle = look[line.color];
    const m = ctx.measureText(line.text);
    const half = (line.leading - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
    ctx.fillText(line.text, x, top + half + m.fontBoundingBoxAscent);
    top += line.leading + line.after;
  }
}

/** The theme's colours and the site's fonts, read from global.css's tokens. */
function readLook(theme: Theme): Look {
  const probe = document.createElement("div");
  probe.dataset.theme = theme;
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const look = {
    bg: read("--bg"),
    ink: read("--ink"),
    muted: read("--muted"),
    accent: read("--accent"),
    line: read("--line-strong"),
    sans: read("--sans"),
    mono: read("--mono"),
  };
  probe.remove();
  return look;
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

/** The tip as a still (the mistake beside the fix), drawn from fresh copies of its figure that nobody can see. */
export async function composeRest(figure: Figure, words: Words, size: Size, theme: Theme): Promise<HTMLCanvasElement> {
  const host = document.createElement("div");
  host.dataset.theme = theme;
  host.style.cssText = "position:fixed;left:0;top:0;width:400px;visibility:hidden;pointer-events:none";
  const stages = [0, 1].map(() => {
    const stage = document.createElement("div");
    stage.style.aspectRatio = "5 / 4";
    host.append(stage);
    return stage;
  });
  document.body.append(host);
  const [mistake, fix] = stages.map((stage, at) => mountFigure(stage, figure, { play: false, at }));
  try {
    return await composeStill({ mistake: mistake!.svg, fix: fix!.svg, words, size, theme });
  } finally {
    mistake!.destroy();
    fix!.destroy();
    host.remove();
  }
}
