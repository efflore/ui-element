import { type Functor, isComment, isDefined } from './is-type'
import { type Maybe, maybe } from './maybe'
import { type UIDOMInstructionQueue, effect } from '../cause-effect'
import type { UIElement } from '../ui-element'

/* === Type definitions === */

interface UIRef<T> extends Functor<T> {                              // Unit: UI monad
  (): T                                                                // Flat: unwraps the container function
  // type: string
  // toString: () => string
  map: <V>(fn: (node: T, host: UIElement) => V) => MaybeRef<V>       // Functor pattern
  // chain: (fn: (node: T, host: UIElement) => unknown) => unknown        // Monad pattern
  // filter: (fn: (node: T, host: UIElement) => boolean) => MaybeRef<T> // Filterable pattern
  // apply: <U>(other: Functor<U>) => Functor<U>                      // Applicative pattern
  on: (event: string, handler: EventListenerOrEventListenerObject) => () => void
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
}

type MaybeRef<T> = UIRef<T> | Maybe<T>

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
 * @param {Element} node - native DOM element to wrap
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = <T>(node: Element, host: UIElement): UIRef<T> => {
  const el = (): Element => node
  // el.type = node.localName
  // el.toString = () => `<${node.localName}${idString(node.id)}${classString(node.classList)}>`
  el.map = (fn: (node: Element, host: UIElement) => Element): MaybeRef<T> => ui(fn(node, host), host)
  // el.chain = (fn: (node: Element, host: UIElement) => unknown): unknown => fn(node, host)
  // el.filter = (fn: (node: Element, host: UIElement) => boolean): MaybeRef<T> => fn(node, host) ? ui(node, host) : nothing()
  // el.apply = <U>(other: Functor<U>): Functor<U> => other.map(el)

  el.on = (event: string, handler: EventListenerOrEventListenerObject): (() => void) => {
    node.addEventListener(event, handler)
    return () => node.removeEventListener(event, handler)
  }

  const autoEffect = <V>(state: PropertyKey, fallback: V, setter: (value: V, fallback: V) => void): UIRef<T> => {
    host.set(state, fallback, false)
    effect((q: UIDOMInstructionQueue) => host.has(state) && q(node, () => setter(host.get(state), fallback)))
    return el as UIRef<T>
  }

  el.text = (state: PropertyKey): UIRef<T> =>
    autoEffect<string>(state, node.textContent || '', (content: string, fallback: string) => {
      Array.from(node.childNodes).filter(isComment).forEach(match => match.remove())
      node.append(document.createTextNode(isDefined(content) ? content : fallback))
    })

  el.prop = (key: PropertyKey, state: PropertyKey = key): UIRef<T> =>
    autoEffect<unknown>(state, node[key], (value: unknown) => node[key] = value)

  el.attr = (name: string, state: PropertyKey = name): UIRef<T> =>
    autoEffect<string | undefined>(state, node.getAttribute(name), (value: string | undefined) =>
      isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name)
    )

  el.bool = (name: string, state: PropertyKey = name): UIRef<T> =>
    autoEffect<boolean>(state, node.hasAttribute(name), (value: boolean) => node.toggleAttribute(name,  value))

  el.class = (token: string, state: PropertyKey = token): UIRef<T> =>
    autoEffect<boolean>(state, node.classList.contains(token), (value: boolean) =>
      node.classList[value? 'add' : 'remove'](token)
    )

  if (isStylable(node)) {
    el.style = (prop: string, state: PropertyKey = prop): UIRef<T> =>
      autoEffect<string | undefined>(state, node.style[prop], (value: string | undefined) =>
        isDefined(value) ? node.style[prop] = String(value) : node.style.removeProperty(prop)
      )
  }

  if (host === node) {
    const root = host.shadowRoot || host

    el.first = (selector: string): MaybeRef<T> => {
      const match = root.querySelector(selector)
      return match ? ui(match, host) : maybe(null)
    }
  
    el.all = (selector: string): UIRef<Element>[] =>
      Array.from(root.querySelectorAll(selector)).map(node => ui(node, host)) // Arrays are monads too :-)
  }

  return el as UIRef<T>
}

export {
  type UIRef, type MaybeRef,
  ui
}
