/* === Types === */
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
 * Check if a given variable is a function
 *
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = (fn) => typeof fn === 'function';
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value) => isFunction(value) && isFunction(value.set);
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const state = () => {
        active && state.effects.add(active);
        return value;
    };
    state.effects = new Set(); // set of listeners
    state.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isState(updater)
            ? updater(old)
            : updater;
        !Object.is(value, old) && autorun(state.effects);
    };
    return state;
};
/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => any} fn - existing state to derive from
 * @returns {UIEffect} derived state
 */
const derive = (fn) => {
    let value;
    const computed = () => {
        const prev = active;
        active = computed;
        value = fn();
        active = prev;
        return value;
    };
    computed.effects = new Set(); // set of listeners
    computed.run = () => autorun(computed.effects);
    return computed;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Map();
    const next = () => {
        const prev = active;
        active = next;
        const cleanup = fn((element, domFn) => {
            !targets.has(element) && targets.set(element, new Set());
            targets.get(element).add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn();
        }
        active = prev;
        isFunction(cleanup) && queueMicrotask(cleanup);
    };
    next.run = () => next();
    next.targets = targets;
    next();
};

export { cause, derive, effect, isFunction, isState };
