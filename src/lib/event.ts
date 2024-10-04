import { effect } from '../cause-effect'
import type { UI, StateLike } from '../ui-element'

/* === Exported Functions === */

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
	(ui: UI<E>): UI<E> => {
		ui.target.addEventListener(event, handler)
		return ui
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
	(ui: UI<E>): UI<E> => {
		ui.target.removeEventListener(event, handler)
		return ui
	}

/**
 * Auto-Effect to emit a custom event when a state changes
 * 
 * @since 0.8.3
 * @param {string} event - event name to dispatch
 * @param {StateLike<unknown>} state - state key
 */
const emit = <E extends Element>(event: string, state: StateLike<unknown> = event) =>

	/**
	 * Partially applied function to connect to params of UI map function
	 * 
	 * @param {UI<E>} ui - UI object of target element to listen to events
	 * @returns - returns ui object of the target
	 */
	(ui: UI<E>): UI<E> => {
		effect(() => {
			ui.target.dispatchEvent(new CustomEvent(event, {
				detail: ui.host.get(state),
				bubbles: true
			}))
		})
		return ui
	}

export { on, off, emit }
