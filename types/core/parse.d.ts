import { type Maybe } from './maybe';
import type { UIElement } from '../ui-element';
type AttributeParser<T> = (value: Maybe<string>, element: UIElement, old: string | undefined) => Maybe<T>;
type AttributeMap = Record<string, AttributeParser<unknown>>;
/**
 * Parse according to static attributeMap
 *
 * @since 0.8.4
 * @param {UIElement} host - host UIElement
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string | undefined} [old=undefined] - old attribute value
 */
declare const parse: (host: UIElement, name: string, value: string, old?: string | undefined) => string | Maybe<unknown>;
export { type AttributeParser, type AttributeMap, parse };
