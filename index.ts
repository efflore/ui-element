/**
 * @name UIElement
 * @version 0.7.0
 */

/* === Types === */

export type FxDOMInstruction = (element: Element, key: unknown, value?: unknown) => unknown;

export type FxDOMInstructionMap = Map<FxDOMInstruction, Map<unknown, unknown>>;

export type FxEffect = {
  (): void;
  targets: Map<Element, FxDOMInstructionMap>
};

export type FxState = {
  (): unknown;
  effects?: Set<FxEffect>;
  set?(value: unknown): void;
}

export type FxDOMInstructionQueue = (element: Element, domFn: FxDOMInstruction, key: unknown, value: unknown) => void;

export type FxMaybeCleanup = void | (() => void);

export type FxEffectCallback = (queue: FxDOMInstructionQueue) => FxMaybeCleanup;

export type FxAttributeParser = ((
  value: string | undefined,
  element: HTMLElement,
  old: string | undefined
) => unknown) | undefined;

export type FxMappedAttributeParser = [PropertyKey, FxAttributeParser];

export type AttributeMap = Record<string, FxAttributeParser | FxMappedAttributeParser>;

export type FxStateMap = Record<PropertyKey, PropertyKey | FxState>;

export type FxContextParser = ((
  value: unknown | undefined,
  element: HTMLElement
) => unknown) | undefined;

export type FxMappedContextParser = [PropertyKey, FxContextParser];

export type Context<KeyType, ValueType> = KeyType & {__context__: ValueType};

export type UnknownContext = Context<unknown, unknown>;

export type ContextMap = Record<PropertyKey, FxContextParser | FxMappedContextParser>;

export type ContextType<T extends UnknownContext> = T extends Context<infer _, infer V> ? V : never;

export type ContextCallback<ValueType> = (
  value: ValueType,
  unsubscribe?: () => void
) => void;

declare global {
  interface HTMLElementEventMap {
    'context-request': ContextRequestEvent<PropertyKey, FxState>;
  }
}

/* === Constants === */

const CONTEXT_REQUEST = 'context-request';

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is a function
 * 
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = (fn: unknown): boolean => typeof fn === 'function';

/**
 * Recursively nest a map
 * 
 * @param {Map<unknown, unknown>} map - map to nest
 * @param {...unknown} args - key(s) to nest the map under
 * @returns {Map<unknown, unknown>} nested map
 */
const nestMap = (map: Map<unknown, unknown>, ...args: unknown[]): Map<unknown, unknown> => {
  const key = args.shift();
  !map.has(key) && map.set(key, new Map<unknown, unknown>());
  return args.length ? nestMap(map.get(key) as Map<unknown, unknown>, ...args) : map.get(key) as Map<unknown, unknown>;
}

// hold the currently active effect
let active: FxEffect | undefined;

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {unknown} value - initial value of the state; may be a function for derived state
 * @returns {FxState} getter function for the current value with a `set` method to update the value
 */
const cause = (value: unknown): FxState => {
  const state = () => { // getter function
    active && state.effects.add(active);
    return value;
  };
  state.effects = new Set<FxEffect>(); // set of listeners
  state.set = (updater: unknown) => { // setter function
    const old = value;
    value = isFunction(updater) && !isFunction((value as FxState).set) ? (updater as (old: unknown) => unknown)(old) : updater;
    if (!Object.is(value, old)) {
      for (const effect of state.effects) effect();
    }
  };
  return state;
};

/* === Exported functions === */

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {FxEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: FxEffectCallback) => {
  const targets = new Map();

  /**
   * @since 0.6.1
   * @param {Element} element - target element
   * @param {FxDOMInstruction} domFn 
   * @param {unknown} key
   * @param {unknown} value
   */
  const enqueue = (element: Element, domFn: FxDOMInstruction, key: unknown, value: unknown) => nestMap(targets, element, domFn).set(key, value);
  
  // effect callback function
  const next = () => queueMicrotask(() => { 
    const prev = active;
    active = next;
    const cleanup = fn(enqueue);
    active = prev;
    // flush all queued instructions
    for (const [el, domFns] of targets) {
      for (const [domFn, argsMap] of domFns) {
        for (const [key, value] of argsMap) domFn(el, key, value);
      }
    }
    isFunction(cleanup) && (cleanup as () => void)();
  });
  next.targets = targets;
  next();
}

/**
 * Recursivlely unwrap a given variable if it is a function
 * 
 * @since 0.7.0
 * @param {unknown} value
 * @returns {unknown} unwrapped variable
 */
const unwrap = (value: unknown): unknown => isFunction(value) ? unwrap((value as () => unknown)()) : value;

/**
 * Parse a boolean attribute to an actual boolean value
 * 
 * @since 0.7.0
 * @param {string|undefined} value 
 * @returns {boolean}
 */
const asBoolean = (value: string | undefined): boolean => typeof value === 'string';

/**
 * Parse an attribute to a number forced to integer
 * 
 * @since 0.7.0
 * @param {string} value 
 * @returns {number}
 */
const asInteger = (value: string): number => parseInt(value, 10);

/**
 * Parse an attribute to a number
 * 
 * @since 0.7.0
 * @param {string} value 
 * @returns {number}
 */
const asNumber = (value: string): number => parseFloat(value);

/**
 * Parse an attribute to a string
 * 
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
const asString = (value: string): string => value;

/**
 * Class for context-request events
 * 
 * @class ContextRequestEvent
 * @extends {Event}
 * 
 * @property {PropertyKey} context - context key
 * @property {ContextCallback<FxState>} callback - callback function for value getter and unsubscribe function
 * @property {boolean} [subscribe=false] - whether to subscribe to context changes
 */
class ContextRequestEvent<PropertyKey, FxState> extends Event {
  context: PropertyKey;
  callback: ContextCallback<FxState>;
  subscribe: boolean;

  /**
   * @param {PropertyKey} context - context key
   * @param {ContextCallback<FxState>} callback - callback for value getter and unsubscribe function
   * @param {boolean} [subscribe=false] - whether to subscribe to context changes
   */
  constructor(context: PropertyKey, callback: ContextCallback<FxState>, subscribe: boolean = false) {
    super(CONTEXT_REQUEST, { bubbles: true, cancelable: true, composed: true });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

/* === Default export === */

/**
 * Base class for reactive custom elements
 * 
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
class UIElement extends HTMLElement {

  /**
   * Define a custom element in the custom element registry
   * 
   * @since 0.5.0
   * @param {string} tag - name of the custom element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  static define(tag: string, registry: CustomElementRegistry = customElements) {
    try {
      registry.get(tag) || registry.define(tag, this);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * @since 0.5.0
   * @property
   * @type {AttributeMap}
   */
  attributeMap: AttributeMap = {};

  /**
   * @since 0.7.0
   * @property
   * @type {ContextMap}
   */
  contextMap: ContextMap = {};

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #states = new Map();

  // @private hold map of published contexts to subscribers (context consumers)
  #publishedContexts = new Map();

  // @private hold map of subscribed contexts to publishers (context providers)
  #subscribedContexts = new Map();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string|undefined} old - old value of the modified attribute
   * @param {string|undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined) {
    if (value !== old) {
      const input = this.attributeMap[name];
      const [key, parser] = Array.isArray(input) ? input : [name, input];
      this.set(key, isFunction(parser) ? parser(value, this, old) : value);
    }
  }

  connectedCallback() {
    const proto = Object.getPrototypeOf(this);

    // context provider
    const provided = proto.providedContexts || [];
    const published = this.#publishedContexts;
    if (provided.length) {

      // listen to context request events and add subscribers
      this.addEventListener(CONTEXT_REQUEST, (e: ContextRequestEvent<PropertyKey, FxState>) => {
        const { target, context, callback, subscribe } = e;
        if (!provided.includes(context) || !isFunction(callback)) return;
        e.stopPropagation();
        const value = this.#states.get(context);
        if (subscribe) {
          const subscribers = nestMap(published, context);
          !subscribers.has(target) && subscribers.set(target, callback);
          callback(value, () => subscribers.delete(target));
        } else {
          callback(value);
        }
      });

      // context change effects
      provided.forEach((context: PropertyKey) => {
        effect(() => {
          const subscribers = published.get(context);
          const value = this.#states.get(context);
          for (const [target, callback] of subscribers) callback(value, () => subscribers.delete(target));
        });
      });
    }

    // context consumer
    setTimeout(() => { // wait for all custom elements to be defined
      proto.consumedContexts?.forEach((context: PropertyKey) => {
        const callback = (value: FxState, unsubscribe: () => void) => {
          this.#subscribedContexts.set(context, unsubscribe);
          const input = this.contextMap[context];
          const [key, fn] = Array.isArray(input) ? input : [context, input];
          this.#states.set(key || context, isFunction(fn) ? (fn as (value: unknown) => void)(value) : value);
        };
        const event = new ContextRequestEvent(context, callback, true);
        this.dispatchEvent(event);
      });
    });
  }

  /**
   * Check whether a state is set
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to be checked
   * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
   */
  has(key: PropertyKey): boolean {
    return this.#states.has(key);
  }

  /**
   * Get the current value of a state
   *
   * @since 0.2.0
   * @param {PropertyKey} key - state to get value from
   * @returns {unknown} current value of state; undefined if state does not exist
   */
  get(key: PropertyKey): unknown {
    return unwrap(this.#states.get(key));
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {unknown} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   */
  set(key: PropertyKey, value: unknown | FxState, update: boolean = true) {
    if (this.#states.has(key)) {
      const state = this.#states.get(key);
      update && isFunction(state.set) && state.set(value);
    } else {
      const state = isFunction(value) && isFunction((value as FxState).set) ? value : cause(value);
      this.#states.set(key, state);
    }
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
   */
  delete(key: PropertyKey): boolean {
    return this.#states.delete(key);
  }

  /**
   * Passes states from the current UIElement to another UIElement
   * 
   * @since 0.5.0
   * @param {UIElement} element - child element to pass the states to
   * @param {FxStateMap} states - object of states to be passed
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  async pass(element: UIElement, states: FxStateMap, registry: CustomElementRegistry = customElements) {
    await registry.whenDefined(element.localName);
    for (const [key, source] of Object.entries(states)) {
      element.set(key, cause(isFunction(source) ? source : this.#states.get(source)));
    }
  }

  /**
   * Return a Set of elements that have effects dependent on the given state
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to get targets for
   * @returns {Set<Element>} set of elements that have effects dependent on the given state
   */
  targets(key: PropertyKey): Set<Element> {
    const targets = new Set<Element>();
    for (const effect of this.#states.get(key).effects) {
      for (const target of effect.targets.keys()) targets.add(target);
    }
    return targets;
  }

}

export { UIElement as default, effect, unwrap, asBoolean, asInteger, asNumber, asString, ContextRequestEvent };