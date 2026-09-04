import type { EllipsisMeasurement, MeasureOptions } from './types';

// Sub-pixel slack: font hinting / anti-aliasing can make a measured width differ
// from the rendered one by a fraction of a pixel. Anything below this is "fits".
export const TOLERANCE = 0.5;

const NOT_TRUNCATED: EllipsisMeasurement = { truncated: false, overflow: 0, axis: null };

const px = (value: string): number => {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
};

// Apply CSS `text-transform` so canvas text metrics match what is painted.
const applyTextTransform = (text: string, transform: string): string => {
  if (transform.startsWith('uppercase')) {
    return text.toUpperCase();
  }
  if (transform.startsWith('lowercase')) {
    return text.toLowerCase();
  }
  if (transform.startsWith('capitalize')) {
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

  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
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
 * Measure whether `element` is currently truncating its text with an ellipsis.
 *
 * Returns `{ truncated, overflow, axis }`. `overflow` is `NaN` on error.
 * Fonts must be loaded for the result to be accurate - `await
 * document.fonts.ready` first if you call this right after page load.
 *
 * For a focused `<input>`/`<textarea>`, this always reports `truncated: false`:
 * the browser scrolls to keep the caret visible instead of painting the
 * ellipsis while the field has focus, so there genuinely isn't one currently
 * displayed - regardless of how much the value would overflow if the field
 * were blurred.
 */
export const measureEllipsis = (element: HTMLElement, options: MeasureOptions = {}): EllipsisMeasurement => {
  const usePlaceholder = options.usePlaceholder ?? true;

  try {
    const styles = window.getComputedStyle(element);
    const tagName = element.tagName;
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';

    // An ellipsis is only painted when `text-overflow` asks for one; the default
    // `clip` cuts mid-glyph with no `…`.
    if (styles.textOverflow.indexOf('ellipsis') === -1) {
      return NOT_TRUNCATED;
    }

    // A focused <input>/<textarea> scrolls to keep the caret visible instead of
    // painting `text-overflow: ellipsis` at all - true the instant it gains
    // focus, before any typing or selection change. isEllipsis reports whether
    // an ellipsis is *currently displayed*, not merely whether the content
    // would overflow, so a focused field is never reported as truncated.
    if (isInput && document.activeElement === element) {
      return NOT_TRUNCATED;
    }

    // Multi-line truncation via `-webkit-line-clamp`.
    if (parseInt(styles.getPropertyValue('-webkit-line-clamp'), 10) > 0) {
      const overflow = element.scrollHeight - element.clientHeight;
      return overflow > TOLERANCE
        ? { truncated: true, overflow, axis: 'y' }
        : { truncated: false, overflow, axis: null };
    }

    // Single-line: a non-input element also needs a clipping context for the
    // ellipsis to appear (an input clips its own text regardless).
    if (!isInput && styles.overflowX === 'visible') {
      return NOT_TRUNCATED;
    }

    const textWidth = isInput
      ? inputTextWidth(element as HTMLInputElement, styles, usePlaceholder)
      : elementTextWidth(element);
    const overflow = textWidth - availableWidth(element, styles);

    return overflow > TOLERANCE ? { truncated: true, overflow, axis: 'x' } : { truncated: false, overflow, axis: null };
  } catch {
    return { truncated: false, overflow: NaN, axis: null };
  }
};
