import { isFunction } from './core/is-type'
import { maybe } from './core/maybe'
import { type Signal, isState, cause, effect } from './cause-effect'
import { type UnknownContext, initContext } from './core/context'
import { log, LOG_ERROR } from './core/log'
import { type StateMap, pass } from './lib/pass'
import { on, off, emit } from './lib/event'
import { asBoolean, asInteger, asJSON, asNumber, asString } from './lib/parse-attribute'
import { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle } from './lib/auto-effects'

/* === Types === */

type UI<T> = {
	host: UIElement,
    target: T,
}
type AttributeParser = (value: string[], element: UIElement, old: string | undefined) => unknown[]
type AttributeMap = Record<string, AttributeParser>
type StateLike = PropertyKey | Signal<unknown> | (() => unknown)

/* === Internal Functions === */

/**
 * Unwrap any value wrapped in a function
 * 
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value, but might still be in a maybe container
 */
const unwrap = (value: any): any =>
	isFunction(value) ? unwrap(value()) : value

/* === Exported Class and Functions === */

/**
 * Base class for reactive custom elements
 * 
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
class UIElement extends HTMLElement {
	static registry: CustomElementRegistry = customElements
	static attributeMap: AttributeMap = {}
	static consumedContexts: UnknownContext[]
	static providedContexts: UnknownContext[]

	/**
	 * Define a custom element in the custom element registry
	 * 
	 * @since 0.5.0
	 * @param {string} tag - name of the custom element
	 */
	static define(tag: string): void {
		try {
			if (!this.registry.get(tag)) this.registry.define(tag, this)
		} catch (error) {
			log(tag, error.message, LOG_ERROR)
		}
	}

	// @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
	#states = new Map<PropertyKey, Signal<any>>()

	/**
	 * @since 0.8.1
	 * @property {UI<UIElement>[]} self - single item array of UI object for this element
	 */
	self: UI<UIElement>[] = [{
		host: this,
		target: this
	}]

	/**
	 * @since 0.8.3
	 */
	root: Element | ShadowRoot = this.shadowRoot || this

	/**
	 * Native callback function when an observed attribute of the custom element changes
	 * 
	 * @since 0.1.0
	 * @param {string} name - name of the modified attribute
	 * @param {string | undefined} old - old value of the modified attribute
	 * @param {string | undefined} value - new value of the modified attribute
	 */
	attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void {
		if (value === old) return
		const parser = (this.constructor as typeof UIElement).attributeMap[name]
		this.set(name, isFunction(parser) ? parser(maybe(value), this, old)[0] : value)
	}

	/**
     * Native callback function when the custom element is first connected to the document
	 * 
	 * Used for context providers and consumers
	 * If your component uses context, you must call `super.connectedCallback()`
     * 
     * @since 0.7.0
     */
	connectedCallback(): void {
		initContext(this)
	}

	disconnectedCallback(): void {}

	/**
	 * Check whether a state is set
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to be checked
	 * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
	 */
	has(key: any): boolean {
		return this.#states.has(key)
	}

	/**
	 * Get the current value of a state
	 *
	 * @since 0.2.0
	 * @param {any} key - state to get value from
	 * @returns {T | undefined} current value of state; undefined if state does not exist
	 */
	get<T>(key: any): T | undefined {
		return unwrap(this.#states.get(key))
	}

	/**
	 * Create a state or update its value and return its current value
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to set value to
	 * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
	 * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
	 */
	set<T>(key: any, value: T | ((old: T | undefined) => T) | Signal<T>, update: boolean = true): void {
		if (!this.#states.has(key)) {
			this.#states.set(key, isState(value) ? value : cause(value))
		} else if (update) {
			const state = this.#states.get(key)
			if (isState(state)) state.set(value)
		}
	}

	/**
	 * Delete a state, also removing all effects dependent on the state
	 * 
	 * @since 0.4.0
	 * @param {any} key - state to be deleted
	 * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
	 */
	delete(key: any): boolean {
		return this.#states.delete(key)
	}

	/**
	 * Return the signal for a state
	 * 
	 * @since 0.8.0
	 * @param {any} key - state to get signal for
	 * @returns {Signal<T> | undefined} signal for the given state; undefined if
	 */
	signal<T>(key: any): Signal<T> | undefined {
		return this.#states.get(key)
	}

	/**
	 * Get array of first sub-element matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-element
	 * @returns {UI<Element>[]} - array of zero or one UI objects of matching sub-element
	 */
	first(selector: string): UI<Element>[] {
		return maybe(this.root.querySelector(selector)).map(target => ({ host: this, target }))
	}

	/**
	 * Get array of all sub-elements matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-elements
	 * @returns {UI<Element>[]} - array of UI object of matching sub-elements
	 */
	all(selector: string): UI<Element>[] {
		return Array.from(this.root.querySelectorAll(selector)).map(target => ({ host: this, target }))
	}

}

export {
	type UI, type AttributeMap, type StateMap, type StateLike,
	UIElement, effect, maybe, log, pass, on, off, emit,
	asBoolean, asInteger, asNumber, asString, asJSON,
	setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
}
