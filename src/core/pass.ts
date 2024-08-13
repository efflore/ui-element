import { isFunction } from './is-type'
import { type Signal, cause, isSignal } from '../cause-effect'
import { UIElement } from '../ui-element'
// import { hasMethod } from './is-type'
// import { log, LOG_ERROR } from './log'

/* === Types === */

type StateMap = Record<PropertyKey, PropertyKey | Signal<unknown> | (() => unknown)>

/* === Exported Function === */

/**
 * Pass states from one UIElement to another
 * 
 * @since 0.8.0
 * @param stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
const pass = <E extends UIElement>(stateMap: StateMap) =>

  /**
   * Partially applied function that connects to params of UI map function
   * 
   * @param host - source UIElement to pass states from
   * @param target - destination UIElement to pass states to
   * @returns - Promise that resolves when target UIElement is defined and got passed states
   */
  async (host: UIElement, target: E): Promise<E> => {
    await (host.constructor as typeof UIElement).registry.whenDefined(target.localName)
    /* if (!hasMethod(target, 'set')) {
      log(target, 'Expected UIElement', LOG_ERROR)
      return
    } */
    for (const [key, source] of Object.entries(stateMap))
      target.set(key, isSignal(source) ? source
        : isFunction(source) ? cause(source)
        : host.signal(source)
      )
    return target
  }

export { pass }
