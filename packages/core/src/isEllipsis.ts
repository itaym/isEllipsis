import { measureEllipsis, TOLERANCE } from './measure';
import type { ResultType, TIsEllipsisFunction } from './types';

/**
 * Classic API - reports whether `sourceElement` is truncating its text with an
 * ellipsis (`…`).
 *
 * - `resultType` `Number` (default) returns the overflow in CSS pixels
 *   (fractional; `> 0` means an ellipsis is shown; `NaN` on error).
 * - `resultType` `Boolean` returns `true` when the overflow exceeds ~0.5px.
 * - `usePlaceholder` (inputs only, default `true`) measures the placeholder when
 *   the field is empty.
 *
 * For a value that updates on resize / text / font changes, use
 * {@link observeEllipsis} or `@isellipsis/react`'s `useIsEllipsis`.
 */
export const isEllipsis: TIsEllipsisFunction = (
  sourceElement: HTMLElement,
  usePlaceholder: boolean = true,
  resultType: ResultType = Number,
) => {
  const { overflow } = measureEllipsis(sourceElement, { usePlaceholder });

  if (resultType === Boolean) {
    return !Number.isNaN(overflow) && overflow > TOLERANCE;
  }
  return overflow;
};
