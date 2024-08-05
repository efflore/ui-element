import { type UIContainer } from './maybe';
interface UIEffect extends UIContainer<void> {
    (): void;
    run(): void;
    targets?: Map<Element, Set<() => void>>;
}
interface UIComputed<T> extends UIEffect {
    (): T;
    effects: Set<UIEffect | UIComputed<unknown>>;
}
interface UIState<T> extends UIContainer<T> {
    (): T;
    effects: Set<UIEffect | UIComputed<unknown>>;
    set(value: unknown): void;
}
type UISignal<T> = UIState<T> | UIComputed<T>;
type UIDOMInstructionQueue = (element: Element, fn: () => void) => void;
type UIMaybeCleanup = void | (() => void);
type UIEffectCallback = (enqueue: UIDOMInstructionQueue) => UIMaybeCleanup;
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
declare const isState: (value: unknown) => value is UIState<unknown>;
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
declare const isSignal: (value: unknown) => value is UISignal<unknown>;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<unknown>} getter function for the current value with a `set` method to update the value
 */
declare const cause: (value: any) => UIState<unknown>;
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
export { type UIState, type UIComputed, type UISignal, type UIEffect, type UIDOMInstructionQueue, isState, isSignal, cause, derive, effect };
