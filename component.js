/* === Exported Functions === */
const is = (type) => (value) => typeof value === type;
const isNullish = (value) => value == null;
const isDefined = (value) => value != null;
const isString = is('string');
const isObject = is('object');
const isDefinedObject = (value) => isDefined(value) && isObject(value);
const isFunction = is('function');
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
 * Check if a given value is a container function
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function
 */
const isAnyContainer = (value) => isFunction(value) && 'type' in value;
/**
 * Check if a given value is a container function
 *
 * @since 0.8.0
 * @param {string} type - expected container type
 * @param {unknown} value - value to check
 * @returns {boolean} - whether the value is a container function of the given type
 */
const isContainer = (type, value) => isAnyContainer(value) && value.type === type;
/**
 * Check if a given value is a functor
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is a functor, false otherwise
 */
const isFunctor = (value) => isAnyContainer(value) && 'map' in value;
/**
 * Check if a given value is nothing
 *
 * @since 0.8.0
 * @param {unknown} value - value to check
 * @returns {boolean} - true if the value is nothing, false otherwise
 */
const isNothing = (value) => isNullish(value) || isContainer(TYPE_NOTHING, value);
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
const TYPE_STATE = 'state';
const TYPE_COMPUTED = 'computed';
const TYPE_EFFECT = 'effect';
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
 * Check if a given variable is a reactive state
 *
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value) => isContainer(TYPE_STATE, value);
/**
 * Check if a given variable is a reactive computed state
 *
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value) => isContainer(TYPE_COMPUTED, value);
/**
 * Check if a given variable is a reactive signal (state or computed state)
 *
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value) => isState(value) || isComputed(value);
/**
 * Check if a given variable is a reactive effect
 *
 * @param {unknown} value - variable to check if it is a reactive effect
 * /
const isEffect = (value: unknown): value is UIEffect => isContainer(TYPE_EFFECT, value)

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
    s.type = TYPE_STATE;
    s.effects = new Set(); // set of listeners
    s.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isAnyContainer(updater)
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
    n.type = TYPE_EFFECT;
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
     * @param {UIElement} element - child element to pass the states to
     * @param {UIStateMap} states - object of states to be passed; target state keys as keys, source state keys or function as values
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry to be used; defaults to `customElements`
     */
    async pass(element, states, registry = customElements) {
        await registry.whenDefined(element.localName);
        for (const [key, source] of Object.entries(states))
            element.set(key, isSignal(source)
                ? source
                : isFunction(source)
                    ? cause(source)
                    : this.#states.get(source));
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
/**
 * Return selector string for the id of the element
 *
 * @param {string} id
 * @returns {string} - id string for the element with '#' prefix
 * /
const idString = (id: string): string => id ? `#${id}` : '';

/**
 * Return a selector string for classes of the element
 *
 * @param {DOMTokenList} classList - DOMTokenList to convert to a string
 * @returns {string} - class string for the DOMTokenList with '.' prefix if any
 * /
const classString = (classList: DOMTokenList): string => classList.length ? `.${Array.from(classList).join('.')}` : '';

/* === Exported functions === */
/**
 * Create a "list" container for an array of whatever, providing a chainable API for handling multiple values
 *
 * @since 0.8.0
 * @param {unknown} items - array of items to wrap in a list container
 * @returns {UIList} - UIList instance for the given array
 */
const list = (items) => {
    const l = () => items;
    l.type = 'list';
    // l.toString = () => items.map(n => n.toString()).join('\n')
    l.map = (fn) => list(items.map((item) => fn(item)));
    l.chain = (fn) => fn(items);
    l.filter = (fn) => list(items.filter((item) => fn(item)));
    // l.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(l)
    return l;
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
    el.type = node.localName;
    // el.toString = () => `<${node.localName}${idString(node.id)}${classString(node.classList)}>`
    el.map = (fn) => ui(host, fn(host, node));
    el.chain = (fn) => fn(host, node);
    el.filter = (fn) => fn(host, node) ? ui(host, node) : nothing();
    // el.apply = <U>(other: UIFunctor<U>): UIFunctor<U> => other.map(el)
    el.first = (selector) => {
        const match = (host.shadowRoot || host).querySelector(selector);
        return match ? ui(host, match) : nothing();
    };
    el.all = (selector) => {
        return list(Array.from((host.shadowRoot || host).querySelectorAll(selector)).map(node => ui(host, node)));
    };
    el.on = (event, handler) => {
        node.addEventListener(event, handler);
        return el;
    };
    el.off = (event, handler) => {
        node.removeEventListener(event, handler);
        return el;
    };
    el.text = (state) => {
        const fallback = node.textContent || '';
        host.set(state, fallback, false);
        effect((q) => host.has(state) && q(node, () => {
            const content = host.get(state);
            Array.from(node.childNodes).filter(isComment).forEach(match => match.remove());
            node.append(document.createTextNode(isDefined(content) ? String(content) : fallback));
        }));
        return el;
    };
    el.prop = (key, state = key) => {
        host.set(state, node[key], false);
        effect((q) => host.has(state) && q(node, () => node[key] = host.get(state)));
        return el;
    };
    el.attr = (name, state = name) => {
        host.set(state, node.getAttribute(name), false);
        effect((q) => host.has(state) && q(node, () => {
            const value = host.get(state);
            isDefined(value) ? node.setAttribute(name, String(value)) : node.removeAttribute(name);
        }));
        return el;
    };
    el.bool = (name, state = name) => {
        host.set(state, node.hasAttribute(name), false);
        effect((q) => host.has(state) && q(node, () => node.toggleAttribute(name, !!host.get(state))));
        return el;
    };
    el.class = (token, state = token) => {
        host.set(state, node.classList.contains(token), false);
        effect((q) => host.has(state) && q(node, () => node.classList.toggle(token, !!host.get(state))));
        return el;
    };
    el.style = (prop, state = prop) => {
        if (isStylable(node)) {
            host.set(state, node.style[prop], false);
            effect((q) => host.has(state) && q(node, () => node.style[prop] = host.get(state)));
        }
        else {
            console.error(`Style effect not supported for element type ${node.localName}`);
        }
        return el;
    };
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
