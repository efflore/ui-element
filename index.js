import { isFunction, isState, cause } from './lib/cause-effect.js';

/* === Constants === */
const CONTEXT_REQUEST = 'context-request';
/* === Exported functions === */
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string|undefined} value
 * @returns {boolean}
 */
const asBoolean = (value) => typeof value === 'string';
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
const asInteger = (value) => parseInt(value, 10);
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {number}
 */
const asNumber = (value) => parseFloat(value);
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
const asString = (value) => value;
/**
 * Class for context-request events
 *
 * @class ContextRequestEvent
 * @extends {Event}
 *
 * @property {PropertyKey} context - context key
 * @property {ContextCallback<FxState>} callback - callback function for value getter and unsubscribe function
 * @property {boolean} [subscribe=false] - whether to subscribe to context changes
 */
class ContextRequestEvent extends Event {
    context;
    callback;
    subscribe;
    /**
     * @param {PropertyKey} context - context key
     * @param {ContextCallback<FxState>} callback - callback for value getter and unsubscribe function
     * @param {boolean} [subscribe=false] - whether to subscribe to context changes
     */
    constructor(context, callback, subscribe = false) {
        super(CONTEXT_REQUEST, {
            bubbles: true,
            cancelable: true,
            composed: true
        });
        this.context = context;
        this.callback = callback;
        this.subscribe = subscribe;
    }
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
        }
        catch (err) {
            console.error(err);
        }
    }
    /**
     * @since 0.5.0
     * @property
     * @type {AttributeMap}
     */
    attributeMap = {};
    /**
     * @since 0.7.0
     * @property
     * @type {ContextMap}
     */
    contextMap = {};
    // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
    #states = new Map();
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
            const [key, parser] = Array.isArray(input)
                ? input :
                [name, input];
            this.set(key, isFunction(parser)
                ? parser(value, this, old)
                : value);
        }
    }
    connectedCallback() {
        const proto = Object.getPrototypeOf(this);
        // context provider: listen to context request events
        const provided = proto.providedContexts || [];
        if (provided.length) {
            this.addEventListener(CONTEXT_REQUEST, (e) => {
                const { context, callback } = e;
                if (!provided.includes(context) || !isFunction(callback))
                    return;
                e.stopPropagation();
                callback(this.#states.get(context));
            });
        }
        // context consumer
        setTimeout(() => {
            proto.consumedContexts?.forEach((context) => {
                const event = new ContextRequestEvent(context, (value) => {
                    const input = this.contextMap[context];
                    const [key, fn] = Array.isArray(input)
                        ? input
                        : [context, input];
                    this.#states.set(key || context, isFunction(fn)
                        ? fn(value, this)
                        : value);
                });
                this.dispatchEvent(event);
            });
        });
    }
    /**
     * Check whether a state is set
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to be checked
     * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
     */
    has(key) {
        return this.#states.has(key);
    }
    /**
     * Get the current value of a state
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to get value from
     * @returns {unknown} current value of state; undefined if state does not exist
     */
    get(key) {
        const unwrap = (value) => isFunction(value)
            ? unwrap(value())
            : value;
        return unwrap(this.#states.get(key));
    }
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to set value to
     * @param {unknown} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
     */
    set(key, value, update = true) {
        if (this.#states.has(key)) {
            const state = this.#states.get(key);
            update && isState(state) && state.set(value);
        }
        else {
            const state = isState(value)
                ? value
                : cause(value);
            this.#states.set(key, state);
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
        return this.#states.delete(key);
    }
    /**
     * Passes states from the current UIElement to another UIElement
     *
     * @since 0.5.0
     * @param {UIElement} element - child element to pass the states to
     * @param {FxStateMap} states - object of states to be passed
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    async pass(element, states, registry = customElements) {
        await registry.whenDefined(element.localName);
        for (const [key, source] of Object.entries(states))
            element.set(key, cause(isFunction(source)
                ? source
                : this.#states.get(source)));
    }
    /**
     * Return a Set of elements that have effects dependent on the given state
     *
     * @since 0.7.0
     * @param {PropertyKey} key - state to get targets for
     * @returns {Set<Element>} set of elements that have effects dependent on the given state
     */
    targets(key) {
        const targets = new Set();
        for (const effect of this.#states.get(key).effects) {
            for (const target of effect.targets.keys())
                targets.add(target);
        }
        return targets;
    }
}

export { ContextRequestEvent, asBoolean, asInteger, asNumber, asString, UIElement as default };
