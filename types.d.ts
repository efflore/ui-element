export interface Signal<T> {
  get(): T;
}
export interface State<T> extends Signal<T> {
  set(v: T): void;
}
export interface Computed<T> extends Signal<T> {}
/*
declare function cause(value: any): State<any>
declare function derive(fn: () => any): Computed<any>
declare function effect(fn: () => void | (() => void)): () => void;
declare function isFunction(fn: any): boolean;

declare function updateText(element: HTMLElement, content: string | null): void;
declare function updateProperty(element: HTMLElement, key: string, value?: string | null | undefined): void;
declare function updateAttribute(element: HTMLElement, name: string, value?: string | null | undefined): void;
declare function toggleClass(element: HTMLElement, token: string, force?: boolean | null | undefined): void;
declare function updateStyle(element: HTMLElement, property: string, value?: string | null | undefined): void;
*/

export type ParserTypeString = 'boolean' | 'integer' | 'number';
export type AttributeParser = ParserTypeString | ((v: string | undefined) => any) | undefined;
export type MappedAttributeParser = [PropertyKey, AttributeParser];
export type ContextParser = ((v: any | undefined) => any) | undefined;
export type MappedContextParser = [PropertyKey, ContextParser];
export type ContextRequestEventCallback = (value: Signal<any>, unsubscribe?: () => void) => void

export class UIElement extends HTMLElement {
  static providedContexts?: string[];
  static observedContexts?: string[];
  static define(tag: string, registry?: CustomElementRegistry): void;
  attributeMap: Map<string, AttributeParser | MappedAttributeParser>;
  contextMap?: Map<PropertyKey, ContextParser | MappedContextParser>;
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
  has(key: any): boolean;
  get(key: any): any;
  set(key: any, value: any, update?: boolean): void;
  delete(key: any): boolean;
  pass(element: UIElement, states: Map<PropertyKey, PropertyKey | (() => any)>, registry?: CustomElementRegistry): void;
  effect(fn: () => void | (() => void)): () => void;
}

export class DebugElement extends UIElement {
  debug: boolean;
  log: () => void;
  error: () => void;
}

export default UIElement;
