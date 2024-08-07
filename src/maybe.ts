import { isDefinedObject, isFunction, /* isDefinedObject, */ isNullish, isSymbol } from './is-type'

/* === Types === */

interface UIContainer<T> {                        // Unit
  (): T                                           // Flat: unwraps the container value
  type?: symbol                                   // type of the container
  toString?: () => string                         // string representation of the container
}

// We deliberately don't extends UIContainer so native arrays also satify the UIFunctor interface
interface UIFunctor<T> {                          // Unit
  map: <V>(fn: (value: T) => V) => UIFunctor<V>   // Functor pattern
}

interface UISomething<T> extends UIFunctor<T> {   // Unit: Something monad
  (): T                                           // Flat: unwraps the container function
  map: <V>(fn: (value: T) => V) => UIMaybe<V>     // Functor pattern; returned for "something" containers
  or: () => UISomething<T>                        // Fallback value; ignored for "something" containers
  // chain: (fn: Function) => unknown                // Monad pattern
  // filter: (fn: Function) => UIMaybe<T>            // Filterable pattern
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U> // Applicative pattern
}

interface UINothing extends UIFunctor<void> {      // Unit: Nothing monad
  (): void                                         // Flat: unwraps the container function
  map: () => UINothing                             // Functor pattern; ignored for "nothing" containers
  or: <V>(fn: () => V) => UIMaybe<V>               // Fallback value; returned for "nothing" containers
  // chain: (fn: Function) => unknown                 // Monad pattern
  // filter: (fn: Function) => UINothing              // Filterable pattern
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U>  // Applicative pattern
}

type UIMaybe<T> = UISomething<T> | UINothing        // Unit: Maybe monad

/* === Constants === */

const TYPE_NOTHING = Symbol()

/* === Exported Functions === */

/**
 * Unwrap any value wrapped in a function
 * 
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value
 */
const unwrap = (value: any): any => isFunction(value) ? unwrap(value()) : value;

/**
 * Compose functions from right to left
 * 
 * @since 0.8.0
 * @param {Function[]} fns - functions to compose
 * @returns {Function} - composed function
 * /
const compose = (...fns: Function[]): Function => (x: unknown) => fns.reduceRight((y, f) => f(y), x);

/**
 * Check if an object has a method of given name
 * 
 * @since 0.8.0
 * @param {object} obj - object to check
 * @returns {boolean} - true if the object has a method of the given name, false otherwise
 */
const hasMethod = (obj: object, name: string): boolean => obj && isFunction(obj[name])

/**
 * Check if a given value is a UIContainer of a given type
 * 
 * @param {unknown} value - value to check
 * @param {symbol[]} allowedTypes - allowed types of UIContainer
 * @returns {(value: unknown) => value is UIContainer<unknown>} - partially applied function that checks if the given value is a UIContainer of the given type
 */
const isContainerOf = (value: unknown, allowedTypes: symbol[] = []): value is UIContainer<unknown> =>
  isFunction(value) && 'type' in value && (!allowedTypes.length || isSymbol(value.type) && allowedTypes.includes(value.type))

/**
 * Check if a given value is a functor
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
const isFunctor = (value: unknown): value is UIFunctor<unknown> =>
  isDefinedObject(value) && hasMethod(value, 'map')

/**
 * Check if a given value is nothing
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
const isNothing = (value: unknown): boolean =>
  isNullish(value) || isContainerOf(value, [TYPE_NOTHING])

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
  // j.type = Symbol(typeof value)
  j.toString = (): string => String(value)
  j.map = <V>(fn: (value: T) => V): UIMaybe<V> => maybe(fn(value))
  j.or = (): UISomething<T> => something(value)
  // j.chain = (fn: Function): unknown => fn(value)
  // j.filter = (fn: Function): UIMaybe<T> => fn(value) ? something(value) : nothing()
  // j.apply = <T>(other: UIFunctor<T>): UIFunctor<T> => isFunction(value) ? other.map(value) : other.map(j)
  return j
};

/**
 * Create a "nothing" container for a given value, providing a chainable API for handling nullable values
 * 
 * @since 0.8.0
 * @returns {UINothing} - container of "nothing" at all
 */
const nothing = (): UINothing => new Proxy((): void => {}, {
  get: (_: any, prop: string): unknown => {
    return (prop === 'type') ? TYPE_NOTHING
      : (prop === 'toString') ? () => ''
      : (prop === 'or') ? <V>(fn: () => V): UIMaybe<V> => maybe(fn())
      // : (prop === 'chain') ? (fn: Function): unknown => fn()
      : (): UINothing => nothing()
  }
});

export {
  type UIContainer, type UIFunctor, type UIMaybe, type UISomething, type UINothing,
  unwrap, /* compose, */ hasMethod, isContainerOf, isFunctor, isNothing, isSomething, maybe, something, nothing
}
