import { type UIFunctor, type UINothing } from '../maybe';
import UIElement from '../ui-element';
interface UIRef<T> extends UIFunctor<T> {
    (): T;
    map: <V>(fn: (node: T, host: UIElement) => V) => UIMaybeRef<V>;
    on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>;
    off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>;
    text: (state: PropertyKey) => UIRef<T>;
    prop: (key: PropertyKey, state?: PropertyKey) => UIRef<T>;
    attr: (name: string, state?: PropertyKey) => UIRef<T>;
    bool: (name: string, state?: PropertyKey) => UIRef<T>;
    class: (token: string, state?: PropertyKey) => UIRef<T>;
    style?: (prop: string, state?: PropertyKey) => UIRef<T>;
    first?: (selector: string) => UIRef<T>;
    all?: (selector: string) => UIRef<T>[];
}
type UIMaybeRef<T> = UIRef<T> | UINothing;
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
declare const ui: <T>(host: UIElement, node?: Element) => UIRef<T>;
export { type UIRef, type UIMaybeRef, ui as default };
