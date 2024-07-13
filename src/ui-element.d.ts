import { type FxState } from "./cause-effect";
type FxAttributeParser = ((value: string | undefined, element: HTMLElement, old: string | undefined) => unknown) | undefined;
type FxMappedAttributeParser = [PropertyKey, FxAttributeParser];
type FxAttributeMap = Record<string, FxAttributeParser | FxMappedAttributeParser>;
type FxStateMap = Record<PropertyKey, PropertyKey | FxState>;
type FxContextParser = ((value: unknown | undefined, element: HTMLElement) => unknown) | undefined;
type FxMappedContextParser = [PropertyKey, FxContextParser];
type FxContextMap = Record<PropertyKey, FxContextParser | FxMappedContextParser>;
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
     * @type {FxAttributeMap}
     */
    attributeMap: FxAttributeMap;
    /**
     * @since 0.7.0
     * @property
     * @type {FxContextMap}
     */
    contextMap: FxContextMap;
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
export { type FxStateMap, type FxAttributeMap, type FxContextMap, UIElement as default };
