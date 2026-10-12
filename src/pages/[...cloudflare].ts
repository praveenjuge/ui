/**
 * Cloudflare's _redirects file: /12 to /12/<slug>, for links that name only
 * the number, and the sitemap's old address to its new one. Astro leaves a
 * page file whose name starts with _ out of routing, so this is a rest route
 * whose one path is _redirects.
 */
import type { APIRoute } from "astro";
import { getTips, tipPath } from "../lib/tips";

export const getStaticPaths = () => [{ params: { cloudflare: "_redirects" } }];

export const GET: APIRoute = async () => {
  const lines = [
    ...(await getTips()).map((tip) => `/${tip.data.number} ${tipPath(tip)} 301`),
    "/sitemap-index.xml /sitemap.xml 301",
  ];
  return new Response(`${lines.join("\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
