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

/* === Types === */
/* === Constants === */
const LOG_DEBUG = 'debug';
const LOG_WARN = 'warn';
const LOG_ERROR = 'error';
/* === Default Export */
const log = (value, msg, level = LOG_DEBUG) => {
    if ([LOG_ERROR, LOG_WARN].includes(level))
        console[level](msg, value);
    return value;
};

/* === Exported Function === */
const scheduler = () => {
    const effectQueue = new Map();
    const cleanupQueue = new Map();
    let requestId;
    const run = (fn, msg) => {
        try {
            fn();
        }
        catch (reason) {
            log(reason, msg, LOG_ERROR);
        }
    };
    const flush = () => {
        requestId = null;
        effectQueue.forEach((elEffect, el) => elEffect.forEach((fn, prop) => run(fn(el), `Effect ${prop} on ${el?.localName || 'unknown'} failed`)));
        effectQueue.clear();
        cleanupQueue.forEach(fn => run(fn, 'Cleanup failed'));
        cleanupQueue.clear();
    };
    const requestTick = () => {
        if (requestId)
            cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(flush);
    };
    const getEffectMap = (key) => {
        if (!effectQueue.has(key))
            effectQueue.set(key, new Map());
        return effectQueue.get(key);
    };
    const addToQueue = (map) => (key, fn) => {
        const more = !map.has(key);
        map.set(key, fn);
        if (more)
            requestTick();
    };
    queueMicrotask(flush); // initial flush when the call stack is empty
    return {
        enqueue: (element, prop, fn) => addToQueue(getEffectMap(element))(prop, fn),
        cleanup: addToQueue(cleanupQueue)
    };
};

/* === Internal === */
const { enqueue, cleanup } = scheduler();
// hold the currently active effect
let active;
// hold schuduler instance
// const { enqueue, cleanup } = scheduler()
/**
 * Add notify function of active listener to the set of listeners
 *
 * @param {Set<() => void>} targets - set of current listeners
 */
const autotrack = (targets) => {
    if (active)
        targets.add(active);
};
/**
 * Run all notify function of dependent listeners
 *
 * @param {Set<() => void>} targets
 */
const autorun = (targets) => targets.forEach(notify => notify());
const reactive = (fn, notify) => {
    const prev = active;
    active = notify;
    try {
        fn();
    }
    catch (error) {
        log(error, 'Error during reactive computation', LOG_ERROR);
    }
    finally {
        active = prev;
    }
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
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const targets = new Set();
    const state = () => {
        autotrack(targets);
        return value;
    };
    state.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isState(updater) ? updater(value) : updater;
        if (!Object.is(value, old))
            autorun(targets);
    };
    return state;
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
    const targets = new Set();
    let value;
    let stale = true;
    return () => {
        autotrack(targets);
        if (!memo || stale) {
            reactive(() => {
                value = fn();
                stale = false;
            }, () => {
                stale = true;
                if (memo)
                    autorun(targets);
            });
        }
        return value;
    };
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const run = () => reactive(() => {
        const cleanupFn = fn(enqueue);
        if (isFunction(cleanupFn))
            cleanup(fn, cleanupFn);
    }, run);
    run();
};

export { cause, derive, effect, isState };
