import { type Enqueue } from './core/scheduler';
type State<T> = {
    (): T;
    set(value: T): void;
};
type Computed<T> = () => T;
type Signal<T> = State<T> | Computed<T>;
type Effect = () => void;
type MaybeCleanup = void | (() => void);
type EffectCallback = (enqueue: Enqueue) => MaybeCleanup;
/**
 * Check if a given variable is a state signal
 *
 * @param {unknown} value - variable to check
 * @returns {boolean} true if supplied parameter is a state signal
 */
declare const isState: (value: unknown) => value is State<unknown>;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
declare const cause: <T>(value: T) => State<T>;
/**
 * Create a derived state from a existing states
 *
 * @since 0.1.0
 * @param {() => T} fn - compute function to derive state
 * @returns {Computed<T>} result of derived state
 */
declare const derive: <T>(fn: () => T | undefined, memo?: boolean) => Computed<T>;
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: EffectCallback) => void;
export { type State, type Computed, type Signal, type Effect, isState, cause, derive, effect };
