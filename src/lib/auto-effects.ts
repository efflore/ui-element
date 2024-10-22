import { isComment, isFunction, isNull, isNullish, isString } from '../core/is-type'
import { parse } from '../core/parse'
import { effect } from '../core/cause-effect'
import type { Enqueue } from '../core/scheduler'
import type { UI } from '../core/ui'
import type { StateLike } from '../ui-element'

/* === Types === */

type ElementUpdater<E extends Element, T> = {
	key: string,
    read: (element: E) => T,
    update: (value: T) => (element: E) => () => void,
    delete?: (element: E) => () => void
}

/* === Exported Functions === */

/**
 * Auto-effect for setting properties of a target element according to a given state
 * 
 * @since 0.9.0
 * @param {StateLike<T>} state - state bounded to the element property
 * @param {ElementUpdater} updater - updater object containing key, read, update, and delete methods
 */
const updateElement = <E extends Element, T>(
	state: StateLike<T>,
	updater: ElementUpdater<E, T>
) => (ui: UI<E>): UI<E> => {
	const { key, read, update } = updater
	const { host, target } = ui
	const fallback = read(target)
	if (!isFunction(state)) {
		const value = isString(state) && isString(fallback)
			? parse(host, state, fallback)
			: fallback
		host.set(state, value, false)
	}
	effect((enqueue: Enqueue) => {
		const current = read(target)
		const value = isFunction(state) ? state(current) : host.get<T>(state)
		if (!Object.is(value, current)) {
			const action = isNull(value) && updater.delete ? updater.delete
				: isNullish(value) ? update(fallback)
				: update(value)
			enqueue(target, key, action)
		}
	})
	return ui
}

/**
 * Set text content of an element
 * 
 * @since 0.8.0
 * @param {StateLike<string>} state - state bounded to the text content
 */
const setText = <E extends Element>(
	state: StateLike<string>
) => updateElement(state, {
	key: 't',
	read: (element: E) => element.textContent || '',
	update: (value: string) => (element: E) =>
		() => {
			Array.from(element.childNodes)
				.filter(node => !isComment(node))
				.forEach(node => node.remove())
			element.append(document.createTextNode(value))
		}
})

/**
 * Set property of an element
 * 
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike<unknown>} state - state bounded to the property value
 */
const setProperty = <E extends Element>(
	key: PropertyKey,
	state: StateLike<unknown> = key
) => updateElement(state, {
	key: `p:${String(key)}`,
	read: (el: E) => el[key],
	update: (value: any) => (el: E) =>
		() => el[key] = value,
})

/**
 * Set attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike<string>} state - state bounded to the attribute value
 */
const setAttribute = <E extends Element>(
	name: string,
	state: StateLike<string> = name
) => updateElement(state, {
	key: `a:${name}`,
	read: (el: E) => el.getAttribute(name),
	update: (value: string) => (el: E) =>
		() => el.setAttribute(name, value),
	delete: (el: E) =>
		() => el.removeAttribute(name)
})

/**
 * Toggle a boolan attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike<boolean>} state - state bounded to the attribute existence
 */
const toggleAttribute = <E extends Element>(
	name: string,
	state: StateLike<boolean> = name
) => updateElement(state, {
	key: `a:${name}`,
	read: (element: E) => element.hasAttribute(name),
	update: (value: boolean) => (element: E) =>
		() => element.toggleAttribute(name, value)
})

/**
 * Toggle a classList token of an element
 * 
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike<boolean>} state - state bounded to the class existence
 */
const toggleClass = <E extends Element>(
	token: string,
	state: StateLike<boolean> = token
) => updateElement(state, {
	key: `c:${token}`,
	read: (el: E) => el.classList.contains(token),
	update: (value: boolean) => (el: E) =>
		() => el.classList.toggle(token, value)
})

/**
 * Set a style property of an element
 * 
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike<string>} state - state bounded to the style property value
 */
const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(
	prop: string,
	state: StateLike<string> = prop
) => updateElement(state, {
		key: `s:${prop}`,
		read: (element: E) => element.style.getPropertyValue(prop),
		update: (value: string) => (element: E) =>
			() => element.style.setProperty(prop, value),
		delete: (element: E) =>
			() => element.style.removeProperty(prop)
	})

/* === Exported Types === */

export { type ElementUpdater, updateElement, setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle }
