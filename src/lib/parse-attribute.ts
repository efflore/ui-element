import { log, LOG_ERROR } from '../core/log'
import { isDefined } from '../core/is-type'

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
	value.map(v => parseInt(v, 10)).filter(Number.isFinite)

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
const asNumber = (value: string[]): number[] =>
	value.map(parseFloat).filter(Number.isFinite)

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
const asJSON = (value: string[]): unknown[] => {
	let result = []
	try {
		result = value.map(v => JSON.parse(v))
	} catch (error) {
		log(error, 'Failed to parse JSON', LOG_ERROR)
	}
	return result
}

export { asBoolean, asInteger, asNumber, asString, asJSON }
