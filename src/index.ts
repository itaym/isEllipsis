import { TIsEllipsisFunction } from "./module";

const copyComputedStyles = (source: HTMLElement, target: HTMLElement): CSSStyleDeclaration => {
  const computedStyles: CSSStyleDeclaration = window.getComputedStyle(source);

  // @ts-ignore
    for (const computedStyle of computedStyles) {
    target.style[computedStyle as any] = computedStyles.getPropertyValue(computedStyle);
  }
  return computedStyles;
};
const getInputValue = (inputElement: HTMLInputElement, usePlaceholder: boolean): string => {
  return inputElement.value || (usePlaceholder ? inputElement.placeholder : '');
};
const getValue = (element: HTMLElement, usePlaceholder:boolean): string => {
  return element.tagName === 'INPUT' ? getInputValue(element as HTMLInputElement, usePlaceholder) : element.innerHTML;
};
export const isEllipsis:TIsEllipsisFunction = (
    sourceElement: HTMLElement,
    usePlaceholder:boolean = true,
    resultType:NumberConstructor|BooleanConstructor = Number) => {
    try {
        const copiedElement: HTMLDivElement = document.createElement('DIV') as HTMLDivElement;
        const innerHtml: string = getValue(sourceElement, usePlaceholder);
        copyComputedStyles(sourceElement, copiedElement);

        copiedElement.style.width = `${sourceElement.offsetWidth}px`;
        copiedElement.style.minWidth = `${sourceElement.offsetWidth}px`;
        copiedElement.style.height = `${sourceElement.offsetHeight}px`;
        copiedElement.style.minHeight = `${sourceElement.offsetHeight}px`;
        copiedElement.style.boxSizing = 'border-box';
        copiedElement.style.position = 'fixed';
        copiedElement.style.top = `${sourceElement.offsetHeight * -1}px`;

        document.body.appendChild(copiedElement);
        copiedElement.innerHTML = innerHtml;

        const result = copiedElement.scrollWidth - copiedElement.clientWidth;
        document.body.removeChild(copiedElement)

        if (resultType === Number) {
            return result;
        }
        else {
            return result > 0;
        }
    }
    catch {
        if (resultType === Number) {
            return NaN;
        }
        else {
            return false;
        }
    }
};
