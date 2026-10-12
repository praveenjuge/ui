/**
 * /llms.txt (llmstxt.org): what the site is, and every tip as a link to its
 * Markdown version, grouped by category.
 */
import type { APIRoute } from "astro";
import { CATEGORIES, CATEGORY_IDS, categoryPath } from "../lib/categories";
import { SITE } from "../lib/site";
import { getTips, tipLabel, tipPath } from "../lib/tips";

export const GET: APIRoute = async () => {
  const tips = await getTips();
  const sections = CATEGORY_IDS.map((id) => {
    const lines = tips
      .filter((tip) => tip.data.category === id)
      .map((tip) => `- [${tip.data.title}](${SITE.url}${tipPath(tip)}.md): ${tipLabel(tip)}. ${tip.data.body}`);
    return lines.length ? `## ${CATEGORIES[id].name}\n\n${CATEGORIES[id].intro} (${SITE.url}${categoryPath(id)})\n\n${lines.join("\n")}` : "";
  }).filter(Boolean);

  const text = [
    `# ${SITE.title}`,
    `> ${SITE.description}`,
    `${SITE.title} is by ${SITE.author} (${SITE.authorUrl}). Each tip is one rule for interface design, a short body, a longer write-up with sources, and an animated drawing of the mistake turning into the fix. Every tip's page has a Markdown version at the same address plus .md, linked below. The tips are free to share, with a link back.`,
    ...sections,
    `## Optional\n\n- [About](${SITE.url}/about): who makes the site, how the drawings work, and how to share them.\n- [RSS](${SITE.url}/rss.xml): every tip, newest first.`,
  ].join("\n\n");

  return new Response(`${text}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
