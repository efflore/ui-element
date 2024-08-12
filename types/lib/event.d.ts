import type { UIElement } from '../ui-element';
/**
 * Add event listener to a host element and update a state when the event occurs
 *
 * @since 0.8.0
 * @param event - event name to listen to
 * @param key - state key to update when the event occurs
 * @param setter - function to set the state when the event occurs; return a nullish value to cancel the update
 * @returns - returns a function to remove the event listener when no longer needed
 */
declare const on: (event: string, key: PropertyKey, setter: <T>(e: Event) => T) => (host: UIElement, target: HTMLElement) => () => void;
export { on };
