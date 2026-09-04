import { useCallback, useEffect, useRef, useState } from 'react';
import { observeEllipsis, type EllipsisMeasurement, type ObserveOptions } from 'isellipsis';

export interface UseIsEllipsisResult<T extends HTMLElement> extends EllipsisMeasurement {
  /** Attach to the element you want watched: `<div ref={ref} />`. */
  ref: (node: T | null) => void;
}

const INITIAL: EllipsisMeasurement = { truncated: false, overflow: 0, axis: null };

/**
 * Tracks whether the referenced element is truncating its text with an ellipsis,
 * updating on container resize, text/attribute changes, and web-font load.
 *
 * ```tsx
 * const { ref, truncated } = useIsEllipsis<HTMLDivElement>();
 * return <div ref={ref} className="truncate" title={truncated ? text : undefined}>{text}</div>;
 * ```
 */
export function useIsEllipsis<T extends HTMLElement = HTMLElement>(
  options: ObserveOptions = {},
): UseIsEllipsisResult<T> {
  const [node, setNode] = useState<T | null>(null);
  const [state, setState] = useState<EllipsisMeasurement>(INITIAL);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!node) {
      setState(INITIAL);
      return;
    }
    return observeEllipsis(node, setState, optionsRef.current);
    // Re-subscribe when the node or the measurement-affecting option changes.
  }, [node, options.usePlaceholder]);

  const ref = useCallback((next: T | null) => setNode(next), []);

  return { ref, ...state };
}
