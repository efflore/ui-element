import { type Ok, type None } from "./maybe";
import { type Fail } from "./attempt";
type Result<T, E extends Error> = Ok<T> | None | Fail<E>;
type Cases = {
    Ok: (value: unknown) => unknown;
    None: () => unknown;
    Fail: (error: Error) => unknown;
    else: (value: unknown) => unknown;
};
/**
 * Helper function to execute a series of functions in sequence
 *
 * @since 0.9.0
 * @param {((v: unknown) => unknown)[]} fs
 * @returns
 */
declare const flow: (...fs: unknown[]) => unknown;
/**
 * Match a result type against a set of case handlers
 *
 * @since 0.9.0
 * @param {Record<PropertyKey, (value: unknown) => unknown>} cases - object with case handlers for pattern matching
 * @returns {(result: Result<unknown>) => unknown} - value from the matching case handler, or the original value if no match is found
 */
declare const match: (cases: Cases) => (result: Result<unknown, Error>) => unknown;
export { type Result, flow, match };
