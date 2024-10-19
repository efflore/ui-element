import { type Ok, type None, maybe } from "./maybe"
import { type Fail, fail } from "./attempt"
import { isFunction } from "./is-type"

/* === Types === */

type Result<T, E extends Error> = Ok<T> | None | Fail<E>

type Cases = {
	Ok: (value: unknown) => unknown,
	None: () => unknown,
	Fail: (error: Error) => unknown,
    else: (value: unknown) => unknown,
}

/* === Exported Functions === */

/**
 * Helper function to execute a series of functions in sequence
 * 
 * @since 0.9.0
 * @param {((v: unknown) => unknown)[]} fs 
 * @returns 
 */
const flow = (...fs: unknown[]) =>
	fs.reduce((acc, f) => isFunction(f) ? f(acc) : fail(new TypeError(`Expected a function, got ${typeof f}`)))

/**
 * Match a result type against a set of case handlers
 * 
 * @since 0.9.0
 * @param {Record<PropertyKey, (value: unknown) => unknown>} cases - object with case handlers for pattern matching
 * @returns {(result: Result<unknown>) => unknown} - value from the matching case handler, or the original value if no match is found
 */
const match = (cases: Cases) => (result: Result<unknown, Error>): unknown => {
	const handler = cases[result[Symbol.toStringTag]] || cases.else
	const value = 'value' in result
		? result.value
		: 'error' in result
			? result.error
			: undefined
	return maybe(handler)
		.filter(isFunction)
		.map(handler => handler(value))
		.or(value)
}

export { type Result, flow, match }