import { type FxState, effect } from './lib/cause-effect';
/**
 * @name UIElement
 * @version 0.7.0
 */
export type FxAttributeParser = ((value: string | undefined, element: HTMLElement, old: string | undefined) => unknown) | undefined;
export type FxMappedAttributeParser = [PropertyKey, FxAttributeParser];
export type AttributeMap = Record<string, FxAttributeParser | FxMappedAttributeParser>;
export type FxStateMap = Record<PropertyKey, PropertyKey | FxState>;
export type FxContextParser = ((value: unknown | undefined, element: HTMLElement) => unknown) | undefined;
export type FxMappedContextParser = [PropertyKey, FxContextParser];
export type Context<KeyType, ValueType> = KeyType & {
    __context__: ValueType;
};
export type UnknownContext = Context<unknown, unknown>;
export type ContextMap = Record<PropertyKey, FxContextParser | FxMappedContextParser>;
export type ContextType<T extends UnknownContext> = T extends Context<infer _, infer V> ? V : never;
export type ContextCallback<ValueType> = (value: ValueType, unsubscribe?: () => void) => void;
declare global {
    interface HTMLElementEventMap {
        'context-request': ContextRequestEvent<PropertyKey, FxState>;
    }
}
/**
 * Recursivlely unwrap a given variable if it is a function
 *
 * @since 0.7.0
 * @param {unknown} value
 * @returns {unknown} unwrapped variable
 */
declare const unwrap: (value: unknown) => unknown;
/**
 * Parse a boolean attribute to an actual boolean value
 *
 * @since 0.7.0
 * @param {string|undefined} value
 * @returns {boolean}
 */
declare const asBoolean: (value: string | undefined) => boolean;
/**
 * Parse an attribute to a number forced to integer
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
declare const asInteger: (value: string) => number;
/**
 * Parse an attribute to a number
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
declare const asNumber: (value: string) => number;
/**
 * Parse an attribute to a string
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
declare const asString: (value: string) => string;
/**
 * Class for context-request events
 *
 * @class ContextRequestEvent
 * @extends {Event}
 *
 * @property {PropertyKey} context - context key
 * @property {ContextCallback<FxState>} callback - callback function for value getter and unsubscribe function
 * @property {boolean} [subscribe=false] - whether to subscribe to context changes
 */
declare class ContextRequestEvent<PropertyKey, FxState> extends Event {
    context: PropertyKey;
    callback: ContextCallback<FxState>;
    subscribe: boolean;
    /**
     * @param {PropertyKey} context - context key
     * @param {ContextCallback<FxState>} callback - callback for value getter and unsubscribe function
     * @param {boolean} [subscribe=false] - whether to subscribe to context changes
     */
    constructor(context: PropertyKey, callback: ContextCallback<FxState>, subscribe?: boolean);
}
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
declare class UIElement extends HTMLElement {
    #private;
    /**
     * Define a custom element in the custom element registry
     *
     * @since 0.5.0
     * @param {string} tag - name of the custom element
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    static define(tag: string, registry?: CustomElementRegistry): void;
    /**
     * @since 0.5.0
     * @property
     * @type {AttributeMap}
     */
    attributeMap: AttributeMap;
    /**
     * @since 0.7.0
     * @property
     * @type {ContextMap}
     */
    contextMap: ContextMap;
    /**
     * Native callback function when an observed attribute of the custom element changes
     *
     * @since 0.1.0
     * @param {string} name - name of the modified attribute
     * @param {string|undefined} old - old value of the modified attribute
     * @param {string|undefined} value - new value of the modified attribute
     */
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    connectedCallback(): void;
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
     * @returns {unknown} current value of state; undefined if state does not exist
     */
    get(key: PropertyKey): unknown;
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to set value to
     * @param {unknown} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
     */
    set(key: PropertyKey, value: unknown | FxState, update?: boolean): void;
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
     * @param {UIElement} element - child element to pass the states to
     * @param {FxStateMap} states - object of states to be passed
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    pass(element: UIElement, states: FxStateMap, registry?: CustomElementRegistry): Promise<void>;
    /**
     * Return a Set of elements that have effects dependent on the given state
     *
     * @since 0.7.0
     * @param {PropertyKey} key - state to get targets for
     * @returns {Set<Element>} set of elements that have effects dependent on the given state
     */
    targets(key: PropertyKey): Set<Element>;
}
export { UIElement as default, effect, unwrap, asBoolean, asInteger, asNumber, asString, ContextRequestEvent };
