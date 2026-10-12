// @ts-check
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

const SITE = "https://ui.praveenjuge.com";

// The fonts come from their npm packages, so a build never fetches them.
const npm = fontProviders.npm({ remote: false });

/** Each published tip's address, category and date, read straight from its front matter. */
const tips = readdirSync("src/content/tips")
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const source = readFileSync(`src/content/tips/${file}`, "utf8");
    const field = (/** @type {string} */ name) => new RegExp(`^${name}:\\s*(\\S+)\\s*$`, "m").exec(source)?.[1] ?? "";
    return { path: `/${field("number")}/${field("slug")}`, category: field("category"), date: new Date(field("date")) };
  })
  .filter((tip) => tip.date <= new Date());

/** The newest date among some tips, for a page that lists them. */
const newest = (/** @type {typeof tips} */ list) =>
  list.length ? new Date(Math.max(...list.map((tip) => tip.date.getTime()))) : undefined;

/** A tip's page lives at /12/<slug>; the short /12 redirects there, for links that name only the number. */
const redirects = {
  name: "tip-redirects",
  hooks: {
    "astro:build:done": ({ dir, pages }) => {
      const lines = pages
        .map((page) => /^\/?(\d+)\/([a-z0-9-]+)\/?$/.exec(page.pathname))
        .filter((match) => match !== null)
        .map(([, number, slug]) => `/${number} /${number}/${slug} 301`);
      writeFileSync(new URL("_redirects", dir), `${lines.join("\n")}\n`);
    },
  },
};

export default defineConfig({
  site: SITE,
  trailingSlash: "never",
  // "file" gives dist/12/slug.html, which Cloudflare serves at /12/slug with no trailing slash.
  build: { format: "file" },
  fonts: [
    {
      provider: npm,
      name: "Geist Variable",
      cssVariable: "--font-geist",
      options: { package: "@fontsource-variable/geist", file: "wght.css" },
      weights: ["100 900"],
      styles: ["normal"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: npm,
      name: "Geist Mono Variable",
      cssVariable: "--font-geist-mono",
      options: { package: "@fontsource-variable/geist-mono", file: "wght.css" },
      weights: ["100 900"],
      styles: ["normal"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
  integrations: [
    sitemap({
      // The render and lab pages are tools, not pages for readers.
      filter: (page) => !/^\/(render|lab)\//.test(new URL(page).pathname),
      // lastmod is the newest tip a page shows: its own date for a tip, the latest in it for a list.
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "") || "/";
        const tip = tips.find((t) => t.path === path);
        const lastmod = tip ? tip.date : path === "/" ? newest(tips) : newest(tips.filter((t) => `/${t.category}` === path));
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
      },
    }),
    redirects,
  ],
});
