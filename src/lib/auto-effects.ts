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
  onNothing: () => void,
  onSomething: (value: T) => () => void
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
    const setter = (value: string) => () => {
      Array.from(target.childNodes).filter(isComment).forEach(match => match.remove())
      target.append(document.createTextNode(value))
    }
    return autoEffect<E, string>(
      this,
      state,
      target,
      `text ${String(state)}`,
      fallback,
      setter(fallback),
      setter
    )
  }

const setProperty = <E extends Element>(key: PropertyKey, state: PropertyKey = key) =>
  function (target: E): E {
    const setter = (value: any) => () => target[key] = value
    return autoEffect<E, any>(
      this,
      state,
      target,
      `property ${String(key)}`,
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
      `attribute ${String(name)}`,
      target.getAttribute(name),
      () => target.removeAttribute(name),
      (value: string) => () => target.setAttribute(name, value)
    )
  }

const toggleAttribute = <E extends Element>(name: string, state: PropertyKey = name) =>
  function (target: E): E {
    const setter = (value: boolean) => () => target.toggleAttribute(name, value)
    return autoEffect<E, boolean>(
      this,
      state,
      target,
      `attribute ${String(name)}`,
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
      `class ${String(token)}`,
      target.classList.contains(token),
      () => target.classList.remove(token),
      (value: boolean) => () => target.classList.toggle(token, value)
    )
  }

const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state: PropertyKey = prop) =>
  function (target: E): E {
    return autoEffect<E, string | undefined>(
      this,
      state,
      target,
      `style ${String(prop)}`,
      target.style[prop],
      () => target.style.removeProperty(prop),
      (value: string) => () => target.style[prop] = String(value)
    )
  }

export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
