interface Effect {
    (): void;
    run(): void;
    targets?: Set<Element>;
}
interface Computed<T> extends Effect {
    (): T;
    effects: Set<Effect | Computed<unknown>>;
}
interface State<T> {
    (): T;
    effects: Set<Effect | Computed<unknown>>;
    set(value: T): void;
}
type Signal<T> = State<T> | Computed<T>;
type DOMInstruction = (element: Element, prop: string, callback: () => void) => void;
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
