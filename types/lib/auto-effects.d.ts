import type { UI } from '../core/ui';
import type { StateLike } from '../ui-element';
type ElementUpdater<E extends Element, T> = {
    key: string;
    read: (element: E) => T;
    update: (value: T) => (element: E) => () => void;
    delete?: (element: E) => () => void;
};
/**
 * Auto-effect for setting properties of a target element according to a given state
 *
 * @since 0.9.0
 * @param {StateLike<T>} state - state bounded to the element property
 * @param {ElementUpdater} updater - updater object containing key, read, update, and delete methods
 */
declare const updateElement: <E extends Element, T>(state: StateLike<T>, updater: ElementUpdater<E, T>) => (ui: UI<E>) => UI<E>;
/**
 * Set text content of an element
 *
 * @since 0.8.0
 * @param {StateLike<string>} state - state bounded to the text content
 */
declare const setText: <E extends Element>(state: StateLike<string>) => (ui: UI<E>) => UI<E>;
/**
 * Set property of an element
 *
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike<unknown>} state - state bounded to the property value
 */
declare const setProperty: <E extends Element>(key: PropertyKey, state?: StateLike<unknown>) => (ui: UI<E>) => UI<E>;
/**
 * Set attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike<string>} state - state bounded to the attribute value
 */
declare const setAttribute: <E extends Element>(name: string, state?: StateLike<string>) => (ui: UI<E>) => UI<E>;
/**
 * Toggle a boolan attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike<boolean>} state - state bounded to the attribute existence
 */
declare const toggleAttribute: <E extends Element>(name: string, state?: StateLike<boolean>) => (ui: UI<E>) => UI<E>;
/**
 * Toggle a classList token of an element
 *
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike<boolean>} state - state bounded to the class existence
 */
declare const toggleClass: <E extends Element>(token: string, state?: StateLike<boolean>) => (ui: UI<E>) => UI<E>;
/**
 * Set a style property of an element
 *
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike<string>} state - state bounded to the style property value
 */
declare const setStyle: <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state?: StateLike<string>) => (ui: UI<E>) => UI<E>;
export { type ElementUpdater, updateElement, setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle };
