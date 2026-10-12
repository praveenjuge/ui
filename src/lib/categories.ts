export const CATEGORY_IDS = ["layout", "typography", "forms", "ux"] as const;

export type Category = (typeof CATEGORY_IDS)[number];

export const CATEGORIES: Record<Category, string> = {
  layout: "Layout & spacing",
  typography: "Typography & color",
  forms: "Forms & components",
  ux: "UX & accessibility",
};
