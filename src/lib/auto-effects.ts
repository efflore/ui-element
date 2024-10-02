import { isComment, isFunction, isNullish, isString } from '../core/is-type'
import { parse } from '../core/parse'
import { effect } from '../cause-effect'
import type { Enqueue } from '../core/scheduler'
import type { UI, StateLike } from '../ui-element'

/* === Internal Functions === */

/**
 * Auto-effect for setting properties of a target element according to a given state
 * 
 * @since 0.8.0
 * @param {UI} ui - UI object of host UIElement and target element to update properties
 * @param {StateLike} state - state to be set to the host element
 * @param {string} prop - property name to be updated
 * @param {T} fallback - fallback value to be used if state is not defined
 * @param {(element: E) => () => void} onNothing - callback to be executed when state is not defined
 * @param {(value: T) => (element: E) => () => void} onSomething - callback to be executed when state is defined
 * @returns {UI} object with host and target
 */
const autoEffect = <E extends Element, T>(
	ui: UI<E>,
	state: StateLike<T>,
	prop: string,
	fallback: T,
	onNothing: (element: E) => () => void,
	onSomething: (value: T) => (element: E) => () => void
): UI<E> => {
	if (!isFunction(state)) ui.host.set(
		state,
		isString(state) && isString(fallback) ? parse(ui.host, state, fallback) : fallback,
		false
	)
	effect((enqueue: Enqueue) => {
		const value = isFunction(state) ? state() : ui.host.get<T>(state)
		enqueue(ui.target, prop, isNullish(value) ? onNothing : onSomething(value))
	})
	return ui
}

/* === Exported Functions === */

/**
 * Set text content of an element
 * 
 * @since 0.8.0
 * @param {StateLike} state - state bounded to the text content
 */
const setText = <E extends Element>(state: StateLike<string>) =>
	(ui: UI<E>): UI<E> => {
		const fallback = ui.target.textContent || ''
		const setter = (value: string) => (element: E) => () => {
			Array.from(element.childNodes)
				.filter(isComment)
				.forEach(match => match.remove())
			element.append(document.createTextNode(value))
		}
		return autoEffect<E, string>(
			ui,
			state,
			't',
			fallback,
			setter(fallback),
			setter
		)
	}

/**
 * Set property of an element
 * 
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike} state - state bounded to the property value
 */
const setProperty = <E extends Element>(key: PropertyKey, state: StateLike<unknown> = key) =>
	(ui: UI<E>): UI<E> => {
		const setter = (value: any) => (element: E) => () => element[key] = value
		return autoEffect<E, any>(
			ui,
			state,
			`p-${String(key)}`,
			ui.target[key],
			setter(null),
			setter
		)
	}

/**
 * Set attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike} state - state bounded to the attribute value
 */
const setAttribute = <E extends Element>(name: string, state: StateLike<string> = name) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, string | undefined>(
			ui,
			state,
			`a-${name}`,
			ui.target.getAttribute(name),
			(element: E) => () => element.removeAttribute(name),
			(value: string) => (element: E) => () => element.setAttribute(name, value)
		)

/**
 * Toggle a boolan attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike} state - state bounded to the attribute existence
 */
const toggleAttribute = <E extends Element>(name: string, state: StateLike<boolean> = name) =>
	(ui: UI<E>): UI<E> => {
		const setter = (value: boolean) => (element: E) => () => element.toggleAttribute(name, value)
		return autoEffect<E, boolean>(
			ui,
			state,
			`a-${name}`,
			ui.target.hasAttribute(name),
			setter(false),
			setter
		)
	}

/**
 * Toggle a classList token of an element
 * 
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike} state - state bounded to the class existence
 */
const toggleClass = <E extends Element>(token: string, state: StateLike<boolean> = token) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, boolean>(
			ui,
			state,
			`c-${token}`,
			ui.target.classList.contains(token),
			(element: E) => () => element.classList.remove(token),
			(value: boolean) => (element: E)  => () => element.classList.toggle(token, value)
		)

/**
 * Set a style property of an element
 * 
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike} state - state bounded to the style property value
 */
const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state: StateLike<string> = prop) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, string | undefined>(
			ui,
			state,
			`s-${prop}`,
			ui.target.style[prop],
			(element: E) => () => element.style.removeProperty(prop),
			(value: string) => (element: E) => () => element.style[prop] = value
		)

/* === Exported Types === */

export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
