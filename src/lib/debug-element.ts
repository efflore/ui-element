import { isString, isDefined } from '../core/is-type'
import type { Computed, Effect } from '../cause-effect'
import { type StateMap, UIElement } from '../ui-element'
import { log, DEV_MODE } from '../core/log'

/* === Constants === */

const DEBUG_STATE = 'debug'
const SELECTOR_PREFIX = 'data-'
const HOVER_SUFFIX = 'hover'
const FOCUS_SUFFIX = 'focus'
const EFFECT_CLASS = 'ui-effect'

/* === Internal Functions === */

/**
 * Return selector string for the id of the element
 * 
 * @param {string} id 
 * @returns {string} - id string for the element with '#' prefix
 */
const idString = (id: string): string => id ? `#${id}` : '';

/**
 * Return a selector string for classes of the element
 * 
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
    : typeof value === 'object' ? JSON.stringify(value)
      : isDefined(value) ? value.toString()
        : 'undefined'

/* === Exported Class === */

/**
 * Add debug capabilities to UIElement classes
 * 
 * @since 0.5.0
 * 
 * @class DebugElement
 * @extends {UIElement}
 */
class DebugElement extends UIElement {

  /**
   * Wrap connectedCallback to log to the console
   */
  connectedCallback() {
    if (isString(this.getAttribute(DEBUG_STATE))) this.set(DEBUG_STATE, true)
    super.connectedCallback()
    log(elementName(this), 'Connected')
  }

  /**
   * Wrap disconnectedCallback to log to the console
   */
  disconnectedCallback() {
    log(elementName(this), 'Disconnected')
  }

  /**
   * Wrap adoptedCallback to log to the console
   */
  adoptedCallback() {
    log(elementName(this), 'Adopted')
  }

  /**
   * Wrap attributeChangedCallback to log changes to the console
   * 
   * @since 0.5.0
   * @param {string} name
   * @param {string | undefined} old
   * @param {string | undefined} value
   */
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined) {
    log(`${valueString(old)} => ${valueString(value)}`, `Attribute "${name}" of ${elementName(this)} changed`)
    super.attributeChangedCallback(name, old, value)
  }

  /**
   * Wrap get() to log signal reads to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to get
   * @returns {unknown} - current value of the state
   */
  get<T>(key: PropertyKey): T {
    return log(super.get(key), `Get current value of state ${valueString(key)} in ${elementName(this)}`)
  }

  /**
   * Wrap set() to log signal writes to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to be set
   * @param {unknown} value - value to be set
   * @param {boolean} [update=true] - whether to update the state
   */
  set(key: PropertyKey, value: unknown, update: boolean = true): void {
    log(value, `Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to`)
    super.set(key, value, update)
  }

  /**
   * Wrap delete() to log signal deletions to the console
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} - whether the state was deleted
   */
  delete(key: PropertyKey): boolean {
    return log(super.delete(key), `Delete state ${valueString(key)} from ${elementName(this)}`)
  }

  /**
   * Wrap pass() to log passed signals to the console
   * 
   * @since 0.7.0
   * @param {UIElement} element - UIElement to be passed to
   * @param {StateMap} stateMap - states to be passed to the element
   */
  async pass(element: UIElement, stateMap: StateMap) {
    log(Object.keys(stateMap), `Pass state(s) from ${elementName(this)} to ${elementName(element as HTMLElement)}`)
    super.pass(element, stateMap)
  }

  /**
   * Recursively get all target elements of a given state
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to be observed
   */
  targets(key: PropertyKey): Element[] {
    let targets = []
    const state = this.signal(key)
    if (!state || !state.effects) return targets
    const recurse = (effects: Set<Effect | Computed<unknown>>) => {
      for (const effect of effects) {
        if ('effects' in effect) recurse(effect.effects)
        else targets = [...targets, ...Array.from(effect.targets?.keys())]
      }
    }
    recurse(state.effects)
    return targets
  }

  /**
   * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
   * 
   * @since 0.7.0
   * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
   */
  highlight(className: string = EFFECT_CLASS): void {
    [HOVER_SUFFIX, FOCUS_SUFFIX].forEach(suffix => {
      const [onOn, onOff] = suffix === HOVER_SUFFIX ? ['mouseenter','mouseleave'] : ['focus', 'blur']
      const attr = `${SELECTOR_PREFIX}-${this.localName}-${suffix}`
      const apply = (node: Element) => {
        const key = this.getAttribute(attr).trim()
        const on = (type: string, force: boolean) =>
          node.addEventListener(type, () => {
            for (const target of this.targets(key)) target.classList.toggle(className, force)
          })
        on(onOn, true)
        on(onOff, false)
        node.removeAttribute(attr)
      }

      if (this.hasAttribute(attr)) apply(this)
      for (const node of (this.shadowRoot || this).querySelectorAll(`[${attr}]`)) apply(node)
    })
  }

}

export { DEV_MODE, DebugElement }