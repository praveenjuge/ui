// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ui.praveenjuge.com",
  trailingSlash: "never",
  // "file" gives dist/12.html, which Cloudflare serves at /12 with no trailing slash.
  build: { format: "file" },
  integrations: [
    sitemap({
      // The render and lab pages are tools, not pages for readers.
      filter: (page) => !/^\/(render|lab)\//.test(new URL(page).pathname),
    }),
  ],
});
