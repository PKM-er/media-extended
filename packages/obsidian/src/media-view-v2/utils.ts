export const create = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  appendTo: HTMLElement | null,
  props?: Partial<HTMLElementTagNameMap[K]>,
  callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] => {
  let el = document.createElement(tag);
  props && Object.assign(el, props);
  callback && callback(el);
  appendTo && appendTo.append(el);
  return el;
};
