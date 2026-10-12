---
name: tip-figure
description: Use when a UI tip on this site needs its figure, when someone asks for a new tip illustration, or runs /tip-figure with a tip. Draws one flat, animated wireframe of the interface the tip is about, moving from the mistake to the fix, as src/figures/<name>.ts, then checks it with bun run look and wires it to the tip.
argument-hint: "[tip number or title]"
---

# Tip figure

Every tip on ui.praveenjuge.com has one figure: a flat wireframe of the interface the tip is about, drawn in thin lines, with the one thing the tip is about in the electric-blue accent. It has one number, `t`. At `t = 0` the interface makes the mistake the tip warns about; at `t = 1` it follows the tip.

The host plays the lesson on a loop, everywhere the figure appears:

1. the fix, held;
2. a quick reset to the mistake, held;
3. the fix, applied slowly, and held.

The same file becomes the tip page's figure, its share image, its downloads and its 8-second video, so you draw it once.

The motion follows Emil Kowalski's animation rules, installed in this project as `emil-design-eng`, `animate` and `review-animations`. Read `animate` once before your first figure.

Read `reference.md` in this folder for the API and the patterns. The ten figures in `src/figures/` are the examples; open the one nearest your tip before you start.

## 1. Find the rule

Read the tip (`src/content/tips/<number>.md`). Every tip names something you can see and measure: a size, a gap, an edge, a width, a contrast, a count, a time, a word. Write it down in one line, with its two values:

> Touch targets: hit area **24pt → 44pt**. Line length: **120ch → 65ch**. Alignment: **5 edges → 1 edge**.

If you can't name the two values, you can't draw the tip yet.

## 2. Pick the interface

Draw the real UI the tip lives in, front-on and flat: an app screen with a tab bar, a form, a dialog, a page of text, a browser window, a chart, a card. Not a metaphor. A reader should recognise the screen at a glance and see the rule change on it.

One screen, a few parts. It must read at 240px wide, the size of a card on the home page.

## 3. Write the concept

One line each, then build it:

- **Interface:** what's on screen.
- **Mistake (t = 0):** what's wrong, visibly. It's held for two seconds, and the share image and image downloads show it on its own plate beside the fix, so it has to read on its own.
- **Fix (t = 1):** what's right. This is the rest pose: the thumbnail, the still the page ships before its script runs, the fix plate in the share image, and the video's first and last frame.
- **Measurement:** the annotation that says the rule: a dimension line with its value, a pair of gap markers, a dashed guide, a count. It changes with `t`.
- **Accent:** the one thing in blue: the element the tip is about, and its measurement.

## 4. Build

Write `src/figures/<name>.ts` (lowercase, one word if you can). Start with a doc comment: the tip's number and title, then two or three sentences describing the mistake and the fix. Then:

```ts
import { defineFigure, ease, lerp } from "../lib/figure";

export default defineFigure({
  name: "<name>",
  means: "One sentence for screen readers: what the drawing shows changing.",
  build(d) {
    // Draw everything once, back to front. Keep the handles you'll move.
    return (t) => {
      // Move them for this t. Pure: the same t always draws the same picture.
    };
  },
});
```

Then set `figure: <name>` in the tip's markdown.

## 5. Check

Run `bun run look <name>`. It builds the site, photographs `/lab/<name>` to `look/<name>.png` and fails on what a machine can catch: the drawing leaving the safe area at t 0, 0.5 or 1, a missing or long `means`, or a console error. Fix every failure, then open the picture and answer each of these with yes:

1. **The two-second test.** Cover everything but the 240px rest picture and the tip's title. Would a stranger connect them?
2. **The mistake is visibly wrong** and the fix visibly right, at 240px, without reading the labels.
3. **The rule is measured.** An annotation shows the tip's value, and it changes from the mistake's value to the fix's.
4. **One accent.** Blue marks the subject and its measurement. Nothing else is blue.
5. **The change reads as one motion.** Parts move one after another (a 30–80ms stagger, in `t` terms a window of about 0.1–0.3 each), not all at once and not in a long queue. Nothing overlaps or tangles at t = 0.5.
6. **Both themes.** Nothing vanishes or turns the wrong colour in the dark row.
7. **It's the interface.** Real UI, front-on, rounded, no perspective, nothing decorative.

Then open `/lab/<name>` in `bun run dev` and watch the live loop at least twice. Ask: can I tell what changed, and why the fix is better, without reading the tip? Watch it slowed down too: in DevTools, set the Animations panel to 25% or throttle the CPU.

## 6. Ship

Run `bun run render`. It renders the tip's four videos and share image (the mistake beside the fix) into `public/media/<number>/`. Commit them with the tip and the figure.

## What goes wrong

| If you catch yourself | Do this instead |
| --- | --- |
| drawing an object that stands for the idea | draw the screen where the idea happens |
| making the change subtle | exaggerate it until it reads at 240px |
| explaining the rule only with words | measure it: a dimension, a gap, a guide, a count |
| colouring several things blue | one subject; move the rest to `ink` or the default |
| setting a colour, fill or stroke width in code | use the classes in `reference.md` |
| writing a timer, `requestAnimationFrame` or CSS animation | derive everything from `t`; the host animates `t` |
| easing with your own curve, or none | `ease()` around every `phase`/`stagger`: Emil's strong ease-in-out for movement on screen |
| growing something from nothing (`r: 0`, `w: 0`) | start it small and faded, e.g. scale from 0.6 with opacity, and let it grow |
| a busy halfway frame | stagger parts with `phase`/`stagger`, or crossfade with `opacity` |
| drawing outside the safe area | keep within x 24–376, y 32–288 |
| a label in every corner | at most two labels, plus words that belong to the UI itself |
