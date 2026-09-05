# @isellipsis/react

![npm version](https://img.shields.io/npm/v/%40isellipsis%2Freact?logo=npm&logoColor=white) ![bundle size](https://img.shields.io/bundlephobia/minzip/%40isellipsis%2Freact?logo=javascript&logoColor=white) ![License](https://img.shields.io/npm/l/%40isellipsis%2Freact?logo=open-source-initiative)

React hook for detecting whether an element is truncating its text with an ellipsis (`…`) — reactive to resize, text changes and web-font load.

```bash
npm i @isellipsis/react
```

## `useIsEllipsis`

```tsx
import { useIsEllipsis } from '@isellipsis/react';

function Label({ text }: { text: string }) {
  const { ref, truncated, overflow, axis } = useIsEllipsis<HTMLDivElement>();
  return (
    <div ref={ref} className="truncate" title={truncated ? text : undefined}>
      {text}
    </div>
  );
}
```

Returns `{ ref, truncated, overflow, axis }`:

| field | meaning |
| --- | --- |
| `ref` | attach to the element you want watched |
| `truncated` | `true` while an ellipsis is being rendered |
| `overflow` | overflow in CSS px (`NaN` on error) |
| `axis` | `'x'` (single-line), `'y'` (`-webkit-line-clamp`), or `null` |

The value updates automatically via `ResizeObserver`, `MutationObserver` and `document.fonts` — no manual re-measuring.

## `<EllipsisTooltip>`

Batteries-included: renders an element and exposes a native `title` **only while the text is actually clipped**.

```tsx
import { EllipsisTooltip } from '@isellipsis/react';

<EllipsisTooltip className="truncate">{label}</EllipsisTooltip>;
// <EllipsisTooltip as="span" title="explicit tooltip text">{node}</EllipsisTooltip>
```

`as` picks the element/component (default `'div'`); `title` overrides the tooltip text (defaults to string children); any other prop is spread onto the element. It also sets `data-truncated` while clipped.

## Notes

- Peer dependency: `react >= 17`. Depends on [`isellipsis`](https://www.npmjs.com/package/isellipsis) (installed automatically).
- `await document.fonts.ready` is handled for you by the observer.

## Have a good productive day :)

If you like this package please consider donation <a href="https://paypal.me/ItayMerchav?locale.x=en_US" target="_blank">Click Here</a>

MIT © 2020 Itay Merchav
