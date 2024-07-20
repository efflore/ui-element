import { type UIState } from "./cause-effect";
type UIAttributeParser = ((value: unknown | undefined, element?: HTMLElement, old?: unknown | undefined) => unknown) | undefined;
type UIMappedAttributeParser = [PropertyKey, UIAttributeParser];
type UIAttributeMap = Record<string, UIAttributeParser | UIMappedAttributeParser>;
type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>;
type UIContextParser = ((value: unknown | undefined, element?: HTMLElement) => unknown) | undefined;
type UIMappedContextParser = [PropertyKey, UIContextParser];
type UIContextMap = Record<PropertyKey, UIContextParser | UIMappedContextParser>;
interface UIElement extends HTMLElement {
    attributeMap: UIAttributeMap;
    contextMap: UIContextMap;
    connectedCallback(): void;
    disconnectedCallback(): void;
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
export { type UIStateMap, type UIAttributeMap, type UIContextMap, UIElement as default };
