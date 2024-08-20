import { maybe } from './core/maybe';
import { type UI } from './core/ui';
import { type Signal, effect } from './cause-effect';
import { type UnknownContext } from './core/context-request';
import { log } from './core/log';
import { type StateMap, pass } from './lib/pass';
import { on } from './lib/event';
import { asBoolean, asInteger, asJSON, asNumber, asString } from './lib/parse-attribute';
import { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle } from './lib/auto-effects';
type AttributeParser = (<T>(value: string[], element: UIElement, old: string | undefined) => T[]);
type AttributeMap = Record<string, AttributeParser>;
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
declare class UIElement extends HTMLElement {
    #private;
    static registry: CustomElementRegistry;
    static attributeMap: AttributeMap;
    static consumedContexts: UnknownContext[];
    static providedContexts: UnknownContext[];
    /**
     * Define a custom element in the custom element registry
     *
     * @since 0.5.0
     * @param {string} tag - name of the custom element
     */
    static define(tag: string): void;
    /**
     * @since 0.8.1
     * @property {UI<UIElement>} self - UI object for this element
     */
    self: UI<UIElement>;
    /**
     * Native callback function when an observed attribute of the custom element changes
     *
     * @since 0.1.0
     * @param {string} name - name of the modified attribute
     * @param {string | undefined} old - old value of the modified attribute
     * @param {string | undefined} value - new value of the modified attribute
     */
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * Check whether a state is set
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to be checked
     * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
     */
    has(key: PropertyKey): boolean;
    /**
     * Get the current value of a state
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to get value from
     * @returns {T | undefined} current value of state; undefined if state does not exist
     */
    get<T>(key: PropertyKey): T | undefined;
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to set value to
     * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
     */
    set<T>(key: PropertyKey, value: T | ((old: T | undefined) => T) | Signal<T>, update?: boolean): void;
    /**
     * Delete a state, also removing all effects dependent on the state
     *
     * @since 0.4.0
     * @param {PropertyKey} key - state to be deleted
     * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
     */
    delete(key: PropertyKey): boolean;
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {PropertyKey} key - state to get signal for
     * @returns {Signal<T> | undefined} signal for the given state; undefined if
     */
    signal<T>(key: PropertyKey): Signal<T> | undefined;
    /**
     * Get array of first sub-element matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-element
     * @returns {UI<Element>[]} - array of zero or one matching sub-element
     */
    first: (selector: string) => UI<Element>[];
    /**
     * Get array of all sub-elements matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-elements
     * @returns {UI<Element>[]} - array of matching sub-elements
     */
    all: (selector: string) => UI<Element>[];
}
export { type AttributeMap, type StateMap, UIElement, effect, maybe, pass, on, log, asBoolean, asInteger, asNumber, asString, asJSON, setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle };
