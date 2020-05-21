
import { isEllipsis } from '../index';

const wasItSummer = 'Was it summer when the river ran dry or was it just another day';

test('isEllipsis input element', () => {
    expect(isEllipsis).toBeDefined();

    const inputElement = document.createElement('input');
    document.body.appendChild(inputElement);

    inputElement.style.overflow = 'hidden';
    inputElement.style.textOverflow = 'ellipsis';
    inputElement.style.whiteSpace = 'nowrap';
    inputElement.style.width = '120px';

    inputElement.value = wasItSummer;

    expect(isEllipsis(inputElement)).toBe(2);
    expect(isEllipsis(undefined as any)).toBe(0);

    inputElement.value = '';
    inputElement.placeholder = wasItSummer;
    expect(isEllipsis(inputElement)).toBe(2);
    inputElement.placeholder = '';
    expect(isEllipsis(inputElement, false)).toBe(2);
    document.body.removeChild(inputElement);
});

test('isEllipsis html element', () => {
    expect(isEllipsis).toBeDefined();

    const divElement = document.createElement('div');
    document.body.appendChild(divElement);

    divElement.style.overflow = 'hidden';
    divElement.style.textOverflow = 'ellipsis';
    divElement.style.whiteSpace = 'nowrap';
    divElement.style.width = '12px';
    divElement.style.display = 'block';
    divElement.innerHTML = `<span>${wasItSummer}</span>`;

    expect(isEllipsis(divElement, false)).toBe(0);

    document.body.removeChild(divElement);
});