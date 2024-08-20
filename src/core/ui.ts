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
 * Create a new UI instance with the provided host UIElement
 *
 * @since 0.8.1
 * @param {UIElement} host - host UIElement for the new UI instance
 * @param {Element} target - target element to use for the new UI instance
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
   */
  (selector: string): UI<Element>[] => {
    return Array.from(getRoot(host).querySelectorAll(selector)).map(target => ui(host, target))
  }

export {
  type UI,
  ui, first, all
}
