import { isFunction, isInstanceOf } from "./is-type"
import { type UIState, isState, cause } from "./cause-effect"
import { type UnknownContext, CONTEXT_REQUEST, ContextRequestEvent } from "./context-request"

/* === Types === */

type UIAttributeParser = ((
  value: string | undefined,
  element?: HTMLElement,
  old?: string | undefined,
) => unknown)

type UIAttributeMap = Record<string, UIAttributeParser>

type UIStateMap = Record<PropertyKey, PropertyKey | UIState<unknown>>

interface UIElement extends HTMLElement {
  attributeMap: UIAttributeMap
  connectedCallback(): void
  disconnectedCallback(): void
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void
  has(key: PropertyKey): boolean
  get<V>(key: PropertyKey): V
  set<V>(key: PropertyKey, value: V | ((old: V | undefined) => V) | UIState<V>, update?: boolean): void
  delete(key: PropertyKey): boolean
  pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>
  targets(key: PropertyKey): Set<Element>
}

/* === Default export === */

/**
 * Base class for reactive custom elements
 * 
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
class UIElement extends HTMLElement {
  static consumedContexts: UnknownContext[]
  static providedContexts: UnknownContext[]

  /**
   * Define a custom element in the custom element registry
   * 
   * @since 0.5.0
   * @param {string} tag - name of the custom element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  static define(
    tag: string,
    registry: CustomElementRegistry = customElements
  ): void {
    try {
      registry.get(tag) || registry.define(tag, this)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * @since 0.5.0
   * @property
   * @type {UIAttributeMap}
   */
  attributeMap: UIAttributeMap = {}

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #states = new Map<PropertyKey, UIState<any>>()

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string|undefined} old - old value of the modified attribute
   * @param {string|undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(
    name: string,
    old: string | undefined,
    value: string | undefined
  ): void {
    if (value === old) return
    const parser = this.attributeMap[name]
    this.set(name, isFunction(parser) ? parser(value, this, old) : value)
  }

  connectedCallback(): void {
    const proto = this.constructor as typeof UIElement

    // context consumer
    const consumed = proto.consumedContexts || []
    for (const context of consumed) this.set(String(context), undefined)
    setTimeout(() => { // wait for all custom elements to be defined
      for (const context of consumed)
        this.dispatchEvent(new ContextRequestEvent(context, (value: unknown) => this.set(String(context), value)))
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
    const unwrap = (value: T | undefined | (() => T) | UIState<T>): T | undefined => 
      isFunction(value) ? unwrap(value()) : value
    return unwrap(this.#states.get(key))
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {T | ((old: T | undefined) => T) | UIState<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   */
  set<T>(
    key: PropertyKey,
    value: T | ((old: T | undefined) => T) | UIState<T>,
    update: boolean = true
  ): void {
    if (this.#states.has(key)) {
      const state = this.#states.get(key)
      update && isState(state) && state.set(value)
    } else {
      this.#states.set(key, isState(value) ? value : cause(value))
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
   * Passes states from the current UIElement to another UIElement
   * 
   * @since 0.5.0
   * @param {UIElement} element - child element to pass the states to
   * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  async pass(
    element: UIElement,
    states: UIStateMap,
    registry: CustomElementRegistry = customElements
  ): Promise<void> {
    await registry.whenDefined(element.localName)
    for (const [key, source] of Object.entries(states))
      element.set(key, cause(isFunction(source) ? source : this.#states.get(source)))
  }

  /**
   * Return a Set of elements that have effects dependent on the given state
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to get targets for
   * @returns {Set<Element>} set of elements that have effects dependent on the given state
   */
  targets(key: PropertyKey): Set<Element> {
    const targets = new Set<Element>()
    const state = this.#states.get(key)
    if (!state || !state.effects) return targets
    for (const effect of state.effects) {
      const t = effect.targets?.keys()
      if (t) for (const target of t)
        targets.add(target)
    }
    return targets
  }

}

// const isUIElement = isInstanceOf(UIElement)

export { type UIStateMap, type UIAttributeMap, UIElement as default, /* isUIElement */ }
