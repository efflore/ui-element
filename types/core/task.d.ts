import { type Attempt } from './attempt';
type Task<T, E extends Error> = Promise<Attempt<T, E>>;
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
export { type Task, task };
