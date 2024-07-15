/* === Constants === */

const SELECTOR_PREFIX = 'data';

/* === Exported function === */

/**
 * Loop through all elements with the given attribute and call the provided callback function
 * 
 * @since 0.7.0
 * @param {Element} el - UIElement to iterate over
 * @param {string} suffix - attribute name suffix to look for
 * @param {(node: Element, value: string) => void} callback - callback function to be called for each element
 */
const autoApply = (
  el: Element,
  suffix: string,
  callback: (
    node: Element,
    value: string
  ) => void
): void => {
  const attr = `${SELECTOR_PREFIX}-${el.localName}-${suffix}`;
  const apply = (node: Element) => {
    callback(node, node.getAttribute(attr));
    node.removeAttribute(attr);
  };
  el.hasAttribute(attr) && apply(el);
  for (const node of el.querySelectorAll(`[${attr}]`))
    apply(node);
}

export { autoApply as default, SELECTOR_PREFIX };