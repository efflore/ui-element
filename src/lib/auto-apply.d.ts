declare const SELECTOR_PREFIX = "data";
/**
 * Loop through all elements with the given attribute and call the provided callback function
 *
 * @since 0.7.0
 * @param {Element} el - UIElement to iterate over
 * @param {string} suffix - attribute name suffix to look for
 * @param {(node: Element, value: string) => void} callback - callback function to be called for each element
 */
declare const autoApply: (el: Element, suffix: string, callback: (node: Element, value: string) => void) => void;
export { autoApply as default, SELECTOR_PREFIX };
