/* === Types === */
/* === Exported Functions === */
const isOfType = (type) => (value) => typeof value === type;
const isObject = isOfType('object');
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const isFunction = isOfType('function');
const isDefined = (value) => value != null;
const isDefinedObject = (value) => isDefined(value) && (isObject(value) || isFunction(value));
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const hasMethod = (obj, name) => isFunction(obj[name]);

/* === Internal === */
// hold the currently active effect
let activeEffect;
/**
 * Run all effects in the provided set
 *
 * @param {Set<Effect | Computed<unknown>>} effects
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
const isState = (value) => isDefinedObject(value) && hasMethod(value, 'set');
/**
 * Check if a given variable is a reactive computed state
 *
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value) => isDefinedObject(value) && hasMethod(value, 'run') && 'effects' in value;
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value) => isState(value) || isComputed(value);
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const s = () => {
        if (activeEffect)
            s.effects.add(activeEffect);
        return value;
    };
    s.effects = new Set(); // set of listeners
    s.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isSignal(updater) ? updater(value) : updater;
        if (!Object.is(value, old))
            autorun(s.effects);
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
        if (activeEffect)
            c.effects.add(activeEffect);
        if (memo && !dirty)
            return value;
        const prev = activeEffect;
        activeEffect = c;
        value = fn();
        dirty = false;
        activeEffect = prev;
        return value;
    };
    c.effects = new Set(); // set of listeners
    c.run = () => {
        dirty = true;
        if (memo)
            autorun(c.effects);
    };
    return c;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Map();
    const n = () => {
        const prev = activeEffect;
        activeEffect = n;
        const cleanup = fn((element, domFn) => {
            if (!targets.has(element))
                targets.set(element, new Set());
            targets.get(element)?.add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn.run();
            domFns.clear();
        }
        activeEffect = prev;
        if (isFunction(cleanup))
            queueMicrotask(cleanup);
    };
    n.run = () => n();
    n.targets = targets;
    n();
};

export { cause, derive, effect, isSignal, isState };
