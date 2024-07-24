import { type UIState, isFunction, isState, cause } from "./cause-effect";
import { type UnknownContext, CONTEXT_REQUEST, ContextRequestEvent } from "./context-request";

/* === Types === */

type UIAttributeParser = ((
  value: string | undefined,
  element?: HTMLElement,
  old?: string | undefined,
) => unknown);

type UIMappedAttributeParser = [PropertyKey, UIAttributeParser];

type UIAttributeMap = Record<string, UIAttributeParser | UIMappedAttributeParser>;

type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>;

type UIContextParser = ((
  value: unknown | undefined,
  element?: HTMLElement
) => unknown);

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

/* === Internal function === */

/**
 * Parse a attribute or context mapping value into a key-value pair
 * 
 * @param {[PropertyKey, T] | T} value 
 * @param {PropertyKey} defaultKey 
 * @returns {[PropertyKey, T]}
 */
const getArrayMapping = <T extends Function>(
  value: [PropertyKey, T] | T,
  defaultKey: PropertyKey
): [PropertyKey, T | ((v: unknown) => unknown)] =>
  Array.isArray(value) ? value : [defaultKey, (isFunction(value) ? value : (v: unknown): unknown => v)];

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
  static define(
    tag: string,
    registry: CustomElementRegistry = customElements
  ): void {
    try {
      registry.get(tag) || registry.define(tag, this);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * @since 0.5.0
   * @property
   * @type {UIAttributeMap}
   */
  attributeMap: UIAttributeMap = {};

  /**
   * @since 0.7.0
   * @property
   * @type {UIContextMap}
   */
  contextMap: UIContextMap = {};

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #states = new Map<PropertyKey, UIState<unknown>>();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string|undefined} old - old value of the modified attribute
   * @param {string|undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(
    name: string,
    old: string | undefined,
    value: string | undefined
  ): void {
    if (value === old) return;
    const [key, fn] = getArrayMapping(this.attributeMap[name], name);
    this.set(key, isFunction(fn) ? fn(value, this, old) : value);
  }

  connectedCallback(): void {
    const proto = Object.getPrototypeOf(this);

    // context consumer
    setTimeout(() => { // wait for all custom elements to be defined
      proto.consumedContexts?.forEach((context: UnknownContext) => {
        const event = new ContextRequestEvent(context, (value: unknown) => {
          if (typeof context !== 'string') return;
          const [key, fn] = getArrayMapping(this.contextMap[context], context);
          this.set(key || context, isFunction(fn) ? fn(value, this) : value);
        });
        this.dispatchEvent(event);
      });
    });

    // context provider: listen to context request events
    const provided = proto.providedContexts || [];
    if (!provided.length) return;
    this.addEventListener(CONTEXT_REQUEST, (e: ContextRequestEvent<UnknownContext>) => {
      const { context, callback } = e;
      if (!(typeof context === 'string') || !provided.includes(context) || !isFunction(callback)) return;
      e.stopPropagation();
      callback(this.#states.get(context));
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
  get(key: PropertyKey) {
    const unwrap = (value: unknown | (() => unknown) | UIState<unknown>): unknown => 
      isFunction(value) ? unwrap(value()) : value;
    return unwrap(this.#states.get(key));
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {V | ((old: V | undefined) => V) | UIState<V>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   */
  set<V>(
    key: PropertyKey,
    value: V | ((old: V | undefined) => V) | UIState<V>,
    update: boolean = true
  ): void {
    if (this.#states.has(key)) {
      const state = this.#states.get(key);
      update && isState(state) && state.set(value);
    } else {
      this.#states.set(key, isState(value) ? value : cause(value));
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
   * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  async pass(
    element: UIElement,
    states: UIStateMap,
    registry: CustomElementRegistry = customElements
  ): Promise<void> {
    await registry.whenDefined(element.localName);
    for (const [key, source] of Object.entries(states))
      element.set(key, cause(isFunction(source) ? source : this.#states.get(source)));
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
    const state = this.#states.get(key);
    if (!state || !state.effects) return targets;
    for (const effect of state.effects) {
      const t = effect.targets?.keys();
      if (t) for (const target of t)
        targets.add(target);
    }
    return targets;
  }

}

export { type UIStateMap, type UIAttributeMap, type UIContextMap, UIElement as default };