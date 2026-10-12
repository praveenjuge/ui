import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { CATEGORIES } from "../lib/categories";
import { SHARE, mediaPath } from "../lib/media";
import { SITE } from "../lib/site";
import { getTips, tipLabel, tipPath } from "../lib/tips";

export const GET: APIRoute = async () => {
  const tips = (await getTips()).reverse();
  return rss({
    title: SITE.brand,
    description: SITE.description,
    site: SITE.url,
    trailingSlash: false,
    items: tips.map((tip) => {
      const { data } = tip;
      const image = mediaPath(data.number, SHARE.file);
      const file = resolve("public", image.slice(1));
      return {
        title: `${data.title} · ${tipLabel(tip)}`,
        description: data.body,
        link: tipPath(tip),
        pubDate: data.date,
        categories: [CATEGORIES[data.category].name],
        enclosure: existsSync(file)
          ? { url: `${SITE.url}${image}`, type: "image/png", length: statSync(file).size }
          : undefined,
      };
    }),
    customData: "<language>en-us</language>",
  });
};
