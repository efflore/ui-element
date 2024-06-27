// hold the currently active effect
let active;

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("../types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const sources = new WeakMap();
  const targets = (/** @type {import("../types").Signal<any>} */ signal) => {
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
      value = (typeof updater === 'function') ? updater(old) : updater;
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
 * @returns {import("../types").Computed<any>} signal object with `get` method
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

/**
 * Define what happens when a signal changes
 * 
 * @since 0.1.0
 * @param {() => void} fn - callback function to be executed when a signal changes
 */
const effect = fn => derive(fn).get();

export { cause, derive, effect };