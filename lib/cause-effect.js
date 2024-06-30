// hold the currently active effect
let active;

/**
 * Define a state and return an function to get the current value of the state and a method to update the state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {() => (() => any)} state getter function with `set()` method to update
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const s = () => {
    active && s.e.add(active);
    return value;
  };
  s.e = new Set();
  s.set = (/** @type {any} */ updater) => {
    const old = value;
    value = (typeof updater === 'function') ? updater(old) : updater;
    if (!Object.is(value, old)) {
      for (const effect of s.e) effect();
    }
  };
  return s;
};

/**
 * Define a derived signal and return the getter / effect function
 * 
 * @since 0.4.0
 * @param {() => any} fn - computation function to be called
 * @returns {() => any} function to be called when the signal changes
 * @see https://github.com/tc39/proposal-signals/
 */
const derive = fn => {
  const c = () => {
    const prev = active;
    active = c;
    const value = fn();
    active = prev;
    return value;
  };
  return c;
};

/**
 * Define what happens when a signal changes
 * 
 * @since 0.1.0
 * @param {() => void} fn - callback function to be executed when a signal changes
 */
const effect = fn => derive(fn).call();

export { cause, derive, effect };