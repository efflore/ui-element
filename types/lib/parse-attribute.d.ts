import { type Maybe } from '../core/maybe';
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<boolean>}
 */
declare const asBoolean: (value: Maybe<string>) => Maybe<boolean>;
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<number>}
 */
declare const asInteger: (value: Maybe<string>) => Maybe<number>;
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<number>}
 */
declare const asNumber: (value: Maybe<string>) => Maybe<number>;
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<string>}
 */
declare const asString: (value: Maybe<string>) => Maybe<string>;
/**
 * Parse an attribute as a tri-state value (true, false, mixed)
 *
 * @since 0.9.0
 * @param {string[]} valid - array of valid values
 */
declare const asEnum: (valid: string[]) => (value: Maybe<string>) => Maybe<string>;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<unknown>}
 */
declare const asJSON: (value: Maybe<string>) => Maybe<unknown>;
export { asBoolean, asInteger, asNumber, asString, asEnum, asJSON, };
