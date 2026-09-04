import { measureEllipsis } from './measure';
import type { EllipsisMeasurement, ObserveOptions } from './types';

const sameState = (a: EllipsisMeasurement, b: EllipsisMeasurement): boolean =>
  a.truncated === b.truncated &&
  a.axis === b.axis &&
  (a.overflow === b.overflow || (Number.isNaN(a.overflow) && Number.isNaN(b.overflow)));

interface FontFaceSetLike {
  ready: Promise<unknown>;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

/**
 * Watch `element` and call `onChange` whenever its ellipsis state changes -
 * on container resize, text or attribute mutation, web-font load, and (for an
 * `<input>`/`<textarea>`) focus/blur.
 *
 * `onChange` is called once synchronously with the initial measurement, then
 * only when the state actually changes. Returns an unsubscribe function.
 */
export const observeEllipsis = (
  element: HTMLElement,
  onChange: (state: EllipsisMeasurement) => void,
  options: ObserveOptions = {},
): (() => void) => {
  let disposed = false;
  let frame = 0;
  let last: EllipsisMeasurement | undefined;

  const emit = (): void => {
    frame = 0;
    if (disposed) {
      return;
    }
    const next = measureEllipsis(element, options);
    if (!last || !sameState(last, next)) {
      last = next;
      onChange(next);
    }
  };

  const schedule = (): void => {
    if (disposed || frame) {
      return;
    }
    frame =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(emit)
        : (setTimeout(emit, 16) as unknown as number);
  };

  // Initial measurement, synchronous, so consumers have a value immediately.
  emit();

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined;
  if (resizeObserver) {
    resizeObserver.observe(element);
    // The text may overflow because a parent shrank, not the element itself.
    const parent = element.offsetParent;
    if (parent instanceof HTMLElement && parent !== element) {
      resizeObserver.observe(parent);
    }
  }

  const mutationObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : undefined;
  mutationObserver?.observe(element, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'value', 'placeholder', 'dir'],
  });

  const fonts = (document as Document & { fonts?: FontFaceSetLike }).fonts;
  const onFonts = (): void => schedule();
  fonts?.ready.then(onFonts).catch(() => undefined);
  fonts?.addEventListener?.('loadingdone', onFonts);

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', schedule);
  }

  // A focused <input>/<textarea> never paints an ellipsis (see measureEllipsis),
  // so focus/blur - on their own, with no other DOM change - can flip the
  // result. Neither ResizeObserver nor the MutationObserver above would
  // otherwise notice that transition.
  element.addEventListener('focus', schedule);
  element.addEventListener('blur', schedule);

  return () => {
    disposed = true;
    if (frame) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame);
      } else {
        clearTimeout(frame);
      }
    }
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    fonts?.removeEventListener?.('loadingdone', onFonts);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', schedule);
    }
    element.removeEventListener('focus', schedule);
    element.removeEventListener('blur', schedule);
  };
};
