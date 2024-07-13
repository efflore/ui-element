import type { FxState } from './cause-effect';
/**
 * Check if a given variable is a function
 *
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
declare const isFunction: (fn: unknown) => fn is Function;
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
declare const isState: (value: unknown) => value is FxState;
/**
 * Check if a given variable is defined
 *
 * @param {any} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
declare const isDefined: (value: any) => value is {} | null;
export { isFunction, isState, isDefined };
