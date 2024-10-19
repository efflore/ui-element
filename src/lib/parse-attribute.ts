import { isDefined } from '../core/is-type'
import { log, LOG_ERROR } from '../core/log'
import { type Maybe, maybe, none } from '../core/maybe'

/* === Exported functions === */

/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<boolean>}
 */
const asBoolean = (value: Maybe<string>): Maybe<boolean> =>
	maybe(isDefined(value.get()))

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asInteger = (value: Maybe<string>): Maybe<number> =>
	value.map(v => parseInt(v, 10)).filter(Number.isFinite)

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asNumber = (value: Maybe<string>): Maybe<number> =>
	value.map(parseFloat).filter(Number.isFinite)

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
const asJSON = (value: Maybe<string>): Maybe<unknown> => {
	try {
		return value.map(v => JSON.parse(v))
	} catch (error) {
		log(error, 'Failed to parse JSON', LOG_ERROR)
		return none()
	}
}

export { asBoolean, asInteger, asNumber, asString, asJSON }
