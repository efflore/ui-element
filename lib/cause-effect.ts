/* === Types === */

export type FxEffect = {
  (): void;
};

export type FxState = {
  (): unknown;
  effects?: Set<FxEffect>;
  set?(value: unknown): void;
}

export type FxMaybeCleanup = void | (() => void);

export type FxEffectCallback = () => FxMaybeCleanup;

/* === Internal === */

// hold the currently active effect
let active: FxEffect | undefined;

/* === Exported === */

/**
 * Check if a given variable is a function
 * 
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = (fn: unknown): boolean => typeof fn === 'function';

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {unknown} value - initial value of the state; may be a function for derived state
 * @returns {FxState} getter function for the current value with a `set` method to update the value
 */
const cause = (value: unknown): FxState => {
  const state = () => { // getter function
    active && state.effects.add(active);
    return value;
  };
  state.effects = new Set<FxEffect>(); // set of listeners
  state.set = (updater: unknown) => { // setter function
    const old = value;
    value = isFunction(updater) && !isFunction((value as FxState).set) ? (updater as (old: unknown) => unknown)(old) : updater;
    if (!Object.is(value, old)) {
      for (const effect of state.effects) effect();
    }
  };
  return state;
};

const derive = (fn: () => any) => fn();

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {FxEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: FxEffectCallback) => {
  const next = () => queueMicrotask(() => { 
    const prev = active;
    active = next;
    const cleanup = fn();
    active = prev;
    isFunction(cleanup) && (cleanup as () => void)();
  });
  next();
}

export { cause, derive, effect };