import { type UIState, isFunction, isState, cause } from "./cause-effect";
import { Context, CONTEXT_REQUEST, ContextRequestEvent } from "./context-request";

/* === Types === */

type UIAttributeParser = ((
  value: unknown | undefined,
  element?: HTMLElement,
  old?: unknown | undefined,
) => unknown) | undefined;

type UIMappedAttributeParser = [PropertyKey, UIAttributeParser];

type UIAttributeMap = Record<string, UIAttributeParser | UIMappedAttributeParser>;

type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>;

type UIContextParser = ((
  value: unknown | undefined,
  element?: HTMLElement
) => unknown) | undefined;

type UIMappedContextParser = [PropertyKey, UIContextParser];

type UIContextMap = Record<PropertyKey, UIContextParser | UIMappedContextParser>;

type UIStateContext = Context<PropertyKey, UIState<unknown>>;

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

/* === Internal function === */

/**
 * Parse a attribute or context mapping value into a key-value pair
 * 
 * @param {[PropertyKey, UIAttributeParser | UIContextParser] | UIAttributeParser | UIContextParser} value 
 * @param {PropertyKey} defaultKey 
 * @returns {[PropertyKey, UIAttributeParser | UIContextParser]}
 */
const getArrayMapping = (
  value: [PropertyKey, UIAttributeParser | UIContextParser] | UIAttributeParser | UIContextParser,
  defaultKey: PropertyKey
): [PropertyKey, UIAttributeParser | UIContextParser] => {
  return Array.isArray(value) ? value : [defaultKey, isFunction(value) ? value : (v: unknown): unknown => v];
};

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
  #states = new Map();

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
    if (value !== old) {
      const input = this.attributeMap[name];
      const [key, fn] = getArrayMapping(input, name);
      this.set(key, isFunction(fn)
        ? fn(value, this, old)
        : value
      );
    }
  }

  connectedCallback(): void {
    const proto = Object.getPrototypeOf(this);

    // context provider: listen to context request events
    const provided = proto.providedContexts || [];
    if (provided.length) {
      this.addEventListener(CONTEXT_REQUEST, (e: ContextRequestEvent<UIStateContext>) => {
        const { context, callback } = e;
        if (!provided.includes(context) || !isFunction(callback)) return;
        e.stopPropagation();
        callback(this.#states.get(context));
      });
    }

    // context consumer
    setTimeout(() => { // wait for all custom elements to be defined
      proto.consumedContexts?.forEach((context: UIStateContext) => {
        const event = new ContextRequestEvent(context, (value: UIState<unknown>) => {
          const input = this.contextMap[context];
          const [key, fn] = getArrayMapping(input, context);
          this.#states.set(key || context, isFunction(fn)
            ? fn(value, this)
            : value
          );
        });
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
    const unwrap = (value: unknown): unknown => isFunction(value)
      ? unwrap(value())
      : value;
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
  set(
    key: PropertyKey,
    value: unknown | UIState<unknown>,
    update: boolean = true
  ): void {
    if (this.#states.has(key)) {
      const state = this.#states.get(key);
      update && isState(state) && state.set(value);
    } else {
      const state = isState(value)
        ? value
        : cause(value);
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
      element.set(key, cause(isFunction(source)
        ? source
        : this.#states.get(source)
      ));
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
      for (const target of effect.targets.keys())
        targets.add(target);
    }
    return targets;
  }

}

export { type UIStateMap, type UIAttributeMap, type UIContextMap, UIElement as default };