import { isComment, isNullish } from '../core/is-type'
import { effect, type DOMInstruction } from '../cause-effect'
import type { UIElement } from '../ui-element'

/* === Internal Functions === */

const autoEffect = <E extends Element, T>(
  host: UIElement,
  state: PropertyKey,
  target: E,
  prop: string,
  fallback: T,
  onNothing: (element: E) => () => void,
  onSomething: (value: T) => (element: E) => () => void
): E => {
  const remover = onNothing
  const setter = (value: T) => onSomething(value)
  host.set(state, fallback, false)
  effect((enqueue: DOMInstruction) => {
    if (host.has(state)) {
      const value = host.get<T>(state)
      if (isNullish(value)) enqueue(target, prop, remover)
      else enqueue(target, prop, setter(value))
    }
  })
  return target
}

/* === Exported Functions === */

const setText = <E extends Element>(state: PropertyKey) =>
  function (target: E): E {
    const fallback = target.textContent || ''
    const setter = (value: string) => (element: E) => () => {
      Array.from(element.childNodes).filter(isComment).forEach(match => match.remove())
      element.append(document.createTextNode(value))
    }
    return autoEffect<E, string>(
      this,
      state,
      target,
      `t-${String(state)}`,
      fallback,
      setter(fallback),
      setter
    )
  }

const setProperty = <E extends Element>(key: PropertyKey, state: PropertyKey = key) =>
  function (target: E): E {
    const setter = (value: any) => (element: E) => () => element[key] = value
    return autoEffect<E, any>(
      this,
      state,
      target,
      `p-${String(key)}`,
      target[key],
      setter(null),
      setter
    )
  }

const setAttribute = <E extends Element>(name: string, state: PropertyKey = name) =>
  function (target: E): E {
    return autoEffect<E, string | undefined>(
      this,
      state,
      target,
      `a-${name}`,
      target.getAttribute(name),
      (element: E) => () => element.removeAttribute(name),
      (value: string) => (element: E) => () => element.setAttribute(name, value)
    )
  }

const toggleAttribute = <E extends Element>(name: string, state: PropertyKey = name) =>
  function (target: E): E {
    const setter = (value: boolean) => (element: E) => () => element.toggleAttribute(name, value)
    return autoEffect<E, boolean>(
      this,
      state,
      target,
      `a-${name}`,
      target.hasAttribute(name),
      setter(false),
      setter
    )
  }

const toggleClass = <E extends Element>(token: string, state: PropertyKey = token) =>
  function (target: E): E {
    return autoEffect<E, boolean>(
      this,
      state,
      target,
      `c-${token}`,
      target.classList.contains(token),
      (element: E) => () => element.classList.remove(token),
      (value: boolean) => (element: E)  => () => element.classList.toggle(token, value)
    )
  }

const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state: PropertyKey = prop) =>
  function (target: E): E {
    return autoEffect<E, string | undefined>(
      this,
      state,
      target,
      `s-${prop}`,
      target.style[prop],
      (element: E) => () => element.style.removeProperty(prop),
      (value: string) => (element: E) => () => element.style[prop] = value
    )
  }

export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
