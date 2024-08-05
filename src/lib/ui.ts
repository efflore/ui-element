import { isComment, isDefined } from '../is-type'
import { nothing, type UIFunctor, type UINothing } from '../maybe'
import { type UIDOMInstructionQueue, effect } from '../cause-effect'
import UIElement from '../ui-element'

/* === Type definitions === */

interface UIRef<T> extends UIFunctor<unknown> {                        // Unit: UI monad
  (): T                                                                // Flat: unwraps the container function
  // type: string
  // toString: () => string
  map: (fn: (host: UIElement, node: T) => T) => UIMaybeRef<T>          // Functor pattern
  chain: (fn: (host: UIElement, node: T) => unknown) => unknown        // Monad pattern
  filter: (fn: (host: UIElement, node: T) => boolean) => UIMaybeRef<T> // Filterable pattern
  // apply: <U>(other: UIFunctor<U>) => UIFunctor<U>                      // Applicative pattern
  on: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>
  off: (event: string, handler: EventListenerOrEventListenerObject) => UIRef<T>
  text: (state: PropertyKey) => UIRef<T>
  prop: (key: PropertyKey, state?: PropertyKey) => UIRef<T>
  attr: (name: string, state?: PropertyKey) => UIRef<T>
  bool: (name: string, state?: PropertyKey) => UIRef<T>
  class: (token: string, state?: PropertyKey) => UIRef<T>
  // only if the element has a style property, which is the case for HTMLElement, SVGElement, and MathMLElement
  style?: (prop: string, state?: PropertyKey) => UIRef<T>
  // the following methods are defined for UIElement
  first?: (selector: string) => UIRef<T>
  all?: (selector: string) => UIRef<T>[]
  targets?: (key: PropertyKey) => UIRef<Element>[]
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

/* === Default export === */

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = <T>(
  host: UIElement,
  node: Element = host
): UIRef<T> => {
  const el = (): Element => node
  // el.type = node.localName
  // el.toString = () => `<${node.localName}${idString(node.id)}${classString(node.classList)}>`
  el.map = (fn: (host: UIElement, node: Element) => Element): UIMaybeRef<T> => ui(host, fn(host, node))
  el.chain = (fn: (host: UIElement, node: Element) => unknown): unknown => fn(host, node)
  el.filter = (fn: (host: UIElement, node: Element) => boolean): UIMaybeRef<T> => fn(host, node) ? ui(host, node) : nothing()
  // el.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(el)

  el.on = (
    event: string,
    handler: EventListenerOrEventListenerObject
  ): UIRef<T> => {
    node.addEventListener(event, handler)
    return el as UIRef<T>
  }

  el.off = (event: string, handler: EventListenerOrEventListenerObject): UIRef<T> => {
    node.removeEventListener(event, handler)
    return el as UIRef<T>
  }

  const autoEffect = <V>(state: PropertyKey, fallback: V, setter: (value: V, fallback: V) => void) => {
    host.set(state, fallback, false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => setter(
      host.get(state),
      fallback
    )))
    return el as UIRef<T>
  }

  el.text = (state: PropertyKey): UIRef<T> => autoEffect<string>(
    state,
    node.textContent || '',
    (content: string, fallback: string) => {
      Array.from(node.childNodes).filter(isComment).forEach(match => match.remove())
      node.append(document.createTextNode(isDefined(content) ? String(content) : fallback))
    }
  )

  el.prop = (
    key: PropertyKey,
    state: PropertyKey = key
  ): UIRef<T> => autoEffect<unknown>(
    state,
    node[key],
    (value: unknown) => node[key] = value
  )

  el.attr = (
    name: string,
    state: PropertyKey = name
  ): UIRef<T> => autoEffect<string | null>(
    state,
    node.getAttribute(name),
    (value: string | undefined) =>
      isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name)
  )

  el.bool = (
    name: string,
    state: PropertyKey = name
  ): UIRef<T> => autoEffect<boolean>(
    state,
    node.hasAttribute(name),
    (value: boolean) =>
      node.toggleAttribute(name,  value)
  )

  el.class = (
    token: string,
    state: PropertyKey = token
  ): UIRef<T> => autoEffect<boolean>(
    state,
    node.classList.contains(token),
    (value: boolean) =>
      node.classList[value? 'add' : 'remove'](token)
  )

  if (isStylable(node)) {
    el.style = (
      prop: string,
      state: PropertyKey = prop
    ): UIRef<T> => autoEffect<string | undefined>(
      state,
      node.style[prop],
      (value: string | undefined) =>
        isDefined(value) ? node.style[prop] = String(value) : node.style.removeProperty(prop)
    )
  }

  if (host === node) {
    const root = (host.shadowRoot || host)

    el.first = (selector: string): UIMaybeRef<T> => {
      const match = root.querySelector(selector)
      return match ? ui(host, match) : nothing()
    }
  
    el.all = (selector: string): UIRef<Element>[] =>
      Array.from(root.querySelectorAll(selector)).map(node => ui(host, node)) // Arrays are monads too :-)

    el.targets = (key: PropertyKey): UIRef<Element>[] => {
      const targets = [] // Arrays are monads too :-)
      const state = host.signal(key)
      if (!state || !state.effects) return targets
      for (const effect of state.effects) {
        const t = effect.targets?.keys()
        if (t) for (const target of t)
          targets.push(ui(host, target))
      }
      return targets
    }
  }

  return el as UIRef<T>
}

export { type UIRef, type UIMaybeRef, ui as default }
