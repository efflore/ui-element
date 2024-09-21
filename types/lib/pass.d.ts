import type { UIElement, StateLike } from '../ui-element';
import type { UI } from '../core/ui';
type StateMap = Record<PropertyKey, StateLike>;
/**
 * Pass states from one UIElement to another
 *
 * @since 0.8.0
 * @param {StateMap} stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
declare const pass: <E extends UIElement>(stateMap: StateMap) => ({ host, target }: UI<E>) => Promise<UI<E>>;
export { type StateMap, pass };
