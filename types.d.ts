interface Signal<T> {
  get(): T;
}
export interface State<T> extends Signal<T> {
  set(v: T): void;
}
export interface Computed<T> extends Signal<T> {}
declare function cause(value: any): State<any>
declare function derive(fn: () => any): Computed<any>

export type ParserTypeString = 'boolean' | 'integer' | 'number';
export type AttributeParser = ParserTypeString | ((v: string | undefined) => any) | undefined;
export type MappedAttributeParser = [string, AttributeParser];

export default class extends HTMLElement {
  static define(tag: string, registry: CustomElementRegistry): void;
  attributeMap: Map<string, AttributeParser | MappedAttributeParser>;
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
  has(key: any): boolean;
  get(key: any): any;
  set(key: any, value: any, update: boolean): any;
  delete(key: any): boolean;
  effect(fn: () => void | (() => void)): () => void;
}
