import { type Ok } from './maybe';
type Fail<E extends Error> = {
    readonly [Symbol.toStringTag]: string;
    error: E;
    map: () => Fail<E>;
    flatMap: () => Fail<E>;
    filter: () => Fail<E>;
    or: <T>(value: T) => Ok<T>;
    get: () => never;
};
type Attempt<T, E extends Error> = Ok<T> | Fail<E>;
/**
 * Create a "Fail" value, representing a failure
 *
 * @since 0.9.0
 * @param {E extends Error} error - error to wrap in a "Fail" value
 * @returns {Fail<E>} - "Fail" value with the given error
 */
declare const fail: <E extends Error>(error: E) => Fail<E>;
declare const isFail: <E extends Error>(value: unknown) => value is Fail<E>;
/**
 * Try executing the given function and returning a "Ok" value if it succeeds, or a "Fail" value if it fails
 *
 * @since 0.9.0
 * @param {() => T} f - function to try
 * @returns {Ok<T> | Fail<E>} - "Ok" value if the function succeeds, or a "Fail" value if it fails
 */
declare const attempt: <T, E extends Error>(f: () => T) => Ok<T> | Fail<E>;
export { type Fail, type Attempt, fail, isFail, attempt };
