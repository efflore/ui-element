import { isFunction } from './is-type'
import { maybe, type Maybe } from './maybe'
import type { UIElement } from '../ui-element'

/* === Types === */

type AttributeParser = (value: Maybe<string>, element: UIElement, old: string | undefined) => Maybe<unknown>

type AttributeMap = Record<string, AttributeParser>

/* === Internal Functions === */

const isAttributeParser = (value: unknown): value is AttributeParser =>
	isFunction(value) && !!(value as AttributeParser).length

/* === Exported Functions === */

/**
 * Parse according to static attributeMap
 * 
 * @since 0.8.4
 * @param {UIElement} host - host UIElement
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string | undefined} [old=undefined] - old attribute value
 */
const parse = (host: UIElement, name: string, value: string, old: string | undefined = undefined) =>
	maybe((host.constructor as typeof UIElement).attributeMap[name])
		.guard(isAttributeParser)
		.map(parser => parser(maybe(value), host, old))
		.or(value)
		.get()

export { type AttributeParser, type AttributeMap, parse }