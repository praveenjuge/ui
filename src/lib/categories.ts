export const CATEGORY_IDS = ["layout", "typography", "forms", "ux"] as const;

export type Category = (typeof CATEGORY_IDS)[number];

/** Each category's name, what it covers in a few words, and the intro its page at /<id> opens with. */
export const CATEGORIES: Record<Category, { name: string; covers: string; intro: string }> = {
  layout: {
    name: "Layout & spacing",
    covers: "spacing, alignment and grouping",
    intro:
      "Tips on spacing, alignment and grouping: how the space between things tells people what belongs together, and how fewer edges make a screen calmer to read.",
  },
  typography: {
    name: "Typography & color",
    covers: "type sizes, line length and color",
    intro:
      "Tips on type and color: sizes that come from one scale, lines short enough to read, and color that helps the text instead of fighting it.",
  },
  forms: {
    name: "Forms & components",
    covers: "buttons, fields and the things people tap",
    intro:
      "Tips on buttons, fields and the components people tap and type into: targets big enough for a thumb, labels that say what happens, errors that show up where they belong.",
  },
  ux: {
    name: "UX & accessibility",
    covers: "contrast, color and feedback that work for everyone",
    intro:
      "Tips on making an interface work for everyone: enough contrast to read in sunlight, signals that don't rely on color alone, and feedback fast enough to feel instant.",
  },
};

export const categoryPath = (id: Category) => `/${id}`;
