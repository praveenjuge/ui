import { getCollection, type CollectionEntry } from "astro:content";
import { pad } from "./media";

export type Tip = CollectionEntry<"tips">;

/**
 * Tips by number. A tip dated after today is scheduled: it stays off the
 * site until a build on or after its date (a daily rebuild publishes it; see
 * .github/workflows/publish.yml). Pass `scheduled` to include those too, as the
 * render and lab pages do, and as `astro dev` does so you can preview them.
 *
 * Fails the build when a file name and its number disagree, or two tips share
 * a number or a slug.
 */
export async function getTips({ scheduled = import.meta.env.DEV } = {}): Promise<Tip[]> {
  const tips = (await getCollection("tips")).sort((a, b) => a.data.number - b.data.number);
  const numbers = new Set<number>();
  const slugs = new Set<string>();
  for (const tip of tips) {
    const { number, slug } = tip.data;
    if (tip.id !== pad(number)) throw new Error(`Tip ${tip.id}.md has number ${number}; name it ${pad(number)}.md`);
    if (numbers.has(number)) throw new Error(`Two tips have number ${number}`);
    if (slugs.has(slug)) throw new Error(`Two tips have slug ${slug}`);
    numbers.add(number);
    slugs.add(slug);
  }
  const now = new Date();
  return scheduled ? tips : tips.filter((tip) => isPublished(tip, now));
}

export const isPublished = (tip: Tip, now = new Date()) => tip.data.date <= now;

/** A tip's page: /12/touch-target-size. The bare /12 redirects here (see astro.config.mjs). */
export const tipPath = (tip: Tip) => `/${tip.data.number}/${tip.data.slug}`;

/** How a tip is named wherever it is listed or shared: "UI Tip #012". */
export const tipLabel = (tip: Tip) => `UI Tip #${pad(tip.data.number)}`;

/** `count` other tips: the same category's first, newest first, then the newest of the rest. */
export function relatedTips(tip: Tip, tips: Tip[], count = 3): Tip[] {
  const others = tips.filter((other) => other.data.number !== tip.data.number).reverse();
  const same = others.filter((other) => other.data.category === tip.data.category);
  return [...same, ...others.filter((other) => !same.includes(other))].slice(0, count);
}
