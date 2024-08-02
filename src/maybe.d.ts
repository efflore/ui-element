interface UIContainer {
    (): unknown;
    type: string;
    toString: () => string;
    map: (fn: Function) => UIContainer;
}
interface UISomething<T> extends UIContainer {
    (): unknown;
    or: (_: unknown) => unknown;
    map: (fn: Function) => UIMaybe<T>;
    chain: (fn: Function) => unknown;
    filter: (fn: Function) => UISomething<T> | UINothing;
    apply: (other: UIContainer) => UIContainer;
}
interface UINothing extends UIContainer {
    (): void;
    or: (value: unknown) => unknown;
    map: (fn: Function) => UINothing;
    chain: (fn: Function) => unknown;
    filter: (fn: Function) => UINothing;
    apply: (other: UIContainer) => UIContainer;
}
type UIMaybe<T> = UISomething<T> | UINothing;
/**
 * Unwrap any value wrapped in a container
 *
 * @since 0.8.0
 * @param {unknown} value - value to unwrap if it's a container function
 * @param {unknown[]} args - additional arguments to pass to the container function
 * @returns {unknown} - unwrapped value
 */
declare const unwrap: (value: unknown, ...args: unknown[]) => unknown;
/**
 * Check if a given value is nothing
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
declare const isNothing: (value: unknown) => boolean;
/**
 * Check if a given value is something
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is something, false otherwise
 */
declare const isSomething: (value: unknown) => boolean;
/**
 * Create a container for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {UIMaybe<T>} - container of either "something" or "nothing" for the given value
 */
declare const maybe: <T>(value: T) => UIMaybe<T>;
/**
 * Create a "something" container for a given value, providing a chainable API for handling nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a "something" container
 * @returns {UISomething} - container of "something" type for the given value
 */
declare const something: <T>(value: T) => UISomething<T>;
/**
 * Create a "nothing" container for a given value, providing a chainable API for handling nullable values
 *
 * @since 0.8.0
 * @returns {UINothing} - container of "nothing" at all
 */
declare const nothing: () => UINothing;
export { unwrap, isNothing, isSomething, maybe, something, nothing };
