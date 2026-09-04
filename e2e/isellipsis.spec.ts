import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Real-browser behaviour of the built `isellipsis` bundle, verified against
 * an independent visual oracle.
 *
 * Ground truth: `text-overflow: ellipsis` only changes pixels when the text
 * actually overflows, so
 *
 *     screenshot(el) vs screenshot(el with text-overflow: clip)
 *        identical -> no ellipsis is painted
 *        different -> an ellipsis is painted
 *
 * (for -webkit-line-clamp the clamp value is toggled instead). Every test then
 * asserts the library's answer matches what is really on screen.
 */

const iifePath = path.join(here, '..', 'packages', 'isellipsis', 'dist', 'index.global.js');
if (!fs.existsSync(iifePath)) {
  throw new Error('packages/isellipsis/dist/index.global.js not found - run `npm run build` first.');
}
const BUNDLE = fs.readFileSync(iifePath, 'utf8');

const LONG = 'Was it summer when the river ran dry or was it just another dam that held the water back';
const SHORT = 'dry';

const PAGE_STYLE = `
  body { margin: 20px; font: 16px/1.4 Arial, sans-serif; }
  input.box, textarea.box { font: inherit; }
  .box {
    width: 140px; overflow: hidden; white-space: nowrap;
    text-overflow: ellipsis; box-sizing: border-box; border: 1px solid #ccc; padding: 2px 4px;
  }
  .inline-block { display: inline-block; }
  .wrap { white-space: normal; height: 45px; }
  .clamp { white-space: normal; height: auto; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
`;

const render = async (page: Page, bodyHtml: string) => {
  await page.setContent(
    `<!doctype html><html><head><style>${PAGE_STYLE}</style></head><body>${bodyHtml}</body></html>`,
  );
  await page.evaluate(() => (document as any).fonts?.ready);
  await page.addScriptTag({ content: BUNDLE });
};

// The IIFE build exposes the module on `window.isEllipsis`.
const measure = (page: Page, selector: string, usePlaceholder = true) =>
  page.evaluate(
    ({ selector, usePlaceholder }) => {
      const el = document.querySelector(selector) as HTMLElement;
      const api = (window as any).isEllipsis;
      return {
        num: api.isEllipsis(el, usePlaceholder, Number) as number,
        bool: api.isEllipsis(el, usePlaceholder, Boolean) as boolean,
        measurement: api.measureEllipsis(el, { usePlaceholder }) as {
          truncated: boolean;
          overflow: number;
          axis: string | null;
        },
      };
    },
    { selector, usePlaceholder },
  );

const ellipsisIsPainted = async (page: Page, selector: string, mode: 'line' | 'clamp' = 'line') => {
  const loc = page.locator(selector);
  const before = await loc.screenshot();
  await page.evaluate(
    ({ selector, mode }) => {
      const el = document.querySelector(selector) as HTMLElement;
      (el as any).__restore =
        mode === 'clamp' ? el.style.getPropertyValue('-webkit-line-clamp') : el.style.textOverflow;
      if (mode === 'clamp') el.style.setProperty('-webkit-line-clamp', '999');
      else el.style.textOverflow = 'clip';
    },
    { selector, mode },
  );
  const after = await loc.screenshot();
  await page.evaluate(
    ({ selector, mode }) => {
      const el = document.querySelector(selector) as HTMLElement;
      if (mode === 'clamp') el.style.setProperty('-webkit-line-clamp', (el as any).__restore);
      else el.style.textOverflow = (el as any).__restore;
    },
    { selector, mode },
  );
  return Buffer.compare(before, after) !== 0;
};

const expectAgree = async (page: Page, selector: string, mode: 'line' | 'clamp' = 'line') => {
  const { num, bool, measurement } = await measure(page, selector);
  const painted = await ellipsisIsPainted(page, selector, mode);
  expect(bool, 'boolean vs painted').toBe(painted);
  expect(num > 0.5, `number (${num}) vs painted`).toBe(painted);
  expect(measurement.truncated, 'measureEllipsis.truncated vs painted').toBe(painted);
  return { num, bool, measurement, painted };
};

test.describe('isellipsis (real browser, verified visually)', () => {
  test('exposes the API on the global', async ({ page }) => {
    await render(page, '');
    const keys = await page.evaluate(() => Object.keys((window as any).isEllipsis).sort());
    expect(keys).toEqual(expect.arrayContaining(['isEllipsis', 'measureEllipsis', 'observeEllipsis']));
  });

  test('DIV: overflowing single-line text shows an ellipsis on the x axis', async ({ page }) => {
    await render(page, `<div id="t" class="box">${LONG}</div>`);
    const { num, measurement, painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
    expect(num).toBeGreaterThan(0);
    expect(measurement.axis).toBe('x');
  });

  test('DIV: fitting text shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box">${SHORT}</div>`);
    expect((await expectAgree(page, '#t')).painted).toBe(false);
  });

  test('DIV: text-overflow:clip is never reported, even when overflowing', async ({ page }) => {
    await render(page, `<div id="t" class="box" style="text-overflow:clip">${LONG}</div>`);
    const { bool, num } = await measure(page, '#t');
    expect(bool).toBe(false);
    expect(num).toBeLessThanOrEqual(0.5);
    await page.evaluate(() => ((document.querySelector('#t') as HTMLElement).style.textOverflow = 'ellipsis'));
    expect(await ellipsisIsPainted(page, '#t')).toBe(true);
  });

  test('DIV: overflow:visible cannot show an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box" style="overflow:visible">${LONG}</div>`);
    expect((await measure(page, '#t')).bool).toBe(false);
  });

  test('DIV: wrapping multi-word text shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box wrap">${LONG}</div>`);
    expect((await expectAgree(page, '#t')).painted).toBe(false);
  });

  test('DIV: a single unbreakable word that overflows shows an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box wrap">Supercalifragilisticexpialidocious_and_then_some_more</div>`);
    expect((await expectAgree(page, '#t')).painted).toBe(true);
  });

  test('DIV: -webkit-line-clamp truncation is detected on the y axis', async ({ page }) => {
    await render(page, `<div id="t" class="box clamp">${LONG}</div>`);
    const { measurement, painted } = await expectAgree(page, '#t', 'clamp');
    expect(painted).toBe(true);
    expect(measurement.axis).toBe('y');
  });

  test('DIV: -webkit-line-clamp not exceeded shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box clamp">${SHORT}</div>`);
    expect((await expectAgree(page, '#t', 'clamp')).painted).toBe(false);
  });

  test('SPAN, display:inline-block: overflowing text shows an ellipsis', async ({ page }) => {
    await render(page, `<span id="t" class="box inline-block">${LONG}</span>`);
    expect((await expectAgree(page, '#t')).painted).toBe(true);
  });

  test('RTL DIV: overflowing text shows an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box" dir="rtl">${LONG}</div>`);
    expect((await expectAgree(page, '#t')).painted).toBe(true);
  });

  test('INPUT: overflowing value shows an ellipsis', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${LONG}" />`);
    const { num, painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
    expect(num).toBeGreaterThan(0);
  });

  test('INPUT: fitting value shows no ellipsis', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${SHORT}" />`);
    expect((await expectAgree(page, '#t')).painted).toBe(false);
  });

  test('INPUT: overflowing value shows no ellipsis while focused, even though it would if blurred', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${LONG}" />`);
    await page.locator('#t').focus();
    const { bool, measurement } = await measure(page, '#t');
    expect(bool).toBe(false);
    expect(measurement.truncated).toBe(false);
    // The oracle itself must agree there is genuinely nothing painted (not
    // just that the library says so): toggling text-overflow while focused
    // shouldn't change a single pixel, since neither value is ever painted
    // as an ellipsis while the caret is being kept in view.
    expect(await ellipsisIsPainted(page, '#t')).toBe(false);
  });

  test('INPUT: blurring after focus re-shows the ellipsis', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${LONG}" />`);
    await page.locator('#t').focus();
    expect((await measure(page, '#t')).bool).toBe(false);

    await page.locator('#t').blur();
    const { bool } = await measure(page, '#t');
    expect(bool).toBe(true);
    expect(await ellipsisIsPainted(page, '#t')).toBe(true);
  });

  test('TEXTAREA: single-line overflowing value shows no ellipsis while focused', async ({ page }) => {
    await render(page, `<textarea id="t" class="box" style="white-space:nowrap">${LONG}</textarea>`);
    expect((await measure(page, '#t')).bool).toBe(true);
    await page.locator('#t').focus();
    expect((await measure(page, '#t')).bool).toBe(false);
  });

  test('INPUT: placeholder measured only when usePlaceholder is true', async ({ page }) => {
    await render(page, `<input id="t" class="box" placeholder="${LONG}" />`);
    expect((await measure(page, '#t', true)).bool).toBe(true);
    expect((await measure(page, '#t', false)).bool).toBe(false);
  });

  test('INPUT: text-transform:uppercase is accounted for', async ({ page }) => {
    const text = 'illinois minimum wage';
    await render(page, `<input id="t" class="box" style="text-transform:uppercase" value="${text}" />`);
    await page.evaluate((text) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:16px Arial, sans-serif';
      probe.textContent = text;
      document.body.appendChild(probe);
      const lower = probe.getBoundingClientRect().width;
      probe.style.textTransform = 'uppercase';
      const upper = probe.getBoundingClientRect().width;
      probe.remove();
      (document.querySelector('#t') as HTMLElement).style.width = `${Math.round((lower + upper) / 2)}px`;
    }, text);
    expect((await expectAgree(page, '#t')).painted).toBe(true);
    await page.evaluate(() => ((document.querySelector('#t') as HTMLElement).style.textTransform = 'none'));
    expect((await measure(page, '#t')).bool).toBe(false);
  });

  test('the number result approximates the real overflow', async ({ page }) => {
    await render(page, `<div id="t" class="box">${LONG}</div>`);
    const { num, oracleOverflow } = await page.evaluate(() => {
      const el = document.querySelector('#t') as HTMLElement;
      return {
        num: (window as any).isEllipsis.isEllipsis(el, false, Number) as number,
        oracleOverflow: el.scrollWidth - el.clientWidth,
      };
    });
    expect(Math.abs(num - oracleOverflow)).toBeLessThan(2);
  });

  test('invalid element yields NaN (Number) / false (Boolean)', async ({ page }) => {
    await render(page, '');
    const [num, bool] = await page.evaluate(() => [
      (window as any).isEllipsis.isEllipsis(undefined, false, Number),
      (window as any).isEllipsis.isEllipsis(undefined, false, Boolean),
    ]);
    expect(Number.isNaN(num)).toBe(true);
    expect(bool).toBe(false);
  });
});
