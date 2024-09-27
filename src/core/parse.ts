import { isFunction } from './is-type'
import { maybe } from './maybe'
import type { UIElement } from '../ui-element'

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
const parse = (host: UIElement, name: string, value: string, old: string | undefined = undefined) => {
	const parser = (host.constructor as typeof UIElement).attributeMap[name]
	return isFunction(parser) ? parser(maybe(value), host, old)[0] : value
}

export { parse }