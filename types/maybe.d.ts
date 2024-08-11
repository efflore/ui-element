type Maybe<A> = {
    (): A | undefined;
    toString: () => string;
    map: <B>(f: (a: A) => B) => Maybe<B>;
    or: (fallback: A) => A;
};
/**
 * Create a container for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {Maybe<T>} - container of either "something" or "nothing" for the given value
 */
declare const maybe: <T>(value: T | null | undefined) => Maybe<T>;
export { type Maybe, maybe };
