import { type Signal } from '../cause-effect';
import { UIElement } from '../ui-element';
type StateMap = Record<PropertyKey, PropertyKey | Signal<unknown> | (() => unknown)>;
/**
 * Pass states from one UIElement to another
 *
 * @since 0.8.0
 * @param stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
declare const pass: <E extends UIElement>(stateMap: StateMap) => (host: UIElement, target: E) => Promise<E>;
export { type StateMap, pass };
