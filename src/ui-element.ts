import { isFunction, hasMethod } from './core/is-type'
import { maybe } from './core/maybe'
import { attempt } from './core/attempt'
import { type Signal, isState, isSignal, cause } from './cause-effect'
import { type UnknownContext, CONTEXT_REQUEST, ContextRequestEvent } from './core/context-request'
import { log, LOG_ERROR } from './core/log'
import { type UI, ui } from './core/ui'

/* === Types === */

type AttributeParser = (<T>(value: string[], element: UIElement, old: string | undefined) => T[])

type AttributeMap = Record<string, AttributeParser>

type StateMap = Record<PropertyKey, PropertyKey | Signal<unknown> | (() => unknown)>

/* === Internal Functions === */

/**
 * Unwrap any value wrapped in a function
 * 
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value, but might still be in a maybe or attempt container
 */
const unwrap = (value: any): any =>
  isFunction(value) ? unwrap(value()) : value

/**
 * Get root for element queries within the custom element
 * 
 * @since 0.8.0
 * @param {UIElement} element
 * @returns {Element | ShadowRoot}
 */
const getRoot = (element: UIElement): Element | ShadowRoot =>
  element.shadowRoot || element

/* === Default export === */

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
    attempt(() => !this.registry.get(tag) && this.registry.define(tag, this))
      .catch(error => log(tag, error.message, LOG_ERROR))
  }

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #states = new Map<PropertyKey, Signal<any>>()

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

  connectedCallback(): void {
    const proto = this.constructor as typeof UIElement

    // context consumer
    const consumed = proto.consumedContexts || []
    for (const context of consumed) this.set(String(context), undefined)
    setTimeout(() => { // wait for all custom elements to be defined
      for (const context of consumed)
        this.dispatchEvent(new ContextRequestEvent(context, (value: unknown) =>
          this.set(String(context), value)))
    })

    // context provider: listen to context request events
    const provided = proto.providedContexts || []
    if (!provided.length) return
    this.addEventListener(CONTEXT_REQUEST, (e: ContextRequestEvent<UnknownContext>) => {
      const { context, callback } = e
      if (!provided.includes(context) || !isFunction(callback)) return
      e.stopPropagation()
      callback(this.#states.get(String(context)))
    })
  }

  disconnectedCallback(): void {}

  /**
   * Check whether a state is set
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to be checked
   * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
   */
  has(key: PropertyKey): boolean {
    return this.#states.has(key)
  }

  /**
   * Get the current value of a state
   *
   * @since 0.2.0
   * @param {PropertyKey} key - state to get value from
   * @returns {T | undefined} current value of state; undefined if state does not exist
   */
  get<T>(key: PropertyKey): T | undefined {
    return unwrap(this.#states.get(key))
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
   */
  set<T>(key: PropertyKey, value: T | ((old: T | undefined) => T) | Signal<T>, update: boolean = true): void {
    if (!this.#states.has(key)) {
      this.#states.set(key, isSignal(value) ? value : cause(value))
    } else if (update) {
      const state = this.#states.get(key)
      if (isState(state)) state.set(value)
    }
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
   */
  delete(key: PropertyKey): boolean {
    return this.#states.delete(key)
  }

  /**
   * Get UI container of first sub-element matching a given selector within the custom element
   * 
   * @since 0.8.0
   * @param {string} selector - selector to match sub-element
   * @returns {UI<Element>} - UI container of matching sub-element (or empty UI if no match found)
   */
  first(selector: string): UI<Element> {
    return ui(this, maybe(getRoot(this).querySelector(selector)))
  }

  /**
   * Get UI container of all sub-elements matching a given selector within the custom element
   * 
   * @since 0.8.0
   * @param {string} selector - selector to match sub-elements
   * @returns {UI<Element>} - UI container of matching sub-elements
   */
  all(selector: string): UI<Element> {
    return ui(this, Array.from(getRoot(this).querySelectorAll(selector)))
  }

  /**
   * Passes states from the current UIElement to another UIElement
   * 
   * @since 0.5.0
   * @param {UIElement} target - child element to pass the states to
   * @param {StateMap} stateMap - object of states to be passed; target state keys as keys, source state keys or function as values
   */
  async pass(target: UIElement, stateMap: StateMap): Promise<void> {
    await (this.constructor as typeof UIElement).registry.whenDefined(target.localName)
    if (!hasMethod(target, 'set')) {
      log(target, 'Expected UIElement', LOG_ERROR)
      return
    }
    for (const [key, source] of Object.entries(stateMap))
      target.set(key, isSignal(source) ? source
        : isFunction(source) ? cause(source)
        : this.#states.get(source)
      )
  }

  /**
   * Return the signal for a state
   * 
   * @since 0.8.0
   * @param {PropertyKey} key - state to get signal for
   * @returns {Signal<T> | undefined} signal for the given state; undefined if
   */
  signal<T>(key: PropertyKey): Signal<T> | undefined {
    return this.#states.get(key) as Signal<T> | undefined
  }

}

export {
  type StateMap, type AttributeMap,
  UIElement
}
