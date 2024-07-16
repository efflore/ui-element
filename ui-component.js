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
 * @returns {UIState} getter function for the current value with a `set` method to update the value
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
            targets.get(element).add(domFn);
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
 * @param {[PropertyKey, UIAttributeParser | UIContextParser] | UIAttributeParser | UIContextParser} value
 * @param {PropertyKey} defaultKey
 * @returns {[PropertyKey, UIAttributeParser | UIContextParser]}
 */
const getArrayMapping = (value, defaultKey) => {
    return Array.isArray(value) ? value : [defaultKey, isFunction(value) ? value : (v) => v];
};
/* === Default export === */
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {IUIElement}
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
        if (value !== old) {
            const input = this.attributeMap[name];
            const [key, fn] = getArrayMapping(input, name);
            this.set(key, isFunction(fn)
                ? fn(value, this, old)
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
                    const [key, fn] = getArrayMapping(input, context);
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
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
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

/* === Constants === */
const TEXT_SUFFIX = 'text';
const PROP_SUFFIX = 'prop';
const ATTR_SUFFIX = 'attr';
const CLASS_SUFFIX = 'class';
const STYLE_SUFFIX = 'style';
/* Internal functions === */
/**
 * Check if a given variable is an element which can have a style property
 *
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node) => node instanceof HTMLElement
    || node instanceof SVGElement
    || node instanceof MathMLElement;
/* === Exported function === */
/**
 * Check if a given variable is defined
 *
 * @param {unknown} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = (value) => typeof value !== 'undefined';
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @param {Element} element - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const uiRef = (element) => {
    const root = element.shadowRoot || element;
    const el = () => element;
    el.first = (selector) => {
        const node = root.querySelector(selector);
        return node && uiRef(node);
    };
    el.all = (selector) => Array.from(root.querySelectorAll(selector)).map(node => uiRef(node));
    el[TEXT_SUFFIX] = {
        get: () => element.textContent?.trim() || '',
        set: (content) => {
            Array.from(element.childNodes)
                .filter(node => node.nodeType !== Node.COMMENT_NODE)
                .forEach(node => node.remove());
            element.append(document.createTextNode(content));
        }
    };
    el[PROP_SUFFIX] = {
        get: (key) => element[key],
        set: (key, value) => (element[key] = value)
    };
    el[ATTR_SUFFIX] = {
        get: (name) => element.getAttribute(name),
        set: (name, value) => (typeof value === 'boolean')
            ? element.toggleAttribute(name, value)
            : isDefined(value)
                ? element.setAttribute(name, value)
                : element.removeAttribute(name)
    };
    el[CLASS_SUFFIX] = {
        get: (token) => element.classList.contains(token),
        set: (token, force) => element.classList.toggle(token, force)
    };
    isStylable(element) && (el[STYLE_SUFFIX] = {
        get: (prop) => element.style.getPropertyValue(prop),
        set: (prop, value) => isDefined(value)
            ? element.style.setProperty(prop, value)
            : element.style.removeProperty(prop)
    });
    return el;
};

/* === Constants === */
const SELECTOR_PREFIX = 'data';
/* === Exported function === */
/**
 * Loop through all elements with the given attribute and call the provided callback function
 *
 * @since 0.7.0
 * @param {Element} el - UIElement to iterate over
 * @param {string} suffix - attribute name suffix to look for
 * @param {(node: Element, value: string) => void} callback - callback function to be called for each element
 */
const autoApply = (el, suffix, callback) => {
    const attr = `${SELECTOR_PREFIX}-${el.localName}-${suffix}`;
    const apply = (node) => {
        callback(node, node.getAttribute(attr));
        node.removeAttribute(attr);
    };
    el.hasAttribute(attr) && apply(el);
    for (const node of el.querySelectorAll(`[${attr}]`))
        apply(node);
};

/* === Exported functions === */
/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 *
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
const autoEffects = (el) => {
    [TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX].forEach(suffix => {
        const textCallback = (node, value) => {
            const key = value.trim();
            const obj = uiRef(node)[suffix];
            const fallback = obj.get();
            el.set(key, fallback, false);
            effect(enqueue => {
                if (el.has(key)) {
                    const content = el.get(key);
                    enqueue(node, () => obj.set(isDefined(content)
                        ? content
                        : fallback));
                }
            });
        };
        const keyValueCallback = (node, v) => {
            const splitted = (str, separator) => str.split(separator).map(s => s.trim());
            splitted(v, ';').forEach((value) => {
                const [name, key = name] = splitted(value, ':');
                const obj = uiRef(node)[suffix];
                el.set(key, obj.get(), false);
                effect(enqueue => el.has(key) && enqueue(node, () => obj.set(name, el.get(key))));
            });
        };
        autoApply(el, suffix, suffix === TEXT_SUFFIX ? textCallback : keyValueCallback);
    });
};

/* === Constants === */
const HOVER_SUFFIX = 'hover';
const FOCUS_SUFFIX = 'focus';
const EFFECT_CLASS = 'ui-effect';
/* === Exported function === */
/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 *
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
 */
const highlightTargets = (el, className = EFFECT_CLASS) => {
    [HOVER_SUFFIX, FOCUS_SUFFIX].forEach(suffix => {
        const [onOn, onOff] = suffix === HOVER_SUFFIX
            ? ['mouseenter', 'mouseleave']
            : ['focus', 'blur'];
        autoApply(el, suffix, (node, value) => {
            const key = value.trim();
            const on = (type, force) => node.addEventListener(type, () => {
                for (const target of el.targets(key))
                    target.classList.toggle(className, force);
            });
            on(onOn, true);
            on(onOff, false);
        });
    });
};

/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 *
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIAttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(connect: IUIElement) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(disconnect: IUIElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
const uiComponent = (tag, attributeMap = {}, connect, disconnect) => {
    const UIComponent = class extends UIElement {
        static observedAttributes = Object.keys(attributeMap);
        attributeMap = attributeMap;
        connectedCallback() {
            super.connectedCallback();
            connect && connect(this);
            autoEffects(this);
            highlightTargets(this);
        }
        disconnectedCallback() {
            disconnect && disconnect(this);
        }
    };
    UIComponent.define(tag);
    return UIComponent;
};

export { UIElement, asBoolean, asInteger, asNumber, asString, uiComponent as default, effect, uiRef };
