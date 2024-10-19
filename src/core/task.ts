import { ok } from './maybe'
import { type Attempt, fail } from './attempt'

/* === Types === */

type Task<T, E extends Error> = Promise<Attempt<T, E>>

/* === Exported Functions === */

/**
 * Create an async task that retries the given function with exponential backoff if it fails
 * 
 * @since 0.9.0
 * @param {() => Promise<T>} f - async function to try and maybe retry
 * @param {number} [retries=0] - number of times to retry the function if it fails; default is 0 (no retries)
 * @param {number} [delay=1000] - initial delay in milliseconds between retries; default is 1000ms
 * @returns {Promise<Attempt<T, E>>} - promise that resolves to the result of the function or fails with the last error encountered
 */
const task = <T, E extends Error>(
	f: () => Promise<T>,
	retries: number = 0,
	delay: number = 1000
): Promise<Attempt<T, E>> => {
	const attemptTask = async (retries: number, delay: number): Promise<Attempt<T, E>> => {
		try {
			return ok(await f())
		} catch (error) {
			if (retries < 1) return fail(error)
			setTimeout(() => attemptTask(retries - 1, delay * 2), delay)
		}
	}
	return attemptTask(retries, delay)
}

export { type Task, task }