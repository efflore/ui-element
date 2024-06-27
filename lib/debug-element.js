import UIElement from '../index.js';

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
  attributeMap = new Map();

  /**
   * Wrap attributeChangedCallback to log changes to the console
   * 
   * @since 0.5.0
   * @param {string} name
   * @param {string|undefined} old
   * @param {string|undefined} value
   */
  attributeChangedCallback(name, old, value) {
    this.log(`Attribute '${name}' of ${this.localName} changed from '${old}' to '${value}'`);
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
    this.log(`Call get('${String(key)}') in ${this.localName} and track its use in effect`);
    return super.get(key);
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
    this.log(`Call set('${String(key)}', '${value}'${!update && ' , false'}) in ${this.localName} and trigger dependent effects`);
    super.set(key, value, update);
  }

  /**
   * Wrap effect() to check callbacks in debug mode
   * 
   * @since 0.5.0
   * @param {() => (() => void) | void} fn 
   */
  effect(fn) {
    this.debug && (typeof fn !== 'function') && this.error(new TypeError(`Effect handler in ${this.localName} is not a function`));
    return super.effect(fn);
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
