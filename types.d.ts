export type State<T> = {
  get(): T;
  set?(v: T): void;
}
declare function cause(value: any): State<any>
declare function compute(fn: () => any): State<any>
declare function effect(fn: () => void | (() => void)): () => void
export { cause, compute, effect }

export type ParserTypeString = 'boolean' | 'integer' | 'number' | 'string';
export type AttributeParser = ParserTypeString | ((v: string | undefined) => any) | undefined;
export type MappedAttributeParser = [string, AttributeParser];

export default class extends HTMLElement {
  attributeMapping: Record<string, AttributeParser | MappedAttributeParser>;
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
  has(key: any): boolean;
  get(key: any): any;
  set(key: any, value: any): void;
  delete(key: any): void;
  effect(fn: () => void | (() => void)): () => void;
}
