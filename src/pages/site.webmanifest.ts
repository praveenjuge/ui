import type { APIRoute } from "astro";
import { SITE } from "../lib/site";

/** For installing the site to a home screen: its name, colors and the cube at app icon sizes. */
export const GET: APIRoute = () =>
  Response.json({
    name: SITE.brand,
    short_name: SITE.title,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  });
