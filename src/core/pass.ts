import { isFunction } from './is-type'
import { type Signal, cause, isSignal } from '../cause-effect'
import { UIElement } from '../ui-element'

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
const pass = <E extends UIElement>(host: UIElement, stateMap: StateMap) =>

  /**
   * Partially applied function that connects to params of UI map function
   * 
   * @param ui - source UIElement to pass states from
   * @returns - Promise that resolves to UI object of the target UIElement, when it is defined and got passed states
   */
  async function (target: E): Promise<E> {
    await (host.constructor as typeof UIElement).registry.whenDefined(target.localName)
    for (const [key, source] of Object.entries(stateMap))
      target.set(key, isSignal(source) ? source
        : isFunction(source) ? cause(source)
        : host.signal(source)
      )
    return target
  }

export { type StateMap, pass }
