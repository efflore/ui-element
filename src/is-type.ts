/* === Exported Functions === */

const isOfType: <T>(type: string) =>
  (value: unknown) => value is T = (type: string) => <T>(value: unknown): value is T =>
    typeof value === type

const isUndefined: (value: unknown) => value is undefined = isOfType('undefined')
const isSymbol: (value: unknown) => value is undefined = isOfType('symbol')
const isBoolean: (value: unknown) => value is boolean = isOfType('boolean')
const isNumber: (value: unknown) => value is number = isOfType('number')
const isString: (value: unknown) => value is string = isOfType('string')
const isObject: (value: unknown) => value is object = isOfType('object')
const isFunction: (value: unknown) => value is ((...args: any []) => any) = isOfType('function')

const isNull: (value: unknown) => value is null = (value: unknown): value is null =>
  value === null

const isNullish: (value: unknown) => value is null | undefined = (value: unknown): value is null | undefined =>
  value == null

const isDefined: <T>(value: unknown) => value is NonNullable<T> = <T>(value: unknown): value is NonNullable<T> =>
  value != null

const isFalse: (value: unknown) => boolean = (value: unknown): boolean =>
  value === false

const isFalsy: (value: unknown) => boolean = (value: unknown): boolean =>
  !value

const isTrue: (value: unknown) => boolean = (value: unknown): boolean =>
  value === true

const isTruthy: (value: unknown) => boolean = (value: unknown): boolean =>
  !!value

/* eslint-disable @typescript-eslint/no-empty-object-type */
const isDefinedObject: (value: unknown) => value is {} | ((...args: any []) => any) = (value: unknown) =>
  isDefined(value) && (isObject(value) || isFunction(value))

const isInstanceOf = (constructor: typeof Element) => (value: Node) =>
  value instanceof constructor

const isElement: (node: Node) => boolean = isInstanceOf(Element)

const isComment: (node: Node) => boolean = (node: Node) =>
  node.nodeType !== Node.COMMENT_NODE

export {
  isOfType, isUndefined, isSymbol, isBoolean, isNumber, isString, isObject, isFunction,
  isNull, isNullish, isDefined, isFalse, isFalsy, isTrue, isTruthy, isDefinedObject,
  isInstanceOf, isElement, isComment
}
