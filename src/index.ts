import { TIsEllipsisFunction } from './module';

type TResultType = NumberConstructor | BooleanConstructor;

// Sub-pixel slack: font hinting / anti-aliasing can make a measured width differ
// from the rendered one by a fraction of a pixel. Anything below this is "fits".
const TOLERANCE = 0.5;

const px = (value: string): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

// Apply CSS `text-transform` so canvas text metrics match what is painted.
const applyTextTransform = (text: string, transform: string): string => {
  if (transform.indexOf('uppercase') === 0) {
    return text.toUpperCase();
  }
  if (transform.indexOf('lowercase') === 0) {
    return text.toLowerCase();
  }
  if (transform.indexOf('capitalize') === 0) {
    return text.replace(/(^|\s)(\S)/g, (_match, lead: string, ch: string) => lead + ch.toUpperCase());
  }
  return text;
};

// Horizontal space available to text inside `element`, as a fractional value.
const availableWidth = (element: HTMLElement, styles: CSSStyleDeclaration): number => {
  const rect = element.getBoundingClientRect();
  return (
    rect.width -
    px(styles.borderLeftWidth) -
    px(styles.borderRightWidth) -
    px(styles.paddingLeft) -
    px(styles.paddingRight)
  );
};

// Rendered width of a non-input element's text: unclipped (overflow only clips
// painting, not layout) and fractional, measured without touching the DOM.
const elementTextWidth = (element: HTMLElement): number => {
  const range = document.createRange();
  range.selectNodeContents(element);

  let widest = 0;
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width > widest) {
      widest = rect.width;
    }
  }
  return widest || range.getBoundingClientRect().width;
};

let sharedCanvas: HTMLCanvasElement | undefined;

// Rendered width of an <input>/<textarea> value (or placeholder) via canvas text
// metrics - no clone, no reflow, and immune to the browsers whose input
// scrollWidth never exceeds clientWidth.
const inputTextWidth = (
  input: HTMLInputElement | HTMLTextAreaElement,
  styles: CSSStyleDeclaration,
  usePlaceholder: boolean,
): number => {
  let text = input.value || (usePlaceholder ? input.placeholder : '');
  if (!text) {
    return 0;
  }
  text = applyTextTransform(text, styles.textTransform);

  sharedCanvas = sharedCanvas || document.createElement('canvas');
  const ctx = sharedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('isEllipsis: 2d canvas context is unavailable');
  }

  ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  let width = ctx.measureText(text).width;

  const letterSpacing = px(styles.letterSpacing);
  if (letterSpacing) {
    width += letterSpacing * Math.max(0, Array.from(text).length - 1);
  }
  const wordSpacing = px(styles.wordSpacing);
  if (wordSpacing) {
    width += wordSpacing * Math.max(0, text.split(' ').length - 1);
  }
  return width;
};

/**
 * Reports whether `sourceElement` is currently truncating its text with an
 * ellipsis (`…`).
 *
 * - `resultType` `Number` (default) returns the overflow in CSS pixels
 *   (fractional, `> 0` means an ellipsis is shown, `NaN` on error).
 * - `resultType` `Boolean` returns `true` when the overflow exceeds ~0.5px.
 * - `usePlaceholder` (inputs only, default `true`) measures the placeholder when
 *   the field is empty.
 *
 * Fonts must be loaded for the measurement to be accurate - `await
 * document.fonts.ready` first if you call this right after page load.
 */
export const isEllipsis: TIsEllipsisFunction = (
  sourceElement: HTMLElement,
  usePlaceholder: boolean = true,
  resultType: TResultType = Number,
) => {
  const asResult = (overflow: number): number | boolean =>
    resultType === Number ? overflow : overflow > TOLERANCE;

  try {
    const styles = window.getComputedStyle(sourceElement);
    const tagName = sourceElement.tagName;
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';

    // An ellipsis is only painted when `text-overflow` asks for one; the default
    // `clip` cuts mid-glyph with no `…`.
    if (styles.textOverflow.indexOf('ellipsis') === -1) {
      return asResult(0);
    }

    // Multi-line truncation via `-webkit-line-clamp`.
    if (parseInt(styles.getPropertyValue('-webkit-line-clamp'), 10) > 0) {
      return asResult(sourceElement.scrollHeight - sourceElement.clientHeight);
    }

    // Single-line: a non-input element also needs a clipping context for the
    // ellipsis to appear (an input clips its own text regardless).
    if (!isInput && styles.overflowX === 'visible') {
      return asResult(0);
    }

    const textWidth = isInput
      ? inputTextWidth(sourceElement as HTMLInputElement, styles, usePlaceholder)
      : elementTextWidth(sourceElement);

    return asResult(textWidth - availableWidth(sourceElement, styles));
  } catch {
    return resultType === Number ? NaN : false;
  }
};
