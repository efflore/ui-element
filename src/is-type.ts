/* === Exported Functions === */

const is: <T>(type: string) => ((value: unknown) => value is T) = (type: string) =>
  <T>(value: unknown): value is T => typeof value === type

const isUndefined: (value: unknown) => value is undefined = is('undefined')
const isNull: (value: unknown) => value is null = (value: unknown): value is null => value === null
const isNullish: (value: unknown) => value is null | undefined = (value: unknown): value is null | undefined => value == null
const isDefined: <T>(value: unknown) => value is NonNullable<T> = <T>(value: unknown): value is NonNullable<T> => value != null
const isBoolean: (value: unknown) => value is boolean = is('boolean')
const isFalse: (value: unknown) => boolean = (value: unknown): boolean => value === false
const isFalsy: (value: unknown) => boolean = (value: unknown): boolean => !value
const isTrue: (value: unknown) => boolean = (value: unknown): boolean => value === true
const isTruthy: (value: unknown) => boolean = (value: unknown): boolean => !!value
const isNumber: (value: unknown) => value is number = is('number')
const isString: (value: unknown) => value is string = is('string')
const isObject: (value: unknown) => value is Object = is('object')
const isDefinedObject: (value: unknown) => value is Record<string, unknown> = (value: unknown) => isDefined(value) && isObject(value)
const isFunction: (value: unknown) => value is Function = is('function')

const isInstanceOf = (constructor: typeof Element) => (value: Node) => value instanceof constructor
const isElement: (node: Node) => boolean = isInstanceOf(Element)
// const isHTMLElement: (node: Node) => boolean = isInstanceOf(HTMLElement)
// const isSVGElement: (node: Node) => boolean = isInstanceOf(SVGElement)
// const isMathMLElement: (node: Node) => boolean = isInstanceOf(MathMLElement)
const isComment: (node: Node) => boolean = (node: Node) => node.nodeType !== Node.COMMENT_NODE

export { is, isUndefined, isNull, isNullish, isDefined, isBoolean, isFalse, isFalsy, isTrue, isTruthy, isNumber, isString, isObject, isDefinedObject, isFunction, isInstanceOf, isElement, /* isHTMLElement, isSVGElement, isMathMLElement, */ isComment }
