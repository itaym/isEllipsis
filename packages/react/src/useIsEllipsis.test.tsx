import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useIsEllipsis } from './useIsEllipsis';
import { EllipsisTooltip } from './EllipsisTooltip';

// happy-dom has no layout engine, so these tests verify wiring: the ref
// attaches, an initial (non-truncated) state is returned, and cleanup runs
// without throwing. Reactive resize behaviour is covered by the Playwright
// suite driving the playground.

afterEach(cleanup);

function Probe() {
  const { ref, truncated, overflow, axis } = useIsEllipsis<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-testid="probe"
      data-truncated={String(truncated)}
      data-axis={String(axis)}
      data-overflow={String(overflow)}
    >
      hello world
    </div>
  );
}

describe('useIsEllipsis', () => {
  it('attaches a ref and returns an initial measurement', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).toBeTruthy();
    expect(el.getAttribute('data-truncated')).toBe('false');
    expect(el.getAttribute('data-axis')).toBe('null');
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(<Probe />);
    expect(() => unmount()).not.toThrow();
  });
});

describe('EllipsisTooltip', () => {
  it('renders children in the chosen element and omits title when not truncated', () => {
    render(
      <EllipsisTooltip as="span" data-testid="tt" className="truncate">
        A label that is not truncated in happy-dom
      </EllipsisTooltip>,
    );
    const el = screen.getByTestId('tt');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toBe('truncate');
    expect(el.hasAttribute('title')).toBe(false);
    expect(el.textContent).toContain('A label');
  });
});
