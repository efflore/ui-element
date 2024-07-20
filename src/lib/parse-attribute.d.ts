/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {boolean}
 */
declare const asBoolean: (value: string | undefined) => boolean;
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
declare const asInteger: (value: string | undefined) => number | undefined;
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
declare const asNumber: (value: string | undefined) => number;
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
declare const asString: (value: string) => string;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string} value
 * @returns {Record<string, unknown>}
 */
declare const asJSON: (value: string) => Record<string, unknown>;
export { asBoolean, asInteger, asNumber, asString, asJSON };
