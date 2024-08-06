import { UIMaybe } from "../maybe";
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<boolean>}
 */
declare const asBoolean: (maybe: UIMaybe<string>) => UIMaybe<boolean>;
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<number>}
 */
declare const asInteger: (maybe: UIMaybe<string>) => UIMaybe<number>;
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<number>}
 */
declare const asNumber: (maybe: UIMaybe<string>) => UIMaybe<number>;
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<string>}
 */
declare const asString: (maybe: UIMaybe<string>) => UIMaybe<string>;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<unknown>}
 */
declare const asJSON: (maybe: UIMaybe<string>) => UIMaybe<unknown>;
export { asBoolean, asInteger, asNumber, asString, asJSON };
