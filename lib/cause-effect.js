/**
 * Check if a given variable is a function
 * 
 * @param {any} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

// hold the currently active effect
let computing;

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("../types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const reactivityMap = new WeakMap();
  const getTargets = (/** @type {import("../types").Signal<any>} */ signal) => {
    !reactivityMap.has(signal) && reactivityMap.set(signal, new Set());
    return reactivityMap.get(signal);
  };
  const state = {
    get: () => {
      computing && getTargets(state).add(computing);
      return value;
    },
    set: (/** @type {any} */ updater) => {
      const old = value;
      value = isFunction(updater) ? updater(old) : updater;
      if (!Object.is(value, old)) {
        for (const target of getTargets(state)) target.get();
      }
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