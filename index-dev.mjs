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
 * @param {any} fn variable to check
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

/**
 * Get the set of effects associated to the cause getter function in the reactive map
 * 
 * @param {Function} fn getter function of the reactive property as key for the lookup
 * @returns {Set} set of effects associated with the reactive property
 */
const getEffects = fn => {
  !reactiveMap.has(fn) && reactiveMap.set(fn, new Set());
  return reactiveMap.get(fn);
};

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement; extends HTMLElement
 */
export default class extends HTMLElement {

  /*
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

  /*
   * @private hold state of reactive properties – use `has()`, `get()`, `set()`, `delete()` to access and modify
   */
  #state = new Map();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @param {string} name name of the modified attribute
   * @param {any} old old value of the modified attribute
   * @param {any} value new value of the modified attribute
   */
  attributeChangedCallback(name, old, value) {
    if (value !== old) {
      const mapToProp = input => Array.isArray(input) ? input : [name, input];
      const [key, type] = mapToProp(this.attributeMapping[name]);
      const parsed = () => {
        if (isFunction(type)) return type.call(this, value, old);
        const parser = {
          boolean: v => typeof v === 'string' ? true : false,
          integer: v => parseInt(v, 10),
          number: v => parseFloat(v),
        };
        return parser[type] ? parser[type](value) : value;
      };
      this.debug && console.debug(`Attribute '${name}' of ['${this.localName}'] changed from '${old}' to '${value}', parsed as ${type || 'string'}: ${parsed()}`);
      this.set(key, parsed());
    };
  }

  /**
   * Implement iterable protocol by simply passing to `this.#state` Map
   * 
   * @returns {MapIterator}
   */
  [Symbol.iterator]() {
      return this.#state[Symbol.iterator]();
  }

  /**
   * Check whether a reactive property is set
   * 
   * @param {any} key reactive property to be checked
   * @returns {boolean} true if `this` has reactive property with the passed key; false otherwise
   */
  has(key) {
    return this.#state.has(key);
  }

  /**
   * Get the current value of a reactive property
   * 
   * @param {any} key reactive property to get value from
   * @param {boolean} raw if true, return the reactive property function, otherwise return the current value
   * @returns {any} current value of reactive property
   */
  get(key, raw = false) {
    if (!this.#state.has(key)) return;
    this.debug && console.debug(`Get reactive property ['${this.localName}'].get('${key}') and track its use in effect`);
    const reactive = this.#state.get(key);
    return raw ? reactive : reactive();
  }

  /**
   * Create a reactive property or update its value; to pass a reactive property, value must be a function with a 'set' method
   * 
   * @param {any} key reactive property to set a value to
   * @param {any} value initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   */
  set(key, value) {
    if (!this.#state.has(key)) {

      // value is already a reactive property
      if (isFunction(value) && isFunction(value.set)) {
        this.#state.set(key, value);

      // create a new reactive property
      } else {
        const reactive = () => {
          activeEffect && getEffects(reactive).add(activeEffect);
          return isFunction(value) ? value() : value;
        };
        reactive.set = updater => {
          const old = value;
          value = isFunction(updater) ? updater(value) : updater;
          (value !== old) && getEffects(reactive).forEach(effect => effect());
        };
        this.debug && console.debug(`Create reactive property ['${this.localName}'].set('${key}', '${value})'`);
        this.#state.set(key, reactive);
      }
    
    // call set method on already defined reactive property
    } else {
      this.debug && console.debug(`Set reactive property ['${this.localName}'].set('${key}', '${value}') and trigger dependent effects`);
      this.#state.get(key).set(value);
    }
  }

  /**
   * Delete a new reactive property
   * 
   * @param {any} key reactive property to delete
   */
  delete(key) {
    if (this.#state.has(key)) {
      this.debug && console.debug(`Delete reactive property ['${this.localName}'].set('${key}') and trigger dependent effects`);
      this.#state.get(key).set(); // call set method of reactive property a last time with undefined value
      this.#state.delete(key);
    }
  }

  /**
   * Delete all reactive properties on this object
   * /
  clear() {
    this.debug && console.debug(`Delete all reactive properties from ['${this.localName}'] and trigger dependent effects`);
    this.#state.forEach(reactive => reactive.set()); // call set method of reactive property a last time with undefined value
    this.#state.clear();
  } */

  /**
   * Get a MapIterator to access all defined reactive property keys on this object
   * 
   * @returns {MapIterator}
   */
  keys() {
    return this.#state.keys();
  }
  
  /**
   * Get a MapIterator to access all defined reactive property values on this object
   * 
   * @ignore UNTESTED and deliberatly UNDOCUMENTED at this stage; returns raw reactive property functions as values, not the actual values!
   * @returns {MapIterator}
   * /
  values() {
    return this.#state.values();
  } */

  /**
   * Get a MapIterator to access all defined reactive property entries on this object
   * 
   * @ignore UNTESTED and deliberatly UNDOCUMENTED at this stage; returns raw reactive property functions as values, not the actual values!
   * @returns {MapIterator}
   * /
  entries() {
    return this.#state.entries();
  } */

  /**
   * Get the number of reactive properies on this object
   */
  get size() {
    return this.#state.size;
  }

  /**
   * Main method to define what happens when a reactive dependency changes; function may return a cleanup function to be executed on idle
   * 
   * @param {Function} handler callback function to be executed when a reactive dependency changes
   * @throws {TypeError} if handler is not a function
   */
  effect(handler) {
    if (!isFunction(handler)) throw new TypeError(`Effect handler in '${this.localName}' is not a function`);
    const next = () => {
      activeEffect = next; // register the current effect
      const cleanup = handler(); // execute handler function
      isFunction(cleanup) && setTimeout(cleanup); // execute possibly returned cleanup function on next tick
      activeEffect = null; // unregister the current effect
    };
    requestAnimationFrame(next); // wait for the next animation frame to bundle DOM updates
  }

}