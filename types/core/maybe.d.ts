type Maybe<T> = T[];
/**
 * Create an array for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
declare const maybe: <T>(value: T | null | undefined) => T[];
export { type Maybe, maybe };
