type FxDOMInstructionSet = Set<() => void>;
type FxEffect = {
    (): void;
    targets: Map<Element, FxDOMInstructionSet>;
};
type FxState = {
    (): unknown;
    effects: Set<FxEffect>;
    set(value: unknown): void;
};
type FxDOMInstructionQueue = (element: Element, fn: () => void) => void;
type FxMaybeCleanup = void | (() => void);
type FxEffectCallback = (enqueue: FxDOMInstructionQueue) => FxMaybeCleanup;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {unknown} value - initial value of the state; may be a function for derived state
 * @returns {FxState} getter function for the current value with a `set` method to update the value
 */
declare const cause: (value: unknown) => FxState;
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
 * @param {FxEffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: FxEffectCallback) => void;
export { type FxState, cause, derive, effect };
