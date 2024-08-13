import { isComment, isNullish } from '../core/is-type'
import { effect, type DOMInstructionQueue } from '../cause-effect'
import { io } from '../core/io'
import type { UIElement } from '../ui-element'

/* === Internal Functions === */

/**
 * Check if a given variable is an element which can have a style property
 * 
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 * /
const isStylable = (node: Element): node is HTMLElement | SVGElement | MathMLElement => {
  for (const type of [HTMLElement, SVGElement, MathMLElement]) {
    if (node instanceof type) return true
  }
  return false
} */

const autoEffect = <E extends Element, T>(
  host: UIElement,
  state: PropertyKey,
  target: E,
  fallback: T,
  onNothing: () => void,
  onSomething: (value: T) => () => void
): E => {
  const remover = io(onNothing)
  const setter = (value: T) => io(onSomething(value))
  host.set(state, fallback, false)
  effect((enqueue: DOMInstructionQueue) => {
    if (host.has(state)) {
      const value = host.get<T>(state)
      if (isNullish(value)) enqueue(target, remover)
      else enqueue(target, setter(value))
    }
  })
  return target
}

/* === Exported Functions === */

const setText = <E extends Element>(state: PropertyKey) =>
  (host: UIElement, element: E): E => {
    const fallback = element.textContent || ''
    const setter = (value: string) => () => {
      Array.from(element.childNodes).filter(isComment).forEach(match => match.remove())
      element.append(document.createTextNode(value))
    }
    return autoEffect<E, string>(
      host,
      state,
      element,
      fallback,
      setter(fallback),
      setter
    )
  }

const setProperty = <E extends Element>(key: PropertyKey, state: PropertyKey = key) =>
  (host: UIElement, element: E): E => {
    const setter = (value: any) => () => element[key] = value
    return autoEffect<E, any>(
      host,
      state,
      element,
      element[key],
      setter(null),
      setter
    )
  }

const setAttribute = <E extends Element>(name: string, state: PropertyKey = name) =>
  (host: UIElement, element: E): E => {
    return autoEffect<E, string | undefined>(
      host,
      state,
      element,
      element.getAttribute(name),
      () => element.removeAttribute(name),
      (value: string) => () => element.setAttribute(name, value)
    )
  }

const toggleAttribute = <E extends Element>(name: string, state: PropertyKey = name) =>
  (host: UIElement, element: E): E => {
    const setter = (value: boolean) => () => element.toggleAttribute(name, value)
    return autoEffect<E, boolean>(
      host,
      state,
      element,
      element.hasAttribute(name),
      setter(false),
      setter
    )
  }

const toggleClass = <E extends Element>(token: string, state: PropertyKey = token) =>
  (host: UIElement, element: E): E => {
    return autoEffect<E, boolean>(
      host,
      state,
      element,
      element.classList.contains(token),
      () => element.classList.remove(token),
      (value: boolean) => () => element.classList.toggle(token, value)
    )
  }

const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state: PropertyKey = prop) =>
  (host: UIElement, element: E): E => {
    return autoEffect<E, string | undefined>(
      host,
      state,
      element,
      element.style[prop],
      () => element.style.removeProperty(prop),
      (value: string) => () => element.style[prop] = String(value)
    )
  }

export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
