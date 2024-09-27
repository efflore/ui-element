/* === Exported Functions === */
const isOfType = (type) => (value) => typeof value === type;
const isString = isOfType('string');
const isObject = isOfType('object');
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const isFunction = isOfType('function');
const isNullish = (value) => value == null;
const isDefined = (value) => value != null;
const isDefinedObject = (value) => isDefined(value) && (isObject(value) || isFunction(value));
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const hasMethod = (obj, name) => isFunction(obj[name]);
const isComment = (node) => node.nodeType !== Node.COMMENT_NODE;

/* === Exported Function === */
/**
 * Create an array for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
const maybe = (value) => isNullish(value) ? [] : [value];

/* === Types === */
/* === Constants === */
const LOG_DEBUG = 'debug';
const LOG_WARN = 'warn';
const LOG_ERROR = 'error';
/* === Default Export */
const log = (value, msg, level = LOG_DEBUG) => {
    if ([LOG_ERROR, LOG_WARN].includes(level))
        console[level](msg, value);
    return value;
};

/* === Exported Function === */
/**
 * Schedules functions to be executed after the next animation frame or after all events have been dispatched
 *
 * @since 0.8.0
 * @returns {Scheduler}
 */
const scheduler = () => {
    const effectQueue = new Map();
    const cleanupQueue = new Map();
    let requestId;
    const run = (fn, msg) => {
        try {
            fn();
        }
        catch (reason) {
            log(reason, msg, LOG_ERROR);
        }
    };
    const flush = () => {
        requestId = null;
        effectQueue.forEach((elEffect, el) => elEffect.forEach((fn, prop) => run(fn(el), `Effect ${prop} on ${el?.localName || 'unknown'} failed`)));
        effectQueue.clear();
        cleanupQueue.forEach(fn => run(fn, 'Cleanup failed'));
        cleanupQueue.clear();
    };
    const requestTick = () => {
        if (requestId)
            cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(flush);
    };
    const getEffectMap = (key) => {
        if (!effectQueue.has(key))
            effectQueue.set(key, new Map());
        return effectQueue.get(key);
    };
    const addToQueue = (map) => (key, fn) => {
        const more = !map.has(key);
        map.set(key, fn);
        if (more)
            requestTick();
    };
    queueMicrotask(flush); // initial flush when the call stack is empty
    return {
        enqueue: (element, prop, fn) => addToQueue(getEffectMap(element))(prop, fn),
        cleanup: addToQueue(cleanupQueue)
    };
};

/* === Internal === */
// hold the currently active effect
let active;
// hold schuduler instance
const { enqueue, cleanup } = scheduler();
/**
 * Add notify function of active listener to the set of listeners
 *
 * @param {Set<() => void>} targets - set of current listeners
 */
const autotrack = (targets) => {
    if (active)
        targets.add(active);
};
/**
 * Run all notify function of dependent listeners
 *
 * @param {Set<() => void>} targets
 */
const autorun = (targets) => targets.forEach(notify => notify());
/**
 * Run a function in a reactive context
 *
 * @param {() => void} fn - function to run the computation or effect
 * @param {() => void} notify - function to be called when the state changes
 */
const reactive = (fn, notify) => {
    const prev = active;
    active = notify;
    try {
        fn();
    }
    catch (error) {
        log(error, 'Error during reactive computation', LOG_ERROR);
    }
    finally {
        active = prev;
    }
};
/* === Exported Functions === */
/**
 * Check if a given variable is a state signal
 *
 * @param {unknown} value - variable to check
 * @returns {boolean} true if supplied parameter is a state signal
 */
const isState = (value) => isDefinedObject(value) && hasMethod(value, 'set');
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const targets = new Set();
    const state = () => {
        autotrack(targets);
        return value;
    };
    state.set = (updater) => {
        const old = value;
        value = isFunction(updater) && updater.length ? updater(value) : updater;
        if (!Object.is(value, old))
            autorun(targets);
    };
    return state;
};
/**
 * Create a derived state from a existing states
 *
 * @since 0.1.0
 * @param {() => T} fn - compute function to derive state
 * @returns {Computed<T>} result of derived state
 */
const derive = (fn, memo = false) => {
    const targets = new Set();
    let value;
    let stale = true;
    const notify = () => {
        stale = true;
        if (memo)
            autorun(targets);
    };
    return () => {
        autotrack(targets);
        if (!memo || stale)
            reactive(() => {
                value = fn();
                stale = isNullish(value);
            }, notify);
        return value;
    };
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const run = () => reactive(() => {
        const cleanupFn = fn(enqueue);
        if (isFunction(cleanupFn))
            cleanup(fn, cleanupFn);
    }, run);
    run();
};

/* === Exported Functions === */
/**
 * Parse according to static attributeMap
 *
 * @since 0.8.4
 * @param {UIElement} host - host UIElement
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string | undefined} [old=undefined] - old attribute value
 */
const parse = (host, name, value, old = undefined) => {
    const parser = host.constructor.attributeMap[name];
    return isFunction(parser) ? parser(maybe(value), host, old)[0] : value;
};

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
        super(CONTEXT_REQUEST, {
            bubbles: true,
            composed: true
        });
        this.context = context;
        this.callback = callback;
        this.subscribe = subscribe;
    }
}
/**
 * Initialize context provider / consumer for a UIElement instance
 *
 * @param {UIelement} host - UIElement instance to initialize context for
 */
const initContext = (host) => {
    const proto = host.constructor;
    // context consumers
    const consumed = proto.consumedContexts || [];
    for (const context of consumed)
        host.set(String(context), undefined, false);
    setTimeout(() => {
        for (const context of consumed)
            host.dispatchEvent(new ContextRequestEvent(context, (value) => host.set(String(context), value)));
    });
    // context providers
    const provided = proto.providedContexts || [];
    if (!provided.length)
        return;
    host.addEventListener(CONTEXT_REQUEST, (e) => {
        const { context, callback } = e;
        if (!provided.includes(context) || !isFunction(callback))
            return;
        e.stopPropagation();
        callback(host.get(String(context)));
    });
};

/* === Exported Function === */
/**
 * Pass states from one UIElement to another
 *
 * @since 0.8.0
 * @param {StateMap} stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
const pass = (stateMap) => 
/**
 * Partially applied function that connects to params of UI map function
 *
 * @param {UI<E>} ui - source UIElement to pass states from
 * @returns - Promise that resolves to UI object of the target UIElement, when it is defined and got passed states
 */
async (ui) => {
    await ui.host.constructor.registry.whenDefined(ui.target.localName);
    for (const [key, source] of Object.entries(stateMap))
        ui.target.set(key, isState(source)
            ? source
            : isFunction(source)
                ? cause(source) // we need cause() here; with derive() the lexical scope of the source would be lost
                : ui.host.signal(source));
    return ui;
};

/* === Exported Functions === */
/**
 * Add event listener to a target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to add
 */
const on = (event, handler) => 
/**
 * Partially applied function to connect to params of UI map function
 *
 * @param {UI<E>} ui - UI object of target element to listen to events
 * @returns - returns ui object of the target
 */
(ui) => {
    ui.target.addEventListener(event, handler);
    return ui;
};
/**
 * Remove event listener from target element
 *
 * @since 0.8.1
 * @param {string} event - event name to listen to
 * @param {EventListener} handler - event handler to remove
 */
const off = (event, handler) => 
/**
 * Partially applied function to connect to params of UI map function
 *
 * @param {UI<E>} ui - UI object of target element to listen to events
 * @returns - returns ui object of the target
 */
(ui) => {
    ui.target.removeEventListener(event, handler);
    return ui;
};
/**
 * Auto-Effect to emit a custom event when a state changes
 *
 * @since 0.8.3
 * @param {string} event - event name to dispatch
 * @param {StateLike} state - state key
 */
const emit = (event, state = event) => 
/**
 * Partially applied function to connect to params of UI map function
 *
 * @param {UI<E>} ui - UI object of target element to listen to events
 * @returns - returns ui object of the target
 */
(ui) => {
    effect(() => {
        ui.target.dispatchEvent(new CustomEvent(event, {
            detail: ui.host.get(state),
            bubbles: true
        }));
    });
    return ui;
};

/* === Exported functions === */
/**
 * Parse a boolean attribute as an actual boolean value
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {boolean[]}
 */
const asBoolean = (value) => [isDefined(value[0])];
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
const asInteger = (value) => value.map(v => parseInt(v, 10)).filter(Number.isFinite);
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {number[]}
 */
const asNumber = (value) => value.map(parseFloat).filter(Number.isFinite);
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {string[]} value - maybe string value or nothing
 * @returns {string[]}
 */
const asString = (value) => value;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {string[]} value - maybe string value or nothing
 * @returns {unknown[]}
 */
const asJSON = (value) => {
    let result = [];
    try {
        result = value.map(v => JSON.parse(v));
    }
    catch (error) {
        log(error, 'Failed to parse JSON', LOG_ERROR);
    }
    return result;
};

/* === Internal Functions === */
/**
 * Auto-effect for setting properties of a target element according to a given state
 *
 * @since 0.8.0
 * @param {UI} ui - UI object of host UIElement and target element to update properties
 * @param {StateLike} state - state to be set to the host element
 * @param {string} prop - property name to be updated
 * @param {T} fallback - fallback value to be used if state is not defined
 * @param {(element: E) => () => void} onNothing - callback to be executed when state is not defined
 * @param {(value: T) => (element: E) => () => void} onSomething - callback to be executed when state is defined
 * @returns {UI} object with host and target
 */
const autoEffect = (ui, state, prop, fallback, onNothing, onSomething) => {
    if (!isFunction(state))
        ui.host.set(state, isString(state) && isString(fallback) ? parse(ui.host, state, fallback) : fallback, false);
    effect((enqueue) => {
        const value = isFunction(state) ? state() : ui.host.get(state);
        enqueue(ui.target, prop, isNullish(value) ? onNothing : onSomething(value));
    });
    return ui;
};
/* === Exported Functions === */
/**
 * Set text content of an element
 *
 * @since 0.8.0
 * @param {StateLike} state - state bounded to the text content
 */
const setText = (state) => (ui) => {
    const fallback = ui.target.textContent || '';
    const setter = (value) => (element) => () => {
        Array.from(element.childNodes).filter(isComment).forEach(match => match.remove());
        element.append(document.createTextNode(value));
    };
    return autoEffect(ui, state, 't', fallback, setter(fallback), setter);
};
/**
 * Set property of an element
 *
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike} state - state bounded to the property value
 */
const setProperty = (key, state = key) => (ui) => {
    const setter = (value) => (element) => () => element[key] = value;
    return autoEffect(ui, state, `p-${String(key)}`, ui.target[key], setter(null), setter);
};
/**
 * Set attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike} state - state bounded to the attribute value
 */
const setAttribute = (name, state = name) => (ui) => autoEffect(ui, state, `a-${name}`, ui.target.getAttribute(name), (element) => () => element.removeAttribute(name), (value) => (element) => () => element.setAttribute(name, value));
/**
 * Toggle a boolan attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike} state - state bounded to the attribute existence
 */
const toggleAttribute = (name, state = name) => (ui) => {
    const setter = (value) => (element) => () => element.toggleAttribute(name, value);
    return autoEffect(ui, state, `a-${name}`, ui.target.hasAttribute(name), setter(false), setter);
};
/**
 * Toggle a classList token of an element
 *
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike} state - state bounded to the class existence
 */
const toggleClass = (token, state = token) => (ui) => autoEffect(ui, state, `c-${token}`, ui.target.classList.contains(token), (element) => () => element.classList.remove(token), (value) => (element) => () => element.classList.toggle(token, value));
/**
 * Set a style property of an element
 *
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike} state - state bounded to the style property value
 */
const setStyle = (prop, state = prop) => (ui) => autoEffect(ui, state, `s-${prop}`, ui.target.style[prop], (element) => () => element.style.removeProperty(prop), (value) => (element) => () => element.style[prop] = value);

/* === Exported Class and Functions === */
/**
 * Base class for reactive custom elements
 *
 * @class UIElement
 * @extends HTMLElement
 * @type {UIElement}
 */
class UIElement extends HTMLElement {
    static registry = customElements;
    static attributeMap = {};
    static consumedContexts;
    static providedContexts;
    /**
     * Define a custom element in the custom element registry
     *
     * @since 0.5.0
     * @param {string} tag - name of the custom element
     */
    static define(tag) {
        try {
            if (!this.registry.get(tag))
                this.registry.define(tag, this);
        }
        catch (error) {
            log(tag, error.message, LOG_ERROR);
        }
    }
    // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
    #states = new Map();
    /**
     * @since 0.8.1
     * @property {UI<UIElement>[]} self - single item array of UI object for this element
     */
    self = [{
            host: this,
            target: this
        }];
    /**
     * @since 0.8.3
     */
    root = this.shadowRoot || this;
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
        this.set(name, parse(this, name, value, old));
    }
    /**
     * Native callback function when the custom element is first connected to the document
     *
     * Used for context providers and consumers
     * If your component uses context, you must call `super.connectedCallback()`
     *
     * @since 0.7.0
     */
    connectedCallback() {
        initContext(this);
    }
    disconnectedCallback() { }
    /**
     * Check whether a state is set
     *
     * @since 0.2.0
     * @param {any} key - state to be checked
     * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
     */
    has(key) {
        return this.#states.has(key);
    }
    /**
     * Get the current value of a state
     *
     * @since 0.2.0
     * @param {any} key - state to get value from
     * @returns {T | undefined} current value of state; undefined if state does not exist
     */
    get(key) {
        const unwrap = (v) => isFunction(v) ? unwrap(v()) : v;
        return unwrap(this.#states.get(key));
    }
    /**
     * Create a state or update its value and return its current value
     *
     * @since 0.2.0
     * @param {any} key - state to set value to
     * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
     */
    set(key, value, update = true) {
        if (!this.#states.has(key)) {
            this.#states.set(key, isState(value) ? value : cause(value));
        }
        else if (update) {
            const state = this.#states.get(key);
            if (isState(state))
                state.set(value);
        }
    }
    /**
     * Delete a state, also removing all effects dependent on the state
     *
     * @since 0.4.0
     * @param {any} key - state to be deleted
     * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
     */
    delete(key) {
        return this.#states.delete(key);
    }
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {any} key - state to get signal for
     * @returns {Signal<T> | undefined} signal for the given state; undefined if
     */
    signal(key) {
        return this.#states.get(key);
    }
    /**
     * Get array of first sub-element matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-element
     * @returns {UI<Element>[]} - array of zero or one UI objects of matching sub-element
     */
    first(selector) {
        return maybe(this.root.querySelector(selector)).map(target => ({ host: this, target }));
    }
    /**
     * Get array of all sub-elements matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-elements
     * @returns {UI<Element>[]} - array of UI object of matching sub-elements
     */
    all(selector) {
        return Array.from(this.root.querySelectorAll(selector)).map(target => ({ host: this, target }));
    }
}

export { UIElement, asBoolean, asInteger, asJSON, asNumber, asString, derive, effect, emit, log, maybe, off, on, pass, setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass };
