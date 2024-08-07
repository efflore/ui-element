import { type UIMaybe } from "./maybe";
import { type UISignal } from "./cause-effect";
import { type UnknownContext } from "./context-request";
type UIAttributeParser = ((value: UIMaybe<string>, element?: HTMLElement, old?: string | undefined) => unknown);
type UIAttributeMap = Record<string, UIAttributeParser>;
type UIStateMap = Record<PropertyKey, PropertyKey | UISignal<unknown> | (() => unknown)>;
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
    static attributeMap: UIAttributeMap;
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
     * @param {T | ((old: T | undefined) => T) | UISignal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
     */
    set<T>(key: PropertyKey, value: T | ((old: T | undefined) => T) | UISignal<T>, update?: boolean): void;
    /**
     * Delete a state, also removing all effects dependent on the state
     *
     * @since 0.4.0
     * @param {PropertyKey} key - state to be deleted
     * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
     */
    delete(key: PropertyKey): boolean;
    /**
     * Passes states from the current UIElement to another UIElement
     *
     * @since 0.5.0
     * @param {UIElement} target - child element to pass the states to
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
     */
    pass(target: UIElement, states: UIStateMap): Promise<void>;
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {PropertyKey} key - state to get signal for
     * @returns {UISignal<T> | undefined} signal for the given state; undefined if
     */
    signal<T>(key: PropertyKey): UISignal<T> | undefined;
}
export { type UIStateMap, type UIAttributeMap, UIElement };
