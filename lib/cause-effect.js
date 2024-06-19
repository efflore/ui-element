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
 * @returns {import("../types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const getPending = (/** @type {import("../types").State<any>} */ state) => {
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
      !Object.is(value, old) && getPending(state).forEach((/** @type {import("../types").Computed<any>} */ computed) => computed.get());
    }
  };
  return state;
};

/**
 * Define a derived state and return an object duck-typing Signal.Computed instances
 * 
 * @since 0.4.0
 * @param {() => any} fn - computation function to be called
 * @returns {import("../types").Computed<any>} state object with `get` method
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

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {() => void} fn - callback function to be executed when a state changes
 */
const effect = fn => derive(fn).get();

export { cause, derive, effect };