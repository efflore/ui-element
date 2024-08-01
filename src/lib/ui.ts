import { type UIDOMInstructionQueue, is, effect } from '../cause-effect'
import UIElement from '../ui-element'

/* === Type definitions === */

type UIRef = {
  (): Element
  first: (selector: string) => UIRef | undefined
  all: (selector: string) => UIRef[]
  on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef | undefined
  off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef | undefined
  setText: (content: string) => void
  text: (stateKey: PropertyKey) => UIRef | undefined
  prop: (propKey: PropertyKey, stateKey?: PropertyKey) => UIRef | undefined
  attr: (name: string, stateKey?: PropertyKey) => UIRef | undefined
  bool: (name: string, stateKey?: PropertyKey) => UIRef | undefined
  class: (token: string, stateKey?: PropertyKey) => UIRef | undefined
  style: (prop: string, stateKey?: PropertyKey) => UIRef | undefined
}

/* Internal functions === */

/**
 * Check if a given variable is an element which can have a style property
 * 
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node: Element): node is HTMLElement | SVGElement | MathMLElement => {
  for (const type of [HTMLElement, SVGElement, MathMLElement]) {
    if (node instanceof type) return true
  }
  return false
}

/* === Exported function === */

/**
 * Check if a given variable is defined
 * 
 * @since 0.7.0
 * @param {unknown} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = (value: unknown): value is NonNullable<unknown> => !is('undefined', value) && value !== null

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = (host: UIElement, node: Element = host): UIRef => {
  const root = host.shadowRoot || host
  const autoEffect = (
    stateKey: PropertyKey,
    fallback: any,
    setter: () => void
  ): void => {
    if (!node) return
    host.set(stateKey, fallback, false)
    effect((q: UIDOMInstructionQueue) => host.has(stateKey) && q(node, setter))
  }

  // return native DOM element
  const el = (): Element => node

  // return first matching selector as UIRef or undefined
  el.first = (selector: string): UIRef | undefined => {
    const match = root.querySelector(selector)
    return match && ui(host, match)
  }

  // return all matching selectors as UIRef array
  el.all = (selector: string): UIRef[] =>
    Array.from(root.querySelectorAll(selector)).map(match => ui(host, match))

  el.on = (event: string, handler: EventListenerOrEventListenerObject): UIRef | undefined => {
    node && node.addEventListener(event, handler)
    return el
  }

  el.off = (event: string, handler: EventListenerOrEventListenerObject): UIRef | undefined => {
    node && node.removeEventListener(event, handler)
    return el
  }

  // set text content of the element while preserving comments
  el.setText = (content: string): void => {
    if (!node) return
    Array.from(node.childNodes)
      .filter(match => match.nodeType !== Node.COMMENT_NODE)
      .forEach(match => match.remove())
    node.append(document.createTextNode(content))
  }

  // sync text content of the element with given state by key
  el.text = (stateKey: PropertyKey): UIRef | undefined => {
    const fallback = node?.textContent || ''
    autoEffect(stateKey, fallback, () => {
      const content = host.get(stateKey)
      el.setText(isDefined(content) ? String(content) : fallback)
    })
    return el
  }

  // sync given property of the element with given state by key
  el.prop = (
    key: PropertyKey,
    stateKey: PropertyKey = key
  ): UIRef | undefined => {
    autoEffect(stateKey, node[key], () => el[key] = host.get(stateKey))
    return el
  }

  // sync given attribute of the element with given state by key
  el.attr = (
    name: string,
    stateKey: PropertyKey = name
  ): UIRef | undefined => {
      autoEffect(stateKey, node.getAttribute(name), () => {
      const value = host.get(stateKey)
      isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name)
    })
    return el
  }

  // sync given boolean attribute of the element with given state by key
  el.bool = (
    name: string,
    stateKey: PropertyKey = name
  ): UIRef | undefined => {
    autoEffect(stateKey, node.hasAttribute(name), () => node.toggleAttribute(name, !!host.get(stateKey)))
    return el
  }

  // sync given class of the element with given state by key
  el.class = (
    token: string,
    stateKey: PropertyKey = token
  ): UIRef | undefined => {
    autoEffect(stateKey, node.classList.contains(token), () => node.classList.toggle(token, !!host.get(stateKey)))
    return el
  }

  // sync given style property of the element with given state by key
  el.style = (
    prop: string,
    stateKey: PropertyKey = prop
  ): UIRef | undefined => {
    isStylable(node)
      ? autoEffect(stateKey, node.style.getPropertyValue(prop), () => node.style.setProperty(prop, String(host.get(stateKey))))
      : console.warn('Cannot sync style property', prop, 'on non-stylable element')
    return el
  }

  // return UIRef instance
  return el
}

export { type UIRef, ui as default, isDefined }
