import type { UIElement } from '../ui-element';
/**
 * Toggle an internal state of an element based on given state
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
declare const toggleInternal: <E extends UIElement>(host: E, name: string, ariaProp?: string) => void;
/**
 * Set ElementInternals ARIA property and attribute based on given state
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
declare const setInternal: <E extends UIElement>(host: E, name: string, ariaProp: string) => void;
/**
 * Synchronize internal states of an element with corresponding HTML attributes and aria properties
 *
 * @param host host UIElement to sync internals
 */
declare const syncInternals: (host: UIElement) => void;
export { syncInternals, toggleInternal, setInternal };
