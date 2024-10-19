import type { UI, UIElement, StateLike } from '../ui-element'
import { isSignal, state } from '../cause-effect'
import { isFunction } from '../core/is-type'

/* === Types === */

type StateMap = Record<PropertyKey, StateLike<unknown>>

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
	async (ui: UI<E>): Promise<UI<E>> => {
		await (ui.host.constructor as typeof UIElement).registry.whenDefined(ui.target.localName)
		for (const [key, source = key] of Object.entries(stateMap))
			ui.target.set(
				key,
				isSignal(source)
					? source
					: isFunction(source)
						? state(source) // we need state() here; with computed() the lexical scope of the source would be lost
						: ui.host.signals.get(source)
			)
		return ui
	}

export { type StateMap, pass }
