import type { UIElement } from '../ui-element'

/* === Type Definitions === */

interface UI<A extends Element> {
  elements: A[],
  host: UIElement,
  map: <B extends Element>(f: (host: UIElement, element: A) => B) => UI<B>
}

/* === Exported Function === */

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element[]} elements - native DOM elements to wrap
 * @returns {UI} - UIRef instance for the given element
 */
const ui = <A extends Element>(host: UIElement, elements: A[]): UI<A> => ({
  elements,
  host,
  map: <B extends Element>(f: (host: UIElement, elements: A) => B): UI<B> =>
    ui(host, elements.map(el => f(host, el)))
})

export { type UI, ui }
