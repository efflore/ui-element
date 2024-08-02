/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {boolean}
 */
declare const asBoolean: (value: unknown) => value is string;
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
declare const asNumber: (value: string | undefined) => number | undefined;
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
declare const asString: (value: string | undefined) => string | undefined;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string | undefined} value
 * @returns {Record<string, unknown> | undefined}
 */
declare const asJSON: (value: string | undefined) => Record<string, unknown> | undefined;
export { asBoolean, asInteger, asNumber, asString, asJSON };
