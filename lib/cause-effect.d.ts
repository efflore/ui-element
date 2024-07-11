type FxDOMInstruction = (element: Element, key: unknown, value?: unknown) => unknown;
type FxDOMInstructionMap = Map<FxDOMInstruction, Map<unknown, unknown>>;
type FxEffect = {
    (): void;
    targets: Map<Element, FxDOMInstructionMap>;
};
type FxState = {
    (): unknown;
    effects: Set<FxEffect>;
    set(value: unknown): void;
};
type FxDOMInstructionQueue = (element: Element, domFn: FxDOMInstruction, key: unknown, value: unknown) => void;
type FxMaybeCleanup = void | (() => void);
type FxEffectCallback = (queue: FxDOMInstructionQueue) => FxMaybeCleanup;
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
declare const isState: (value: unknown) => value is FxState;
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
export { type FxState, isFunction, isState, cause, derive, effect };
