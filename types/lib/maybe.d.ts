type Maybe<A> = {
    map<B>(f: (a: A) => B): Maybe<B>;
    fold: <B>(onNothing: () => B, onSomething: (value: A) => B) => B;
    toString: () => string;
};
declare const nothing: <A>() => Maybe<A>;
declare const something: <A>(value: A) => Maybe<A>;
/**
 * Create a container for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {Maybe<T>} - container of either "something" or "nothing" for the given value
 */
declare const maybe: <T>(value: T | null | undefined) => Maybe<T>;
export { type Maybe, maybe, nothing, something };
