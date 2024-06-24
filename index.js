/**
 * @name UIElement
 * @version 0.5.0
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
let computing;

/**
 * Define a state and return an object duck-typing Signal.State instances
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function to be called on first access
 * @returns {import("./types").State<any>} state object with `get` and `set` methods
 * @see https://github.com/tc39/proposal-signals/
 */
const cause = value => {
  const reactivityMap = new WeakMap();
  const getTargets = (/** @type {import("./types").Signal<any>} */ signal) => {
    !reactivityMap.has(signal) && reactivityMap.set(signal, new Set());
    return reactivityMap.get(signal);
  };
  const state = {
    get: () => {
      computing && getTargets(state).add(computing);
      return value;
    },
    set: (/** @type {any} */ updater) => {
      const old = value;
      value = isFunction(updater) ? updater(old) : updater;
      if (!Object.is(value, old)) {
        for (const target of getTargets(state)) target.get();
      }
    }
  };
  return state;
};

/**
 * Define a derived state and return an object duck-typing Signal.Computed instances
 * 
 * @since 0.4.0
 * @param {() => any} fn - computation function to be called
 * @returns {import("./types").Computed<any>} state object with `get` method
 * @see https://github.com/tc39/proposal-signals/
 */
const derive = fn => {
  const computed = {
    get: () => {
      const prev = computing;
      computing = computed;
      const value = fn();
      computing = prev;
      return value;
    }
  };
  return computed;
};

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement
 * 
 * @class
 * @extends HTMLElement
 */
export default class extends HTMLElement {

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
   * @type {Map<string, import("./types").AttributeParser|import("./types").MappedAttributeParser>}
   */
  attributeMap;

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
      const input = this.attributeMap?.get(name);
      const [key, type] = Array.isArray(input) ? input : [name, input];
      const parser = {
        boolean: (/** @type {string|undefined} */ v) => typeof v === 'string' ? true : false,
        integer: (/** @type {string} */ v) => parseInt(v, 10),
        number: (/** @type {string} */ v) => parseFloat(v),
      };
      const fn = isFunction(type) ? type : parser[type];
      this.set(key, fn ? fn(value, old) : value);
    }
  }

  /**
   * Check whether a state is set
   * 
   * @since 0.2.0
   * @param {PropertyKey} key - state to be checked
   * @returns {boolean} `true` if this element has state with the passed key; `false` otherwise
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
    return this.#state.get(key)?.get();
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
      const state = typeof value === 'object' && isFunction(value.get)
        ? value
        : isFunction(value) ? derive(value) : cause(value);
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
   * @param {import("./types").UIElement} element - child element to pass the states to
   * @param {Map<PropertyKey, PropertyKey | (() => any)>} [states] - set of states to be passed
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
   */
  pass(element, states, registry = customElements) {
    (async () => {
      await registry.whenDefined(element.localName);
      for (const [key, source] of states) {
        element.set(key, isFunction(source) ? { get: source } : this.#state.get(source));
      }
    })();
  }

  /**
   * Define what happens when a reactive state changes
   * 
   * @since 0.1.0
   * @param {() => (() => void) | void} fn - callback function to be executed when a state changes
   */
  effect(fn) {
    requestAnimationFrame(() => derive(fn).get()); // wait for the next animation frame to bundle DOM updates
  }

  /**
   * Update text content of an element
   * 
   * @since 0.5.0
   * @param {HTMLElement} element - element to be updated
   * @param {string|null} content - new text content; `null` for opt-out of update
   */
  updateText(element, content) {
    if ((content !== null) && (content !== element.textContent)) {
      // preserve comments unlike element.textContent assignment
      Array.from(element.childNodes).filter(node => node.nodeType !== Node.COMMENT_NODE).forEach(node => node.remove());
      element.append(document.createTextNode(content));
    }
  }

  /**
   * Update property of an element
   * 
   * @since 0.5.0
   * @param {HTMLElement} element - element to be updated
   * @param {PropertyKey} key - key of property to be updated
   * @param {any} value - new property value; `''` for boolean attribute; `null` for opt-out of update; `undefined` will delete existing property
   */
  updateProperty(element, key, value) {
    if ((value !== null) && (value !== element[key])) {
      (typeof value === 'undefined') ? delete element[key] : (element[key] = value);
    }
  }

  /**
   * Update attribute of an element
   * 
   * @since 0.5.0
   * @param {HTMLElement} element - element to be updated
   * @param {string} name - name of attribute to be updated
   * @param {string|null} value - new attribute value; `null` for opt-out of update; `undefined` will remove existing attribute
   */
  updateAttribute(element, name, value) {
    if ((value !== null) && (value !== element.getAttribute(name))) {
      (typeof value === 'undefined') ? element.removeAttribute(name) : element.setAttribute(name, value);
    }
  }

  /**
   * Toggle class on an element
   * 
   * @since 0.5.0
   * @param {HTMLElement} element - element to be toggled
   * @param {string} token - name of class to be toggled
   * @param {boolean|null|undefined} force - force toggle condition `true` or `false`; `null` for opt-out of update; `undefined` will toggle existing class
   */
  toggleClass(element, token, force) {
    if ((force !== null) && (force !== element.classList.contains(token))) {
      element.classList.toggle(token, force);
    }
  }

  /**
   * Update style property of an element
   * 
   * @since 0.5.0
   * @param {HTMLElement} element - element to be updated
   * @param {string} property - name of style property to be updated
   * @param {string|null|undefined} value - new style property value; `null` for opt-out of update; `undefined` will remove existing style property
   */
  updateStyle(element, property, value) {
    if (value !== null) {
      (typeof value === 'undefined') ? element.style.removeProperty(property) : element.style.setProperty(property, value);
    }
  }

}
