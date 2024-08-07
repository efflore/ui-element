interface UIContainer<T> {
    (): T;
    type: symbol;
    toString?: () => string;
}
interface UIFunctor<T> {
    map: <V>(fn: (value: T) => V) => UIFunctor<V>;
}
interface UISomething<T> extends UIFunctor<T> {
    (): T;
    map: <V>(fn: (value: T) => V) => UIMaybe<V>;
    or: () => UISomething<T>;
}
interface UINothing extends UIFunctor<void> {
    (): void;
    map: () => UINothing;
    or: <V>(fn: () => V) => UIMaybe<V>;
}
type UIMaybe<T> = UISomething<T> | UINothing;
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
 * /
const compose = (...fns: Function[]): Function => (x: unknown) => fns.reduceRight((y, f) => f(y), x);

/**
 * Check if an object has a method of given name
 *
 * @since 0.8.0
 * @param {object} obj - object to check
 * @returns {boolean} - true if the object has a method of the given name, false otherwise
 */
declare const hasMethod: (obj: object, name: string) => boolean;
/**
 * Check if a given value is a UIContainer of a given type
 *
 * @param {unknown} value - value to check
 * @param {symbol[]} allowedTypes - allowed types of UIContainer
 * @returns {(value: unknown) => value is UIContainer<unknown>} - partially applied function that checks if the given value is a UIContainer of the given type
 */
declare const isContainerOf: (value: unknown, allowedTypes?: symbol[]) => value is UIContainer<unknown>;
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
 * @returns {UINothing} - container of "nothing" at all
 */
declare const nothing: () => UINothing;
export { type UIContainer, type UIFunctor, type UIMaybe, type UISomething, type UINothing, unwrap, /* compose, */ hasMethod, isContainerOf, isFunctor, isNothing, isSomething, maybe, something, nothing };
