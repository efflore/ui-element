import { isNullish } from './is-type'

/* === Types === */

type Maybe<A> = {
  map<B>(f: (a: A) => B): Maybe<B>
  fold: <B>(onNothing: () => B, onSomething: (value: A) => B) => B
}

/* === Exported Functions === */

const nothing = <A>(): Maybe<A> => ({
  map: <B>(): Maybe<B> => nothing(),
  fold: <B>(onNothing: () => B): B => onNothing()
})

const something = <A>(value: A): Maybe<A> => ({
  map: <B>(f: (a: A) => B): Maybe<B> => something(f(value)),
  fold: <B>(_: () => B, onSomething: (value: A) => B): B => onSomething(value)
})

/* === Default Export === */

/**
 * Create a container for a given value to gracefully handle nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {Maybe<T>} - container of either "something" or "nothing" for the given value
 */
const maybe = <T>(value: T | null | undefined): Maybe<T> => isNullish(value) ? nothing() : something(value)

export { type Maybe, maybe, nothing, something };
