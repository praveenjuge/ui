/**
 * Each tip as plain Markdown, at its page's address plus .md: for reading
 * tools, agents and anyone who'd rather not parse HTML. The page links it as
 * an alternate, and /llms.txt lists them all.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { CATEGORIES } from "../../lib/categories";
import { getFigure } from "../../lib/figure/still";
import { SITE } from "../../lib/site";
import { getTips, tipLabel, tipPath, type Tip } from "../../lib/tips";

export const getStaticPaths = (async () =>
  (await getTips()).map((tip) => ({
    params: { number: String(tip.data.number), slug: tip.data.slug },
    props: { tip },
  }))) satisfies GetStaticPaths;

/** Turns the write-up's links to other tips into full addresses, so they work outside the site. */
const absolute = (markdown: string) => markdown.replace(/\]\((\/[^)\s]*)\)/g, (_, path) => `](${SITE.url}${path})`);

export const GET: APIRoute<{ tip: Tip }> = ({ props: { tip } }) => {
  const { title, body, category, figure, date } = tip.data;
  const url = `${SITE.url}${tipPath(tip)}`;
  const markdown = [
    `# ${title}`,
    `${tipLabel(tip)} · ${CATEGORIES[category].name} · ${date.toISOString().slice(0, 10)} · ${url}`,
    `> ${body}`,
    `*Figure: ${getFigure(figure).means}*`,
    absolute(tip.body ?? "").trim(),
    `---\n\nFrom [${SITE.brand}](${SITE.url}). Free to share, with a link back to ${url}.`,
  ].join("\n\n");
  return new Response(`${markdown}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
