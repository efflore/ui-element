import type { UI, StateLike } from '../ui-element';
/**
 * Add event listener to a target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to add
 */
declare const on: <E extends Element>(event: string, handler: EventListener) => (ui: UI<E>) => UI<E>;
/**
 * Remove event listener from target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to remove
 */
declare const off: <E extends Element>(event: string, handler: EventListener) => (ui: UI<E>) => UI<E>;
/**
 * Auto-Effect to emit a custom event when a state changes
 *
 * @since 0.8.3
 * @param {string} event - event name to dispatch
 * @param {StateLike} state - state key
 */
declare const emit: <E extends Element>(event: string, state?: StateLike<unknown>) => (ui: UI<E>) => UI<E>;
export { on, off, emit };
