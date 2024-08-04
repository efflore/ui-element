import { isComment, isDefined } from '../is-type'
import { nothing, type UIFunctor, type UINothing } from '../maybe'
import { type UIDOMInstructionQueue, effect } from '../cause-effect'
import UIElement from '../ui-element'

/* === Type definitions === */

interface UIRef<T> extends UIFunctor<unknown> {
  (): T
  type: string
  // toString: () => string
  map: (fn: (host: UIElement, node: T) => T) => UIMaybeRef<T> | UIList<UIRef<T>>
  chain: (fn: (host: UIElement, node: T) => unknown) => unknown
  filter: (fn: (host: UIElement, node: T) => boolean) => UIMaybeRef<T>
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U>
  first: (selector: string) => UIRef<T>
  all: (selector: string) => UIList<UIRef<T>>
  on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>
  off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>
  text: (state: PropertyKey) => UIRef<T>
  prop: (key: PropertyKey, state?: PropertyKey) => UIRef<T>
  attr: (name: string, state?: PropertyKey) => UIRef<T>
  bool: (name: string, state?: PropertyKey) => UIRef<T>
  class: (token: string, state?: PropertyKey) => UIRef<T>
  style: (prop: string, state?: PropertyKey) => UIRef<T>
}

interface UIList<T> extends UIFunctor<unknown> {
  (): T[]
  type: string
  // toString: () => string
  map: (fn: (node: T) => T[]) => UIList<T>
  chain: (fn: (node: T) => T[]) => unknown
  filter: (fn: (node: T) => boolean) => UIList<T>
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U>
}

type UIMaybeRef<T> = UIRef<T> | UINothing<T>

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

/**
 * Return selector string for the id of the element
 * 
 * @param {string} id 
 * @returns {string} - id string for the element with '#' prefix
 * /
const idString = (id: string): string => id ? `#${id}` : '';

/**
 * Return a selector string for classes of the element
 * 
 * @param {DOMTokenList} classList - DOMTokenList to convert to a string
 * @returns {string} - class string for the DOMTokenList with '.' prefix if any
 * /
const classString = (classList: DOMTokenList): string => classList.length ? `.${Array.from(classList).join('.')}` : '';

/* === Exported functions === */

/**
 * Create a "list" container for an array of whatever, providing a chainable API for handling multiple values
 * 
 * @since 0.8.0
 * @param {unknown} items - array of items to wrap in a list container
 * @returns {UIList} - UIList instance for the given array
 */
const list = <T>(items: T[]): UIList<T> => {
  const l = ()  => items
  l.type = 'list'
  // l.toString = () => items.map(n => n.toString()).join('\n')
  l.map = (fn: Function): UIList<T> => list(items.map((item: T) => fn(item)))
  l.chain = (fn: Function): unknown => fn(items)
  l.filter = (fn: Function): UIList<T> => list(items.filter((item: T) => fn(item)))
  // l.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(l)
  return l
}

/* === Default export === */

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = <T>(host: UIElement, node: Element = host): UIRef<T> => {
  const el = (): Element => node
  el.type = node.localName
  // el.toString = () => `<${node.localName}${idString(node.id)}${classString(node.classList)}>`
  el.map = (fn: (host: UIElement, node: Element) => Element): UIRef<T> => ui(host, fn(host, node))
  el.chain = (fn: (host: UIElement, node: Element) => unknown): unknown => fn(host, node)
  el.filter = (fn: (host: UIElement, node: Element) => boolean): UIMaybeRef<T> => fn(host, node) ? ui(host, node) : nothing()
  // el.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(el)

  el.first = (selector: string): UIMaybeRef<T> => {
    const match = (host.shadowRoot || host).querySelector(selector)
    return match ? ui(host, match) : nothing()
  }

  el.all = (selector: string): UIList<UIRef<Element>> => {
    return list(Array.from((host.shadowRoot || host).querySelectorAll(selector)).map(node => ui(host, node)))
  }

  el.on = (event: string, handler: EventListenerOrEventListenerObject): UIRef<T> => {
    node.addEventListener(event, handler)
    return el as UIRef<T>
  }

  el.off = (event: string, handler: EventListenerOrEventListenerObject): UIRef<T> => {
    node.removeEventListener(event, handler)
    return el as UIRef<T>
  }

  el.text = (state: PropertyKey): UIRef<T> => {
    const fallback = node.textContent || '';
    host.set(state, fallback, false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => {
      const content = host.get(state)
      Array.from(node.childNodes).filter(isComment).forEach(match => match.remove())
      node.append(document.createTextNode(isDefined(content) ? String(content) : fallback))
    }))
    return el as UIRef<T>
  }

  el.prop = (key: PropertyKey, state: PropertyKey = key): UIRef<T> => {
    host.set(state, node[key], false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => node[key] = host.get(state)))
    return el as UIRef<T>
  }

  el.attr = (name: string, state: PropertyKey = name): UIRef<T> => {
    host.set(state, node.getAttribute(name), false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => {
      const value = host.get(state)
      isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name)
    }))
    return el as UIRef<T>
  }

  el.bool = (name: string, state: PropertyKey = name): UIRef<T> => {
    host.set(state, node.hasAttribute(name), false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => node.toggleAttribute(name, !!host.get(state))))
    return el as UIRef<T>
  }

  el.class = (token: string, state: PropertyKey = token): UIRef<T> => {
    host.set(state, node.classList.contains(token), false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => node.classList.toggle(token, !!host.get(state))))
    return el as UIRef<T>
  }

  el.style = (prop: string, state: PropertyKey = prop): UIRef<T> => {
    if (isStylable(node)) {
      host.set(state, node.style[prop], false)
      effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => node.style[prop] = host.get(state)))
    } else {
      console.error(`Style effect not supported for element type ${node.localName}`)
    }
    return el as UIRef<T>
  }

  return el as UIRef<T>
}

export { type UIRef, type UIList, ui as default, list }
