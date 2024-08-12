import { isComment } from '../core/is-type'
import { maybe } from '../core/maybe'
import { effect, type DOMInstructionQueue } from '../cause-effect'
import { UIElement } from '../ui-element'
import { io } from '../core/io'
import { log } from '../core/log'

/* === Internal Functions === */

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

const autoEffect = <T>(
  host: UIElement,
  state: PropertyKey,
  target: Element,
  fallback: T,
  onNothing: () => void,
  onSomething: (value: T) => () => void
): void => {
  const remover = io(onNothing)
  const setter = (value: T) => io(onSomething(value))
  host.set(state, fallback, false)
  effect((enqueue: DOMInstructionQueue) => {
    if (host.has(state)) maybe(host.get(state)).fold(
      () => enqueue(target, remover),
      (value: T) => enqueue(target, setter(value))
    )
  })
}

/* === Exported Functions === */

const syncText = (state: PropertyKey) =>
  (host: UIElement, target: HTMLElement): void => {
    const fallback = target.textContent || ''
    const setter = (value: string) => () => {
      Array.from(target.childNodes).filter(isComment).forEach(match => match.remove())
      target.append(document.createTextNode(value))
    }
    autoEffect<string>(
      host,
      state,
      target,
      fallback,
      setter(fallback),
      setter
    )
  }

const syncProp = (key: PropertyKey, state: PropertyKey = key) =>
  (host: UIElement, target: HTMLElement): void => {
    const setter = (value: any) => () => target[key] = value
    autoEffect<any>(
      host,
      state,
      target,
      target[key],
      setter(null),
      setter
    )
  }

const syncAttr = (name: string, state: PropertyKey = name) =>
  (host: UIElement, target: HTMLElement): void => {
    autoEffect<string | undefined>(
      host,
      state,
      target,
      target.getAttribute(name),
      () => target.removeAttribute(name),
      (value: string) => () => target.setAttribute(name, value)
    )
  }

const syncBool = (name: string, state: PropertyKey = name) =>
  (host: UIElement, target: HTMLElement): void => {
    const setter = (value: boolean) => () => target.toggleAttribute(name, value)
    autoEffect<boolean>(
      host,
      state,
      target,
      target.hasAttribute(name),
      setter(false),
      setter
    )
  }

const syncClass = (token: string, state: PropertyKey = token) =>
  (host: UIElement, target: HTMLElement): void => {
    autoEffect<boolean>(
      host,
      state,
      target,
      target.classList.contains(token),
      () => target.classList.remove(token),
      () => () => target.classList.add(token)
    )
  }

const syncStyle = (prop: string, state: PropertyKey = prop) =>
  (host: UIElement, target: HTMLElement): void => {
    if (!isStylable(target)) {
      log(target, 'The target element is not styleable')
      return
    }
    autoEffect<string | undefined>(
      host,
      state,
      target,
      target.style[prop],
      () => target.style.removeProperty(prop),
      (value: string) => () => target.style[prop] = String(value)
    )
  }

export { syncText, syncProp, syncAttr, syncBool, syncClass, syncStyle }
