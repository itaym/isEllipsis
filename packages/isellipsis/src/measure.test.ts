import { afterEach, describe, expect, it } from 'vitest';
import { isEllipsis, measureEllipsis, observeEllipsis } from './index';

// happy-dom performs no layout and has no real 2d canvas, so these tests cover
// the "protocol": exports, argument handling, the CSS gates that short-circuit
// before any measurement, and graceful failure. Real geometry is verified
// against a headless browser in e2e/.

const make = (css: Partial<CSSStyleDeclaration>, html = 'x'): HTMLDivElement => {
  const el = document.createElement('div');
  Object.assign(el.style, {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: '40px',
    ...css,
  });
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isEllipsis (classic API)', () => {
  it('is a function with a default export', async () => {
    const mod = await import('./index');
    expect(typeof isEllipsis).toBe('function');
    expect(mod.default).toBe(isEllipsis);
  });

  it('returns a number by default and a boolean on request', () => {
    const el = make({});
    expect(typeof isEllipsis(el)).toBe('number');
    expect(typeof isEllipsis(el, true, Boolean)).toBe('boolean');
  });

  it('returns NaN / false for an invalid element', () => {
    expect(isEllipsis(undefined as unknown as HTMLElement, false, Number)).toBeNaN();
    expect(isEllipsis(undefined as unknown as HTMLElement, false, Boolean)).toBe(false);
  });
});

describe('measureEllipsis gates', () => {
  it('text-overflow other than ellipsis is never truncated', () => {
    expect(measureEllipsis(make({ textOverflow: 'clip' }))).toEqual({ truncated: false, overflow: 0, axis: null });
  });

  it('overflow:visible on a non-input is never truncated', () => {
    expect(measureEllipsis(make({ overflow: 'visible', overflowX: 'visible' }))).toEqual({
      truncated: false,
      overflow: 0,
      axis: null,
    });
  });

  it('a thrown measurement surfaces as overflow: NaN', () => {
    const result = measureEllipsis(null as unknown as HTMLElement);
    expect(result.truncated).toBe(false);
    expect(result.overflow).toBeNaN();
  });
});

describe('observeEllipsis', () => {
  it('emits an initial measurement synchronously and returns an unsubscribe', () => {
    const el = make({ textOverflow: 'clip' });
    const states: unknown[] = [];
    const stop = observeEllipsis(el, (s) => states.push(s));

    expect(states).toHaveLength(1);
    expect(states[0]).toEqual({ truncated: false, overflow: 0, axis: null });
    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
  });

  it('stops emitting after unsubscribe', async () => {
    const el = make({ textOverflow: 'clip' });
    let calls = 0;
    const stop = observeEllipsis(el, () => (calls += 1));
    stop();
    el.textContent = 'a much longer value that would change layout';
    await new Promise((r) => setTimeout(r, 32));
    expect(calls).toBe(1);
  });
});
