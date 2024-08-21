import type { UIElement } from '../ui-element';
interface UI<T extends Element> {
    host: UIElement;
    target: T;
}
/**
 * Create a new UI object with the provided host UIElement
 *
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI object
 * @param {Element} target - target element to use for the new UI object
 * @returns {UI<T>} - UI object with the provided host UIElement and target element
 */
declare const ui: <T extends Element>(host: UIElement, target: T) => UI<T>;
/**
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 */
declare const first: (host: UIElement) => (selector: string) => UI<Element>[];
/**
 *
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 */
declare const all: (host: UIElement) => (selector: string) => UI<Element>[];
export { type UI, ui, first, all };
