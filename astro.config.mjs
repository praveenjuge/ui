// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// The fonts come from their npm packages, so a build never fetches them.
const npm = fontProviders.npm({ remote: false });

export default defineConfig({
  site: "https://ui.praveenjuge.com",
  trailingSlash: "never",
  // "file" gives dist/12/slug.html, which Cloudflare serves at /12/slug with no trailing slash.
  // The sitemap and _redirects are pages too: src/pages/sitemap.xml.ts and [...cloudflare].ts.
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
});
