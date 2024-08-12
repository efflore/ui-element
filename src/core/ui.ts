import type { UIElement } from '../ui-element'

/* === Type Definitions === */

interface UI<T extends Element> {
  get: () => T,
  map: (f: (host: UIElement, node: T) => unknown) => UI<T>
}

/* === Exported Function === */

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UI} - UIRef instance for the given element
 */
const ui = <T extends Element>(host: UIElement, node: T): UI<T> => ({
  get: () => node,
  map: (f: (host: UIElement, node: T) => T): UI<T> => {
    f(host, node)
    return ui(host, node)
  }
})

export { type UI, ui }
