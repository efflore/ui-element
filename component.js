/* === Exported Functions === */
const isType = (type) => (value) => typeof value === type;
const isNullish = (value) => value == null;
const isDefined = (value) => value != null;
const isString = isType('string');
const isObject = isType('object');
const isFunction = isType('function');
const isDefinedObject = (value) => isDefined(value) && (isObject(value) || isFunction(value));
// const isHTMLElement: (node: Node) => boolean = isInstanceOf(HTMLElement)
// const isSVGElement: (node: Node) => boolean = isInstanceOf(SVGElement)
// const isMathMLElement: (node: Node) => boolean = isInstanceOf(MathMLElement)
const isComment = (node) => node.nodeType !== Node.COMMENT_NODE;

/* === Constants === */
const TYPE_NOTHING = 'nothing';
/* === Exported Functions === */
/**
 * Unwrap any value wrapped in a function
 *
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value
 */
const unwrap = (value) => isFunction(value) ? unwrap(value()) : value;
/**
 * Check if an object has a method of given name
 *
 * @since 0.8.0
 * @param {object} obj - object to check
 * @returns {boolean} - true if the object has a method of the given name, false otherwise
 */
const hasMethod = (obj, name) => obj && isFunction(obj[name]);
/**
 * Check if a given value is a functor
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
const isFunctor = (value) => isDefinedObject(value) && hasMethod(value, 'map');
/**
 * Check if a given value is nothing
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
const isNothing = (value) => isNullish(value)
    || (isFunction(value) && 'type' in value && value.type === TYPE_NOTHING);
/**
 * Create a container for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {UIMaybe<T>} - container of either "something" or "nothing" for the given value
 */
const maybe = (value) => isNothing(value) ? nothing() : something(value);
/**
 * Create a "something" container for a given value, providing a chainable API for handling nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a "something" container
 * @returns {UISomething} - container of "something" type for the given value
 */
const something = (value) => {
    const j = () => value;
    j.type = typeof value;
    // j.toString = (): string => isDefinedObject(value) ? JSON.stringify(value) : String(value)
    j.or = (_) => value;
    j.map = (fn) => maybe(fn(value));
    j.chain = (fn) => fn(value);
    j.filter = (fn) => fn(value) ? something(value) : nothing();
    // j.apply = <T>(other: UIFunctor<T>): UIFunctor<T> => isFunction(value) ? other.map(value) : other.map(j)
    return j;
};
/**
 * Create a "nothing" container for a given value, providing a chainable API for handling nullable values
 *
 * @since 0.8.0
 * @returns {UINothing<T>} - container of "nothing" at all
 */
const nothing = () => new Proxy(() => undefined, {
    get: (_, prop) => {
        switch (prop) {
            case 'type': return TYPE_NOTHING;
            case 'toString': return () => '';
            case 'or': return (value) => value;
            case 'chain': return (fn) => fn();
            default: return () => nothing();
        }
    }
});

/* === Constants === */
/* const TYPE_STATE = 'state'
const TYPE_COMPUTED = 'computed'
const TYPE_EFFECT = 'effect' */
/* === Internal === */
// hold the currently active effect
let active;
/**
 * Run all effects in the provided set
 *
 * @param {Set<UIEffect | UIComputed<unknown>>} effects
 */
const autorun = (effects) => {
    for (const effect of effects)
        effect.run();
};
/* === Exported functions === */
/**
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value) => isFunction(value) && hasMethod(value, 'set');
/**
 * Check if a given variable is a reactive computed state
 *
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value) => isFunction(value) && hasMethod(value, 'run') && 'effects' in value;
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value) => isState(value) || isComputed(value);
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<unknown>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const s = () => {
        active && s.effects.add(active);
        return value;
    };
    // s.type = TYPE_STATE
    s.effects = new Set(); // set of listeners
    s.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isSignal(updater)
            ? isFunctor(value)
                ? value.map(updater)
                : updater(value)
            : updater;
        !Object.is(unwrap(value), unwrap(old)) && autorun(s.effects);
    };
    return s;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Map();
    const n = () => {
        const prev = active;
        active = n;
        const cleanup = fn((element, domFn) => {
            !targets.has(element) && targets.set(element, new Set());
            targets.get(element)?.add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn();
            domFns.clear();
        }
        active = prev;
        isFunction(cleanup) && queueMicrotask(cleanup);
    };
    // n.type = TYPE_EFFECT
    n.run = () => n();
    n.targets = targets;
    n();
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

/* === Default export === */
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
class UIElement extends HTMLElement {
    static consumedContexts;
    static providedContexts;
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
    // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
    #states = new Map();
    /**
     * Native callback function when an observed attribute of the custom element changes
     *
     * @since 0.1.0
     * @param {string} name - name of the modified attribute
     * @param {string | undefined} old - old value of the modified attribute
     * @param {string | undefined} value - new value of the modified attribute
     */
    attributeChangedCallback(name, old, value) {
        if (value === old)
            return;
        const parser = this.attributeMap[name];
        const maybeValue = maybe(value);
        this.set(name, isFunction(parser)
            ? maybeValue.map((v) => parser(v, this, old))
            : maybeValue);
    }
    connectedCallback() {
        const proto = this.constructor;
        // context consumer
        const consumed = proto.consumedContexts || [];
        for (const context of consumed)
            this.set(String(context), undefined);
        setTimeout(() => {
            for (const context of consumed)
                this.dispatchEvent(new ContextRequestEvent(context, (value) => this.set(String(context), value)));
        });
        // context provider: listen to context request events
        const provided = proto.providedContexts || [];
        if (!provided.length)
            return;
        this.addEventListener(CONTEXT_REQUEST, (e) => {
            const { context, callback } = e;
            if (!provided.includes(context) || !isFunction(callback))
                return;
            e.stopPropagation();
            callback(this.#states.get(String(context)));
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
     * @returns {T | undefined} current value of state; undefined if state does not exist
     */
    get(key) {
        return unwrap(this.#states.get(key));
    }
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {PropertyKey} key - state to set value to
     * @param {T | ((old: T | undefined) => T) | UISignal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
     */
    set(key, value, update = true) {
        if (!this.#states.has(key)) {
            this.#states.set(key, isSignal(value) ? value : cause(value));
        }
        else if (update) {
            const state = this.#states.get(key);
            isState(state) && state.set(value);
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
     * @param {UIElement} target - child element to pass the states to
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    async pass(target, states, registry = customElements) {
        await registry.whenDefined(target.localName);
        if (!hasMethod(target, 'set'))
            throw new TypeError('Expected UIElement');
        for (const [key, source] of Object.entries(states))
            target.set(key, isSignal(source)
                ? source
                : isFunction(source)
                    ? cause(source)
                    : this.#states.get(source));
    }
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {PropertyKey} key - state to get signal for
     * @returns {UISignal<T> | undefined} signal for the given state; undefined if
     */
    signal(key) {
        return this.#states.get(key);
    }
}

/* === Internal === */
/**
 * Returns a finite number or undefined
 *
 * @param {number} value
 * @returns {number | undefined}
 */
const toFinite = (value) => Number.isFinite(value) ? value : undefined;
/* === Exported functions === */
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {boolean}
 */
const asBoolean = (value) => isString(value);
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
const asInteger = (value) => toFinite(parseInt(value, 10));
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {number | undefined}
 */
const asNumber = (value) => toFinite(parseFloat(value));
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
const asString = (value) => isDefined(value) ? value : undefined;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string | undefined} value
 * @returns {Record<string, unknown> | undefined}
 */
const asJSON = (value) => {
    let result;
    try {
        result = JSON.parse(value);
    }
    catch (error) {
        console.error(error);
        result = undefined;
    }
    return result;
};

/* Internal functions === */
/**
 * Check if a given variable is an element which can have a style property
 *
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node) => {
    for (const type of [HTMLElement, SVGElement, MathMLElement]) {
        if (node instanceof type)
            return true;
    }
    return false;
};
/* === Default export === */
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.7.2
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element} node - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
const ui = (host, node = host) => {
    const el = () => node;
    // el.type = node.localName
    // el.toString = () => `<${node.localName}${idString(node.id)}${classString(node.classList)}>`
    el.map = (fn) => ui(host, fn(host, node));
    el.chain = (fn) => fn(host, node);
    el.filter = (fn) => fn(host, node) ? ui(host, node) : nothing();
    // el.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(el)
    el.on = (event, handler) => {
        node.addEventListener(event, handler);
        return el;
    };
    el.off = (event, handler) => {
        node.removeEventListener(event, handler);
        return el;
    };
    const autoEffect = (state, fallback, setter) => {
        host.set(state, fallback, false);
        effect((q) => host.has(state) && q(node, () => setter(host.get(state), fallback)));
        return el;
    };
    el.text = (state) => autoEffect(state, node.textContent || '', (content, fallback) => {
        Array.from(node.childNodes).filter(isComment).forEach(match => match.remove());
        node.append(document.createTextNode(isDefined(content) ? String(content) : fallback));
    });
    el.prop = (key, state = key) => autoEffect(state, node[key], (value) => node[key] = value);
    el.attr = (name, state = name) => autoEffect(state, node.getAttribute(name), (value) => isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name));
    el.bool = (name, state = name) => autoEffect(state, node.hasAttribute(name), (value) => node.toggleAttribute(name, value));
    el.class = (token, state = token) => autoEffect(state, node.classList.contains(token), (value) => node.classList[value ? 'add' : 'remove'](token));
    if (isStylable(node)) {
        el.style = (prop, state = prop) => autoEffect(state, node.style[prop], (value) => isDefined(value) ? node.style[prop] = String(value) : node.style.removeProperty(prop));
    }
    if (host === node) {
        const root = (host.shadowRoot || host);
        el.first = (selector) => {
            const match = root.querySelector(selector);
            return match ? ui(host, match) : nothing();
        };
        el.all = (selector) => Array.from(root.querySelectorAll(selector)).map(node => ui(host, node)); // Arrays are monads too :-)
    }
    return el;
};

/* === Default export === */
/**
 * Create a UIElement subclass for a custom element tag
 *
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIComponentProps} props - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement, my: UIRef<Element>) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(host: UIElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @param {typeof UIElement} superClass - parent class to extend; defaults to `UIElement`
 * @returns {typeof FxComponent} - custom element class
 */
const component = (tag, props = {}, connect, disconnect, superClass = UIElement) => {
    const UIComponent = class extends superClass {
        static observedAttributes = isDefinedObject(props.attributeMap) ? Object.keys(props.attributeMap) : [];
        static providedContexts = props.providedContexts || [];
        static consumedContexts = props.consumedContexts || [];
        attributeMap = props.attributeMap || {};
        connectedCallback() {
            super.connectedCallback();
            connect && connect(this, ui(this));
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            disconnect && disconnect(this);
        }
    };
    UIComponent.define(tag);
    return UIComponent;
};

export { asBoolean, asInteger, asJSON, asNumber, asString, component, UIElement as default, effect, ui };
