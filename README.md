# UI Tips

Short, numbered UI and UX tips at [ui.praveenjuge.com](https://ui.praveenjuge.com). Each tip has its own animated wireframe figure that moves from the mistake to the fix, and can be downloaded as an image or a video.

Built with Astro and Bun, and served as a static Cloudflare Worker.

## Run it

```sh
bun install
bun run dev
```

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `bun run dev`          | Local dev server                                                |
| `bun run build`        | Type checks, then builds to `dist/`                            |
| `bun run look [name]`  | Photographs and checks figures while you draw them (`look/`)    |
| `bun run render`       | Renders videos and share images for new or changed tips         |
| `bun run preview`      | Builds, then serves `dist/` the way Cloudflare does (`cf dev`)  |
| `bun run deploy`       | Builds, then deploys by hand with `cf deploy`                   |

## Add a tip

1. Write `src/content/tips/<number>.md`, named by its zero-padded number:

   ```md
   ---
   number: 11
   title: "Up to 60 characters"
   body: "Up to 180 characters. The limits keep the text inside every image and video format; the build fails past them."
   category: layout # layout, typography, forms or ux
   figure: <name>
   date: 2026-10-13
   ---
   ```

2. Draw its figure with the `tip-figure` skill (`.claude/skills/tip-figure`, or `/tip-figure` in Claude Code) as `src/figures/<name>.ts`, and check it with `bun run look <name>`.
3. Run `bun run render`. It writes the tip's four videos (4:5 and 9:16, light and dark) and its share image to `public/media/<number>/`, and records what it rendered in `scripts/render-manifest.json`. It only re-renders tips whose markdown, figure or render code changed. Needs `ffmpeg`.
4. Commit the tip, the figure and the media together, and push to `main`. That deploys it.

Images (1:1, 4:5, 9:16 and 16:9, light and dark) aren't stored: the tip page draws them in the browser when someone downloads one, with the same compositor (`src/lib/compose.ts`) the render script uses for video frames.

## Deploys

Every push to `main` deploys. Workers Builds (Cloudflare's Git integration, connected to this repo) runs `bun run build`, then `cf deploy` from `deploy/`. That publishes `dist/` to the `ui` Worker on ui.praveenjuge.com. Build logs are under the Worker's **Deployments** tab in the Cloudflare dashboard.

`deploy/` holds the Worker's config (`cloudflare.config.ts`) and the `cf` CLI. It's a separate package because `cf` builds any package that depends on Astro through the Astro adapter, and this site is fully static. Without Astro in its `package.json`, `cf` deploys the already-built files instead.

## How the figures work

A figure is a flat wireframe in a 400 × 320 viewBox with one number, `t`: 0 is the mistake, 1 is the fix. It draws itself once with the kit in `src/lib/figure/draw.ts`, and returns a function that shows it at any `t`.

The host (`src/lib/figure/host.ts`) plays the lesson on a loop: the fix, a quick reset to the mistake, then the fix applied slowly. One frame loop runs every figure on the page and skips the ones off screen. Under reduced motion, figures hold the fix.

The motion follows Emil Kowalski's animation rules. His skills (`emil-design-eng`, `animate`, `review-animations` and others, from [emilkowalski/skills](https://github.com/emilkowalski/skills)) are installed in `.claude/skills`, with their versions in `skills-lock.json`.

## License

The code is MIT (see `LICENSE`). The tips, figures and rendered media are © Praveen Juge, free to download for personal use.
