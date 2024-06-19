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

/**
 * Call a function if it is a function; otherwise return the fallback value
 * 
 * @param {any} fn - variable to check if it is a function
 * @param {Array} [args=[]] - arguments to pass to `fn.call()`; defaults to empty array (called with null `this` without arguments)
 * @param {any} [fallback=fn] - value to return if the supplied function is not a function; defaults to the not-a-function first parameter
 * @returns {any} value returned by the supplied function if it is a function; otherwise returns the fallback value
 */
const maybeCall = (fn, args = [], fallback = fn) => isFunction(fn) ? fn.call(...args) : fallback;

// hold the currently active effect
let computing;

// set up an empty WeakMap to hold the watched states mapped to their targets
const watcher = new WeakMap();

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("./types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const getPending = (/** @type {import("./types").State<any>} */ state) => {
    !watcher.has(state) && watcher.set(state, new Set());
    return watcher.get(state);
  };
  const state = {
    get: () => {
      computing && getPending(state).add(computing);
      return value;
    },
    set: (/** @type {any} */ updater) => {
      const old = value;
      value = maybeCall(updater, [state, old], updater);
      !Object.is(value, old) && getPending(state).forEach((/** @type {import("./types").Computed<any>} */ computed) => computed.get());
    }
  };
  return state;
};

/**
 * Define a derived state and return an object duck-typing Signal.Computed instances
 * 
 * @since 0.4.0
 * @param {() => any} fn - computation function to be called
 * @returns {import("./types").Computed<any>} state object with `get` method
 * @see https://github.com/tc39/proposal-signals/
 */
const derive = fn => {
  const computed = {
    get: () => {
      const prev = computing;
      computing = computed;
      const value = fn();
      computing = prev;
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
      this.set(key, maybeCall(isFunction(type) ? type : parser[type], [this, value, old], value));
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
   * @returns {any} current value of state
   */
  set(key, value, update = true) {
    const state = this.#state.get(key);
    const create = () => {
      this.#state.set(key, isFunction(value) ? derive(value) : cause(value));
      !Object.prototype.hasOwnProperty.call(this, key) && Object.defineProperty(this, key, {
        get: () => this.#state.get(key)?.get(),
        set: (/** @type {any} */ value) => {
          const state = this.#state.get(key);
          maybeCall(state.set, [state, value]);
        },
        configurable: true,
        enumerable: true,
      });
    }
    this.#state.has(key) ? update && maybeCall(state.set, [state, value]) : create();
    return state?.get();
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if the state if ignored
   */
  delete(key) {
    delete this[key];
    return this.#state.delete(key);
  }

  /**
   * Define what happens when a reactive state changes
   * 
   * @since 0.1.0
   * @param {() => (() => void) | void} fn - callback function to be executed when a state changes
   */
  effect(fn) {
    requestAnimationFrame(() => derive(fn).get());  // wait for the next animation frame to bundle DOM updates
  }

}
