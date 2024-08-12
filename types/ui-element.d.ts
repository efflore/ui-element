import { type Maybe } from './core/maybe';
import { type Signal } from './cause-effect';
import { type UnknownContext } from './core/context-request';
import { type UI } from './core/ui';
type AttributeParser = (<T>(value: Maybe<string>, element: UIElement, old: string | undefined) => Maybe<T>);
type AttributeMap = Record<string, AttributeParser>;
type StateMap = Record<PropertyKey, PropertyKey | Signal<unknown> | (() => unknown)>;
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
     * Get first sub-element matching a given selector within the custom element as a maybe of element
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-element
     * @returns {UI<Element> | undefined} - first matching sub-element as a UI of element
     */
    first(selector: string): UI<Element> | undefined;
    /**
     * Get all sub-elements matching a given selector within the custom element as an array
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-elements
     * @returns {UI<Element>[]} - all matching sub-elements as an array of UI of element
     */
    all(selector: string): UI<Element>[];
    /**
     * Passes states from the current UIElement to another UIElement
     *
     * @since 0.5.0
     * @param {UIElement} target - child element to pass the states to
     * @param {StateMap} stateMap - object of states to be passed; target state keys as keys, source state keys or function as values
     */
    pass(target: UIElement, stateMap: StateMap): Promise<void>;
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {PropertyKey} key - state to get signal for
     * @returns {Signal<T> | undefined} signal for the given state; undefined if
     */
    signal<T>(key: PropertyKey): Signal<T> | undefined;
}
export { type StateMap, type AttributeMap, UIElement };
