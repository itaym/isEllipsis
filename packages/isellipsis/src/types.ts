export type EllipsisAxis = 'x' | 'y';

export interface EllipsisMeasurement {
  /** `true` when an ellipsis (`…`) is currently being rendered. */
  truncated: boolean;
  /**
   * Amount by which the content overflows its box, in CSS pixels (fractional).
   * `> ~0.5` means truncated. `NaN` when the element could not be measured.
   */
  overflow: number;
  /**
   * `'x'` for single-line width truncation, `'y'` for `-webkit-line-clamp`
   * multi-line truncation, `null` when not truncated.
   */
  axis: EllipsisAxis | null;
}

export interface MeasureOptions {
  /** Inputs only: measure the placeholder when the field is empty. Default `true`. */
  usePlaceholder?: boolean;
}

// Reserved for future observer-only options; kept as its own type so the public
// surface is stable.
export type ObserveOptions = MeasureOptions;

export type ResultType = NumberConstructor | BooleanConstructor;

/** Backwards-compatible signature of the classic `isEllipsis` function. */
export type TIsEllipsisFunction = (
  sourceElement: HTMLElement,
  usePlaceholder?: boolean,
  resultType?: ResultType,
) => number | boolean;
