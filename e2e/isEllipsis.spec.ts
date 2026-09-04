import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Real-browser behaviour of the built library, verified against an independent
 * visual oracle.
 *
 * The DOM has no "is this truncated" flag, so ground truth comes from a
 * screenshot diff: `text-overflow: ellipsis` only changes pixels when the text
 * actually overflows, so
 *
 *     screenshot(el) vs screenshot(el with text-overflow: clip)
 *        identical -> no ellipsis is painted
 *        different -> an ellipsis is painted
 *
 * (for -webkit-line-clamp the clamp value is toggled instead). Every test then
 * asserts the library's answer matches what is really on screen.
 */

const cjs = fs.readFileSync(path.join(__dirname, '..', 'lib', 'index.js'), 'utf8');
const BUNDLE = `(function(){var module={exports:{}};var exports=module.exports;\n${cjs}\nwindow.isEllipsis=module.exports.isEllipsis;})();`;

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
  await page.setContent(`<!doctype html><html><head><style>${PAGE_STYLE}</style></head><body>${bodyHtml}</body></html>`);
  await page.evaluate(() => (document as any).fonts && (document as any).fonts.ready);
  await page.addScriptTag({ content: BUNDLE });
};

const measure = (page: Page, selector: string, usePlaceholder = true) =>
  page.evaluate(
    ({ selector, usePlaceholder }) => {
      const el = document.querySelector(selector) as HTMLElement;
      const w = window as any;
      return { num: w.isEllipsis(el, usePlaceholder, Number) as number, bool: w.isEllipsis(el, usePlaceholder, Boolean) as boolean };
    },
    { selector, usePlaceholder },
  );

const ellipsisIsPainted = async (page: Page, selector: string, mode: 'line' | 'clamp' = 'line') => {
  const loc = page.locator(selector);
  const before = await loc.screenshot();
  await page.evaluate(
    ({ selector, mode }) => {
      const el = document.querySelector(selector) as HTMLElement;
      (el as any).__restore = mode === 'clamp' ? el.style.getPropertyValue('-webkit-line-clamp') : el.style.textOverflow;
      if (mode === 'clamp') {
        el.style.setProperty('-webkit-line-clamp', '999');
      } else {
        el.style.textOverflow = 'clip';
      }
    },
    { selector, mode },
  );
  const after = await loc.screenshot();
  await page.evaluate(
    ({ selector, mode }) => {
      const el = document.querySelector(selector) as HTMLElement;
      if (mode === 'clamp') {
        el.style.setProperty('-webkit-line-clamp', (el as any).__restore);
      } else {
        el.style.textOverflow = (el as any).__restore;
      }
    },
    { selector, mode },
  );
  return Buffer.compare(before, after) !== 0;
};

/** Assert the library's number + boolean results match the visual oracle. */
const expectAgree = async (page: Page, selector: string, mode: 'line' | 'clamp' = 'line') => {
  const { num, bool } = await measure(page, selector);
  const painted = await ellipsisIsPainted(page, selector, mode);
  expect(bool, `boolean result vs painted ellipsis`).toBe(painted);
  expect(num > 0.5, `number result (${num}) vs painted ellipsis`).toBe(painted);
  return { num, bool, painted };
};

test.describe('isEllipsis (real browser, verified visually)', () => {
  test('is exposed on the page', async ({ page }) => {
    await render(page, '');
    expect(await page.evaluate(() => typeof (window as any).isEllipsis)).toBe('function');
  });

  test('DIV: overflowing single-line text shows an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box">${LONG}</div>`);
    const { num, painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
    expect(num).toBeGreaterThan(0);
  });

  test('DIV: fitting text shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box">${SHORT}</div>`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(false);
  });

  test('DIV: text-overflow:clip is not reported as an ellipsis even when overflowing', async ({ page }) => {
    await render(page, `<div id="t" class="box" style="text-overflow:clip">${LONG}</div>`);
    const { num, bool } = await measure(page, '#t');
    expect(bool).toBe(false);
    expect(num).toBeLessThanOrEqual(0.5);
    // ...but the text genuinely overflows: forcing an ellipsis would paint one.
    await page.evaluate(() => ((document.querySelector('#t') as HTMLElement).style.textOverflow = 'ellipsis'));
    expect(await ellipsisIsPainted(page, '#t')).toBe(true);
  });

  test('DIV: overflow:visible cannot show an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box" style="overflow:visible">${LONG}</div>`);
    const { num, bool } = await measure(page, '#t');
    expect(bool).toBe(false);
    expect(num).toBeLessThanOrEqual(0.5);
  });

  test('DIV: wrapping multi-word text shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box wrap">${LONG}</div>`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(false);
  });

  test('DIV: a single unbreakable word that overflows shows an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box wrap">Supercalifragilisticexpialidocious_and_then_some_more</div>`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
  });

  test('DIV: -webkit-line-clamp truncation is detected', async ({ page }) => {
    await render(page, `<div id="t" class="box clamp">${LONG}</div>`);
    const { painted } = await expectAgree(page, '#t', 'clamp');
    expect(painted).toBe(true);
  });

  test('DIV: -webkit-line-clamp that is not exceeded shows no ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box clamp">${SHORT}</div>`);
    const { painted } = await expectAgree(page, '#t', 'clamp');
    expect(painted).toBe(false);
  });

  test('SPAN, display:inline-block: overflowing text shows an ellipsis', async ({ page }) => {
    await render(page, `<span id="t" class="box inline-block">${LONG}</span>`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
  });

  test('RTL DIV: overflowing text shows an ellipsis', async ({ page }) => {
    await render(page, `<div id="t" class="box" dir="rtl">${LONG}</div>`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
  });

  test('INPUT: overflowing value shows an ellipsis', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${LONG}" />`);
    const { num, painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);
    expect(num).toBeGreaterThan(0);
  });

  test('INPUT: fitting value shows no ellipsis', async ({ page }) => {
    await render(page, `<input id="t" class="box" value="${SHORT}" />`);
    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(false);
  });

  test('INPUT: placeholder is measured only when usePlaceholder is true', async ({ page }) => {
    await render(page, `<input id="t" class="box" placeholder="${LONG}" />`);
    const withPh = await measure(page, '#t', true);
    const withoutPh = await measure(page, '#t', false);
    expect(withPh.bool).toBe(true);
    expect(withoutPh.bool).toBe(false);
    expect(withoutPh.num).toBeLessThanOrEqual(0.5);
  });

  test('INPUT: text-transform:uppercase is accounted for', async ({ page }) => {
    const text = 'illinois minimum wage';
    await render(page, `<input id="t" class="box" style="text-transform:uppercase" value="${text}" />`);

    // Width that fits the lowercase text but not the uppercase rendering, so the
    // transform is the sole reason an ellipsis appears - the library must apply
    // it before measuring.
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

    const { painted } = await expectAgree(page, '#t');
    expect(painted).toBe(true);

    // Remove the transform and the very same text now fits.
    await page.evaluate(() => ((document.querySelector('#t') as HTMLElement).style.textTransform = 'none'));
    expect((await measure(page, '#t')).bool).toBe(false);
  });

  test('the number result approximates the real overflow', async ({ page }) => {
    await render(page, `<div id="t" class="box">${LONG}</div>`);
    const { num, oracleOverflow } = await page.evaluate(() => {
      const el = document.querySelector('#t') as HTMLElement;
      return {
        num: (window as any).isEllipsis(el, false, Number) as number,
        oracleOverflow: el.scrollWidth - el.clientWidth,
      };
    });
    expect(Math.abs(num - oracleOverflow)).toBeLessThan(2);
  });

  test('invalid element yields NaN (Number) / false (Boolean)', async ({ page }) => {
    await render(page, '');
    const [num, bool] = await page.evaluate(() => [
      (window as any).isEllipsis(undefined, false, Number),
      (window as any).isEllipsis(undefined, false, Boolean),
    ]);
    expect(Number.isNaN(num)).toBe(true);
    expect(bool).toBe(false);
  });
});
