import { effect } from '../cause-effect'
import type { UI } from '../core/ui'

/**
 * Add event listener to a target element
 * 
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to add
 */
const on = <E extends Element>(event: string, handler: EventListener) =>

  /**
   * Partially applied function to connect to params of UI map function
   * 
   * @param {UI<E>} ui - UI object of target element to listen to events
   * @returns - returns ui object of the target
   */
  ({ host, target }: UI<E>): UI<E> => {
    target.addEventListener(event, handler)
    return { host, target }
  }

/**
 * Remove event listener from target element
 * 
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to remove
 */
const off = <E extends Element>(event: string, handler: EventListener) =>

  /**
   * Partially applied function to connect to params of UI map function
   * 
   * @param {UI<E>} ui - UI object of target element to listen to events
   * @returns - returns ui object of the target
   */
  ({ host, target }: UI<E>): UI<E> => {
    target.removeEventListener(event, handler)
    return { host, target }
  }

/**
 * Auto-Effect to dispatch a custom event when a state changes
 * 
 * @since 0.8.1
 * @param {string} event - event name to dispatch
 * @param {PropertyKey} state - state key
 */
const dispatch = <E extends Element>(event: string, state: PropertyKey = event) =>

  /**
   * Partially applied function to connect to params of UI map function
   * 
   * @param {UI<E>} ui - UI object of target element to listen to events
   * @returns - returns ui object of the target
   */
  ({ host, target }: UI<E>): UI<E> => {
    effect(() => {
      target.dispatchEvent(new CustomEvent(event, {
        detail: host.get(state),
        bubbles: true
      }))
    })
    return { host, target }
  }

export { on, off, dispatch }
