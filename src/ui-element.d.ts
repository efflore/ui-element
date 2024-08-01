import { type UIState } from "./cause-effect";
import { type UnknownContext } from "./context-request";
type UIAttributeParser = ((value: string | undefined, element?: HTMLElement, old?: string | undefined) => unknown);
type UIMappedAttributeParser = [PropertyKey, UIAttributeParser];
type UIAttributeMap = Record<string, UIAttributeParser | UIMappedAttributeParser>;
type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>;
type UIContextParser = ((value: unknown | undefined, element?: HTMLElement) => unknown);
type UIMappedContextParser = [string, UIContextParser];
type UIContextMap = Record<string, UIContextParser | UIMappedContextParser>;
interface UIElement extends HTMLElement {
    attributeMap: UIAttributeMap;
    contextMap: UIContextMap;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    has(key: PropertyKey): boolean;
    get<V>(key: PropertyKey): V;
    set<V>(key: PropertyKey, value: V | ((old: V | undefined) => V) | UIState<V>, update?: boolean): void;
    delete(key: PropertyKey): boolean;
    pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>;
    targets(key: PropertyKey): Set<Element>;
}
/**
 * Check if a given value is a string
 *
 * @param {unknown} value - value to check if it is a string
 * @returns {boolean} true if supplied parameter is a string
 */
declare const isString: (value: unknown) => value is string;
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
declare class UIElement extends HTMLElement {
    #private;
    static consumedContexts: UnknownContext[];
    static providedContexts: UnknownContext[];
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
}
export { type UIStateMap, type UIAttributeMap, type UIContextMap, UIElement as default, isString };
