import UIElement from '../ui-element';
import { isDefined } from '../utils';

/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */

/* === Constants === */

const DEV_MODE = true;

/* === Internal variables and functions to the module === */

/**
 * Return a HyperScript string representation of the Element instance
 * 
 * @since 0.7.0
 * @param {Element} el 
 * @returns {string}
 */
const elementName = (el: Element): string =>
  `<${el.localName}${el.id && `#${el.id}`}${el.className && `.${el.className.replace(' ', '.')}`}>`;

/**
 * Return a string representation of a JavaScript variable
 * 
 * @since 0.7.0
 * @param {any} value 
 * @returns {string}
 */
const valueString = (value: any): string => typeof value === 'string'
  ? `"${value}"`
  : typeof value === 'object'
    ? JSON.stringify(value)
    : isDefined(value)
      ? value.toString()
      : 'undefined';

/* === Exported class === */

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
    (typeof this.getAttribute('debug') === 'string') && this.set('debug', true);
    this.log(`Connected ${elementName(this)}`);
  }

  /**
   * Wrap disconnectedCallback to log to the console
   */
  disconnectedCallback() {
    this.log(`Disconnected ${elementName(this)}`);
  }

  /**
   * Wrap adoptedCallback to log to the console
   */
  adoptedCallback() {
    this.log(`Adopted ${elementName(this)}`);
  }

  /**
   * Wrap attributeChangedCallback to log changes to the console
   * 
   * @since 0.5.0
   * @param {string} name
   * @param {string|undefined} old
   * @param {string|undefined} value
   */
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined) {
    this.log(`Attribute "${name}" of ${elementName(this)} changed from ${valueString(old)} to ${valueString(value)}`);
    super.attributeChangedCallback(name, old, value);
  }

  /**
   * Wrap set() to log signal reads to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key 
   * @returns {any}
   */
  get(key: PropertyKey): any {
    const value = super.get(key);
    this.log(`Get current value of state ${valueString(key)} in ${elementName(this)} (value: ${valueString(value)}) and track its use in effect`);
    return value;
  }

  /**
   * Wrap set() to log signal writes to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to be set
   * @param {any} value - value to be set
   * @param {boolean} [update=true] - whether to update the state
   */
  set(
    key: PropertyKey,
    value: any,
    update: boolean = true
  ): void {
    this.log(`Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to ${valueString(value)} and trigger dependent effects`);
    super.set(key, value, update);
  }

  /**
   * Wrap delete() to log signal deletions to the console
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} - whether the state was deleted
   */
  delete(key: PropertyKey): boolean {
    this.log(`Delete state ${valueString(key)} from ${elementName(this)}`);
    return super.delete(key);
  }

  /**
   * Wrap pass() to log passed signals to the console
   * 
   * @since 0.7.0
   * @param {UIElement} element - UIElement to be passed to
   * @param {import('../types.js').FxStateMap} states - states to be passed to the element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry
   */
  async pass(element: UIElement, states: import('../ui-element').FxStateMap, registry: CustomElementRegistry = customElements) {
    this.log(`Pass state(s) ${valueString(Object.keys(states))} to ${elementName(element)} from ${elementName(this)}`);
    super.pass(element, states, registry);
  }

  /**
   * Log messages in debug mode
   * 
   * @since 0.5.0
   * @param {string} msg - debug message to be logged
   */
  log(msg: string): void {
    this.has('debug') && console.debug(msg);
  }
}

export { DEV_MODE, DebugElement as default };