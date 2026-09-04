import { createElement, type ElementType, type ReactNode } from 'react';
import type { ObserveOptions } from '@isellipsis/core';
import { useIsEllipsis } from './useIsEllipsis';

export interface EllipsisTooltipProps {
  /** Element or component to render. Default `'div'`. */
  as?: ElementType;
  children: ReactNode;
  /** Tooltip text. Defaults to `children` when it is a string. */
  title?: string;
  /** Forwarded to {@link useIsEllipsis}. */
  observeOptions?: ObserveOptions;
  /** Any other props are spread onto the rendered element. */
  [prop: string]: unknown;
}

/**
 * Renders an element that clips its text and only exposes a native `title`
 * tooltip while the text is actually truncated.
 *
 * ```tsx
 * <EllipsisTooltip className="truncate">{label}</EllipsisTooltip>
 * ```
 */
export function EllipsisTooltip({
  as = 'div',
  children,
  title,
  observeOptions,
  ...rest
}: EllipsisTooltipProps): JSX.Element {
  const { ref, truncated } = useIsEllipsis<HTMLElement>(observeOptions);
  const tooltip = title ?? (typeof children === 'string' ? children : undefined);

  return createElement(
    as,
    { ...rest, ref, title: truncated ? tooltip : undefined, 'data-truncated': truncated || undefined },
    children,
  );
}
