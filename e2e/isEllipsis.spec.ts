import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * jsdom does no layout, so the unit tests in src/__tests__ can only assert the
 * "protocol" (the function is defined, bad input yields NaN/false). These tests
 * run the built library in real headless Chromium, where scrollWidth and
 * clientWidth actually reflect overflow, and check the real behaviour.
 *
 * The library is built to CommonJS (lib/index.js); wrap it so it can be dropped
 * into a page as a classic script that exposes `window.isEllipsis`.
 */
const buildBrowserBundle = (): string => {
  const libPath = path.join(__dirname, '..', 'lib', 'index.js');
  if (!fs.existsSync(libPath)) {
    throw new Error('lib/index.js not found - run `npm run build` before the browser tests.');
  }
  const cjs = fs.readFileSync(libPath, 'utf8');
  return `(function(){var module={exports:{}};var exports=module.exports;\n${cjs}\nwindow.isEllipsis=module.exports.isEllipsis;})();`;
};

const BUNDLE = buildBrowserBundle();

const LONG_TEXT = 'Was it summer when the river ran dry or was it just another dam that held the water back';
const SHORT_TEXT = 'dry';

type Args = { html: string; usePlaceholder?: boolean; asBoolean?: boolean };

/** Render `html` into a fresh page, then call isEllipsis on `#target`. */
const run = async (page: Page, { html, usePlaceholder = true, asBoolean = false }: Args) => {
  await page.setContent(`<!doctype html><html><head><style>
    .clip { width: 120px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-sizing: border-box; }
    .block { display: block; }
    .inline-block { display: inline-block; }
    .flex { display: flex; }
  </style></head><body>${html}</body></html>`);
  await page.addScriptTag({ content: BUNDLE });
  return page.evaluate(
    ([usePlaceholder, asBoolean]) => {
      const el = document.getElementById('target') as HTMLElement;
      // @ts-ignore - injected by the bundle
      return window.isEllipsis(el, usePlaceholder, asBoolean ? Boolean : Number);
    },
    [usePlaceholder, asBoolean] as const,
  );
};

test.describe('isEllipsis (real browser)', () => {
  test('is exposed on the page', async ({ page }) => {
    await page.setContent('<body></body>');
    await page.addScriptTag({ content: BUNDLE });
    expect(await page.evaluate(() => typeof (window as any).isEllipsis)).toBe('function');
  });

  test('DIV: overflowing text reports an ellipsis', async ({ page }) => {
    const n = await run(page, { html: `<div id="target" class="clip block">${LONG_TEXT}</div>` });
    expect(typeof n).toBe('number');
    expect(n as number).toBeGreaterThan(0);
  });

  test('DIV: fitting text reports no ellipsis', async ({ page }) => {
    const n = await run(page, { html: `<div id="target" class="clip block">${SHORT_TEXT}</div>` });
    expect(n).toBe(0);
  });

  test('DIV: Boolean return type', async ({ page }) => {
    expect(await run(page, { html: `<div id="target" class="clip block">${LONG_TEXT}</div>`, asBoolean: true })).toBe(true);
    expect(await run(page, { html: `<div id="target" class="clip block">${SHORT_TEXT}</div>`, asBoolean: true })).toBe(
      false,
    );
  });

  test('SPAN, display:inline-block: overflowing text reports an ellipsis', async ({ page }) => {
    const n = await run(page, { html: `<span id="target" class="clip inline-block">${LONG_TEXT}</span>` });
    expect(n as number).toBeGreaterThan(0);
  });

  test('SPAN, display:flex: overflowing text reports an ellipsis', async ({ page }) => {
    const n = await run(page, { html: `<span id="target" class="clip flex">${LONG_TEXT}</span>` });
    expect(n as number).toBeGreaterThan(0);
  });

  test('SPAN, plain inline: reports no ellipsis (inline boxes cannot show one)', async ({ page }) => {
    // A `display: inline` element is not a block container, so `text-overflow`
    // has no effect and it never actually shows an ellipsis. Returning 0 here
    // is correct, not a miss.
    const n = await run(page, { html: `<span id="target" class="clip">${LONG_TEXT}</span>` });
    expect(n).toBe(0);
  });

  test('INPUT: overflowing value reports an ellipsis', async ({ page }) => {
    const n = await run(page, { html: `<input id="target" class="clip block" value="${LONG_TEXT}" />` });
    expect(n as number).toBeGreaterThan(0);
  });

  test('INPUT: placeholder measured only when usePlaceholder is true', async ({ page }) => {
    const html = `<input id="target" class="clip block" placeholder="${LONG_TEXT}" />`;
    expect((await run(page, { html, usePlaceholder: true })) as number).toBeGreaterThan(0);
    expect(await run(page, { html, usePlaceholder: false })).toBe(0);
  });

  test('invalid element yields NaN (Number) / false (Boolean)', async ({ page }) => {
    await page.setContent('<body></body>');
    await page.addScriptTag({ content: BUNDLE });
    const [num, bool] = await page.evaluate(() => [
      (window as any).isEllipsis(undefined, false, Number),
      (window as any).isEllipsis(undefined, false, Boolean),
    ]);
    expect(Number.isNaN(num)).toBe(true);
    expect(bool).toBe(false);
  });
});
