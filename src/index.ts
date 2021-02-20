import { TIsEllipsisFunction } from "./module";

const getCorrectionValueByBrowser = ():number => {
    const browsersNames:{[index:string]:number} = {
        Chrome: 0,
        Firefox: -1,
        MSIE: 0,
        Edge: 0,
        Safari: 0,
        Opera: 0,
        YaBrowser: 0,
    };
    // @ts-ignore
    const browserName:string = Object.keys(browsersNames).find(name => navigator.userAgent.indexOf(name) > -1) || 'Chrome';
    
    return browsersNames[browserName] as number
}

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
    const browser = getCorrectionValueByBrowser();
    try {
        const copiedElement: HTMLDivElement = document.createElement('DIV') as HTMLDivElement;
        const holderElement: HTMLSpanElement = document.createElement('SPAN') as HTMLSpanElement;
        const computedStyles: CSSStyleDeclaration = copyComputedStyles(sourceElement, copiedElement);
        const innerHtml: string = getValue(sourceElement, usePlaceholder);

        copiedElement.style.width = `${sourceElement.offsetWidth}px`;
        copiedElement.style.minWidth = `${sourceElement.offsetWidth}px`;
        copiedElement.style.height = `${sourceElement.offsetHeight}px`;
        copiedElement.style.minHeight = `${sourceElement.offsetHeight}px`;
        copiedElement.style.boxSizing = 'border-box';
        copiedElement.style.position = 'fixed';
        copiedElement.style.top = `${sourceElement.offsetHeight * -1}px`;

        copiedElement.appendChild(holderElement);
        document.body.appendChild(copiedElement);

        const scrollWidth =
            copiedElement.scrollWidth -
            parseInt(computedStyles.getPropertyValue('padding-left') || "0", 10) -
            parseInt(computedStyles.getPropertyValue('padding-right') || "0", 10);
        holderElement.innerHTML = innerHtml;

        // noinspection PointlessArithmeticExpressionJS
        const result: number =
            computedStyles.getPropertyValue('white-space') === 'nowrap' &&
            computedStyles.getPropertyValue('overflow') === 'hidden' &&
            computedStyles.getPropertyValue('text-overflow') === 'ellipsis'
                ? holderElement.offsetWidth - scrollWidth + browser
                : holderElement.offsetWidth * -1 + 0; // adding 0 will prevent -0 !!!
        // @ts-ignore
        document.body.removeChild(copiedElement)
        if (resultType === Number) {
            return result;
        }
        else {
            return !(result < 0);
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
