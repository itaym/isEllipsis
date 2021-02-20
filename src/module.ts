export type TIsEllipsisFunction = {
  (
      sourceElement: HTMLElement,
      usePlaceholder?:boolean,
      resultType?:NumberConstructor|BooleanConstructor
  ):number|boolean
}