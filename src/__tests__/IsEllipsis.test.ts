import { isEllipsis } from '../index';

// jsdom performs no layout and has no 2d canvas, so these tests only cover the
// "protocol": the export exists, the argument handling, and graceful failure.
// The real behaviour is verified against a headless browser in e2e/.

const LONG_TEXT = 'Was it summer when the river ran dry or was it just another dam that held the water back';

let div: HTMLDivElement;

beforeEach(() => {
  div = document.createElement('div');
  div.style.overflow = 'hidden';
  div.style.textOverflow = 'ellipsis';
  div.style.whiteSpace = 'nowrap';
  div.style.width = '80px';
  div.innerHTML = LONG_TEXT;
  document.body.appendChild(div);
});

afterEach(() => {
  document.body.removeChild(div);
});

test('isEllipsis is exported', () => {
  expect(isEllipsis).toBeDefined();
  expect(typeof isEllipsis).toBe('function');
});

test('returns a number by default and a boolean when asked', () => {
  expect(typeof isEllipsis(div)).toBe('number');
  expect(typeof isEllipsis(div, true, Boolean)).toBe('boolean');
});

test('a non-clipping element can never show an ellipsis', () => {
  div.style.overflow = 'visible';
  div.style.overflowX = 'visible';
  expect(isEllipsis(div, false, Number)).toBe(0);
  expect(isEllipsis(div, false, Boolean)).toBe(false);
});

test('text-overflow other than ellipsis reports nothing', () => {
  div.style.textOverflow = 'clip';
  expect(isEllipsis(div, false, Number)).toBe(0);
  expect(isEllipsis(div, false, Boolean)).toBe(false);
});

test('invalid element yields NaN / false', () => {
  expect(isEllipsis(undefined as any, false, Number)).toBe(NaN);
  expect(isEllipsis(undefined as any, false, Boolean)).toBe(false);
});
