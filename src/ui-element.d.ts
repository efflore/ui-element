import { type UISignal } from "./cause-effect";
import { type UnknownContext } from "./context-request";
type UIAttributeParser = ((value: string | undefined, element?: HTMLElement, old?: string | undefined) => unknown);
type UIAttributeMap = Record<string, UIAttributeParser>;
type UIStateMap = Record<PropertyKey, PropertyKey | UISignal<unknown> | (() => unknown)>;
interface UIElement extends HTMLElement {
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    has(key: PropertyKey): boolean;
    get<V>(key: PropertyKey): V;
    set<V>(key: PropertyKey, value: V | ((old: V | undefined) => V) | UISignal<V>, update?: boolean): void;
    delete(key: PropertyKey): boolean;
    pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>;
    signal<V>(key: PropertyKey): UISignal<V>;
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
}
export { type UIStateMap, type UIAttributeMap, UIElement as default };
