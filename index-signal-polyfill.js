import { Signal } from "signal-polyfill";

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
 * @param {Array} args - arguments to pass to `fn.call()`; defaults to empty array (called with null `this` without arguments)
 * @param {any} fallback - value to return if the supplied function is not a function; defaults to the not-a-function first parameter
 * @returns {any} value returned by the supplied function if it is a function; otherwise returns the fallback value
 */
const maybeCall = (fn, args = [], fallback = fn) => isFunction(fn) ? fn.call(...args) : fallback;

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement
 * 
 * @class
 * @extends HTMLElement
 */
export default class extends HTMLElement {

  /**
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
   * @param {any} key - state to be checked
   * @returns {boolean} `true` if this element has state with the passed key; `false` otherwise
   */
  has(key) {
    return this.#state.has(key);
  }

  /**
   * Get the current value of a state
   *
   * @since 0.2.0
   * @param {any} key - state to get value from
   * @returns {any} current value of state; undefined if state does not exist
   */
  get(key) {
    return this.#state.get(key)?.get();
  }

  /**
   * Create a state or update its value
   * 
   * @since 0.2.0
   * @param {any} key - state to set value to
   * @param {any} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   * @returns {any} current value of state; undefined if state does not exist
   */
  set(key, value, update = true) {
    return this.#state.has(key)
      ? update ? maybeCall(this.#state.get(key).set, [this.#state.get(key), value]) : this.#state.get(key) // update state value
      : this.#state.set(key, isFunction(value) ? new Signal.Computed(value) : new Signal.State(value)); // create state
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {any} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if the state if ignored
   */
  delete(key) {
    return this.#state.delete(key);
  }

  /**
   * Define what happens when a reactive state changes
   * 
   * @since 0.1.0
   */
  effect(callback) {
    // wait for the next animation frame to bundle DOM updates
    requestAnimationFrame(() => {
      let cleanup;
      let needsEnqueue = true;
      const watcher = new Signal.subtle.Watcher(() => {
        if (needsEnqueue) {
          needsEnqueue = false;
          queueMicrotask(() => {
            needsEnqueue = true;
            for (const signal of watcher.getPending()) signal.get();
            watcher.watch();
          });
        }
      });
      const computed = new Signal.Computed(() => {
        isFunction(cleanup) && cleanup();
        cleanup = callback();
      });
      watcher.watch(computed);
      computed.get();
      return () => {
        watcher.unwatch(computed);
        isFunction(cleanup) && cleanup();
        cleanup = undefined;
      };
    });
  }

  /**
   * Define a custom element in the custom element registry
   * 
   * @since 0.5.0
   * @param {string} tag - name of the custom element
   * @param {CustomElementConstructor} el - constructor of the custom element
   */
  define(tag, el) {
    try {
      customElements.get(tag) || customElements.define(tag, el);
    } catch (err) {
      console.error(err);
    }
  }

}
