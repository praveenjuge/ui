import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CATEGORY_IDS } from "./lib/categories";

/**
 * One file per tip, named by its zero-padded number (012.md). The length
 * limits are what keeps the text inside every image and video format, so
 * a tip that breaks them fails the build instead of overflowing a render.
 */
const tips = defineCollection({
  loader: glob({ base: "./src/content/tips", pattern: "*.md" }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string().trim().min(1).max(60),
    body: z.string().trim().min(1).max(180),
    category: z.enum(CATEGORY_IDS),
    figure: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/)
      .refine((name) => existsSync(resolve("src/figures", `${name}.ts`)), {
        message: "No figure with this name in src/figures",
      }),
    date: z.coerce.date(),
  }),
});

export const collections = { tips };
