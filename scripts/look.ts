/**
 * Photographs a figure's lab page and checks it, while you draw it:
 *
 *   bun run look target          one figure
 *   bun run look                 every figure in src/figures
 *
 * It builds the site, opens /lab/<name>, and writes look/<name>.png: the
 * mistake, halfway and the fix in both themes, the rest pose at 240px, and a
 * live copy. It fails when the drawing leaves the safe area at any of the
 * three states, when `means` is missing or long, or when the page logs an
 * error. Read the picture too: the checks can't tell whether it says the tip.
 */
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { ROOT, run, serveDist } from "./serve";

const names = process.argv.slice(2);
if (!names.length) {
  for (const file of await readdir(join(ROOT, "src/figures"))) if (file.endsWith(".ts")) names.push(file.slice(0, -3));
}
if (names.some((name) => !/^[a-z][a-z0-9-]*$/.test(name))) {
  console.error("usage: bun run look [figure name...]");
  process.exit(2);
}

await run("bunx", ["astro", "build"], { quiet: true });
const { base, close } = await serveDist();
const browser = await chromium.launch();
let failed = false;
try {
  await mkdir(join(ROOT, "look"), { recursive: true });
  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    const response = await page.goto(`${base}/lab/${name}`);
    if (!response?.ok()) throw new Error(`No lab page for "${name}": is src/figures/${name}.ts there?`);
    await page.waitForSelector("body[data-ready]", { state: "attached", timeout: 15_000 });
    const out = join(ROOT, "look", `${name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    const report = (await page.textContent("#report")) ?? "";
    const problems = [...report.split("\n").filter((line) => line && line !== "ok"), ...errors];
    failed ||= problems.length > 0;
    console.log(`${problems.length ? "fail" : "ok  "}  ${name}  look/${name}.png`);
    for (const problem of problems) console.log(`      ${problem}`);
    await page.close();
  }
} finally {
  await browser.close();
  close();
}
process.exit(failed ? 1 : 0);
