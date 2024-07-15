/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string|undefined} value
 * @returns {boolean}
 */
declare const asBoolean: (value: string | undefined) => boolean;
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
declare const asInteger: (value: string) => number;
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
declare const asNumber: (value: string) => number;
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
declare const asString: (value: string) => string;
export { asBoolean, asInteger, asNumber, asString };
