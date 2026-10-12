import { getCollection, type CollectionEntry } from "astro:content";
import { pad } from "./media";

export type Tip = CollectionEntry<"tips">;

/** All tips by number. Fails the build when a file name and its number disagree, or two tips share a number. */
export async function getTips(): Promise<Tip[]> {
  const tips = (await getCollection("tips")).sort((a, b) => a.data.number - b.data.number);
  const seen = new Set<number>();
  for (const tip of tips) {
    const { number } = tip.data;
    if (tip.id !== pad(number)) throw new Error(`Tip ${tip.id}.md has number ${number}; name it ${pad(number)}.md`);
    if (seen.has(number)) throw new Error(`Two tips have number ${number}`);
    seen.add(number);
  }
  return tips;
}
