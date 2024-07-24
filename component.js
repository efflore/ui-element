/* === Types === */
/* === Internal === */
// hold the currently active effect
let active;
/**
 * Run all effects in the provided set
 *
 * @param {Set<UIEffects>} effects
 */
const autorun = (effects) => {
    for (const effect of effects)
        effect.run();
};
/* === Exported functions === */
/**
 * Check if a given variable is a function
 *
 * @param {unknown} fn - variable to check if it is a function
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = (fn) => typeof fn === 'function';
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value) => isFunction(value) && isFunction(value.set);
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<T>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const state = () => {
        active && state.effects.add(active);
        return value;
    };
    state.effects = new Set(); // set of listeners
    state.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isState(updater)
            ? updater(old)
            : updater;
        !Object.is(value, old) && autorun(state.effects);
    };
    return state;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Map();
    const next = () => {
        const prev = active;
        active = next;
        const cleanup = fn((element, domFn) => {
            !targets.has(element) && targets.set(element, new Set());
            targets.get(element)?.add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn();
        }
        active = prev;
        isFunction(cleanup) && queueMicrotask(cleanup);
    };
    next.run = () => next();
    next.targets = targets;
    next();
};

/** @see https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md */
/* === Constants === */
const CONTEXT_REQUEST = 'context-request';
/* === Exported class === */
/**
 * Class for context-request events
 *
 * An event fired by a context requester to signal it desires a named context.
 *
 * A provider should inspect the `context` property of the event to determine if it has a value that can
 * satisfy the request, calling the `callback` with the requested value if so.
 *
 * If the requested context event contains a truthy `subscribe` value, then a provider can call the callback
 * multiple times if the value is changed, if this is the case the provider should pass an `unsubscribe`
 * function to the callback which requesters can invoke to indicate they no longer wish to receive these updates.
 *
 * @class ContextRequestEvent
 * @extends {Event}
 *
 * @property {T} context - context key
 * @property {ContextCallback<ContextType<T>>} callback - callback function for value getter and unsubscribe function
 * @property {boolean} [subscribe=false] - whether to subscribe to context changes
 */
class ContextRequestEvent extends Event {
    context;
    callback;
    subscribe;
    constructor(context, callback, subscribe = false) {
        super(CONTEXT_REQUEST, { bubbles: true, composed: true });
        this.context = context;
        this.callback = callback;
        this.subscribe = subscribe;
    }
}

/* === Internal function === */
/**
 * Parse a attribute or context mapping value into a key-value pair
 *
 * @param {[PropertyKey, T] | T} value
 * @param {PropertyKey} defaultKey
 * @returns {[PropertyKey, T]}
 */
const getArrayMapping = (value, defaultKey) => Array.isArray(value) ? value : [defaultKey, (isFunction(value) ? value : (v) => v)];
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
     * @type {UIAttributeMap}
     */
    attributeMap = {};
    /**
     * @since 0.7.0
     * @property
     * @type {UIContextMap}
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
        if (value === old)
            return;
        const [key, fn] = getArrayMapping(this.attributeMap[name], name);
        this.set(key, isFunction(fn) ? fn(value, this, old) : value);
    }
    connectedCallback() {
        const proto = Object.getPrototypeOf(this);
        // context consumer
        setTimeout(() => {
            proto.consumedContexts?.forEach((context) => {
                const event = new ContextRequestEvent(context, (value) => {
                    if (typeof context !== 'string')
                        return;
                    const [key, fn] = getArrayMapping(this.contextMap[context], context);
                    this.set(key || context, isFunction(fn) ? fn(value, this) : value);
                });
                this.dispatchEvent(event);
            });
        });
        // context provider: listen to context request events
        const provided = proto.providedContexts || [];
        if (!provided.length)
            return;
        this.addEventListener(CONTEXT_REQUEST, (e) => {
            const { context, callback } = e;
            if (!(typeof context === 'string') || !provided.includes(context) || !isFunction(callback))
                return;
            e.stopPropagation();
            callback(this.#states.get(context));
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
        const unwrap = (value) => isFunction(value) ? unwrap(value()) : value;
        return unwrap(this.#states.get(key));
    }
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to set value to
     * @param {V | ((old: V | undefined) => V) | UIState<V>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, just return existing value
     */
    set(key, value, update = true) {
        if (this.#states.has(key)) {
            const state = this.#states.get(key);
            update && isState(state) && state.set(value);
        }
        else {
            this.#states.set(key, isState(value) ? value : cause(value));
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
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    async pass(element, states, registry = customElements) {
        await registry.whenDefined(element.localName);
        for (const [key, source] of Object.entries(states))
            element.set(key, cause(isFunction(source) ? source : this.#states.get(source)));
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
        const state = this.#states.get(key);
        if (!state || !state.effects)
            return targets;
        for (const effect of state.effects) {
            const t = effect.targets?.keys();
            if (t)
                for (const target of t)
                    targets.add(target);
        }
        return targets;
    }
}

/* === Internal === */
/**
 * Returns a finite number or undefined
 */
const finiteNumber = (value) => Number.isFinite(value) && value;
/* === Exported functions === */
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {boolean}
 */
const asBoolean = (value) => typeof value === 'string';
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
const asInteger = (value) => finiteNumber(parseInt(value, 10));
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
const asNumber = (value) => finiteNumber(parseFloat(value));
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string} value
 * @returns {string}
 */
const asString = (value) => value;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string} value
 * @returns {Record<string, unknown>}
 */
const asJSON = (value) => JSON.parse(value);

/* Internal functions === */
/**
 * Check if a given variable is an element which can have a style property
 *
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node) => {
    for (const type of [HTMLElement, SVGElement, MathMLElement]) {
        if (node instanceof type) {
            return true;
        }
    }
    return false;
};
/* === Exported function === */
/**
 * Check if a given variable is defined
 *
 * @since 0.7.0
 * @param {unknown} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = (value) => typeof value !== 'undefined';
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = (host, node = host) => {
    const root = host.shadowRoot || host;
    const autoEffect = (stateKey, fallback, setter) => {
        if (!node)
            return;
        host.set(stateKey, fallback, false);
        effect((q) => host.has(stateKey) && q(node, setter));
    };
    // return native DOM element
    const el = () => node;
    // return first matching selector as UIRef or undefined
    el.first = (selector) => {
        const match = root.querySelector(selector);
        return match && ui(host, match);
    };
    // return all matching selectors as UIRef array
    el.all = (selector) => Array.from(root.querySelectorAll(selector)).map(match => ui(host, match));
    el.on = (event, handler) => {
        node && node.addEventListener(event, handler);
        return el;
    };
    el.off = (event, handler) => {
        node && node.removeEventListener(event, handler);
        return el;
    };
    // set text content of the element while preserving comments
    el.setText = (content) => {
        if (!node)
            return;
        Array.from(node.childNodes)
            .filter(match => match.nodeType !== Node.COMMENT_NODE)
            .forEach(match => match.remove());
        node.append(document.createTextNode(content));
    };
    // sync text content of the element with given state by key
    el.text = (stateKey) => {
        const fallback = node?.textContent || '';
        autoEffect(stateKey, fallback, () => {
            const content = host.get(stateKey);
            el.setText(isDefined(content) ? String(content) : fallback);
        });
        return el;
    };
    // sync given property of the element with given state by key
    el.prop = (key, stateKey = key) => {
        autoEffect(stateKey, node[key], () => el[key] = host.get(stateKey));
        return el;
    };
    // sync given attribute of the element with given state by key
    el.attr = (name, stateKey = name) => {
        autoEffect(stateKey, node.getAttribute(name), () => {
            const value = host.get(stateKey);
            isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name);
        });
        return el;
    };
    // sync given boolean attribute of the element with given state by key
    el.bool = (name, stateKey = name) => {
        autoEffect(stateKey, node.hasAttribute(name), () => node.toggleAttribute(name, !!host.get(stateKey)));
        return el;
    };
    // sync given class of the element with given state by key
    el.class = (token, stateKey = token) => {
        autoEffect(stateKey, node.classList.contains(token), () => node.classList.toggle(token, !!host.get(stateKey)));
        return el;
    };
    // sync given style property of the element with given state by key
    el.style = (prop, stateKey = prop) => {
        isStylable(node)
            ? autoEffect(stateKey, node.style.getPropertyValue(prop), () => node.style.setProperty(prop, String(host.get(stateKey))))
            : console.warn('Cannot sync style property', prop, 'on non-stylable element');
        return el;
    };
    // return UIRef instance
    return el;
};

/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 *
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIAttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement, my: UIRef) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(host: UIElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
const component = (tag, attributeMap = {}, connect, disconnect) => {
    const UIComponent = class extends UIElement {
        static observedAttributes = Object.keys(attributeMap);
        attributeMap = attributeMap;
        connectedCallback() {
            super.connectedCallback();
            connect && connect(this, ui(this));
        }
        disconnectedCallback() {
            disconnect && disconnect(this);
        }
    };
    UIComponent.define(tag);
    return UIComponent;
};

export { asBoolean, asInteger, asJSON, asNumber, asString, component, UIElement as default, effect, ui };