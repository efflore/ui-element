import { type Maybe, maybe } from './maybe'
import { attempt } from './attempt'
import { log, LOG_ERROR } from './log'

/* === Internal === */

/**
 * Returns a finite number or undefined
 * 
 * @param {number} value
 * @returns {number | undefined}
 */
const toFinite = (value: number): number | undefined =>
  Number.isFinite(value) ? value : undefined

/* === Exported functions === */

/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<boolean>}
 */
const asBoolean = (value: Maybe<string>): Maybe<boolean> =>
  maybe(value.fold(() => false, () => true))

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asInteger = (value: Maybe<string>): Maybe<number> =>
  value.map(v => parseInt(v, 10)).map(toFinite);

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asNumber = (value: Maybe<string>): Maybe<number> =>
  value.map(parseFloat).map(toFinite);

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<string>}
 */
const asString = (value: Maybe<string>): Maybe<string> => value

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<unknown>}
 */
const asJSON = (value: Maybe<string>): Maybe<unknown> =>
  value.map(v => attempt(() => JSON.parse(v)).fold(
    error => log(undefined, `Failed to parse JSON: ${error.message}`, LOG_ERROR),
    v => v
  ))

export { asBoolean, asInteger, asNumber, asString, asJSON }
