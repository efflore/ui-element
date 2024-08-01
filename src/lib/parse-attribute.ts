import { isDefined } from './ui'
import { isString } from '../ui-element'

/* === Internal === */

/**
 * Returns a finite number or undefined
 * 
 * @param {number} value
 * @returns {number | undefined}
 */
const toFinite = (value: number): number | undefined => Number.isFinite(value) ? value : undefined

/* === Exported functions === */

/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {boolean}
 */
const asBoolean = (value: string | undefined): boolean => isString(value)

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {number | undefined}
 */
const asInteger = (value: string | undefined): number | undefined => toFinite(parseInt(value, 10))

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string | undefined} value 
 * @returns {number | undefined}
 */
const asNumber = (value: string | undefined): number | undefined => toFinite(parseFloat(value))

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
const asString = (value: string | undefined): string | undefined => isDefined(value) ? value : undefined

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {string | undefined} value
 * @returns {Record<string, unknown> | undefined}
 */
const asJSON = (value: string | undefined): Record<string, unknown> | undefined => {
  let result: Record<string, unknown> | undefined
  try {
    result = JSON.parse(value)
  } catch (error) {
    console.error(error)
    result = undefined
  }
  return result
}

export { asBoolean, asInteger, asNumber, asString, asJSON }
