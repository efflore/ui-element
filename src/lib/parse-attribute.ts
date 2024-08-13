import { attempt } from '../core/attempt'
import { log, LOG_ERROR } from '../core/log'
import { isDefined } from '../core/is-type'

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
 * @param {string[]} value - maybe string value or nothing
 * @returns {boolean[]}
 */
const asBoolean = (value: string[]): boolean[] => [isDefined(value[0])]

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
const asInteger = (value: string[]): number[] =>
  value.map(v => parseInt(v, 10)).map(toFinite)

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
const asNumber = (value: string[]): number[] =>
  value.map(parseFloat).map(toFinite);

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {string[]}
 */
const asString = (value: string[]): string[] => value

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {string[]} value - maybe string value or nothing
 * @returns {unknown[]}
 */
const asJSON = (value: string[]): unknown[] =>
  value.map(v => attempt(() => JSON.parse(v)).fold(
    error => log(undefined, `Failed to parse JSON: ${error.message}`, LOG_ERROR),
    v => v
  ))

export { asBoolean, asInteger, asNumber, asString, asJSON }
