type None = {
    readonly [Symbol.toStringTag]: string;
    map: () => None;
    flatMap: () => None;
    filter: () => None;
    or: <T>(fallback: T) => Ok<T>;
    get: () => undefined;
};
type Ok<T> = {
    readonly [Symbol.toStringTag]: string;
    value: T;
    map: <U>(f: (value: T) => U) => Ok<U>;
    flatMap: <U>(f: (value: T) => Ok<U>) => Ok<U>;
    filter: (f: (value: T) => boolean) => Maybe<T>;
    or: () => Ok<T>;
    get: () => T;
};
type Maybe<T> = Ok<T> | None;
/**
 * Create a "None" value, representing a lack of a value
 *
 * @since 0.9.0
 * @returns {None} - "None" value
 */
declare const none: () => None;
/**
 * Create an "Ok" value, representing a value
 *
 * @since 0.9.0
 * @param {T} value - value to wrap in an "Ok" value
 * @returns {Ok<T>} - "Ok" value with the given value
 */
declare const ok: <T>(value: T) => Ok<T>;
declare const isOk: <T>(value: unknown) => value is Ok<T>;
declare const isNone: (value: unknown) => value is None;
/**
 * Create an array for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
declare const maybe: <T>(value: T | null | undefined) => Maybe<T>;
export { type None, type Ok, type Maybe, none, ok, isNone, isOk, maybe };
