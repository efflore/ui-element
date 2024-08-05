interface UIContainer<T> {
    (): T;
    type?: string;
    toString?: () => string;
}
interface UIFunctor<T> {
    map: (fn: Function) => UIFunctor<T>;
}
interface UISomething<T> extends UIFunctor<T> {
    (): T;
    or: (_: unknown) => unknown;
    map: (fn: Function) => UIMaybe<T>;
    chain: (fn: Function) => unknown;
    filter: (fn: Function) => UIMaybe<T>;
}
interface UINothing<T> extends UIFunctor<T> {
    (): T;
    or: (value: unknown) => unknown;
    map: (fn: Function) => UINothing<T>;
    chain: (fn: Function) => unknown;
    filter: (fn: Function) => UINothing<T>;
}
type UIMaybe<T> = UISomething<T> | UINothing<T>;
/**
 * Unwrap any value wrapped in a function
 *
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value
 */
declare const unwrap: (value: any) => any;
/**
 * Compose functions from right to left
 *
 * @since 0.8.0
 * @param {Function[]} fns - functions to compose
 * @returns {Function} - composed function
 */
declare const compose: (...fns: Function[]) => Function;
/**
 * Check if a given value is a container function
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function
 */
declare const isAnyContainer: (value: unknown) => value is UIContainer<unknown>;
/**
 * Check if a given value is a container function
 *
 * @since 0.8.0
 * @param {string} type - expected container type
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function of the given type
 */
declare const isContainer: (type: string, value: unknown) => boolean;
/**
 * Check if an object has a method of given name
 */
declare const hasMethod: (obj: object, methodName: string) => boolean;
/**
 * Check if a given value is a functor
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
declare const isFunctor: (value: unknown) => value is UIFunctor<unknown>;
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
 * @returns {UINothing<T>} - container of "nothing" at all
 */
declare const nothing: <T>() => UINothing<T>;
export { type UIContainer, type UIFunctor, type UIMaybe, type UISomething, type UINothing, unwrap, compose, isAnyContainer, isContainer, hasMethod, isFunctor, isNothing, isSomething, maybe, something, nothing };
