const copyComputedStyles = (source: HTMLElement, target: HTMLElement): CSSStyleDeclaration => {
  const computedStyles: CSSStyleDeclaration = window.getComputedStyle(source);

  for (const computedStyle of Array.from(computedStyles)) {
    // @ts-ignore
    target.style[computedStyle] = computedStyles.getPropertyValue(computedStyle);
  }
  return computedStyles;
};

const getInputValue = (inputElement: HTMLInputElement): string => {
  return inputElement.value || inputElement.placeholder;
};

const getValue = (element: HTMLElement): string => {
  return element.tagName === 'INPUT' ? getInputValue(element as HTMLInputElement) : element.innerHTML;
};

export const isEllipsis = (sourceElement: HTMLElement): number => {
  const copiedElement: HTMLDivElement = document.createElement('DIV') as HTMLDivElement;
  const holderElement: HTMLSpanElement = document.createElement('SPAN') as HTMLSpanElement;

  copiedElement.appendChild(holderElement);
  document.body.appendChild(copiedElement);

  const computedStyles: CSSStyleDeclaration = copyComputedStyles(sourceElement, copiedElement);
  const innerHtml: string = getValue(sourceElement);

  copiedElement.style.width = `${sourceElement.offsetWidth}px`;
  copiedElement.style.height = `${sourceElement.offsetHeight}px`;

  const scrollWidth =
    copiedElement.scrollWidth -
    parseInt(computedStyles.getPropertyValue('padding-left'), 10) -
    parseInt(computedStyles.getPropertyValue('padding-right'), 10);
  holderElement.innerHTML = innerHtml;

  const result: number =
    computedStyles.getPropertyValue('white-space') === 'nowrap' &&
    computedStyles.getPropertyValue('overflow') === 'hidden' &&
    computedStyles.getPropertyValue('text-overflow') === 'ellipsis' &&
    holderElement.offsetWidth > scrollWidth
      ? holderElement.offsetWidth - scrollWidth
      : 0;
  document.body.removeChild(copiedElement);
  return result;
};
