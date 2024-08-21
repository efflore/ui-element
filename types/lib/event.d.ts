import type { UI } from '../core/ui';
/**
 * Add event listener to a target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to add
 */
declare const on: <E extends Element>(event: string, handler: EventListener) => ({ host, target }: UI<E>) => UI<E>;
/**
 * Remove event listener from target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to remove
 */
declare const off: <E extends Element>(event: string, handler: EventListener) => ({ host, target }: UI<E>) => UI<E>;
/**
 * Auto-Effect to dispatch a custom event when a state changes
 *
 * @since 0.8.1
 * @param {string} event - event name to dispatch
 * @param {PropertyKey} state - state key
 */
declare const dispatch: <E extends Element>(event: string, state?: PropertyKey) => ({ host, target }: UI<E>) => UI<E>;
export { on, off, dispatch };
