import { isFunction, /* isDefinedObject, */ isNullish } from './is-type'

/* === Types === */

interface UIContainer<T> {                        // Unit
  (): T                                           // Flat: unwraps the container value
  type?: string                                   // type of the container
  toString?: () => string                         // string representation of the container
}

interface UIFunctor<T> {                          // Unit
  map: (fn: Function) => UIFunctor<T>             // Functor pattern
}

interface UISomething<T> extends UIFunctor<T> {   // Unit: Something monad
  (): T                                           // Flat: unwraps the container function
  or: (_: unknown) => unknown                     // fallback value; ignored for "something" containers
  map: (fn: Function) => UIMaybe<T>               // Functor pattern
  chain: (fn: Function) => unknown                // Monad pattern
  filter: (fn: Function) => UIMaybe<T>            // Filterable pattern
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U> // Applicative pattern
}

interface UINothing<T> extends UIFunctor<T> {      // Unit: Nothing monad
  (): T                                            // Flat: unwraps the container function
  or: (value: unknown) => unknown                  // fallback value; returned for "nothing" containers
  map: (fn: Function) => UINothing<T>              // Functor pattern
  chain: (fn: Function) => unknown                 // Monad pattern
  filter: (fn: Function) => UINothing<T>           // Filterable pattern
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U>  // Applicative pattern
}

type UIMaybe<T> = UISomething<T> | UINothing<T>     // Unit: Maybe monad

/* === Constants === */

const TYPE_NOTHING = 'nothing'

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
 */
const compose = (...fns: Function[]): Function => (x: unknown) => fns.reduceRight((y, f) => f(y), x);

/**
 * Check if a given value is a container function
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function
 */
const isAnyContainer = (value: unknown): value is UIContainer<unknown> => isFunction(value) && 'type' in value;

/**
 * Check if a given value is a container function
 * 
 * @since 0.8.0
 * @param {string} type - expected container type
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function of the given type
 */
const isContainer = (type: string, value: unknown): boolean => isAnyContainer(value) && value.type === type

/**
 * Check if an object has a method of given name
 */
const hasMethod = (obj: object, methodName: string): boolean => obj && isFunction(obj[methodName])

/**
 * Check if a given value is a functor
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
const isFunctor = (value: unknown): value is UIFunctor<unknown> => isAnyContainer(value) && hasMethod(value, 'map')

/**
 * Check if a given value is nothing
 * 
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
const isNothing = (value: unknown): boolean => isNullish(value) || isContainer(TYPE_NOTHING, value)

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
  // j.toString = (): string => isDefinedObject(value) ? JSON.stringify(value) : String(value)
  j.or = (_: unknown): unknown => value
  j.map = (fn: Function): UIMaybe<T> => maybe(fn(value))
  j.chain = (fn: Function): unknown => fn(value)
  j.filter = (fn: Function): UIMaybe<T> => fn(value) ? something(value) : nothing()
  // j.apply = <T>(other: UIFunctor<T>): UIFunctor<T> => isFunction(value) ? other.map(value) : other.map(j)
  return j
};

/**
 * Create a "nothing" container for a given value, providing a chainable API for handling nullable values
 * 
 * @since 0.8.0
 * @returns {UINothing<T>} - container of "nothing" at all
 */
const nothing = <T>(): UINothing<T> => new Proxy((): undefined => undefined, {
  get: (_: any, prop: string): unknown => {    
    switch (prop) {
      case 'type': return TYPE_NOTHING
      case 'toString': return () => ''
      case 'or': return (value: unknown): unknown => value
      case 'chain': return (fn: Function): unknown => fn()
      default: return (): UINothing<T> => nothing()
    }
  }
});

export { type UIContainer, type UIFunctor, type UIMaybe, type UISomething, type UINothing, unwrap, compose, isAnyContainer, isContainer, hasMethod, isFunctor, isNothing, isSomething, maybe, something, nothing }