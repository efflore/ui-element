import type { UIElement } from '../ui-element';
/**
 * Parse according to static attributeMap
 *
 * @since 0.8.4
 * @param {UIElement} host - host UIElement
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string} old - old attribute value
 */
declare const parse: (host: UIElement, name: string, value: string, old: string) => unknown;
export { parse };
