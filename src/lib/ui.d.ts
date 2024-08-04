import { type UIFunctor, type UINothing } from '../maybe';
import UIElement from '../ui-element';
interface UIRef<T> extends UIFunctor<unknown> {
    (): T;
    type: string;
    map: (fn: (host: UIElement, node: T) => T) => UIMaybeRef<T> | UIList<UIRef<T>>;
    chain: (fn: (host: UIElement, node: T) => unknown) => unknown;
    filter: (fn: (host: UIElement, node: T) => boolean) => UIMaybeRef<T>;
    first: (selector: string) => UIRef<T>;
    all: (selector: string) => UIList<UIRef<T>>;
    on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>;
    off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>;
    text: (state: PropertyKey) => UIRef<T>;
    prop: (key: PropertyKey, state?: PropertyKey) => UIRef<T>;
    attr: (name: string, state?: PropertyKey) => UIRef<T>;
    bool: (name: string, state?: PropertyKey) => UIRef<T>;
    class: (token: string, state?: PropertyKey) => UIRef<T>;
    style: (prop: string, state?: PropertyKey) => UIRef<T>;
}
interface UIList<T> extends UIFunctor<unknown> {
    (): T[];
    type: string;
    map: (fn: (node: T) => T[]) => UIList<T>;
    chain: (fn: (node: T) => T[]) => unknown;
    filter: (fn: (node: T) => boolean) => UIList<T>;
}
type UIMaybeRef<T> = UIRef<T> | UINothing<T>;
/**
 * Return selector string for the id of the element
 *
 * @param {string} id
 * @returns {string} - id string for the element with '#' prefix
 * /
const idString = (id: string): string => id ? `#${id}` : '';

/**
 * Return a selector string for classes of the element
 *
 * @param {DOMTokenList} classList - DOMTokenList to convert to a string
 * @returns {string} - class string for the DOMTokenList with '.' prefix if any
 * /
const classString = (classList: DOMTokenList): string => classList.length ? `.${Array.from(classList).join('.')}` : '';

/* === Exported functions === */
/**
 * Create a "list" container for an array of whatever, providing a chainable API for handling multiple values
 *
 * @since 0.8.0
 * @param {unknown} items - array of items to wrap in a list container
 * @returns {UIList} - UIList instance for the given array
 */
declare const list: <T>(items: T[]) => UIList<T>;
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
declare const ui: <T>(host: UIElement, node?: Element) => UIRef<T>;
export { type UIRef, type UIList, ui as default, list };
