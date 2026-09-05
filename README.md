# isEllipsis

![License](https://img.shields.io/npm/l/isellipsis?logo=open-source-initiative)

Find out if an HTML element is **currently** truncating its text with an ellipsis (`…`) — a `DIV`, a `SPAN`, an `INPUT`, a `-webkit-line-clamp` block, anything.

```
isellipsis           framework-agnostic — isEllipsis(), measureEllipsis(), observeEllipsis()
@isellipsis/react    useIsEllipsis() hook + <EllipsisTooltip>
```

```ts
import { isEllipsis, measureEllipsis, observeEllipsis } from 'isellipsis';
import { useIsEllipsis, EllipsisTooltip } from '@isellipsis/react';
```

> **v3** is a rewrite. Detection no longer clones the element or copies every
> computed style: non-input elements are measured with a `Range`, inputs with
> canvas text metrics. Both are sub-pixel accurate, so the old "use integer
> widths and `box-sizing: border-box`" caveat is gone. The result is also gated
> on an ellipsis *actually being painted* (`text-overflow: ellipsis`, a clipping
> context), and `-webkit-line-clamp` is detected. `isEllipsis`'s own signature
> is unchanged.

## `isellipsis`

![npm version](https://img.shields.io/npm/v/isellipsis?logo=npm&logoColor=white) ![bundle size](https://img.shields.io/bundlephobia/minzip/isellipsis?logo=javascript&logoColor=white)

```bash
npm i isellipsis
```

```ts
isEllipsis(el);                  // overflow in px, > 0 means truncated (NaN on error)
isEllipsis(el, true, Boolean);   // → boolean

measureEllipsis(el);             // { truncated, overflow, axis: 'x' | 'y' | null }

const stop = observeEllipsis(el, ({ truncated, overflow, axis }) => { … });
stop();
```

An element reports truncated only when **all** hold: `text-overflow` is `ellipsis`
(the default `clip` cuts with no `…`); there is a clipping context (`overflow`
not `visible`; inputs clip their own text); and the text overflows the content
box, or `-webkit-line-clamp` is set and exceeded.

`await document.fonts.ready` before measuring right after page load.

## `@isellipsis/react`

![npm version](https://img.shields.io/npm/v/%40isellipsis%2Freact?logo=npm&logoColor=white) ![bundle size](https://img.shields.io/bundlephobia/minzip/%40isellipsis%2Freact?logo=javascript&logoColor=white)

```bash
npm i @isellipsis/react
```

```tsx
import { useIsEllipsis, EllipsisTooltip } from '@isellipsis/react';

function Label({ text }: { text: string }) {
  const { ref, truncated } = useIsEllipsis<HTMLDivElement>();
  return (
    <div ref={ref} className="truncate" title={truncated ? text : undefined}>
      {text}
    </div>
  );
}

// or the batteries-included component — native title only while clipped
<EllipsisTooltip className="truncate">{text}</EllipsisTooltip>;
```

`useIsEllipsis` returns `{ ref, truncated, overflow, axis }` and updates
automatically via `ResizeObserver`, `MutationObserver` and `document.fonts`.

## Repo layout

| path | what |
| --- | --- |
| `packages/isellipsis` | the `isellipsis` package |
| `packages/react` | the `@isellipsis/react` package |
| `playground/` | Vite + React live demo (`npm run playground`) |
| `e2e/` | Playwright — `isellipsis.spec.ts` (visual-oracle) + `react.spec.ts` (drives the playground) |

```bash
npm install
npm run build          # tsup: ESM + CJS + IIFE + d.ts
npm test               # Vitest (happy-dom) — unit / protocol
npm run test:e2e       # Playwright (Chromium) — real layout
npm run playground     # http://localhost:4173
```

### Testing an ellipsis without a DOM flag

There is no `element.isTruncated`, so the e2e suite uses a visual oracle:
`text-overflow: ellipsis` only changes pixels when the text overflows, so a
screenshot of the element differs from a screenshot of the same element with
`text-overflow: clip` **iff** an ellipsis is really on screen (for line-clamp the
clamp count is toggled instead). Every case asserts the library's answer matches
that.

## Have a good productive day :)

If you like this package please consider donation <a href="https://paypal.me/ItayMerchav?locale.x=en_US" target="_blank">Click Here</a>

## License

MIT © 2020 Itay Merchav
