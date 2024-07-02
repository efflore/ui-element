import UIElement from '../index.js';

const elementName = (/** @type {Element} */ el) => `<${el.localName + (el.id && '#' + el.id) + (el.className && '.' + el.className)}>`;
const valueString = (/** @type {any} */ value) => typeof value === 'string' ? `'${value}'` : value.toString();

/**
 * Add debug capabilities to UIElement classes
 * 
 * @since 0.5.0
 * 
 * @class
 * @extends {UIElement}
 * @type {import("../types.js").DebugElement}
 */
export default class extends UIElement {
  debug = false;

  /**
   * Wrap connectedCallback to log to the console
   */
  connectedCallback() {
    (typeof this.getAttribute('debug') === 'string') && (this.debug = true);
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
   * Wrap effect() to log to the console
   * 
   * @since 0.5.0
   * @param {(element: Element, fn: (...args: any[]) => any) => Set<any[]>} fn
   */

  /**
   * Wrap attributeChangedCallback to log changes to the console
   * 
   * @since 0.5.0
   * @param {string} name
   * @param {string|undefined} old
   * @param {string|undefined} value
   */
  attributeChangedCallback(name, old, value) {
    this.log(`Attribute '${name}' of ${elementName(this)} changed from '${old}' to '${value}'`);
    super.attributeChangedCallback(name, old, value);
  }

  /**
   * Wrap set() to log signal reads to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key 
   * @returns {any}
   */
  get(key) {
    const value = super.get(key);
    this.log(`Get current value of state '${String(key)}' in ${elementName(this)} (value: ${valueString(value)}) and track its use in effect`);
    return value;
  }

  /**
   * Wrap set() to log signal writes to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key 
   * @param {any} value 
   * @param {boolean} update 
   */
  set(key, value, update = true) {
    this.log(`Set ${update ? '' : 'default '}value of state '${String(key)}' in ${elementName(this)} to ${valueString(value)} and trigger dependent effects`);
    super.set(key, value, update);
  }

  /**
   * Wrap effect() to check callbacks in debug mode
   * 
   * @since 0.5.0
   * @param {import("../types").EffectCallback} fn 
   */
  effect(fn) {
    if (!this.debug) return super.effect(fn);
    (typeof fn !== 'function') && this.error(new TypeError(`Effect handler in ${elementName(this)} is not a function`));
    const spy = (/** @type {import("../types").DOMEffects} */ scheduled) => {
      fn.targets = new Map();
      fn(scheduled);
      if (spy.targets.size) {
        const elements = [];
        for (const el of spy.targets.keys()) elements.push(elementName(el));
        console.log(`Effect updated ${elements.join(', ')} in ${elementName(this)}`);
      }
    }
    spy.targets = fn.targets;
    super.effect(/** @type {import("../types").EffectCallback} */ spy);
  }

  /**
   * Log messages in debug mode
   * 
   * @since 0.5.0
   * @param {string} msg - debug message to be logged
   */
  log(msg) {
    this.debug && console.debug(msg);
  }

  /**
   * Throw an error
   * 
   * @since 0.5.0
   * @param {Error} err 
   */
  error(err) {
    throw err;
  }
}
