# Reference

The engine is `src/lib/figure/`: `index.ts` is what a figure imports, `draw.ts` is the drawing kit, `host.ts` runs figures on the site. The styles are the "Figures" block in `src/styles/global.css`. A figure never touches the host or the styles.

## The stage

- The viewBox is **400 × 320** (5:4), y down.
- Draw inside the **safe area: x 24–376, y 32–288**. The images set the tip's words right under it, so the bottom margin matters.
- Centre the composition. A screen or card usually spans 220–336 wide and 220–250 tall.

## The visual language

- **Flat and front-on.** No perspective, isometry, shadows, gradients or glows.
- **Rounded.** Screens r 12–30, cards r 14–16, fields and buttons r 6–10, pills r = h/2.
- **Thin lines.** Outlines are 1.1 units, frames 1.25, and the accent 1.5 so the subject leads. Weight comes from skeleton text, not from thicker outlines.
- **Skeleton text.** Text is a round-capped bar (`d.text`), its thickness the type size: 4 for labels, 5 for body, 8–10 for headings, up to 16 for display. Real words appear only when the tip is about words, such as a button's label.
- **Soft tones, quietest to loudest:** skeleton text, the default (controls), `frame` (the device or window), `ink` (headings and emphasised text), and `accent` (the subject). Every grey stays close to the background: light on light, dark on dark. Nothing in a figure is near-black in light mode or near-white in dark mode; only the accent stands out.
- **One accent.** Blue marks the element the tip is about and its measurement. Nothing else.
- **Spec annotations.** The rule is measured the way a design spec marks it: `d.dim` for a size or a gap, a dashed `guide` for an edge or a limit, a short `label` for a value or a count.

## Motion

- **The host owns time.** It plays one 8-second lap on a loop, and the video is exactly one lap:
  - hold the fix for 1.6 s;
  - reset to the mistake in 0.5 s and hold it for 2.1 s;
  - apply the fix over 1.5 s and hold it to the end.

  `t` moves linearly in time between those holds. Your function only maps `t` to a picture, so the same `t` always draws the same frame. That's what makes the videos repeatable.
- **Easing comes from you, per part.** Wrap every `phase(...)` or `stagger(...)` in `ease()`, Emil Kowalski's strong ease-in-out (`cubic-bezier(0.77, 0, 0.175, 1)`), the curve for movement on screen. The reset is fast and the fix is slow, so the eye stays on the fix.
- **Stagger.** Give each part its own stretch of `t` so they move one after another. Over the 1.5 s fix, a window of 0.1–0.3 per part is the 30–80 ms stagger Emil's rules ask for.
  - `phase(t, a, b)` is 0 before `a`, 1 after `b`, and linear between them.
  - `stagger(t, i, n, overlap)` is part `i` of `n`'s overlapping window.
- **Nothing from nothing.** Never grow a shape from zero. Start it at about 60% of its size and faded, and grow it in.
- **Words.** Swap a label's words at a threshold, and crossfade with `opacity` around it so nothing pops.
- **No time of your own.** Never use timers, `requestAnimationFrame`, CSS transitions or randomness.
- **Reduced motion.** The host holds the fix.

## `index.ts`

```ts
defineFigure({ name, means, build })   // build(d) => (t) => void
VIEW   { width: 400, height: 320 }
SAFE   { x: 24, y: 32, width: 352, height: 256 }
clamp(v, lo = 0, hi = 1)
lerp(a, b, t)
ease(t)                         // smoothstep, clamped
phase(t, from, to)              // 0..1 within [from, to]
stagger(t, i, n, overlap = .5)  // part i of n
```

## The kit: `d`

Each call adds one element on top of the ones before, and returns a handle. `handle.set({...})` changes any of its props; only changed attributes touch the DOM. `handle.props` holds the current values.

| Call | Props | For |
| --- | --- | --- |
| `d.box` | `x, y, w, h, r` | screens, cards, fields, buttons, chips |
| `d.text` | `x` (left), `y` (middle), `w`, `size` (default 5) | a line of skeleton text |
| `d.line` | `x1, y1, x2, y2` | dividers, axes, guides |
| `d.circle` | `cx, cy, r` | dots, markers, avatars, a fingertip |
| `d.path` | `d` | anything else, such as a chart line |
| `d.label` | `x, y, text, anchor` ("start", "middle" or "end") | a value: `44pt`, `65ch`, `4.5:1`, `1 edge` |
| `d.dim` | `x1, y1, x2, y2, text, offset` | a dimension line with end ticks and its value |
| `d.group` | `x, y, opacity` | moving or fading several shapes together; draw into `group.draw` |

Every call also takes `cls` and `opacity`.

`d.dim` puts its label `offset` units (default 9) to the left of the line as it runs from point 1 to point 2. That's above a line drawn left to right, and right of one drawn top to bottom.

## Classes

Combine them in `cls`, space-separated.

| Class | Effect |
| --- | --- |
| (none) | a control or container outline |
| `frame` | the device or window outline, a step darker |
| `accent` | the subject: blue. It applies to a group's shapes too. |
| `ink` | a step stronger than skeleton text: headings, typed text, a filled block. Still a soft grey. |
| `guide` | dashed |
| `plate` | filled with the page colour, so it hides what is behind (a dialog over a list) |
| `fill` | a solid block in the skeleton-text tone. `fill accent` and `fill ink` fill with those colours instead. |

On `d.label` the colour is the accent by default; add `ink` (a readable grey) or `muted` for other words. Add `sans` for words that belong to the interface, such as a button's label. The default mono is for measurements.

## Patterns, with an example of each in src/figures

- **A size grows to the rule.** `target.ts`: hit areas from 24pt to 44pt, with a dimension above and a fingertip circle to compare against.
- **Gaps change.** `proximity.ts`: two gaps with `dim` markers, equal at the mistake (16 and 16), unequal at the fix (8 and 24).
- **Many collapse to few.** `scale.ts` (seven type sizes to three) and `align.ts` (five edges to one, with a live count).
- **Words change.** `action.ts`: button labels crossfade from "OK" to "Delete 3 files" at the middle, and the buttons resize.
- **Tone changes.** `contrast.ts`: a dark copy of the text fades in over the faint one, with the ratio as a label.
- **Something moves to the right place.** `inline.ts`: the error crossfades from a banner to under its field while the form reflows.
- **A measure narrows.** `measure.ts`: the paragraph rewraps into a 65ch column between dashed 45ch and 75ch guides.
- **Cues are added.** `signal.ts`: a dashed line, markers and direct labels fade in, one after another.
- **Time shrinks.** `press.ts`: a timeline's response marker slides from 1s to 100ms, and the button shows its pressed and loading states.
