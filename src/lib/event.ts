import type { UI } from '../core/ui'

/* === Exported Function === */

/**
 * Add event listener to a host element and update a state when the event occurs
 * 
 * @since 0.8.0
 * @param {string} event - event name to listen to
 * @param {PropertyKey} state - state key to update when the event occurs
 * @param {(e: Event, v: T) => T | undefined} setter - function to set the state when the event occurs; return a nullish value to cancel the update
 * @returns - returns a function to remove the event listener when no longer needed
 */
const on = <E extends Element, T>(event: string, state: PropertyKey, setter: (e: Event, v: T) => T | undefined) =>

  /**
   * Partially applied function to connect to params of UI map function
   * 
   * @param {UI<E>} target - target element to listen to events
   * @returns - returns ui object of the target
   */
  ({ host, target }: UI<E>): UI<E> => {
    const handler = (e: Event) => host.set(state, (v: T) => setter(e, v) ?? v) // if the setter returns nullish, we return the old value
    target.addEventListener(event, handler)
    return { host, target }
  }

export { on }
