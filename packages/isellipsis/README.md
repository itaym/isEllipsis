# isellipsis

Find out if an HTML element is **currently** truncating its text with an ellipsis (`…`) — framework-agnostic, no dependencies.

```bash
npm i isellipsis
```

```ts
import { isEllipsis, measureEllipsis, observeEllipsis } from 'isellipsis';

// classic, one-shot
isEllipsis(el);                 // overflow in px; > 0 == truncated; NaN on error
isEllipsis(el, true, Boolean);  // → boolean

// richer, one-shot
measureEllipsis(el);            // { truncated, overflow, axis: 'x' | 'y' | null }

// reactive — fires on resize, text/attribute mutation, and web-font load
const stop = observeEllipsis(el, (state) => console.log(state));
stop();
```

React bindings: [`@isellipsis/react`](https://www.npmjs.com/package/@isellipsis/react).

## When is it "truncated"?

Only when **all** hold:

- `text-overflow` computes to `ellipsis` — the default `clip` cuts mid-glyph with no `…`;
- there is a clipping context — `overflow` is not `visible` (an `<input>` clips its own text regardless);
- the text overflows its content box, **or** `-webkit-line-clamp` is set and the content exceeds it (`axis: 'y'`).

## How it measures

- **Elements** — a `Range` over the contents gives the true, fractional, unclipped text width, compared to a fractional content-box width. No clone, no DOM mutation.
- **`<input>` / `<textarea>`** — canvas text metrics against the computed font, applying `text-transform` / `letter-spacing` / `word-spacing`. Works where an input's `scrollWidth` never exceeds its `clientWidth`.

Both are sub-pixel accurate, so integer widths and `box-sizing: border-box` are no longer required (they were in v2).

## Notes

- `await document.fonts.ready` before measuring right after page load, or the width is computed against a fallback font.
- Boolean / `truncated` use a ~0.5px tolerance for anti-aliasing noise.

## API

| export | signature |
| --- | --- |
| `isEllipsis` | `(el, usePlaceholder?= true, resultType?: NumberConstructor \| BooleanConstructor = Number) => number \| boolean` |
| `measureEllipsis` | `(el, options?: { usePlaceholder?: boolean }) => { truncated: boolean; overflow: number; axis: 'x' \| 'y' \| null }` |
| `observeEllipsis` | `(el, onChange, options?) => () => void` (unsubscribe) |

## Migrating from v2

- `isEllipsis(el, usePlaceholder?, resultType?)` is unchanged.
- It now returns `0` / `false` when `text-overflow` isn't `ellipsis`, or a non-input has `overflow: visible` — cases where no `…` is actually painted.
- `measureEllipsis` and `observeEllipsis` are new.

## Have a good productive day :)

If you like this package please consider donation <a href="https://paypal.me/ItayMerchav?locale.x=en_US" target="_blank">Click Here</a>

MIT © 2020 Itay Merchav
