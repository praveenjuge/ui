/**
 * The sitemap: every page for readers, each dated by the newest tip it shows
 * (its own date, for a tip). The render and lab pages are tools, so they're
 * left out.
 */
import type { APIRoute } from "astro";
import { CATEGORY_IDS, categoryPath } from "../lib/categories";
import { SITE } from "../lib/site";
import { getTips, tipPath, type Tip } from "../lib/tips";

const newest = (tips: Tip[]) =>
  tips.length ? new Date(Math.max(...tips.map((tip) => tip.data.date.getTime()))) : undefined;

export const GET: APIRoute = async () => {
  const tips = await getTips();
  const pages: [string, Date | undefined][] = [
    ["/", newest(tips)],
    ...CATEGORY_IDS.map((id): [string, Date | undefined] => [categoryPath(id), newest(tips.filter((tip) => tip.data.category === id))]),
    ...tips.map((tip): [string, Date | undefined] => [tipPath(tip), tip.data.date]),
    ["/about", undefined],
  ];
  const urls = pages.map(([path, date]) => {
    const lastmod = date ? `<lastmod>${date.toISOString()}</lastmod>` : "";
    return `<url><loc>${new URL(path, SITE.url).href}</loc>${lastmod}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
