/**
 * The mark: an electric blue cube, seen from above, in a 32 × 32 box. The
 * header, the favicon, the app icons and the credit line on every image draw
 * it from these faces, so it is the same cube everywhere.
 */
export const LOGO_VIEW = 32;

/** Back to front: top, left, right. Each face is its own shade of the one blue. */
export const LOGO_FACES = [
  { d: "M16 3 27.26 9.5 16 16 4.74 9.5Z", fill: "#6d85ff" },
  { d: "M4.74 9.5 16 16v13L4.74 22.5Z", fill: "#2448ff" },
  { d: "M27.26 9.5 16 16v13l11.26-6.5Z", fill: "#1733d6" },
] as const;

/** The cube as an svg document, `size` px square, on an optional background with `inset` px around it. */
export function logoSvg({ size = LOGO_VIEW, background, inset = 0 }: { size?: number; background?: string; inset?: number } = {}) {
  const view = LOGO_VIEW + inset * 2;
  const faces = LOGO_FACES.map(
    (face) => `<path d="${face.d}" fill="${face.fill}" stroke="${face.fill}" stroke-width=".6" stroke-linejoin="round"/>`,
  ).join("");
  const plate = background ? `<rect x="${-inset}" y="${-inset}" width="${view}" height="${view}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-inset} ${-inset} ${view} ${view}">${plate}${faces}</svg>`;
}
