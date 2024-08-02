import { isFunction, isObject, isNullish } from './is-type'

/* === Types === */

interface UIContainer {                                // Unit
  (): unknown                                          // Flatten: unwraps the container function
  type: string                                         // type of the container
  toString: () => string                               // string representation of the container
  map: (fn: Function) => UIContainer                   // Functor pattern
}

interface UISomething<T> extends UIContainer {         // Unit
  (): unknown                                          // Flatten: unwraps the container function
  or: (_: unknown) => unknown                          // fallback value; ignored for "something" containers
  map: (fn: Function) => UIMaybe<T>                    // Functor pattern
  chain: (fn: Function) => unknown                     // Bind operation
  filter: (fn: Function) => UISomething<T> | UINothing // Filter operation
  apply: (other: UIContainer) => UIContainer           // Applicative pattern
}

interface UINothing extends UIContainer {              // Unit
  (): void                                             // Flatten: unwraps the container function
  or: (value: unknown) => unknown                      // fallback value; returned for "nothing" containers
  map: (fn: Function) => UINothing                     // Functor pattern
  chain: (fn: Function) => unknown                     // Bind operation
  filter: (fn: Function) => UINothing                  // Filter operation
  apply: (other: UIContainer) => UIContainer           // Applicative pattern
}

type UIMaybe<T> = UISomething<T> | UINothing           // Unit: Maybe monad

/* === Exported Functions === */

/**
 * Unwrap any value wrapped in a container
 * 
 * @since 0.8.0
 * @param {unknown} value - value to unwrap if it's a container function
 * @param {unknown[]} args - additional arguments to pass to the container function
 * @returns {unknown} - unwrapped value
 */
const unwrap = (value: unknown, ...args: unknown[]): unknown => isFunction(value) ? unwrap(value(...args)) : value

/**
 * Check if a given value is nothing
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
const isNothing = (value: unknown): boolean => isNullish(value) ||
  (isObject(value) && ('type' in value) && value.type !== 'nothing')

/**
 * Check if a given value is something
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is something, false otherwise
 */
const isSomething = (value: unknown): boolean => !isNothing(value)

/**
 * Create a container for a given value to gracefully handle nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {UIMaybe<T>} - container of either "something" or "nothing" for the given value
 */
const maybe = <T>(value: T): UIMaybe<T> => isNothing(value) ? nothing() : something(value)

/**
 * Create a "something" container for a given value, providing a chainable API for handling nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a "something" container
 * @returns {UISomething} - container of "something" type for the given value
 */
const something = <T>(value: T): UISomething<T> => {
  const j = (): T => value
  j.type = typeof value
  j.toString = (): string => isObject(value) ? JSON.stringify(value) : String(value)
  j.or = (_: unknown): unknown => value
  j.map = (fn: Function): UISomething<T> | UINothing => maybe(fn(value))
  j.chain = (fn: Function): unknown => fn(value)
  j.filter = (fn: Function): UISomething<T> | UINothing => fn(value) ? something(value) : nothing()
  j.apply = (container: UIContainer): UIContainer => isFunction(value) ? container.map(value) : container.map(j)
  return j
};

/**
 * Create a "nothing" container for a given value, providing a chainable API for handling nullable values
 * 
 * @since 0.8.0
 * @returns {UINothing} - container of "nothing" at all
 */
const nothing = (): UINothing => {
  const n = (): void => undefined
  n.type = 'nothing'
  n.toString = (): string => ''
  n.or = (value: unknown): unknown => value
  n.map = n.filter = (_: Function): UINothing => nothing()
  n.chain = (fn: Function): unknown => fn()
  n.apply = (container: UIContainer): UIContainer => container.map(n)
  return n
};

export { unwrap, isNothing, isSomething, maybe, something, nothing }