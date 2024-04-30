// hold the currently active effect
let computing = undefined;

// set up an empty WeakMap to hold the reactivity map
const reactivityMap = new WeakMap();

/**
 * Get the set of effects dependent on a state from the reactivity map
 * 
 * @param {import("../types").State<any>} state - state object as key for the lookup
 * @returns {Set} set of effects associated with the state
 */
const getEffects = state => {
  !reactivityMap.has(state) && reactivityMap.set(state, new Set());
  return reactivityMap.get(state);
};

/* === Public API === */

class State {
    #value;
    constructor (/** @type {any} */ value) {
        this.#value = value;
    }
    get () {
        computing && getEffects(this).add(computing);
        return this.#value;
    }
    set (/** @type {any} */ updater) {
        const old = this.#value;
        this.#value = typeof updater === 'function' ? updater(old) : updater;
        !Object.is(this.#value, old) && getEffects(this).forEach(effect => effect());
    }
}

class Computed {
    #fn;
    constructor (/** @type {() => any} */ fn) {
        this.#fn = fn;
    }
    get () {
        const prev = computing;
        computing = this;
        const value = this.#fn();
        computing = prev;
        return value;
    }
}

export default { State, Computed };