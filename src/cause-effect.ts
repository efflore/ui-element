import { isFunction, isState } from './utils';

/* === Types === */

type FxDOMInstructionSet = Set<() => void>;

type FxEffect = {
  (): void;
  targets: Map<Element, FxDOMInstructionSet>
};

type FxState = {
  (): unknown;
  effects: Set<FxEffect>;
  set(value: unknown): void;
}

type FxDOMInstructionQueue = (
  element: Element,
  fn: () => void
) => void;

type FxMaybeCleanup = void | (() => void);

type FxEffectCallback = (enqueue: FxDOMInstructionQueue) => FxMaybeCleanup;

/* === Internal === */

// hold the currently active effect
let active: FxEffect | undefined;

/* === Exported functions === */

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
    value = isFunction(updater) && !isState(updater)
      ? updater(old)
      : updater;
    if (!Object.is(value, old)) {
      for (const effect of state.effects)
        effect();
    }
  };
  return state;
};

/**
 * Create a derived state from an existing state
 * 
 * @since 0.1.0
 * @param {() => unknown} fn - existing state to derive from
 * @returns {() => unknown} derived state
 */
const derive = (fn: () => unknown): (() => unknown) => fn;

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {FxEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: FxEffectCallback) => {
  const targets = new Map<Element, FxDOMInstructionSet>();
  const next = () => {
    const prev = active;
    active = next;
    const cleanup = fn((
      element: Element,
      domFn: () => void
    ): void => {
      !targets.has(element) && targets.set(element, new Set<() => void>());
      targets.get(element).add(domFn);
    });
    active = prev;
    queueMicrotask(() => {
      for (const domFns of targets.values()) {
        for (const domFn of domFns)
          domFn();
      }   
      isFunction(cleanup) && cleanup();
    });
  };
  next.targets = targets;
  next();
}

export { type FxState, cause, derive, effect };