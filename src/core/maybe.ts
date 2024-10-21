import { callFunction, isDefined, isFunction, isObjectOfType } from './is-type'

/* === Types === */

type Ok<T> = {
	readonly [Symbol.toStringTag]: string
	value: T
	map: <U>(f: (value: T) => U) => Ok<U>
	flatMap: <U>(f: (value: T) => Ok<U>) => Ok<U>
	filter: (f: (value: T) => boolean) => Ok<T> | None
	guard: <U extends T>(f: (value: T) => value is U) => Ok<U> | None
	or: () => Ok<T>
	get: () => T
}

type None = {
	readonly [Symbol.toStringTag]: string
	map: () => None
	flatMap: () => None
	filter: () => None
	guard: () => None
	or: <T>(fallback: T) => Ok<T> | None
	get: () => undefined
}

type Fail<E extends Error> = {
	readonly [Symbol.toStringTag]: string
	error: E
	map: () => Fail<E>
	flatMap: () => Fail<E>
	filter: () => Fail<E>
	guard: () => Fail<E>
	or: <T>(value: T) => Ok<T> | None
	get: () => never
}

type Maybe<T> = Ok<T> | None

type Result<T, E extends Error> = Ok<T> | Fail<E> | None

type Cases<U> = {
	[TYPE_OK]?: (value: unknown) => U,
	[TYPE_NONE]?: () => U,
	[TYPE_FAIL]?: (error: Error) => U,
    else?: (value: unknown) => U,
}

/* === Constants === */

const TYPE_OK = 'Ok'
const TYPE_NONE = 'None'
const TYPE_FAIL = 'Fail'

/* === Exported Function === */

/**
 * Create an "Ok" value, representing a value
 * 
 * @since 0.9.0
 * @param {T} value - value to wrap in an "Ok" value
 * @returns {Ok<T>} - "Ok" value with the given value
 */
const ok = <T>(value: T): Ok<T> => ({
	[Symbol.toStringTag]: TYPE_OK,
	value,
	map: f => ok(f(value)),
	flatMap: f => f(value),
	filter: f => f(value) ? ok(value) : none(),
	guard: f => f(value) ? ok(value) : none(),
	or: () => ok(value),
	get: () => value,
})

/**
 * Create a "None" value, representing a lack of a value
 * 
 * @since 0.9.0
 * @returns {None} - "None" value
 */
const none = (): None => {
	const map = () => none()
	return {
		[Symbol.toStringTag]: TYPE_NONE,
		map,
		flatMap: map,
        filter: map,
        guard: map,
        or: fallback => maybe(fallback),
		get: () => undefined,
	}
}

/**
 * Create a "Fail" value, representing a failure
 * 
 * @since 0.9.0
 * @param {E extends Error} error - error to wrap in a "Fail" value
 * @returns {Fail<E>} - "Fail" value with the given error
 */
const fail = <E extends Error>(error: E): Fail<E> => {
	const map = () => fail(error)
	return {
		[Symbol.toStringTag]: TYPE_FAIL,
		error,
		map,
		flatMap: map,
		filter: map,
		guard: map,
		or: <T>(value: T) => maybe(value),
		get: () => { throw error }, // re-throw error for the caller to handle
	}
}

/**
 * Check if a value is an "Ok" value
 * 
 * @param {unknown} value - value to check
 * @returns {value is Ok<T>} - true if the value is an "Ok" value, false otherwise
 */
const isOk = <T>(value: unknown): value is Ok<T> =>
	isObjectOfType(value, TYPE_OK)

/**
 * Check if a value is a "None" value
 * 
 * @param {unknown} value - value to check
 * @returns {value is None} - true if the value is a "None" value, false otherwise
 */
const isNone = (value: unknown): value is None =>
	isObjectOfType(value, TYPE_NONE)

/**
 * Check if a value is a "Fail" value
 * 
 * @param {unknown} value -	value to check
 * @returns {value is Fail<E>} - true if the value is a "Fail" value, false otherwise
 */
const isFail = <E extends Error>(value: unknown): value is Fail<E> =>
	isObjectOfType(value, TYPE_FAIL)

/**
 * Check if a value is any result type
 */
const isResult = <T, E extends Error>(value: unknown): value is Ok<T> | Fail<E> | None =>
    isOk(value) || isNone(value) || isFail(value)

/**
 * Create an array for a given value to gracefully handle nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
const maybe = <T>(value: T | null | undefined): Maybe<T> =>
	isDefined(value) ? ok(value) : none()

/**
 * Try executing the given function and returning a "Ok" value if it succeeds, or a "Fail" value if it fails
 * 
 * @since 0.9.0
 * @param {() => T} f - function to try
 * @returns {Ok<T> | Fail<E>} - "Ok" value if the function succeeds, or a "Fail" value if it fails
 */
const result = <T, E extends Error>(f: () => T): Result<T, E> => {
	try {
		return maybe(f())
    } catch (error) {
        return fail(error)
    }
}

/**
 * Create an async task that retries the given function with exponential backoff if it fails
 * 
 * @since 0.9.0
 * @param {() => Promise<T>} f - async function to try and maybe retry
 * @param {number} [retries=0] - number of times to retry the function if it fails; default is 0 (no retries)
 * @param {number} [delay=1000] - initial delay in milliseconds between retries; default is 1000ms
 * @returns {Promise<Result<T, E>>} - promise that resolves to the result of the function or fails with the last error encountered
 */
const task = <T, E extends Error>(
	f: () => Promise<T>,
	retries: number = 0,
	delay: number = 1000
): Promise<Result<T, E>> => {
	const attemptTask = async (retries: number, delay: number): Promise<Result<T, E>> => {
		const r = result(async () => await f())
		return await match({
            [TYPE_FAIL]: async error => {
                if (retries < 1) return fail(error)
                await new Promise(resolve => setTimeout(resolve, delay))
                return attemptTask(retries - 1, delay * 2) // retry with exponential backoff
            },
        })(r)
	}
	return attemptTask(retries, delay)
}

/**
 * Helper function to execute a series of functions in sequence
 * 
 * @since 0.9.0
 * @param {((v: unknown) => unknown)[]} fs 
 * @returns 
 */
const flow = (...fs: unknown[]) => fs.reduce((acc, f) => callFunction(f, acc))

/**
 * Match a result type against a set of case handlers
 * 
 * @since 0.9.0
 * @param {Cases<T, E, U>} cases - object with case handlers for pattern matching
 * @returns {<T, E extends Error>(result: Result<T, E>) => Result<U, E>} - value from the matching case handler, or the original value if no match is found
 */
const match = <U>(cases: Cases<U>): (<T, E extends Error>(result: Result<T, E>) => U) => 
	<T, E extends Error>(result: Result<T, E>): U => {
		const handler = cases[result[Symbol.toStringTag]] || cases.else
		const getProperty = (obj: Result<T, E>, prop: string) => (obj && prop in obj && obj[prop]) || undefined
		const value = maybe(getProperty(result, 'value'))
			.or(getProperty(result, 'error'))
			.get()
		return maybe(handler)
			.guard(isFunction)
			.map(handler => handler(value))
			.or(value)
			.get()
	}

export {
	type Ok, type None, type Fail, type Maybe, type Result, type Cases,
	TYPE_OK, TYPE_NONE, TYPE_FAIL,
	ok, none, fail, isOk, isNone, isFail, isResult, maybe, result, task, flow, match
}
