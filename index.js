/**
 * @name UIElement
 * @version 0.5.0
 */

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is a function
 * 
 * @param {any} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

// hold the currently active effect
let active;

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("./types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const sources = new WeakMap();
  const targets = (/** @type {import("./types").Signal<any>} */ signal) => {
    !sources.has(signal) && sources.set(signal, new Set());
    return sources.get(signal);
  };
  const state = {
    get: () => {
      active && targets(state).add(active);
      return value;
    },
    set: (/** @type {any} */ updater) => {
      const old = value;
      value = isFunction(updater) ? updater(old) : updater;
      if (!Object.is(value, old)) {
        for (const target of targets(state)) target.get();
      }
    }
  };
  return state;
};

/**
 * Define a derived signal and return an object duck-typing Signal.Computed instances
 * 
 * @since 0.4.0
 * @param {() => any} fn - computation function to be called
 * @returns {import("./types").Computed<any>} signal object with `get` method
 * @see https://github.com/tc39/proposal-signals/
 */
const derive = fn => {
  const computed = {
    get: () => {
      const prev = active;
      active = computed;
      const value = fn();
      active = prev;
      return value;
    }
  };
  return computed;
};

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement
 * 
 * @class
 * @extends HTMLElement
 * @type {import("./types").UIElement}
 */
export default class extends HTMLElement {

  /**
   * Define a custom element in the custom element registry
   * 
   * @since 0.5.0
   * @param {string} tag - name of the custom element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  static define(tag, registry = customElements) {
    try {
      registry.get(tag) || registry.define(tag, this);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * @since 0.5.0
   * @property
   * @type {Map<string, import("./types").AttributeParser|import("./types").MappedAttributeParser>}
   */
  attributeMap;

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #state = new Map();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string|undefined} old - old value of the modified attribute
   * @param {string|undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(name, old, value) {
    if (value !== old) {
      const input = this.attributeMap?.get(name);
      const [key, type] = Array.isArray(input) ? input : [name, input];
      const parser = {
        boolean: (/** @type {string|undefined} */ v) => typeof v === 'string' ? true : false,
        integer: (/** @type {string} */ v) => parseInt(v, 10),
        number: (/** @type {string} */ v) => parseFloat(v),
      };
      const fn = isFunction(type) ? type : parser[type];
      this.set(key, fn ? fn(value, old) : value);
    }
  }

  /**
   * Check whether a state is set
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to be checked
   * @returns {boolean} `true` if this element has state with the passed key; `false` otherwise
   */
  has(key) {
    return this.#state.has(key);
  }

  /**
   * Get the current value of a state
   *
   * @since 0.2.0
   * @param {PropertyKey} key - state to get value from
   * @returns {any} current value of state; undefined if state does not exist
   */
  get(key) {
    return this.#state.get(key)?.get();
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {any} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   */
  set(key, value, update = true) {
    if (this.#state.has(key)) {
      const state = this.#state.get(key);
      update && isFunction(state.set) && state.set(value);
    } else {
      const state = (typeof value === 'object') && isFunction(value?.get)
        ? value
        : isFunction(value) ? derive(value) : cause(value);
      this.#state.set(key, state);
    }
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
   */
  delete(key) {
    return this.#state.delete(key);
  }

  /**
   * Pass states to a child element
   * 
   * @since 0.5.0
   * @param {import("./types").UIElement} element - child element to pass the states to
   * @param {Map<PropertyKey, PropertyKey | (() => any)>} [states] - set of states to be passed
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  pass(element, states, registry = customElements) {
    (async () => {
      await registry.whenDefined(element.localName);
      for (const [key, source] of states) {
        element.set(key, isFunction(source) ? { get: source } : this.#state.get(source));
      }
    })();
  }

  /**
   * Define what happens when a reactive state changes
   * 
   * @since 0.1.0
   * @param {() => (() => void) | void} fn - callback function to be executed when a state changes
   */
  effect(fn) {
    // wait for the next animation frame to bundle DOM updates
    requestAnimationFrame(() => {
      const cleanup = derive(fn).get();
      isFunction(cleanup) && cleanup();
    });
  }

}
