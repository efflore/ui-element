import { maybe } from '../core/maybe'
import type { UIElement } from '../ui-element'

/* === Exported Function === */

/**
 * Add event listener to a host element and update a state when the event occurs
 * 
 * @since 0.8.0
 * @param event - event name to listen to
 * @param key - state key to update when the event occurs
 * @param setter - function to set the state when the event occurs; return a nullish value to cancel the update
 * @returns - returns a function to remove the event listener when no longer needed
 */
const on = (event: string, key: PropertyKey, setter: <T>(e: Event) => T) =>

  /**
   * Partially applied function to connect to params of UI map function
   * 
   * @param host - host UIElement instance with state
   * @param target - target element to listen to events
   * @returns - returns a function to remove the event listener when no longer needed
   */
  (host: UIElement, target: HTMLElement) => {
    const handler = (e: Event) => maybe(setter(e)).map(v => host.set(key, v))
    target.addEventListener(event, handler)
    return () => target.removeEventListener(event, handler)
  }

export { on }
