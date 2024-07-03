/* Cause & Effect * /
declare function cause(value: any): { (): any; set: (value: any) => any; }
declare function derive(fn: () => any): () => void;
declare function effect(fn: () => void | (() => void)): () => void;
*/

export type DOMUpdater = (element: Element, key: any, value: any) => any;
export type DOMEffects = (element: Element, domFn: DOMUpdater, key: any, value: any) => Map<any, any>;
export type EffectTargetMap = Map<Element, undefined | Map<DOMUpdater, Map<any, any>>>;
export type MaybeCleanup = void | (() => void);
export type EffectCallback = { (queue: DOMEffects): MaybeCleanup; targets?: EffectTargetMap; };
export type ParserTypeString = 'boolean' | 'integer' | 'number';
export type AttributeParser = ParserTypeString | ((v: string | undefined) => any) | undefined;
export type MappedAttributeParser = [PropertyKey, AttributeParser];
export type ContextParser = ((v: any | undefined) => any) | undefined;
export type MappedContextParser = [PropertyKey, ContextParser];
export type ContextRequestEventCallback = (value: { (): any; set?: (value: any) => any; }, unsubscribe?: () => void) => void;

export class UIElement extends HTMLElement {
  static providedContexts?: string[];
  static observedContexts?: string[];
  static define(tag: string, registry?: CustomElementRegistry): void;
  state: Record<PropertyKey, any>;
  attributeMap?: Record<string, AttributeParser | MappedAttributeParser>;
  contextMap?: Record<PropertyKey, ContextParser | MappedContextParser>;
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
  has(key: any): boolean;
  get(key: any): any;
  set(key: any, value: any, update?: boolean): void;
  delete(key: any): boolean;
  pass(element: UIElement, states: Record<PropertyKey, PropertyKey | { (): any; set?: (value: any) => any; }>, registry?: CustomElementRegistry): void;
  effect(fn: EffectCallback): () => void;
}

/* DOM Utils * /
declare function setText(element: HTMLElement, content: string | null): void;
declare function setProp(element: HTMLElement, key: string, value?: string | null | undefined): void;
declare function setAttr(element: HTMLElement, name: string, value?: string boolean | | null | undefined): void;
declare function setClass(element: HTMLElement, token: string, force?: boolean | null | undefined): void;
declare function setStyle(element: HTMLElement, property: string, value?: string | null | undefined): void;
declare function autoEffects(element: UIElement): void;
*/

/* Debug Element */
export class DebugElement extends UIElement {
  debug: boolean;
  log: () => void;
  error: () => void;
}

/* Context Controller */
export class ContextRequestEvent {
  context: PropertyKey;
  callback: ContextRequestEventCallback;
  subscribe?: boolean;
  constructor(context: PropertyKey, callback: ContextRequestEventCallback, subscribe?: boolean );
}
export class ContextProvider {
  host?: UIElement;
  hostPrototype?: UIElement;
  constructor(element: UIElement);
  disconnect(): void;
}

export class ContextConsumer {
  host?: UIElement;
  hostPrototype?: UIElement;
  constructor(element: UIElement);
  disconnect(): void;
}

/* Visibiblity Observer */
export class VisibilityObserver {
  observer?: IntersectionObserver;
  constructor(element: UIElement);
  disconnect(): void;
}

export default UIElement;
