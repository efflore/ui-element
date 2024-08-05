/* === Exported Functions === */
const is = (type) => (value) => typeof value === type;
const isFunction = is('function');

/* === Exported Functions === */
/**
 * Unwrap any value wrapped in a function
 *
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value
 */
const unwrap = (value) => isFunction(value) ? unwrap(value()) : value;
/**
 * Check if a given value is a container function
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function
 */
const isAnyContainer = (value) => isFunction(value) && 'type' in value;
/**
 * Check if an object has a method of given name
 */
const hasMethod = (obj, methodName) => obj && isFunction(obj[methodName]);
/**
 * Check if a given value is a functor
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
const isFunctor = (value) => isAnyContainer(value) && hasMethod(value, 'map');

/* === Constants === */
/* const TYPE_STATE = 'state'
const TYPE_COMPUTED = 'computed'
const TYPE_EFFECT = 'effect' */
/* === Internal === */
// hold the currently active effect
let active;
/**
 * Run all effects in the provided set
 *
 * @param {Set<UIEffects>} effects
 */
const autorun = (effects) => {
    for (const effect of effects)
        effect.run();
};
/* === Exported functions === */
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value) => isFunction(value) && hasMethod(value, 'set');
/**
 * Check if a given variable is a reactive computed state
 *
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value) => isFunction(value) && hasMethod(value, 'run') && 'effects' in value;
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value) => isState(value) || isComputed(value);
/**
 * Check if a given variable is a reactive effect
 *
 * @param {unknown} value - variable to check if it is a reactive effect
 * /
const isEffect = (value: unknown): value is UIEffect => isContainer(TYPE_EFFECT, value)

/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<unknown>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const s = () => {
        active && s.effects.add(active);
        return value;
    };
    // s.type = TYPE_STATE
    s.effects = new Set(); // set of listeners
    s.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isAnyContainer(updater)
            ? isFunctor(value)
                ? value.map(updater)
                : updater(value)
            : updater;
        !Object.is(unwrap(value), unwrap(old)) && autorun(s.effects);
    };
    return s;
};
/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => T} fn - existing state to derive from
 * @param {boolean} [memo=false] - whether to use memoization
 * @returns {UIComputed<T>} derived state
 */
const derive = (fn, memo = false) => {
    let value;
    let dirty = true;
    const c = () => {
        active && c.effects.add(active);
        if (memo && !dirty)
            return value;
        const prev = active;
        active = c;
        value = fn();
        dirty = false;
        active = prev;
        return value;
    };
    // c.type = TYPE_COMPUTED
    c.effects = new Set(); // set of listeners
    c.run = () => {
        dirty = true;
        memo && autorun(c.effects);
    };
    return c;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Map();
    const n = () => {
        const prev = active;
        active = n;
        const cleanup = fn((element, domFn) => {
            !targets.has(element) && targets.set(element, new Set());
            targets.get(element)?.add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn();
            domFns.clear();
        }
        active = prev;
        isFunction(cleanup) && queueMicrotask(cleanup);
    };
    // n.type = TYPE_EFFECT
    n.run = () => n();
    n.targets = targets;
    n();
};

export { cause, derive, effect, isSignal, isState };
