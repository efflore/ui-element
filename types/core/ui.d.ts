import type { UIElement } from '../ui-element';
interface UI<T extends Element> {
    get: () => T;
    map: (f: (host: UIElement, node: T) => unknown) => UI<T>;
}
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UI} - UIRef instance for the given element
 */
declare const ui: <T extends Element>(host: UIElement, node: T) => UI<T>;
export { type UI, ui };
