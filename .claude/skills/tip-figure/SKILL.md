---
name: tip-figure
description: Use when a UI tip on this site needs its figure, when someone asks for a new tip illustration, or runs /tip-figure with a tip. Draws one flat, animated wireframe of the interface the tip is about, moving from the mistake to the fix, as src/figures/<name>.ts, then checks it with bun run look and wires it to the tip.
argument-hint: "[tip number or title]"
---

# Tip figure

Every tip on ui.praveenjuge.com has one figure: a flat wireframe of the interface the tip is about, drawn in thin lines, with the one thing the tip is about in the electric-blue accent. It has one number, `t`. At `t = 0` the interface makes the mistake the tip warns about; at `t = 1` it follows the tip. The pointer's x across the figure scrubs `t`, and the figure rests on the fix. The same file becomes the tip page's figure, its share image, its downloads and its 8-second video, so you draw it once.

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
- **Mistake (t = 0):** what's wrong, visibly.
- **Fix (t = 1):** what's right. This is the rest pose: the thumbnail, the share image, the video's first and last frame.
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
5. **Halfway holds up.** The tour pauses at t = 0.5 for two seconds, so nothing overlaps or tangles there.
6. **Both themes.** Nothing vanishes or turns the wrong colour in the dark row.
7. **It's the interface.** Real UI, front-on, rounded, no perspective, nothing decorative.

Then open `/lab/<name>` in `bun run dev` and scrub it with the pointer, and watch one tour lap: rest, the mistake, halfway, the fix.

## 6. Ship

Run `bun run render`. It renders the tip's four videos and share image into `public/media/<number>/`. Commit them with the tip and the figure.

## What goes wrong

| If you catch yourself | Do this instead |
| --- | --- |
| drawing an object that stands for the idea | draw the screen where the idea happens |
| making the change subtle | exaggerate it until it reads at 240px |
| explaining the rule only with words | measure it: a dimension, a gap, a guide, a count |
| colouring several things blue | one subject; move the rest to `ink` or the default |
| setting a colour, fill or stroke width in code | use the classes in `reference.md` |
| writing a timer, `requestAnimationFrame` or CSS animation | derive everything from `t`; the host animates `t` |
| a busy halfway frame | stagger parts with `phase`/`stagger`, or crossfade with `opacity` |
| drawing outside the safe area | keep within x 24–376, y 32–288 |
| a label in every corner | at most two labels, plus words that belong to the UI itself |
