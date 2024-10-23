import { type AttributeParser } from '../core/parse';
import type { UIElement } from '../ui-element';
/**
 * Toggle an internal state of an element based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
declare const toggleInternal: <E extends UIElement>(name: string, ariaProp?: string) => (host: E) => void;
/**
 * Set ElementInternals ARIA property and attribute based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
declare const setInternal: <E extends UIElement>(name: string, ariaProp: string, parser: AttributeParser<unknown>) => (host: E) => void;
/**
 * Use element internals; will setup the global disabled and hidden states if they are observed attributes
 */
declare const useInternals: (host: UIElement) => boolean;
/**
 * Use a busy state for a live region and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the busy state was successfully setup
 */
declare const useBusy: (host: UIElement) => boolean;
/**
 * Use a checked state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @param {boolean} [isTriState=false] - whether to support tri-state checked state
 * @returns {boolean} - whether the checked state was successfully setup
 */
declare const useChecked: (host: UIElement, isTriState?: boolean) => boolean;
declare const useCurrent: (host: UIElement, isEnumState?: boolean) => boolean;
/**
 * Use a disabled state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the disabled state was successfully setup
 */
declare const useDisabled: (host: UIElement) => boolean;
/**
 * Use an expanded state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the expanded state was successfully setup
 */
declare const useExpanded: (host: UIElement) => boolean;
/**
 * Use a hidden state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the hidden state was successfully setup
 */
declare const useHidden: (host: UIElement) => boolean;
/**
 * Use an invalid state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the invalid state was successfully setup
 ** /
const useInvalid = (host: UIElement): boolean => {
    log(host, 'Invalid state is not yet supported.', LOG_WARN)
    // Implementation pending - we need to use checkValidity() / setValidity() instead of boolean internal
    return false
} */
/**
 * Use a pressed state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the pressed state was successfully setup
 */
declare const usePressed: (host: UIElement, isTriState?: boolean) => boolean;
/**
 * Use a selected state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the selected state was successfully setup
 */
declare const useSelected: (host: UIElement) => boolean;
export { toggleInternal, setInternal, useBusy, useChecked, useCurrent, useInternals, useDisabled, useExpanded, useHidden, usePressed, useSelected, };
