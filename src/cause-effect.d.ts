interface UIEffect {
    (): void;
    run(): void;
    targets?: Map<Element, Set<() => void>>;
}
interface UIComputed<T> extends UIEffect {
    (): T;
    effects: Set<UIEffect>;
}
interface UIState<T> {
    (): T;
    effects: Set<UIEffect>;
    set(value: unknown): void;
}
type UIDOMInstructionQueue = (element: Element, fn: () => void) => void;
type UIMaybeCleanup = void | (() => void);
type UIEffectCallback = (enqueue: UIDOMInstructionQueue) => UIMaybeCleanup;
/**
 * Check if a given variable is a function
 *
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
declare const isFunction: (fn: unknown) => fn is Function;
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
declare const isState: (value: unknown) => value is UIState<unknown>;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<T>} getter function for the current value with a `set` method to update the value
 */
declare const cause: <T>(value: any) => UIState<T>;
/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => T} fn - existing state to derive from
 * @param {boolean} [memo=false] - whether to use memoization
 * @returns {UIComputed<T>} derived state
 */
declare const derive: <T>(fn: () => T, memo?: boolean) => UIComputed<T>;
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: UIEffectCallback) => void;
export { type UIState, type UIComputed, type UIEffect, type UIDOMInstructionQueue, isFunction, isState, cause, derive, effect };
