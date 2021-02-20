import { isEllipsis } from '../index';

const wasItSummer = 'Was it summer when the river ran dry or was it just another dam';
const elements = {
    inputElement: {} as HTMLInputElement,
    divElement: {} as HTMLDivElement,
    spanElement: {} as HTMLSpanElement
};

beforeEach((done) => {
    elements.inputElement = document.createElement('input');
    elements.divElement = document.createElement('div');
    elements.spanElement = document.createElement('span');

    elements.inputElement.style.overflow = 'hidden';
    elements.inputElement.style.textOverflow = 'ellipsis';
    elements.inputElement.style.whiteSpace = 'nowrap';
    elements.inputElement.style.width = '120px';

    elements.divElement.style.overflow = 'hidden';
    elements.divElement.style.textOverflow = 'ellipsis';
    elements.divElement.style.whiteSpace = 'nowrap';
    elements.divElement.style.width = '12px';
    elements.divElement.style.display = 'block';

    document.body.appendChild(elements.inputElement);
    document.body.appendChild(elements.divElement);
    document.body.appendChild(elements.spanElement);

    done();
})
afterEach((done) =>{
    document.body.removeChild(elements.inputElement);
    document.body.removeChild(elements.divElement);
    document.body.removeChild(elements.spanElement);

    done();
})

test('isEllipsis to be defined', () => {
    expect(isEllipsis).toBeDefined();
})

test('isEllipsis input element', () => {

    const  { inputElement } = elements;

    inputElement.value = wasItSummer;
    inputElement.placeholder = '';

    expect(isEllipsis(inputElement, false, Number)).toBe(2);
    expect(isEllipsis(inputElement, false, Number)).toBe(2);

    expect(isEllipsis(inputElement)).toBe(2);

    expect(isEllipsis(undefined as any, false, Number)).toBe(NaN);

    inputElement.value = '';
    inputElement.placeholder = wasItSummer;

    expect(isEllipsis(inputElement, false, Number)).toBe(2);
    expect(isEllipsis(inputElement, true, Number)).toBe(2);

    expect(isEllipsis(inputElement, true, Boolean)).toBe(true);
    expect(isEllipsis(inputElement, true, Boolean)).toBe(true);
    expect(isEllipsis(undefined as any, true, Boolean)).toBe(false);
});

test('isEllipsis div element', () => {

    const { divElement } = elements;

    divElement.innerHTML = `<span>${wasItSummer}</span>`;

    expect(isEllipsis(divElement, false, Number)).toBe(0);
    expect(isEllipsis(divElement, true, Boolean)).toBe(true);
});

test('isEllipsis span element', () => {

    const { spanElement } = elements;

    spanElement.innerHTML = `<span>${wasItSummer}</span>`;

    expect(isEllipsis(spanElement, false, Number)).toBe(0);
    expect(isEllipsis(spanElement, true, Boolean)).toBe(true);
});