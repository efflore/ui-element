/* === Types === */

type FxDOMInstruction = (element: Element, key: unknown, value?: unknown) => unknown;

type FxDOMInstructionMap = Map<FxDOMInstruction, Map<unknown, unknown>>;

type FxEffect = {
  (): void;
  targets: Map<Element, FxDOMInstructionMap>
};

type FxState = {
  (): unknown;
  effects: Set<FxEffect>;
  set(value: unknown): void;
}

type FxDOMInstructionQueue = (element: Element, domFn: FxDOMInstruction, key: unknown, value: unknown) => void;

type FxMaybeCleanup = void | (() => void);

type FxEffectCallback = (queue: FxDOMInstructionQueue) => FxMaybeCleanup;

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
const isFunction = (fn: unknown): fn is Function => typeof fn === 'function';

/**
 * Check if a given variable is a reactive state
 * 
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value: unknown): value is FxState => isFunction(value) && isFunction((value as FxState).set);

/**
 * Recursively nest a map
 * 
 * @param {Map<unknown, unknown>} map - map to nest
 * @param {...unknown} args - key(s) to nest the map under
 * @returns {Map<unknown, unknown>} nested map
 */
const nestMap = (map: Map<unknown, unknown>, ...args: unknown[]): Map<unknown, unknown> => {
  const key = args.shift();
  !map.has(key) && map.set(key, new Map<unknown, unknown>());
  const submap = map.get(key) as Map<unknown, unknown>;
  return args.length ? nestMap(submap, ...args) : submap;
}

/**
 * Create a new DOM instruction queue
 * 
 * @returns {[Map<Element, FxDOMInstructionMap>, FxDOMInstructionQueue]} - tuple containing the targets map and a function to enqueue DOM instructions
 */
const queue = (): [Map<Element, FxDOMInstructionMap>, FxDOMInstructionQueue, () => void] => {
  const targets = new Map<Element, FxDOMInstructionMap>();
  const enqueue: FxDOMInstructionQueue = (element: Element, domFn: FxDOMInstruction, key: unknown, value: unknown) => {
    nestMap(targets, element, domFn).set(key, value);
  };
  const flush = () => {
    for (const [el, domFns] of targets) {
      for (const [domFn, argsMap] of domFns) {
        for (const [key, value] of argsMap) domFn(el, key, value);
      }
    }
  };
  return [targets, enqueue, flush];
};

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
    value = isFunction(updater) && !isState(updater) ? (updater as (old: unknown) => unknown)(old) : updater;
    if (!Object.is(value, old)) {
      for (const effect of state.effects) effect();
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
  const [targets, enqueue, flush] = queue();
  const next = () => {
    const prev = active;
    active = next;
    const cleanup = fn(enqueue);
    active = prev;
    queueMicrotask(() => {
      flush();    
      isFunction(cleanup) && cleanup();
    });
  };
  next.targets = targets;
  next();
}

export { type FxState, isFunction, isState, nestMap, cause, derive, effect };