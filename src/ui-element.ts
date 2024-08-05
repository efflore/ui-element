import { isFunction } from "./is-type"
import { unwrap, maybe, hasMethod } from "./maybe"
import { type UISignal, isState, isSignal, cause } from "./cause-effect"
import { type UnknownContext, CONTEXT_REQUEST, ContextRequestEvent } from "./context-request"

/* === Types === */

type UIAttributeParser = ((
  value: string | undefined,
  element?: HTMLElement,
  old?: string | undefined,
) => unknown)

type UIAttributeMap = Record<string, UIAttributeParser>

type UIStateMap = Record<PropertyKey, PropertyKey | UISignal<unknown> | (() => unknown)>

interface UIElement extends HTMLElement {
  connectedCallback(): void
  disconnectedCallback(): void
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void
  has(key: PropertyKey): boolean
  get<V>(key: PropertyKey): V
  set<V>(key: PropertyKey, value: V | ((old: V | undefined) => V) | UISignal<V>, update?: boolean): void
  delete(key: PropertyKey): boolean
  pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>
  signal<V>(key: PropertyKey): UISignal<V>
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
  static registry: CustomElementRegistry = customElements
  static attributeMap: UIAttributeMap = {}
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
      this.registry.get(tag) || this.registry.define(tag, this)
    } catch (err) {
      console.error(err)
    }
  }

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #states = new Map<PropertyKey, UISignal<any>>()

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string | undefined} old - old value of the modified attribute
   * @param {string | undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(
    name: string,
    old: string | undefined,
    value: string | undefined
  ): void {
    if (value === old) return
    const parser = (this.constructor as typeof UIElement).attributeMap[name]
    const maybeValue = maybe(value);
    this.set(name, isFunction(parser)
      ? maybeValue.map((v: string | undefined) => parser(v, this, old))
      : maybeValue
    )
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
    return unwrap(this.#states.get(key))
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {T | ((old: T | undefined) => T) | UISignal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
   */
  set<T>(
    key: PropertyKey,
    value: T | ((old: T | undefined) => T) | UISignal<T>,
    update: boolean = true
  ): void {
    if (!this.#states.has(key)) {
      this.#states.set(key, isSignal(value) ? value : cause(value))
    } else if (update) {
      const state = this.#states.get(key)
      isState(state) && state.set(value)
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
   * @param {UIElement} target - child element to pass the states to
   * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
   */
  async pass(
    target: UIElement,
    states: UIStateMap
  ): Promise<void> {
    await (this.constructor as typeof UIElement).registry.whenDefined(target.localName)
    if (!hasMethod(target, 'set')) throw new TypeError('Expected UIElement')
    for (const [key, source] of Object.entries(states))
      target.set(key, isSignal(source)
        ? source
        : isFunction(source)
          ? cause(source)
          : this.#states.get(source)
      )
  }

  /**
   * Return the signal for a state
   * 
   * @since 0.8.0
   * @param {PropertyKey} key - state to get signal for
   * @returns {UISignal<T> | undefined} signal for the given state; undefined if
   */
  signal<T>(key: PropertyKey): UISignal<T> | undefined {
    return this.#states.get(key)
  }

}

export { type UIStateMap, type UIAttributeMap, UIElement as default }
