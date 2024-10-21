/* === Types === */

type Primitive = 'undefined' | 'symbol' | 'boolean' | 'number' | 'string' | 'bigint' | 'object' | 'function'

/* === Exported Functions === */

const isOfType = <T>(type: Primitive) =>
	(value: unknown): value is T =>
		typeof value === type

const isUndefined: (value: unknown) => value is undefined = isOfType('undefined')
const isSymbol: (value: unknown) => value is symbol = isOfType('symbol')
const isBoolean: (value: unknown) => value is boolean = isOfType('boolean')
const isNumber: (value: unknown) => value is number = isOfType('number')
const isString: (value: unknown) => value is string = isOfType('string')
const isObject: (value: unknown) => value is object = isOfType('object')

const isPropertyKey = (value: unknown): value is PropertyKey =>
	isString(value) || isSymbol(value) || isNumber(value)

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const isFunction: (value: unknown) => value is Function = isOfType('function')

const isNullaryFunction = (fn: unknown): fn is (() => unknown) =>
	isFunction(fn) && !fn.length

const isVariadicFunction = (fn: unknown): fn is ((...args: unknown[]) => unknown) =>
	isFunction(fn) && !!fn.length

const isUnaryFunction = (fn: unknown): fn is ((arg: unknown) => unknown) =>
	isFunction(fn) && fn.length === 1

const isBinaryFunction = (fn: unknown): fn is ((arg1: unknown, arg2: unknown) => unknown) =>
	isFunction(fn) && fn.length === 2

const isTernaryFunction = (fn: unknown): fn is ((arg1: unknown, arg2: unknown, arg3: unknown) => unknown) =>
	isFunction(fn) && fn.length === 3

const callFunction = (fn: unknown, ...args: unknown[]): unknown =>
	isFunction(fn) ? fn(...args) : undefined

const isNull = (value: unknown): value is null => value === null
const isNullish = (value: unknown): value is null | undefined => value == null
const isDefined = <T>(value: unknown): value is NonNullable<T> => value != null
const isFalse = (value: unknown): boolean => value === false
const isFalsy = (value: unknown): boolean => !value
const isTrue = (value: unknown): boolean => value === true
const isTruthy = (value: unknown): boolean => !!value

const isDefinedObject = (value: unknown): value is Record<PropertyKey, unknown> =>
	isDefined(value) && (isObject(value) || isFunction(value))

const isObjectOfType = (value: unknown, type: string): value is Record<PropertyKey, unknown> =>
	isDefinedObject(value) && (Symbol.toStringTag in value) && value[Symbol.toStringTag] === type

const hasProperty = <T>(obj: T, name: keyof T): obj is T & Record<PropertyKey, unknown> =>
	isDefinedObject(obj) && name in obj

const getProperty = <T>(obj: T, name: keyof T): T[keyof T] | undefined =>
	hasProperty(obj, name) ? obj[name] : undefined

const setProperty = <T>(obj: T, prop: keyof T, value: T[keyof T]): boolean =>
	hasProperty(obj, prop) && ((obj as Record<keyof T, unknown>)[prop] = value) ? true : false

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const hasMethod = <T, K extends keyof T>(obj: T, name: K): obj is T & Record<K, Function> =>
	isFunction(obj[name])

const callMethod = <T, K extends keyof T>(obj: T, name: K, ...args: unknown[]): unknown =>
	hasMethod(obj, name) ? obj[name](...args) : undefined

const isInstanceOf = (constructor: typeof Element) => (value: Node) =>
	value instanceof constructor

const isElement: (node: Node) => node is Element = isInstanceOf(Element)
const isComment: (node: Node) => node is Comment = (node: Node): node is Comment =>
	node.nodeType === Node.COMMENT_NODE

export {
	isOfType, isUndefined, isSymbol, isBoolean, isNumber, isString, isObject, isPropertyKey,
	isFunction, isNullaryFunction, isVariadicFunction, isUnaryFunction, isBinaryFunction, isTernaryFunction, callFunction,
	isNull, isNullish, isDefined, isFalse, isFalsy, isTrue, isTruthy,
	isDefinedObject, isObjectOfType, hasProperty, getProperty, setProperty, hasMethod, callMethod,
	isInstanceOf, isElement, isComment
}
