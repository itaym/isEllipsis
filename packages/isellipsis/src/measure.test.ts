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

describe('measureEllipsis on a focused input/textarea', () => {
  const makeInput = (tag: 'input' | 'textarea'): HTMLInputElement | HTMLTextAreaElement => {
    const el = document.createElement(tag);
    Object.assign(el.style, { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '40px' });
    el.value = 'x';
    document.body.appendChild(el);
    return el;
  };

  it('is never truncated while an <input> has focus, regardless of geometry', () => {
    const input = makeInput('input');
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(measureEllipsis(input)).toEqual({ truncated: false, overflow: 0, axis: null });
  });

  it('is never truncated while a <textarea> has focus, regardless of geometry', () => {
    const textarea = makeInput('textarea');
    textarea.focus();
    expect(document.activeElement).toBe(textarea);
    expect(measureEllipsis(textarea)).toEqual({ truncated: false, overflow: 0, axis: null });
  });

  it('does not short-circuit once the input is blurred again', () => {
    const input = makeInput('input');
    input.focus();
    expect(measureEllipsis(input)).toEqual({ truncated: false, overflow: 0, axis: null });
    input.blur();
    expect(document.activeElement).not.toBe(input);
    // Falls through to the real (canvas-based) measurement path instead of
    // being short-circuited by the focus gate.
    expect(measureEllipsis(input)).not.toEqual({ truncated: false, overflow: 0, axis: null });
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

  it('re-measures on focus and on blur, not just on resize/mutation', async () => {
    const input = document.createElement('input');
    Object.assign(input.style, { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '40px' });
    input.value = 'x';
    document.body.appendChild(input);

    const states: unknown[] = [];
    const stop = observeEllipsis(input, (s) => states.push(s));
    expect(states).toHaveLength(1);

    input.focus();
    await new Promise((r) => setTimeout(r, 32));
    expect(states).toHaveLength(2);
    expect(states[1]).toEqual({ truncated: false, overflow: 0, axis: null });

    input.blur();
    await new Promise((r) => setTimeout(r, 32));
    expect(states).toHaveLength(3);

    stop();
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
