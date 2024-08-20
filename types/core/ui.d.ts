import type { UIElement } from '../ui-element';
interface UI<T extends Element> {
    host: UIElement;
    target: T;
}
/**
 * Create a new UI instance with the provided host UIElement
 *
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 * @param {Element} target - target element to use for the new UI instance
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
