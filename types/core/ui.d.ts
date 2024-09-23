import type { UIElement } from '../ui-element';
interface UI<T extends Element> {
    host: UIElement;
    target: T;
}
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
export { type UI, first, all };
