import type { UI } from '../core/ui';
/**
 * Add event listener to a host element and update a state when the event occurs
 *
 * @since 0.8.0
 * @param {string} event - event name to listen to
 * @param {PropertyKey} state - state key to update when the event occurs
 * @param {(e: Event, v: T) => T | undefined} setter - function to set the state when the event occurs; return a nullish value to cancel the update
 * @returns - returns a function to remove the event listener when no longer needed
 */
declare const on: <E extends Element, T>(event: string, state: PropertyKey, setter: (e: Event, v: T) => T | undefined) => ({ host, target }: UI<E>) => UI<E>;
export { on };
