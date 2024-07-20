/* === Internal === */

/**
 * Returns a finite number or undefined
 */
const finiteNumber = (value: number): number | undefined => Number.isFinite(value) && value;

/* === Exported functions === */

/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {boolean}
 */
const asBoolean = (value: string | undefined): boolean => typeof value === 'string';

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {number | undefined}
 */
const asInteger = (value: string | undefined): number | undefined => finiteNumber(parseInt(value, 10));

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {number | undefined}
 */
const asNumber = (value: string | undefined): number => finiteNumber(parseFloat(value));

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
const asString = (value: string): string => value;

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {string} value
 * @returns {Record<string, unknown>}
 */
const asJSON = (value: string): Record<string, unknown> => JSON.parse(value);

export { asBoolean, asInteger, asNumber, asString, asJSON };