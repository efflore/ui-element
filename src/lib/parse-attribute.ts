import type { UIMaybe } from "../maybe"

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
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<boolean>}
 */
const asBoolean = (maybe: UIMaybe<string>): UIMaybe<boolean> => maybe.map(() => true).or(() => false)

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<number>}
 */
const asInteger = (maybe: UIMaybe<string>): UIMaybe<number> => maybe.map(v => toFinite(parseInt(v, 10)))

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<number>}
 */
const asNumber = (maybe: UIMaybe<string>): UIMaybe<number> => maybe.map(v => toFinite(parseFloat(v)))

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<string>}
 */
const asString = (maybe: UIMaybe<string>): UIMaybe<string> => maybe // just return; nothing will evaluate to empty string if no fallback is provided later on

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {UIMaybe<string>} maybe - maybe string value or nothing
 * @returns {UIMaybe<unknown>}
 */
const asJSON = (maybe: UIMaybe<string>): UIMaybe<unknown> => maybe.map(v => {
  let result: unknown
  try {
    result = JSON.parse(v)
  } catch (error) {
    console.error(error)
  }
  return result
})

export { asBoolean, asInteger, asNumber, asString, asJSON }
