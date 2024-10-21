import { isComment, isFunction, isNull, isNullish, isString } from '../core/is-type'
import { parse } from '../core/parse'
import { effect } from '../core/cause-effect'
import type { Enqueue } from '../core/scheduler'
import type { UI } from '../core/ui'
import type { StateLike } from '../ui-element'

/* === Internal Functions === */

/**
 * Auto-effect for setting properties of a target element according to a given state
 * 
 * @since 0.8.0
 * @param {UI} ui - UI object of host UIElement and target element to update properties
 * @param {StateLike<T>} state - state to be set to the host element
 * @param {string} prop - property name to be updated
 * @param {() => T} getter - getter function to retrieve current value in the DOM
 * @param {(value: T) => (element: E) => () => void} setter - callback to be executed when state is changed
 * @returns {UI} object with host and target
 */
const autoEffect = <E extends Element, T>(
	ui: UI<E>,
	state: StateLike<T>,
	prop: string,
	getter: () => T,
	setter: (value: T) => (element: E) => () => void,
	remover?: (element: E) => () => void
): UI<E> => {
	const fallback = getter()
	if (!isFunction(state)) {
		const value = isString(state) && isString(fallback) ? parse(ui.host, state, fallback) : fallback
		ui.host.set(state, value, false)
	}
	effect((enqueue: Enqueue) => {
		const current = getter()
		const value = isFunction(state) ? state(current) : ui.host.get<T>(state)
		if (!Object.is(value, current)) {
			const action = remover && isNull(value) ? remover
				: isNullish(value) ? setter(fallback)
				: setter(value)
			enqueue(ui.target, prop, action)
		}
	})
	return ui
}

/* === Exported Functions === */

/**
 * Set text content of an element
 * 
 * @since 0.8.0
 * @param {StateLike<string>} state - state bounded to the text content
 */
const setText = <E extends Element>(state: StateLike<string>) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, string>(
			ui,
			state,
			't',
			() => ui.target.textContent || '',
			(value: string) => (element: E) =>
				() => {
					Array.from(element.childNodes)
						.filter(node => !isComment(node))
						.forEach(node => node.remove())
					element.append(document.createTextNode(value))
				}
		)

/**
 * Set property of an element
 * 
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike<unknown>} state - state bounded to the property value
 */
const setProperty = <E extends Element>(key: PropertyKey, state: StateLike<unknown> = key) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, any>(
			ui,
			state,
			`p-${String(key)}`,
			() => ui.target[key],
			(value: any) => (element: E) =>
				() => element[key] = value
		)

/**
 * Set attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike<string>} state - state bounded to the attribute value
 */
const setAttribute = <E extends Element>(name: string, state: StateLike<string> = name) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, string | undefined>(
			ui,
			state,
			`a-${name}`,
			() => ui.target.getAttribute(name),
			(value: string) => (element: E) =>
				() => element.setAttribute(name, value),
		    (element: E) =>
				() => element.removeAttribute(name)
		)

/**
 * Toggle a boolan attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike<boolean>} state - state bounded to the attribute existence
 */
const toggleAttribute = <E extends Element>(name: string, state: StateLike<boolean> = name) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, boolean>(
			ui,
			state,
			`a-${name}`,
			() => ui.target.hasAttribute(name),
			(value: boolean) => (element: E) =>
				() => element.toggleAttribute(name, value)
		)

/**
 * Toggle a classList token of an element
 * 
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike<boolean>} state - state bounded to the class existence
 */
const toggleClass = <E extends Element>(token: string, state: StateLike<boolean> = token) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, boolean>(
			ui,
			state,
			`c-${token}`,
			() => ui.target.classList.contains(token),
			(value: boolean) => (element: E) =>
				() => element.classList.toggle(token, value)
		)

/**
 * Set a style property of an element
 * 
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike<string>} state - state bounded to the style property value
 */
const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state: StateLike<string> = prop) =>
	(ui: UI<E>): UI<E> =>
		autoEffect<E, string | undefined>(
			ui,
			state,
			`s-${prop}`,
			() => ui.target.style.getPropertyValue(prop),
			(value: string) => (element: E) =>
				() => element.style.setProperty(prop, value),
			(element: E) =>
				() => element.style.removeProperty(prop)
		)

/* === Exported Types === */

export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
