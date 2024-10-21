type Ok<T> = {
    readonly [Symbol.toStringTag]: string;
    value: T;
    map: <U>(f: (value: T) => U) => Ok<U>;
    flatMap: <U>(f: (value: T) => Ok<U>) => Ok<U>;
    filter: (f: (value: T) => boolean) => Ok<T> | None;
    guard: <U extends T>(f: (value: T) => value is U) => Ok<U> | None;
    or: () => Ok<T>;
    get: () => T;
};
type None = {
    readonly [Symbol.toStringTag]: string;
    map: () => None;
    flatMap: () => None;
    filter: () => None;
    guard: () => None;
    or: <T>(fallback: T) => Ok<T> | None;
    get: () => undefined;
};
type Fail<E extends Error> = {
    readonly [Symbol.toStringTag]: string;
    error: E;
    map: () => Fail<E>;
    flatMap: () => Fail<E>;
    filter: () => Fail<E>;
    guard: () => Fail<E>;
    or: <T>(value: T) => Ok<T> | None;
    get: () => never;
};
type Maybe<T> = Ok<T> | None;
type Attempt<T, E extends Error> = Ok<T> | Fail<E> | None;
type Cases<U> = {
    [TYPE_OK]?: (value: unknown) => U;
    [TYPE_NONE]?: () => U;
    [TYPE_FAIL]?: (error: Error) => U;
    else?: (value: unknown) => U;
};
declare const TYPE_OK = "Ok";
declare const TYPE_NONE = "None";
declare const TYPE_FAIL = "Fail";
/**
 * Create an "Ok" value, representing a value
 *
 * @since 0.9.0
 * @param {T} value - value to wrap in an "Ok" value
 * @returns {Ok<T>} - "Ok" value with the given value
 */
declare const ok: <T>(value: T) => Ok<T>;
/**
 * Create a "None" value, representing a lack of a value
 *
 * @since 0.9.0
 * @returns {None} - "None" value
 */
declare const none: () => None;
/**
 * Create a "Fail" value, representing a failure
 *
 * @since 0.9.0
 * @param {E extends Error} error - error to wrap in a "Fail" value
 * @returns {Fail<E>} - "Fail" value with the given error
 */
declare const fail: <E extends Error>(error: E) => Fail<E>;
/**
 * Check if a value is an "Ok" value
 *
 * @param {unknown} value - value to check
 * @returns {value is Ok<T>} - true if the value is an "Ok" value, false otherwise
 */
declare const isOk: <T>(value: unknown) => value is Ok<T>;
/**
 * Check if a value is a "None" value
 *
 * @param {unknown} value - value to check
 * @returns {value is None} - true if the value is a "None" value, false otherwise
 */
declare const isNone: (value: unknown) => value is None;
/**
 * Check if a value is a "Fail" value
 *
 * @param {unknown} value -	value to check
 * @returns {value is Fail<E>} - true if the value is a "Fail" value, false otherwise
 */
declare const isFail: <E extends Error>(value: unknown) => value is Fail<E>;
/**
 * Check if a value is any result type
 */
declare const isResult: <T, E extends Error>(value: unknown) => value is Ok<T> | Fail<E> | None;
/**
 * Create an array for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
declare const maybe: <T>(value: T | null | undefined) => Maybe<T>;
/**
 * Try executing the given function and returning a "Ok" value if it succeeds, or a "Fail" value if it fails
 *
 * @since 0.9.0
 * @param {() => T} f - function to try
 * @returns {Ok<T> | Fail<E>} - "Ok" value if the function succeeds, or a "Fail" value if it fails
 */
declare const attempt: <T, E extends Error>(f: () => T) => Attempt<T, E>;
/**
 * Create an async task that retries the given function with exponential backoff if it fails
 *
 * @since 0.9.0
 * @param {() => Promise<T>} f - async function to try and maybe retry
 * @param {number} [retries=0] - number of times to retry the function if it fails; default is 0 (no retries)
 * @param {number} [delay=1000] - initial delay in milliseconds between retries; default is 1000ms
 * @returns {Promise<Attempt<T, E>>} - promise that resolves to the result of the function or fails with the last error encountered
 */
declare const task: <T, E extends Error>(f: () => Promise<T>, retries?: number, delay?: number) => Promise<Attempt<T, E>>;
/**
 * Helper function to execute a series of functions in sequence
 *
 * @since 0.9.0
 * @param {((v: unknown) => unknown)[]} fs
 * @returns
 */
declare const flow: (...fs: unknown[]) => unknown;
/**
 * Match a result type against a set of case handlers
 *
 * @since 0.9.0
 * @param {Cases<T, E, U>} cases - object with case handlers for pattern matching
 * @returns {<T, E extends Error>(result: Attempt<T, E>) => Attempt<U, E>} - value from the matching case handler, or the original value if no match is found
 */
declare const match: <U>(cases: Cases<U>) => (<T, E extends Error>(result: Attempt<T, E>) => U);
export { type Ok, type None, type Fail, type Maybe, TYPE_OK, TYPE_NONE, TYPE_FAIL, ok, none, fail, isOk, isNone, isFail, isResult, maybe, attempt, task, flow, match };
