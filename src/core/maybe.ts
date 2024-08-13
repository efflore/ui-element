import { isNullish } from './is-type'

/* === Types === */

type Maybe<T> = T[]

/* type Maybe<A> = {
  map<B>(f: (a: A) => B): Maybe<B>
  fold: <B>(onNothing: () => B, onSomething: (value: A) => B) => B
} */

/* === Exported Functions === */

/* const nothing = <A>(): Maybe<A> => ({
  map: <B>(): Maybe<B> => nothing(),
  fold: <B>(onNothing: () => B): B => onNothing()
})

const something = <A>(value: A): Maybe<A> => ({
  map: <B>(f: (a: A) => B): Maybe<B> => something(f(value)),
  fold: <B>(_: () => B, onSomething: (value: A) => B): B => onSomething(value)
}) */

/* === Default Export === */

/**
 * Create an array for a given value to gracefully handle nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
const maybe = <T>(value: T | null | undefined): T[] => isNullish(value) ? [] : [value]
// const maybe = <T>(value: T | null | undefined): Maybe<T> => isNullish(value) ? nothing() : something(value)

export { type Maybe, maybe }
