import type { UIElement, StateLike } from '../ui-element'
import type { UI } from '../core/ui'
import { cause, isSignal } from '../cause-effect'
import { isFunction } from '../core/is-type'

/* === Types === */

type StateMap = Record<PropertyKey, StateLike>

/* === Exported Function === */

/**
 * Pass states from one UIElement to another
 * 
 * @since 0.8.0
 * @param {StateMap} stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
const pass = <E extends UIElement>(stateMap: StateMap) =>

	/**
	 * Partially applied function that connects to params of UI map function
	 * 
	 * @param {UI<E>} ui - source UIElement to pass states from
	 * @returns - Promise that resolves to UI object of the target UIElement, when it is defined and got passed states
	 */
	async ({ host, target }: UI<E>): Promise<UI<E>> => {
		await (host.constructor as typeof UIElement).registry.whenDefined(target.localName)
		for (const [key, source] of Object.entries(stateMap))
			target.set(key, isSignal(source) ? source : isFunction(source) ? cause(source) : host.signal(source))
		return { host, target }
	}

export { type StateMap, pass }
