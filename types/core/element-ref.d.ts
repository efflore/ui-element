import type { UIElement } from '../ui-element';
interface ElementRef<T extends Element> {
    get: () => T;
    map: (f: (host: UIElement, node: T) => unknown) => ElementRef<T>;
}
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {ElementRef} - UIRef instance for the given element
 */
declare const elementRef: <T extends Element>(host: UIElement, node: T) => ElementRef<T>;
export { type ElementRef, elementRef };
