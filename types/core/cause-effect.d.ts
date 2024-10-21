import { type Enqueue } from './scheduler';
type State<T> = {
    readonly [Symbol.toStringTag]: string;
    get(): T;
    set(value: T): void;
    get targets(): Array<() => void>;
};
type Computed<T> = {
    readonly [Symbol.toStringTag]: string;
    get(): T;
    get targets(): Array<() => void>;
};
type Signal<T> = State<T> | Computed<T>;
type EffectCallback = (enqueue: Enqueue) => void | Function;
declare const TYPE_STATE = "State";
declare const TYPE_COMPUTED = "Computed";
/**
 * Check if a given variable is a state signal
 *
 * @since 0.7.0
 * @param {unknown} value - variable to check
 * @returns {boolean} true if supplied parameter is a state signal
 */
declare const isState: (value: unknown) => value is State<unknown>;
declare const isComputed: (value: unknown) => value is Computed<unknown>;
declare const isSignal: (value: unknown) => value is Signal<unknown>;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
declare const state: <T>(value: T) => State<T>;
/**
 * Create a derived state from a existing states
 *
 * @since 0.1.0
 * @param {() => T} fn - compute function to derive state
 * @returns {Computed<T>} result of derived state
 */
declare const computed: <T>(fn: () => T | undefined, memo?: boolean) => Computed<T>;
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: EffectCallback) => void;
export { type State, type Computed, type Signal, type EffectCallback, TYPE_STATE, TYPE_COMPUTED, isState, isComputed, isSignal, state, computed, effect };
