/* Cause & Effect * /
declare function cause(value: any): { (): any; set: (value: any) => any; }
declare function derive(fn: () => any): () => void;
declare function effect(fn: () => void | (() => void)): () => void;
*/

export type FxDOMInstruction = (
  element: Element,
  key: any,
  value?: any
) => any;

export type FxDOMInstructionMap = Map<FxDOMInstruction, Map<any, any>>;

export type FxState = {
  (): any;
  effects?: Set<{(): void; targets: Map<Element, FxDOMInstructionMap>}>;
  set?(value: any): void;
}

export type FxDOMInstructionQueue = (
  element: Element,
  domFn: FxDOMInstruction,
  key: any,
  value: any
) => void;

export type FxMaybeCleanup = void | (() => void);

export type FxEffectCallback = (queue: FxDOMInstructionQueue) => FxMaybeCleanup;

export type FxAttributeParser = ((
  value: string | undefined,
  element: HTMLElement,
  old: string | undefined
) => any) | undefined;

export type FxMappedAttributeParser = [PropertyKey, FxAttributeParser];

export type AttributeMap = Record<string, FxAttributeParser | FxMappedAttributeParser>;

export type FxFunctionOrSignal = {
  (): any;
  set?: (value: any) => any;
};

export type FxStateMap = Record<PropertyKey, PropertyKey | FxFunctionOrSignal>;

export type FxContextParser = ((
  value: any | undefined,
  element: HTMLElement
) => any) | undefined;

export type FxMappedContextParser = [PropertyKey, FxContextParser];

export type Context<KeyType, ValueType> = KeyType & {__context__: ValueType};

export type UnknownContext = Context<unknown, unknown>;

export type ContextMap = Record<PropertyKey, FxContextParser | FxMappedContextParser>;

export type ContextType<T extends UnknownContext> = T extends Context<infer _, infer V> ? V : never;

export type ContextCallback<ValueType> = (
  value: ValueType,
  unsubscribe?: () => void
) => void;

export class ContextRequestEvent<T extends UnknownContext> extends Event {
  context: T;
  callback: ContextCallback<ContextType<T>>;
  subscribe?: boolean;
  
  public constructor(
    context: T,
    callback: ContextCallback<ContextType<T>>,
    subscribe?: boolean
  );
}

export class UIElement extends HTMLElement {
  static providedContexts?: string[];
  static consumedContexts?: string[];
  static define(
    tag: string,
    registry?: CustomElementRegistry
  ): void;
  attributeMap: AttributeMap;
  contextMap?: ContextMap;
  attributeChangedCallback(
    name: string,
    old: string | undefined,
    value: string | undefined
  ): void;
  has(key: PropertyKey): boolean;
  get(key: PropertyKey): any;
  set(
    key: PropertyKey,
    value: any,
    update?: boolean
  ): void;
  delete(key: PropertyKey): boolean;
  pass(
    element: UIElement,
    states: FxStateMap,
    registry?: CustomElementRegistry
  ): void;
  targets(key: PropertyKey): Set<Element>;
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
  log: () => void;
}

/* Context Controller */


export class ContextProvider {
  constructor(element: UIElement);
  disconnect(): void;
}

export class ContextConsumer {
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
