// hold the currently active effect
let computing;

// set up an empty WeakMap to hold the reactivity map
const reactivityMap = new WeakMap();

/**
 * Get the set of targets dependent on a state from the reactivity map
 * 
 * @param {import("../types").State<any>} state - state object as key for the lookup
 * @returns {Set} set of targets associated with the state
 */
const getTargets = state => {
  !reactivityMap.has(state) && reactivityMap.set(state, new Set());
  return reactivityMap.get(state);
};

/* === Public API === */

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("../types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const s = {
    get: () => {
      computing && getTargets(s).add(computing);
      return value;
    },
    set: (/** @type {any} */ updater) => {
      const old = value;
      value = typeof updater === 'function' ? updater(old) : updater;
      !Object.is(value, old) && getTargets(s).forEach(t => t.get());
    }
  };
  return s;
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
  const d = {
    get: () => {
      const prev = computing;
      computing = d;
      const value = fn();
      computing = prev;
      return value;
    }
  };
  return d;
};

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {() => void} fn - callback function to be executed when a state changes
 */
const effect = fn => derive(fn).get();

export { cause, derive, effect };