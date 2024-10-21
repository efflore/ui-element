import type { UIElement, StateLike } from '../ui-element'
import type { UI } from '../core/ui'
import { isFunction, isPropertyKey } from '../core/is-type'
import { isSignal, state } from '../core/cause-effect'

/* === Types === */

type StateMap = Record<PropertyKey, StateLike<unknown>>

/* === Exported Type === */

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
		for (const [key, source = key] of Object.entries(stateMap)) {
			const value = isPropertyKey(source) ? ui.host.signals.get(source) // shorthand for signals with PropertyKey keys
				: isSignal(source) ? source // just copy the signal reference
			    // : isNullaryFunction(source) ? computed(source) // create a computed signal
				: isFunction(source) ? state(source) // create a state signal with a function value
				: ui.host.signals.get(source) // map keys can be anything, so try this as last resort
			ui.target.set(key, value)
		}
		return ui
	}

export { type StateMap, pass }
