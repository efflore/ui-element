export type FxEffect = {
    (): void;
};
export type FxState = {
    (): unknown;
    effects?: Set<FxEffect>;
    set?(value: unknown): void;
};
export type FxMaybeCleanup = void | (() => void);
export type FxEffectCallback = () => FxMaybeCleanup;
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {unknown} value - initial value of the state; may be a function for derived state
 * @returns {FxState} getter function for the current value with a `set` method to update the value
 */
declare const cause: (value: unknown) => FxState;
declare const derive: (fn: () => any) => any;
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {FxEffectCallback} fn - callback function to be executed when a state changes
 */
declare const effect: (fn: FxEffectCallback) => void;
export { cause, derive, effect };
