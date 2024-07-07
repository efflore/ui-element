/**
 * @name UIElement
 * @version 0.7.0
 */

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is a function
 * 
 * @param {any} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

// hold the currently active effect
let activeEffect;

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {import('./types').FxState} getter function for the current value with a `set` method to update the value
 */
const cause = value => {
  const s = () => { // getter function
    activeEffect && s.e.add(activeEffect);
    return value;
  };
  s.e = new Set(); // set of listeners
  s.set = (/** @type {any} */ updater) => { // setter function
    const old = value;
    value = isFunction(updater) && !isFunction(value.set) ? updater(old) : updater;
    if (!Object.is(value, old)) {
      for (const e of s.e) e();
    }
  };
  return s;
};

/* === Exported functions === */

/**
 * Recursivlely unwrap a given variable if it is a function
 * 
 * @param {any} value
 * @returns {any} unwrapped variable
 */
const unwrap = value => isFunction(value) ? unwrap(value()) : value;

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {import('./types').FxEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = fn => {
  const targets = new Map();

  /**
   * @since 0.6.1
   * 
   * @param {Element} element - target element
   * @param {import('./types').FxDOMInstruction} domFn 
   * @param  {any} key
   * @param  {any} value
   */
  const enqueue = (element, domFn, key, value) => {
    !targets.has(element) && targets.set(element, new Map());
    const instructions = targets.get(element);
    !instructions.has(domFn) && instructions.set(domFn, new Map());
    const argsMap = instructions.get(domFn);
    key && argsMap.set(key, value);
  };
  
  // effect callback function
  const next = () => queueMicrotask(() => { 
    const prev = activeEffect;
    activeEffect = next;
    const cleanup = fn(enqueue);
    activeEffect = prev;
    // flush all queued instructions
    for (const [element, instructions] of targets.entries()) {
      for (const [domFn, argsMap] of instructions.entries()) {
        for (const [key, value] of argsMap.entries()) domFn(element, key, value);
      }
    }
    // @ts-ignore
    isFunction(cleanup) && cleanup();
  });
  next.targets = targets;
  next();
}

/**
 * Parse a boolean attribute to an actual boolean value
 * 
 * @param {string|undefined} value 
 * @returns {boolean}
 */
const asBoolean = value => typeof value === 'string';

/**
 * Parse an attribute to a number forced to integer
 * 
 * @param {string} value 
 * @returns {number}
 */
const asInteger = value => parseInt(value, 10);

/**
 * Parse an attribute to a number
 * 
 * @param {string} value 
 * @returns {number}
 */
const asNumber = value => parseFloat(value);

/**
 * Parse an attribute to a string
 * 
 * @param {string} value
 * @returns {string}
 */
const asString = value => value;

/* === Default export === */

/**
 * Base class for reactive custom elements
 * 
 * @class
 * @extends HTMLElement
 * @type {import('./types').UIElement}
 */
export default class UIElement extends HTMLElement {

  /**
   * Define a custom element in the custom element registry
   * 
   * @since 0.5.0
   * @param {string} tag - name of the custom element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  static define(tag, registry = customElements) {
    try {
      registry.get(tag) || registry.define(tag, this);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * @since 0.5.0
   * @property
   * @type {import('./types').AttributeMap}
   */
  attributeMap = {};

  // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
  #state = new Map();

  /**
   * Native callback function when an observed attribute of the custom element changes
   * 
   * @since 0.1.0
   * @param {string} name - name of the modified attribute
   * @param {string|undefined} old - old value of the modified attribute
   * @param {string|undefined} value - new value of the modified attribute
   */
  attributeChangedCallback(name, old, value) {
    if (value !== old) {
      const input = this.attributeMap[name];
      const [key, parser] = Array.isArray(input) ? input : [name, input];
      this.set(key, isFunction(parser) ? parser(value, this, old) : value);
    }
  }

  /**
   * Check whether a state is set
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to be checked
   * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
   */
  has(key) {
    return this.#state.has(key);
  }

  /**
   * Get the current value of a state
   *
   * @since 0.2.0
   * @param {PropertyKey} key - state to get value from
   * @returns {any} current value of state; undefined if state does not exist
   */
  get(key) {
    return unwrap(this.#state.get(key));
  }

  /**
   * Create a state or update its value and return its current value
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to set value to
   * @param {any} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
   * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
   */
  set(key, value, update = true) {
    if (this.#state.has(key)) {
      const state = this.#state.get(key);
      update && isFunction(state.set) && state.set(value);
    } else {
      const state = isFunction(value) && isFunction(value.set) ? value : cause(value);
      this.#state.set(key, state);
    }
  }

  /**
   * Delete a state, also removing all effects dependent on the state
   * 
   * @since 0.4.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
   */
  delete(key) {
    return this.#state.delete(key);
  }

  /**
   * Pass states to a child element
   * 
   * @since 0.5.0
   * @param {import('./types').UIElement} element - child element to pass the states to
   * @param {import('./types').FxStateMap} states - object of states to be passed
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  async pass(element, states, registry = customElements) {
    await registry.whenDefined(element.localName);
    for (const [key, source] of Object.entries(states)) {
      element.set(key, cause(isFunction(source) ? source : this.#state.get(source)));
    }
  }

  /**
   * Return a set of elements that have effects dependent on the given state
   * 
   * @since 0.7.0
   * 
   * @param {PropertyKey} key - state to get targets for
   * @returns {Set<Element>} set of elements that have effects dependent on the given state
   */
  targets(key) {
    const targets = new Set();
    for (const effect of this.#state.get(key).e) {
      for (const target of effect.targets.keys()) targets.add(target);
    }
    return targets;
  }

}

export { effect, asBoolean, asInteger, asNumber, asString, unwrap };