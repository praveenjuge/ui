/**
 * Structured data (schema.org, as JSON-LD) for the pages: who writes the
 * site, the site itself, and each kind of page. Base.astro prints whatever a
 * page passes it.
 */
import { CATEGORIES, categoryPath, type Category } from "./categories";
import { SITE } from "./site";
import { tipLabel, tipPath, type Tip } from "./tips";

const url = (path: string) => new URL(path, SITE.url).href;

export const PERSON_ID = `${SITE.authorUrl}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: SITE.author,
  url: SITE.authorUrl,
  jobTitle: "Designer and developer",
  sameAs: SITE.profiles.filter((profile) => profile !== SITE.authorUrl),
};

export const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE.title,
  alternateName: SITE.brand,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "en",
  author: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
};

/** Home › … › here. Each crumb is [name, path]; the last is the page itself. */
export function breadcrumbs(crumbs: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: url(path) })),
  };
}

export function tipArticle(tip: Tip, image: string | undefined, means: string) {
  const { title, body, category, date } = tip.data;
  return {
    "@type": "TechArticle",
    "@id": `${url(tipPath(tip))}#article`,
    headline: title,
    alternativeHeadline: tipLabel(tip),
    description: body,
    abstract: means,
    url: url(tipPath(tip)),
    mainEntityOfPage: url(tipPath(tip)),
    image: image ? [image] : undefined,
    datePublished: date.toISOString(),
    dateModified: date.toISOString(),
    articleSection: CATEGORIES[category].name,
    inLanguage: "en",
    isAccessibleForFree: true,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** A list page (the home page or a category's): what it lists, in order. */
export function collection(path: string, name: string, description: string, tips: Tip[]) {
  return {
    "@type": "CollectionPage",
    "@id": `${url(path)}#page`,
    name,
    description,
    url: url(path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: tips.map((tip, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: url(tipPath(tip)),
        name: tip.data.title,
      })),
    },
  };
}

export const categoryCrumbs = (id: Category): [string, string] => [CATEGORIES[id].name, categoryPath(id)];
