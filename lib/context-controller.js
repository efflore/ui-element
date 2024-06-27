/**
 * @name ContextController
 * @version 0.5.0
 */

/* === Internal variables and functions to the module === */

const CONTEXT_REQUEST = 'context-request';

/**
 * Check if a given variable is a function
 * 
 * @param {any} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

/* === Exported context event class === */

/**
 * Class for context-request events
 * 
 * taken from https://github.com/blikblum/wc-context/blob/master/core.js
 * 
 * (c) Luiz Américo Pereira Câmara aka blikblum, MIT License
 * 
 * @class ContextRequestEvent
 * @extends {Event}
 * 
 * @property {PropertyKey} context - context key
 * @property {import("../types").ContextRequestEventCallback} callback - callback function for value getter and unsubscribe function
 * @property {boolean} [subscribe=false] - whether to subscribe to context changes
 */
export class ContextRequestEvent extends Event {
  /**
   * @param {PropertyKey} context - context key
   * @param {import("../types").ContextRequestEventCallback} callback - callback for value getter and unsubscribe function
   * @param {boolean} [subscribe=false] - whether to subscribe to context changes
   */
  constructor(context, callback, subscribe = false) {
    super(CONTEXT_REQUEST, { bubbles: true, cancelable: true, composed: true });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

/* === Exported context provider class === */

/**
 * Class for Context Providers
 * 
 * @since 0.3.0
 */
export class ContextProvider {
  #consumedContexts = new Map();

  /**
   * Connect a UIElement instance to provide context
   * 
   * @param {import("../types").UIElement} element - UIElement instance to provide context
   */
  constructor(element) {
    this.host = element;
    this.hostPrototype = Object.getPrototypeOf(element);

    // add event listeners for context-request
    this.host.addEventListener(CONTEXT_REQUEST, this.#onContextRequest.bind(this));

    // set up effects for provided contexts
    this.hostPrototype.providedContexts?.forEach((/** @type {PropertyKey} */ context) => {
      this.host.effect(() => {
        const value = this.host.get(context);
        if (this.#consumedContexts.has(context)) {
          this.#consumedContexts.get(context).forEach((
            /** @type {import("../types").ContextRequestEventCallback} */ callback,
            /** @type {import("../types").UIElement} */ target
          ) => callback(
            value,
            () => this.#consumedContexts.get(context).delete(target),
          ));
        }
      });
    });
  }

  /**
   * Remove event listeners for context-request and clear observer map
   */
  disconnect() {
    this.host.removeEventListener(CONTEXT_REQUEST, this.#onContextRequest);
    this.#consumedContexts.clear();
  }

  /**
   * Event handler for context-request events
   * 
   * @param {ContextRequestEvent} e 
   * @returns void
   * @this {ContextProvider}
   */
  #onContextRequest(e) {
    const { target, context, callback, subscribe } = e;
    if (!this.hostPrototype.providedContexts?.includes(context) || !isFunction(callback)) return;
    e.stopPropagation();
    const value = this.host.get(context);
    if (subscribe) {
      !this.#consumedContexts.has(context) && this.#consumedContexts.set(context, new Map());
      const observers = this.#consumedContexts.get(context);
      !observers.has(target) && observers.set(target, callback);
      callback(value, () => this.#consumedContexts.get(context).delete(target));
    } else {
      callback(value);
    }
  }
}

/* === Exported context consumer class === */

/**
 * Class for Context Consumers
 * 
 * @since 0.3.0
 */
export class ContextConsumer {
  #registeredContexts = new Map();

  /**
   * Connect UIElement instance to consume context
   * 
   * @param {import("../types").UIElement} element - UIElement instance to consume context
   */
  constructor(element) {
    this.host = element;
    this.hostPrototype = Object.getPrototypeOf(element);

    // register observed contexts
    requestAnimationFrame(() => {
      this.hostPrototype.observedContexts?.forEach((/** @type {PropertyKey} */ context) => {
        const callback = (/** @type {import("../types").Signal} */ value, /** @type {() => void} */ unsubscribe) => {
          this.#registeredContexts.set(context, unsubscribe);
          const input = this.host.contextMap?.get(context);
          const [key, fn] = Array.isArray(input) ? input : [context, input];
          this.host.set(key, isFunction(fn) ? fn(value) : value);
        };
        const event = new ContextRequestEvent(context, callback, true);
        this.host.dispatchEvent(event);
      });
    });
  }

  /**
   * Unregister observed contexts
   */
  disconnect() {
    this.#registeredContexts.forEach(unsubscribe => isFunction(unsubscribe) && unsubscribe());
  }
}
