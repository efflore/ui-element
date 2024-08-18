/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {boolean[]}
 */
declare const asBoolean: (value: string[]) => boolean[];
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
declare const asInteger: (value: string[]) => number[];
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
declare const asNumber: (value: string[]) => number[];
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {string[]}
 */
declare const asString: (value: string[]) => string[];
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string[]} value - maybe string value or nothing
 * @returns {unknown[]}
 */
declare const asJSON: (value: string[]) => unknown[];
export { asBoolean, asInteger, asNumber, asString, asJSON };
