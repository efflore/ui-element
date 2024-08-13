import type { UIElement } from '../ui-element';
interface UI<A extends Element> {
    elements: A[];
    host: UIElement;
    map: <B extends Element>(f: (host: UIElement, element: A) => B) => UI<B>;
}
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element[]} elements - native DOM elements to wrap
 * @returns {UI} - UIRef instance for the given element
 */
declare const ui: <A extends Element>(host: UIElement, elements: A[]) => UI<A>;
export { type UI, ui };
