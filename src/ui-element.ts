import { isDefined, isDefinedObject, isFunction, isObject, isString } from './core/is-type'
import { type Maybe, type Ok, TYPE_FAIL, TYPE_OK, result, isFail, isResult, match } from './core/maybe'
import { type Signal, isState, isSignal, state } from './core/cause-effect'
import { log, LOG_ERROR } from './core/log'
import { type AttributeMap, parse } from './core/parse'
import { type UI, self, first, all } from './core/ui'
import { type UnknownContext, initContext } from './core/context'

/* === Types === */

type StateLike<T> = PropertyKey | Signal<T> | ((old: T | undefined) => T) | (() => T)

/* === Constants === */

const DEBUG_STATE = 'debug'

/* === Internal Functions === */

/**
 * Return selector string for the id of the element
 * 
 * @since 0.7.0
 * @param {string} id 
 * @returns {string} - id string for the element with '#' prefix
 */
const idString = (id: string): string => id ? `#${id}` : '';

/**
 * Return a selector string for classes of the element
 * 
 * @since 0.7.0
 * @param {DOMTokenList} classList - DOMTokenList to convert to a string
 * @returns {string} - class string for the DOMTokenList with '.' prefix if any
 */
const classString = (classList: DOMTokenList): string =>
	classList.length ? `.${Array.from(classList).join('.')}` : ''

/**
 * Return a HyperScript string representation of the Element instance
 * 
 * @since 0.7.0
 * @param {Element} el 
 * @returns {string}
 */
const elementName = (el: Element): string =>
	`<${el.localName}${idString(el.id)}${classString(el.classList)}>`

/**
 * Return a string representation of a JavaScript variable
 * 
 * @since 0.7.0
 * @param {unknown} value 
 * @returns {string}
 */
const valueString = (value: unknown): string =>
	isString(value) ? `"${value}"`
		: isObject(value) ? JSON.stringify(value)
		: isDefined(value) ? value.toString()
		: 'undefined'

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
	static observedAttributes: string[]
	static consumedContexts: UnknownContext[]
	static providedContexts: UnknownContext[]

	/**
	 * Define a custom element in the custom element registry
	 * 
	 * @since 0.5.0
	 * @param {string} tag - name of the custom element
	 */
	static define(tag: string): void {
		const r = result(() => UIElement.registry.define(tag, this))
		match({
			[TYPE_FAIL]: error => log(tag, error.message, LOG_ERROR),
			[TYPE_OK]: () => log(tag, 'Registered custom element')
		})(r)
	}

	/**
	 * @since 0.9.0
	 * @property {Map<PropertyKey, Signal<any>>} signals - map of observable properties
	 */
	signals = new Map<PropertyKey, Signal<any>>()

	/**
	 * @since 0.9.0
	 * @property {ElementInternals | undefined} internals - native internal properties of the custom element
	 */
	internals: ElementInternals | undefined

	/**
	 * @since 0.8.1
	 * @property {UI<Element>[]} self - single item array of UI object for this element
	 */
	self: Ok<UI<Element>> = self(this)

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
		log(`${valueString(old)} => ${valueString(value)}`, `Attribute "${name}" of ${elementName(this)} changed`)
		this.set(name, parse(this, name, value, old))
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
		if (isString(this.getAttribute(DEBUG_STATE))) this.set(DEBUG_STATE, true)
		initContext(this)
		// syncInternals(this)
		log(elementName(this), 'Connected')
	}

	disconnectedCallback(): void {
		log(elementName(this), 'Disconnected')
	}

	adoptedCallback(): void {
		log(elementName(this), 'Adopted')
    }

	/**
	 * Check whether a state is set
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to be checked
	 * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
	 */
	has(key: any): boolean {
		return this.signals.has(key)
	}

	/**
	 * Get the current value of a state
	 *
	 * @since 0.2.0
	 * @param {any} key - state to get value from
	 * @returns {T | undefined} current value of state; undefined if state does not exist
	 */
	get<T>(key: any): T | undefined {
		const unwrap = (v: any): any =>
			!isDefinedObject(v) ? v // shortcut for non-object values
				: isFunction(v) ? unwrap(v())
				: isSignal(v) || isResult(v) ? unwrap(v.get())
				: v
		return log(unwrap(this.signals.get(key)), `Get current value of state ${valueString(key)} in ${elementName(this)}`)
	}

	/**
	 * Create a state or update its value and return its current value
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to set value to
	 * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
	 * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
	 */
	set<T>(key: any, value: T | Signal<T> | ((old: T | undefined) => T), update: boolean = true): void {
		if (isFail(value)) { // reject Fail, log error and return
			log(value.error, `Unhandled error before trying to set state '${key}' in <${this.localName}>`, LOG_ERROR)
			return
		}
		const v = isResult(value) ? value.get() : value // unwrap Ok or None
		log(v, `Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to`)
		if (!this.signals.has(key)) {
			this.signals.set(key, isSignal(v) ? v : state(v))
		} else if (update) {
			const state = this.signals.get(key)
			if (isSignal(v)) {
				log(v.get(), `Existing state ${valueString(key)} in ${elementName(this)} is replaced by new signal`)
				this.signals.set(key, v)
				state.targets.forEach(notify => notify()) // notify dependent computed states and effects
			} else {
				if (isState(state)) state.set(v)
				else log(v, `Computed state ${valueString(key)} in ${elementName(this)} cannot be set`, LOG_ERROR)
			}
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
		return log(this.signals.delete(key), `Delete state ${valueString(key)} from ${elementName(this)}`)
	}

	/**
	 * Get array of first sub-element matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-element
	 * @returns {UI<Element>[]} - array of zero or one UI objects of matching sub-element
	 */
	first: (selector: string) => Maybe<UI<Element>> = first(this)

	/**
	 * Get array of all sub-elements matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-elements
	 * @returns {UI<Element>[]} - array of UI object of matching sub-elements
	 */
	all: (selector: string) => UI<Element>[] = all(this)

}

export { type StateLike, UIElement }