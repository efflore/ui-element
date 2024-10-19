import { isObjectOfType } from './is-type'
import { type Ok, ok } from './maybe'

/* === Types === */

type Fail<E extends Error> = {
	readonly [Symbol.toStringTag]: string
	error: E
	map: () => Fail<E>
	flatMap: () => Fail<E>
	filter: () => Fail<E>
	or: <T>(value: T) => Ok<T>
	get: () => never
}

type Attempt<T, E extends Error> = Ok<T> | Fail<E>

/* === Constants === */

const TYPE_FAIL = 'Fail'

/* === Exported Functions === */

/**
 * Create a "Fail" value, representing a failure
 * 
 * @since 0.9.0
 * @param {E extends Error} error - error to wrap in a "Fail" value
 * @returns {Fail<E>} - "Fail" value with the given error
 */
const fail = <E extends Error>(error: E): Fail<E> => ({
	[Symbol.toStringTag]: TYPE_FAIL,
    error,
	map: () => fail(error),
	flatMap: () => fail(error),
	filter: () => fail(error),
	or: <T>(value: T) => ok(value),
	get: () => { throw error }, // re-throw error for the caller to handle
})

const isFail = <E extends Error>(value: unknown): value is Fail<E> =>
	isObjectOfType(value, TYPE_FAIL)

/**
 * Try executing the given function and returning a "Ok" value if it succeeds, or a "Fail" value if it fails
 * 
 * @since 0.9.0
 * @param {() => T} f - function to try
 * @returns {Ok<T> | Fail<E>} - "Ok" value if the function succeeds, or a "Fail" value if it fails
 */
const attempt = <T, E extends Error>(f: () => T): Ok<T> | Fail<E> => {
	try {
		return ok(f())
    } catch (error) {
        return fail(error)
    }
}

export { type Fail, type Attempt, fail, isFail, attempt }