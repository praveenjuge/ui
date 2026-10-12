/**
 * Renders each tip's videos and share image into public/media/<number>/, to
 * be committed with the tip. Images for download are drawn in the browser, so
 * they are not rendered here.
 *
 *   bun run render                  tips that are new or whose inputs changed
 *   bun run render --only 3,12      just these tips
 *   bun run render --force          every tip
 *
 * It builds the site, serves dist/, and drives /render/<n> in Playwright. The
 * page draws frames with the same compositor the tip page uses for downloads.
 * For videos it plays one lap of the figure's tour and steps the page's clock
 * one frame at a time (page.clock drives requestAnimationFrame, which the
 * figures run on), so a render comes out the same every time. Needs ffmpeg
 * on PATH.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Browser, type Page } from "playwright";
import { LAP_MS } from "../src/lib/figure";
import { ROOT, run, serveDist } from "./serve";
import { SHARE, THEMES, VIDEO_SIZES, mediaPath, pad, videoFile, type Size, type Theme } from "../src/lib/media";

const MANIFEST = join(ROOT, "scripts/render-manifest.json");

const FPS = 30;

/** Everything a render depends on besides the tip's own markdown and figure. */
const TEMPLATE_FILES = [
  "src/pages/render/[number].astro",
  "src/lib/compose.ts",
  "src/lib/media.ts",
  "src/lib/site.ts",
  "src/lib/figure/index.ts",
  "src/lib/figure/draw.ts",
  "src/lib/figure/host.ts",
  "src/styles/global.css",
  "scripts/render.ts",
  "bun.lock",
];

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    force: { type: "boolean", default: false },
  },
});

interface TipSource {
  number: number;
  hash: string;
}

interface Output {
  file: string;
  size: Size;
  theme: Theme;
  video: boolean;
}

const OUTPUTS: Output[] = [
  { file: SHARE.file, size: SHARE.size, theme: SHARE.theme, video: false },
  ...VIDEO_SIZES.flatMap((size) => THEMES.map((theme) => ({ file: videoFile(size, theme), size, theme, video: true }))),
];

async function main() {
  const tips = await readTips();
  const manifest: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
  const only = args.only ? new Set(args.only.split(",").map(Number)) : null;
  const todo = tips.filter((tip) => {
    if (only) return only.has(tip.number);
    const missing = OUTPUTS.some((o) => !existsSync(publicPath(tip.number, o.file)));
    return args.force || missing || manifest[tip.number] !== tip.hash;
  });
  console.log(`${tips.length} tips, ${todo.length} to render${todo.length ? `: ${todo.map((t) => t.number).join(", ")}` : ""}`);
  if (!todo.length) return;

  await run("bunx", ["astro", "build"], { quiet: true });
  const { base, close } = await serveDist();
  const browser = await chromium.launch();

  try {
    await pool(todo, Math.max(1, Math.min(4, availableParallelism() - 1)), async (tip) => {
      const started = Date.now();
      await mkdir(publicPath(tip.number, ""), { recursive: true });
      for (const output of OUTPUTS) await renderOutput(browser, base, tip.number, output);
      manifest[tip.number] = tip.hash;
      await writeFile(MANIFEST, `${JSON.stringify(sorted(manifest), null, 2)}\n`);
      console.log(`#${pad(tip.number)} done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    });
  } finally {
    await browser.close();
    close();
  }
}

const publicPath = (n: number, file: string) => join(ROOT, "public", mediaPath(n, file));

const sorted = (record: Record<string, string>) =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => Number(a) - Number(b)));

/** Each tip's number, and a hash of every file its renders depend on. */
async function readTips(): Promise<TipSource[]> {
  const template = createHash("sha256");
  for (const file of TEMPLATE_FILES) template.update(file).update(await readFile(join(ROOT, file)));
  const templateHash = template.digest("hex");

  const dir = join(ROOT, "src/content/tips");
  const tips: TipSource[] = [];
  for (const name of (await readdir(dir)).filter((f) => f.endsWith(".md")).sort()) {
    const source = await readFile(join(dir, name), "utf8");
    const number = Number(/^number:\s*(\d+)\s*$/m.exec(source)?.[1]);
    const figure = /^figure:\s*([a-z][a-z0-9-]*)\s*$/m.exec(source)?.[1];
    if (!number || !figure) throw new Error(`${name}: could not read number and figure`);
    const figureSource = await readFile(join(ROOT, "src/figures", `${figure}.ts`));
    const hash = createHash("sha256").update(templateHash).update(source).update(figureSource).digest("hex");
    tips.push({ number, hash });
  }
  return tips;
}

async function renderOutput(browser: Browser, base: string, number: number, output: Output) {
  const out = publicPath(number, output.file);
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
  try {
    if (output.video) {
      // An installed clock still runs in real time until it is paused; paused, it moves only when runFor() says.
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
    }
    await page.goto(`${base}/render/${number}?size=${output.size}&theme=${output.theme}`);
    await page.waitForSelector("html[data-ready][data-visible]", { state: "attached", timeout: 15_000 });
    if (output.video) await recordVideo(page, out);
    else await writeFile(out, await frame(page));
    if (problems.length) throw new Error(`#${number} ${output.file}: ${problems.join("; ")}`);
  } finally {
    await page.close();
  }
}

const frame = async (page: Page) => Buffer.from(await page.evaluate(() => window.render!.frame()), "base64");

/** Plays one lap of the tour, steps the clock one frame at a time, draws each frame, and encodes them. */
async function recordVideo(page: Page, out: string) {
  const dir = await mkdtemp(join(tmpdir(), "ui-frames-"));
  const name = (f: number) => join(dir, `${String(f).padStart(4, "0")}.png`);
  const count = (LAP_MS / 1000) * FPS;
  try {
    await page.evaluate(() => window.render!.play());
    let clock = 0;
    for (let f = 0; f < count; f++) {
      if (f > 0) {
        const next = Math.round((f * 1000) / FPS);
        await page.clock.runFor(next - clock);
        clock = next;
      }
      await writeFile(name(f), await frame(page));
    }
    const [first, last] = await Promise.all([readFile(name(0)), readFile(name(count - 1))]);
    if (!first.equals(last)) console.warn(`  ${out}: the last frame differs from the first, so the loop may jump`);
    await run("ffmpeg", [
      ...["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "%04d.png")],
      ...["-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "20", "-pix_fmt", "yuv420p"],
      ...["-movflags", "+faststart", "-an", out],
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function pool<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await work(item);
    }),
  );
}

await main();
