import type { APIRoute } from "astro";
import { logoSvg } from "../lib/logo";

/** The favicon, drawn from the same faces as the header's mark. */
export const GET: APIRoute = () => new Response(logoSvg(), { headers: { "Content-Type": "image/svg+xml" } });
