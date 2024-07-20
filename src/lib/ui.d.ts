import UIElement from '../ui-element';
type UIRef = {
    (): Element;
    first: (selector: string) => UIRef | undefined;
    all: (selector: string) => UIRef[];
    on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef | undefined;
    off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef | undefined;
    setText: (content: string) => void;
    text: (stateKey: PropertyKey) => UIRef | undefined;
    prop: (propKey: PropertyKey, stateKey?: PropertyKey) => UIRef | undefined;
    attr: (name: string, stateKey?: PropertyKey) => UIRef | undefined;
    bool: (name: string, stateKey?: PropertyKey) => UIRef | undefined;
    class: (token: string, stateKey?: PropertyKey) => UIRef | undefined;
    style: (prop: string, stateKey?: PropertyKey) => UIRef | undefined;
};
/**
 * Check if a given variable is defined
 *
 * @since 0.7.0
 * @param {unknown} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
declare const isDefined: (value: unknown) => value is NonNullable<unknown>;
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
declare const ui: (host: UIElement, node?: Element) => UIRef;
export { type UIRef, ui as default, isDefined };
