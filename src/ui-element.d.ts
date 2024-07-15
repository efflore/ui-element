import { type UIState } from "./cause-effect";
type UIAttributeParser = ((value: unknown | undefined, element?: HTMLElement, old?: unknown | undefined) => unknown) | undefined;
type UIMappedAttributeParser = [PropertyKey, UIAttributeParser];
type UIAttributeMap = Record<string, UIAttributeParser | UIMappedAttributeParser>;
type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>;
type UIContextParser = ((value: unknown | undefined, element?: HTMLElement) => unknown) | undefined;
type UIMappedContextParser = [PropertyKey, UIContextParser];
type UIContextMap = Record<PropertyKey, UIContextParser | UIMappedContextParser>;
interface IUIElement extends Partial<HTMLElement> {
    attributeMap: UIAttributeMap;
    contextMap: UIContextMap;
    connectedCallback(): void;
    disconnectedCallback?(): void;
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    has(key: PropertyKey): boolean;
    get(key: PropertyKey): unknown;
    set(key: PropertyKey, value: unknown | UIState<unknown>, update?: boolean): void;
    delete(key: PropertyKey): boolean;
    pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>;
    targets(key: PropertyKey): Set<Element>;
}
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {IUIElement}
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
     * @type {UIAttributeMap}
     */
    attributeMap: UIAttributeMap;
    /**
     * @since 0.7.0
     * @property
     * @type {UIContextMap}
     */
    contextMap: UIContextMap;
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
    set(key: PropertyKey, value: unknown | UIState<unknown>, update?: boolean): void;
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
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    pass(element: IUIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>;
    /**
     * Return a Set of elements that have effects dependent on the given state
     *
     * @since 0.7.0
     * @param {PropertyKey} key - state to get targets for
     * @returns {Set<Element>} set of elements that have effects dependent on the given state
     */
    targets(key: PropertyKey): Set<Element>;
}
export { type IUIElement, type UIStateMap, type UIAttributeMap, type UIContextMap, UIElement as default };
