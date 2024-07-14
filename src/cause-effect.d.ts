type UIDOMInstructionSet = Set<() => void>;
type UIEffect = {
    (): void;
    targets: Map<Element, UIDOMInstructionSet>;
};
type UIState = {
    (): unknown;
    effects: Set<UIEffect>;
    set(value: unknown): void;
};
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
declare const isState: (value: unknown) => value is UIState;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {unknown} value - initial value of the state; may be a function for derived state
 * @returns {UIState} getter function for the current value with a `set` method to update the value
 */
declare const cause: (value: unknown) => UIState;
/**
 * Create a derived state from an existing state
 *
 * @since 0.1.0
 * @param {() => unknown} fn - existing state to derive from
 * @returns {() => unknown} derived state
 */
declare const derive: (fn: () => unknown) => (() => unknown);
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: UIEffectCallback) => void;
export { type UIState, isFunction, isState, cause, derive, effect };
