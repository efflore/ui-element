/* globals customElements, HTMLElement, requestAnimationFrame, setTimeout */

/**
 * @license
 * Copyright 2024 Esther Brunner
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* === Internal variables and functions to the module === */

// hold the currently active effect
let activeEffect = null;

// set up an empty WeakMap to hold the reactivity tree
const reactiveMap = new WeakMap();

/**
 * Check if a given variable is a function
 * 
 * @param {any} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

/**
 * Call a function if it is a function; otherwise return the fallback value
 * 
 * @param {any} fn - variable to check if it is a function
 * @param {Array} args - arguments to pass to the function; defaults to empty array (called with null this without arguments)
 * @param {any} fallback - value to return if the supplied function is not a function; defaults to the not-a-function first parameter
 * @returns {any} value returned by the supplied function if it is a function; otherwise returns the fallback value
 */
const maybeFunction = (fn, args = [], fallback = fn) => isFunction(fn) ? fn.call(...args) : fallback;

/**
 * Get the set of effects dependent on a reactive property from the reactivity tree
 * 
 * @param {Function} fn - getter function of the reactive property as key for the lookup
 * @returns {Set} set of effects associated with the reactive property
 */
const getEffects = fn => {
  !reactiveMap.has(fn) && reactiveMap.set(fn, new Set());
  return reactiveMap.get(fn);
};

/**
 * Define a reactive property
 * 
 * @param {any} value - initial value or value getter function
 * @returns reactive accessor function
 */
const cause = value => {
  const reactive = () => {
    activeEffect && getEffects(reactive).add(activeEffect);
    return maybeFunction(value);
  };
  reactive.set = updater => {
    const old = maybeFunction(value);
    value = maybeFunction(updater, [null, old]);
    (value !== old) && getEffects(reactive).forEach(effect => effect());
  };
  return reactive;
};

/**
 * Define what happens when a reactive dependency changes; function may return a cleanup function to be executed on next tick
 * 
 * @param {Function} handler - callback function to be executed when a reactive dependency changes
 */
const effect = handler => {
  const next = () => {
    activeEffect = next; // register the current effect
    const cleanup = handler(); // execute handler function
    isFunction(cleanup) && setTimeout(cleanup); // execute possibly returned cleanup function on next tick
    activeEffect = null; // unregister the current effect
  };
  next();
};

/**
 * Parse an attribute value
 * 
 * @param {string} value - attribute value
 * @param {string} type - attribute type: `'boolean'`, `'integer'`, `'number'`; everything else will be treated as `'string'`
 * @returns {boolean | number | string} parsed attribute value
 */
const parseAttribute = (value, type) => {
  const parser = {
    boolean: v => typeof v === 'string' ? true : false,
    integer: v => parseInt(v, 10),
    number: v => parseFloat(v),
  };
  return parser[type] ? parser[type](value) : value;
};

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement; extends HTMLElement
 */
export default class extends HTMLElement {

  /**
   * Hold [name, type] or just type mapping to be used on attributeChangedCallback
   *
   * @example
   * attributeMapping = {
   *   heading: ['title'],  // attribute mapped to a property with a different name; type 'string' is optional (default)
   *   count: 'integer',    // will be parsed with v => parseInt(v, 10)
   *   step: 'number',      // will be parsed with v => parseFloat(v)
   *   value: (v, o) => Number.isInteger(this.get('step')) ? parseInt(v, 10) : parseFloat(v), // custom parser function
   *   selected: 'boolean', // boolean attribute will be parsed with v => typeof v === 'string' ? true : false
   * };
   */
  attributeMapping = {};

  // @private hold state of reactive properties – use `has()`, `get()`, `set()`, `delete()` to access and modify
  #state = new Map();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @param {string} name - name of the modified attribute
   * @param {any} old - old value of the modified attribute
   * @param {any} value - new value of the modified attribute
   */
  attributeChangedCallback(name, old, value) {
    if (value !== old) {
      const input = this.attributeMapping[name];
      const [key, type] = Array.isArray(input) ? input : [name, input];
      const parsed = maybeFunction(type, [this, value, old], parseAttribute(value, type));
      this.log(`Attribute '${name}' of ['${this.localName}'] changed from '${old}' to '${value}', parsed as ${type || 'string'}: ${parsed}`);
      this.set(key, parsed);
    };
  }

  /**
   * Check whether a reactive property is set
   * 
   * @param {any} key - reactive property to be checked
   * @returns {boolean} `true` if this element has reactive property with the passed key; `false` otherwise
   */
  has(key) {
    return this.#state.has(key);
  }

  /**
   * Get the current value of a reactive property
   * 
   * @param {any} key - reactive property to get value from
   * @returns {any} current value of reactive property
   */
  get(key) {
    if (!this.#state.has(key)) return;
    this.log(`['${this.localName}'].get('${key}') and track its use in effect`);
    return this.#state.get(key)();
  }

  /**
   * Create a reactive property or update its value; to inherit a reactive property, value must be a function with a `set` method
   * 
   * @param {any} key - reactive property to set value to
   * @param {any} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved; reactive accessor function for inheritance must have a `set` method
   */
  set(key, value) {
    if (!this.#state.has(key)) {
      this.log(`Create ['${this.localName}'].set('${key}', '${value}')`);
      this.#state.set(key, cause(value)); // create a new reactive property
    } else {
      this.log(`Set ['${this.localName}'].set('${key}', '${value}') and trigger dependent effects`);
      maybeFunction(this.#state.get(key).set, [this, value]); // call set method on already defined reactive property
    }
  }

  /**
   * Derive a read-only reactive property
   * 
   * @param {any} key - reactive property to set derived value to
   * @param {Function} getter - callback function to get the value of the reactive property
   * @throws {TypeError} if getter is not a function
   */
  derive(key, getter) {
    this.debug && !isFunction(getter) && this.error(new TypeError(`Getter of ['${this.localName}'].derive('${key}', getter) is not a function`));
    this.log(`Derive ['${this.localName}'].derive('${key}', ${getter})`);
    effect(() => this.set(key, getter));
  }

  /**
   * Delete a new reactive property
   * 
   * @param {any} key - reactive property to delete
   */
  delete(key) {
    if (this.#state.has(key)) {
      this.log(`Delete ['${this.localName}'].delete('${key}') and trigger dependent effects`);
      maybeFunction(this.#state.get(key).set); // call set method of reactive property a last time with undefined value
      this.#state.delete(key);
    }
  }

  /**
   * Define what happens when a reactive dependency changes; function may return a cleanup function to be executed on next tick
   * 
   * @param {Function} handler - callback function to be executed when a reactive dependency changes
   * @throws {TypeError} if handler is not a function
   * @returns {number} requestAnimationFrame ID to be used with `cancelAnimationFrame()`
   */
  effect(handler) {
    this.debug && !isFunction(handler) && this.error(new TypeError(`Effect handler in ${this.localName} is not a function`));
    return requestAnimationFrame(effect.bind(null, handler)); // wait for the next animation frame to bundle DOM updates
  }

  /**
   * Log messages in debug mode
   * 
   * @param {string} msg - debug message to be logged
   */
  log(msg) {
    this.debug && console.debug(msg);
  }

  /**
   * Throw an error
   * 
   * @param {Error} err 
   */
  error(err) {
    throw err;
  }

}
