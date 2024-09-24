interface Effect {
    (): void;
}
interface Computed<T> extends Effect {
    (): T;
}
interface State<T> {
    (): T;
    set(value: T): void;
}
type Signal<T> = State<T> | Computed<T>;
type DOMInstruction = (element: Element, prop: string, callback: (element: Element) => () => void) => void;
type MaybeCleanup = void | (() => void);
type EffectCallback = (enqueue: DOMInstruction) => MaybeCleanup;
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
declare const isState: (value: unknown) => value is State<unknown>;
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
declare const isSignal: (value: unknown) => value is Signal<unknown>;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
declare const cause: <T>(value: any) => State<T>;
/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => T} fn - existing state to derive from
 * @param {boolean} [memo=false] - whether to use memoization
 * @returns {UIComputed<T>} derived state
 */
declare const derive: <T>(fn: () => T, memo?: boolean) => Computed<T>;
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: EffectCallback) => void;
export { type State, type Computed, type Signal, type Effect, type DOMInstruction, isState, isSignal, cause, derive, effect };
/**
 * Check if the given value is a reactive state
 *
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a reactive state
 * /
const isState = (value: unknown): value is State<unknown> =>
    isDefinedObject(value) && hasMethod(value, 'set')

/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 * /
const cause = <T>(value: any): State<T> => {
    const targets = new Set<() => void>()
    const state: State<T> = (): T => { // getter function
        autotrack(targets)
        return value
    }
    state.set = (updater: unknown | ((value: T) => unknown)) => { // setter function
        const old = value
        value = isFunction(updater) ? updater(value) : updater
        if (!Object.is(value, old)) autorun(targets)
    }
    return state
}

/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => T} fn - existing state to derive from
 * @returns {Computed<T>} derived state
 * /
const derive = <T>(fn: () => T): Computed<T> => {
    const targets = new Set<() => void>()
    let value: T
    let stale: boolean = true
    return () => {
        autotrack(targets)
        if (stale) reactive(() => {
            value = fn()
            stale = false
        }, () => {
            stale = true
            autorun(targets)
        })
        return value
    }
}

/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {() => void} fn - callback function to be executed when a state changes
 * /
const effect = (fn: () => void) => {
    const run = () => reactive(fn, run)
    run()
}

export {
    type State, type Computed, type Signal, type Effect,
    isState, cause, derive, effect
}

*/ 
