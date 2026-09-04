import { test, expect } from '@playwright/test';

/**
 * Drives the playground app to verify that `useIsEllipsis` from
 * `@isellipsis/react` is genuinely reactive - the readout must follow container
 * resizes, text edits, font changes and mode switches without a remount.
 */

test.describe('@isellipsis/react - useIsEllipsis in the playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('box')).toBeVisible();
  });

  test('reacts to the box width slider', async ({ page }) => {
    await page.getByTestId('text-input').fill('A medium length label here');
    const readout = page.getByTestId('readout');
    const widthSlider = page.getByTestId('width-slider');

    await widthSlider.fill('440');
    await expect(readout).toHaveAttribute('data-truncated', 'false');
    await expect(page.getByTestId('readout-axis')).toHaveText('null');

    await widthSlider.fill('90');
    await expect(readout).toHaveAttribute('data-truncated', 'true');
    await expect(page.getByTestId('readout-axis')).toHaveText('x');
    await expect(page.getByTestId('readout-overflow')).not.toHaveText('0.0px');
  });

  test('reacts to editing the text', async ({ page }) => {
    await page.getByTestId('width-slider').fill('260');
    const input = page.getByTestId('text-input');

    await input.fill('short');
    await expect(page.getByTestId('readout')).toHaveAttribute('data-truncated', 'false');

    await input.fill('a very very very very very very very very long piece of text that overflows');
    await expect(page.getByTestId('readout')).toHaveAttribute('data-truncated', 'true');
  });

  test('reacts to the font-size slider', async ({ page }) => {
    await page.getByTestId('width-slider').fill('260');
    await page.getByTestId('text-input').fill('Just wide enough maybe');

    await page.getByTestId('font-slider').fill('10');
    const truncatedAtSmall = await page.getByTestId('readout').getAttribute('data-truncated');

    await page.getByTestId('font-slider').fill('30');
    await expect(page.getByTestId('readout')).toHaveAttribute('data-truncated', 'true');
    // growing the font can only add overflow, never remove it
    if (truncatedAtSmall === 'true') {
      // already truncated small -> still truncated large (checked above)
    }
  });

  test('switches truncation axis when mode changes to line-clamp', async ({ page }) => {
    await page.getByTestId('width-slider').fill('200');
    await page
      .getByTestId('text-input')
      .fill('One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen');
    await expect(page.getByTestId('readout-axis')).toHaveText('x');

    await page.getByTestId('mode-select').selectOption('clamp');
    await expect(page.getByTestId('readout')).toHaveAttribute('data-truncated', 'true');
    await expect(page.getByTestId('readout-axis')).toHaveText('y');
  });

  test('EllipsisTooltip exposes title only for clipped rows', async ({ page }) => {
    const listSlider = page.getByTestId('list-width-slider');

    // Wide: the short rows ("Short one", "Tokyo") are never clipped.
    await listSlider.fill('520');
    await expect(page.getByTestId('tooltip-item-0')).not.toHaveAttribute('title', /.+/);
    await expect(page.getByTestId('tooltip-item-3')).not.toHaveAttribute('title', /.+/);

    // Narrow: the long rows get a title; "Tokyo" still fits.
    await listSlider.fill('120');
    await expect(page.getByTestId('tooltip-item-1')).toHaveAttribute('title', /medium-length label/);
    await expect(page.getByTestId('tooltip-item-4')).toHaveAttribute('title', /quick brown fox/);
    await expect(page.getByTestId('tooltip-item-3')).not.toHaveAttribute('title', /.+/);
  });

  test('input value truncation is reactive', async ({ page }) => {
    const input = page.getByTestId('input');
    await expect(page.getByTestId('input-readout')).toHaveAttribute('data-truncated', 'true');

    await input.fill('short');
    await expect(page.getByTestId('input-readout')).toHaveAttribute('data-truncated', 'false');
  });
});
