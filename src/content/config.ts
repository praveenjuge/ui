import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { rssSchema } from "@astrojs/rss";

const tips = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tips" }),
  schema: rssSchema,
});

export const collections = { tips };
