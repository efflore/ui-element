/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {string|undefined} value 
 * @returns {boolean}
 */
const asBoolean = (value: string | undefined): boolean => typeof value === 'string';

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {string} value 
 * @returns {number}
 */
const asInteger = (value: string): number => parseInt(value, 10);

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string} value 
 * @returns {number}
 */
const asNumber = (value: string): number => parseFloat(value);

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
const asString = (value: string): string => value;

export { asBoolean, asInteger, asNumber, asString };