/**
 * A tip's formats. Images are drawn in the browser when someone downloads
 * one; videos and the share image are rendered locally by scripts/render.ts
 * into public/media/<number>/ and committed.
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Output size in pixels for each format. */
export const SIZES = {
  "1x1": { width: 1080, height: 1080, label: "1:1" },
  "4x5": { width: 1080, height: 1350, label: "4:5" },
  "9x16": { width: 1080, height: 1920, label: "9:16" },
  "16x9": { width: 1920, height: 1080, label: "16:9" },
} as const;
export type Size = keyof typeof SIZES;

export const IMAGE_SIZES: readonly Size[] = ["1x1", "4x5", "9x16", "16x9"];
export const VIDEO_SIZES: readonly Size[] = ["4x5", "9x16"];

/** The share image: the 16:9 light still. */
export const SHARE = { size: "16x9", theme: "light", file: "og.png" } as const satisfies {
  size: Size;
  theme: Theme;
  file: string;
};

export const pad = (n: number) => String(n).padStart(3, "0");

export const videoFile = (size: Size, theme: Theme) => `${size}-${theme}.mp4`;

/** Where a tip's rendered file is served from, and lives under public/. */
export const mediaPath = (n: number, file: string) => `/media/${n}/${file}`;

/** The name a downloaded file is saved as, e.g. ui-tip-012-4x5-dark.png. */
export const downloadName = (n: number, size: Size, theme: Theme, ext: "png" | "mp4") =>
  `ui-tip-${pad(n)}-${size}-${theme}.${ext}`;
