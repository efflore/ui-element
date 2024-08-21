import type { UIElement } from '../ui-element'
import { maybe } from './maybe'

/* === Types === */

interface UI<T extends Element> {
  host: UIElement,
  target: T,
}

/* === Helper Functions === */

/**
 * Get root for element queries within the custom element
 * 
 * @since 0.8.0
 * @param {UIElement} element
 * @returns {Element | ShadowRoot}
 */
const getRoot = (element: UIElement): Element | ShadowRoot =>
  element.shadowRoot || element

/* === Exported Functions === */

/**
 * Create a new UI object with the provided host UIElement
 *
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI object
 * @param {Element} target - target element to use for the new UI object
 * @returns {UI<T>} - UI object with the provided host UIElement and target element
 */
const ui = <T extends Element>(host: UIElement, target: T): UI<T> => {
  return { host, target }
}

/**
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 */
const first = (host: UIElement) =>
  
  /**
   * @since 0.8.1
   * @param {string} selector - CSS selector to match against the host UIElement
   * @returns {UI<Element>[]} - array of zero or one UI objects with the matching element in the host UIElement
   */
  (selector: string): UI<Element>[] => {
    return maybe(getRoot(host).querySelector(selector)).map(target => ui(host, target))
  }

/**
 * 
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 */
const all = (host: UIElement) => 

  /**
   * @since 0.8.1
   * @param {string} selector - CSS selector to match against elements in the host UIElement
   * @returns {UI<Element>[]} - array UI objects with the matching elements in the host UIElement
   */
  (selector: string): UI<Element>[] => {
    return Array.from(getRoot(host).querySelectorAll(selector)).map(target => ui(host, target))
  }

export {
  type UI,
  ui, first, all
}
