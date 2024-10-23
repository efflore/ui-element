import { isFunction } from './is-type'
import { maybe, type Maybe } from './maybe'
import type { UIElement } from '../ui-element'

/* === Types === */

type AttributeParser<T> = (value: Maybe<string>, element: UIElement, old: string | undefined) => Maybe<T>

type AttributeMap = Record<string, AttributeParser<unknown>>

/* === Internal Functions === */

const isAttributeParser = (value: unknown): value is AttributeParser<unknown> =>
	isFunction(value) && !!(value as AttributeParser<unknown>).length

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
const parse = (
	host: UIElement,
	name: string,
	value: string,
	old: string | undefined = undefined
) => {
	const parser = (host.constructor as typeof UIElement).attributeMap[name]
	return isAttributeParser(parser) ? parser(maybe(value), host, old) : value
}

export { type AttributeParser, type AttributeMap, parse }