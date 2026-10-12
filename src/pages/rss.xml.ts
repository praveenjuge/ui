import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SHARE, mediaPath, pad } from "../lib/media";
import { SITE } from "../lib/site";
import { getTips } from "../lib/tips";

export const GET: APIRoute = async () => {
  const tips = (await getTips()).reverse();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: SITE.url,
    trailingSlash: false,
    items: tips.map(({ data }) => {
      const image = mediaPath(data.number, SHARE.file);
      const file = resolve("public", image.slice(1));
      return {
        title: `#${pad(data.number)} · ${data.title}`,
        description: data.body,
        link: `/${data.number}`,
        pubDate: data.date,
        enclosure: existsSync(file)
          ? { url: `${SITE.url}${image}`, type: "image/png", length: statSync(file).size }
          : undefined,
      };
    }),
    customData: "<language>en-us</language>",
  });
};
