/* === Types === */
/* === Exported Functions === */
const isOfType = (type) => (value) => typeof value === type;
const isSymbol = isOfType('symbol');
const isNumber = isOfType('number');
const isString = isOfType('string');
const isObject = isOfType('object');
const isPropertyKey = (value) => isString(value) || isSymbol(value) || isNumber(value);
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const isFunction = isOfType('function');
const callFunction = (fn, ...args) => isFunction(fn) ? fn(...args) : undefined;
const isNull = (value) => value === null;
const isNullish = (value) => value == null;
const isDefined = (value) => value != null;
const isDefinedObject = (value) => isDefined(value) && (isObject(value) || isFunction(value));
const isObjectOfType = (value, type) => isDefinedObject(value) && (Symbol.toStringTag in value) && value[Symbol.toStringTag] === type;
const isComment = (node) => node.nodeType === Node.COMMENT_NODE;

const LOG_DEBUG = 'debug';
const LOG_INFO = 'info';
const LOG_WARN = 'warn';
const LOG_ERROR = 'error';
/* === Internal Functions === */
/**
 * Return selector string for the id of the element
 *
 * @since 0.7.0
 * @param {string} id
 * @returns {string} - id string for the element with '#' prefix
 */
const idString = (id) => id ? `#${id}` : '';
/**
 * Return a selector string for classes of the element
 *
 * @since 0.7.0
 * @param {DOMTokenList} classList - DOMTokenList to convert to a string
 * @returns {string} - class string for the DOMTokenList with '.' prefix if any
 */
const classString = (classList) => classList.length ? `.${Array.from(classList).join('.')}` : '';
/* === Exported Functions === */
/**
 * Return a HyperScript string representation of the Element instance
 *
 * @since 0.7.0
 * @param {Element} el
 * @returns {string}
 */
const elementName = (el) => `<${el.localName}${idString(el.id)}${classString(el.classList)}>`;
/**
 * Return a string representation of a JavaScript variable
 *
 * @since 0.7.0
 * @param {unknown} value
 * @returns {string}
 */
const valueString = (value) => isString(value) ? `"${value}"`
    : isObject(value) ? JSON.stringify(value)
        : isDefined(value) ? String(value)
            : 'undefined';
/**
 * Log a message to the console with the specified level
 *
 * @since 0.7.0
 * @param {T} value - value to inspect
 * @param {string} msg - message to log
 * @param {LogLevel} level - log level
 * @returns {T} - value passed through
 */
const log = (value, msg, level = LOG_DEBUG) => {
    console[level](msg, value);
    return value;
};

/* === Constants === */
const TYPE_OK = 'Ok';
const TYPE_NONE = 'None';
const TYPE_FAIL = 'Fail';
/* === Exported Function === */
/**
 * Create an "Ok" value, representing a value
 *
 * @since 0.9.0
 * @param {T} value - value to wrap in an "Ok" value
 * @returns {Ok<T>} - "Ok" value with the given value
 */
const ok = (value) => ({
    [Symbol.toStringTag]: TYPE_OK,
    value,
    map: f => ok(f(value)),
    flatMap: f => f(value),
    filter: f => f(value) ? ok(value) : none(),
    guard: f => f(value) ? ok(value) : none(),
    or: () => ok(value),
    get: () => value,
});
/**
 * Create a "None" value, representing a lack of a value
 *
 * @since 0.9.0
 * @returns {None} - "None" value
 */
const none = () => {
    const map = () => none();
    return {
        [Symbol.toStringTag]: TYPE_NONE,
        map,
        flatMap: map,
        filter: map,
        guard: map,
        or: fallback => maybe(fallback),
        get: () => undefined,
    };
};
/**
 * Create a "Fail" value, representing a failure
 *
 * @since 0.9.0
 * @param {E extends Error} error - error to wrap in a "Fail" value
 * @returns {Fail<E>} - "Fail" value with the given error
 */
const fail = (error) => {
    const map = () => fail(error);
    return {
        [Symbol.toStringTag]: TYPE_FAIL,
        error,
        map,
        flatMap: map,
        filter: map,
        guard: map,
        or: (value) => maybe(value),
        get: () => { throw error; }, // re-throw error for the caller to handle
    };
};
/**
 * Check if a value is an "Ok" value
 *
 * @param {unknown} value - value to check
 * @returns {value is Ok<T>} - true if the value is an "Ok" value, false otherwise
 */
const isOk = (value) => isObjectOfType(value, TYPE_OK);
/**
 * Check if a value is a "None" value
 *
 * @param {unknown} value - value to check
 * @returns {value is None} - true if the value is a "None" value, false otherwise
 */
const isNone = (value) => isObjectOfType(value, TYPE_NONE);
/**
 * Check if a value is a "Fail" value
 *
 * @param {unknown} value -	value to check
 * @returns {value is Fail<E>} - true if the value is a "Fail" value, false otherwise
 */
const isFail = (value) => isObjectOfType(value, TYPE_FAIL);
/**
 * Check if a value is any result type
 */
const isResult = (value) => isOk(value) || isNone(value) || isFail(value);
/**
 * Create an array for a given value to gracefully handle nullable values
 *
 * @since 0.8.0
 * @param {unknown} value - value to wrap in an array
 * @returns {T[]} - array of either zero or one element, depending on whether the input is nullish
 */
const maybe = (value) => isDefined(value) ? ok(value) : none();
/**
 * Try executing the given function and returning a "Ok" value if it succeeds, or a "Fail" value if it fails
 *
 * @since 0.9.0
 * @param {() => T} f - function to try
 * @returns {Ok<T> | Fail<E>} - "Ok" value if the function succeeds, or a "Fail" value if it fails
 */
const result = (f) => {
    try {
        return maybe(f());
    }
    catch (error) {
        return fail(error);
    }
};
/**
 * Create an async task that retries the given function with exponential backoff if it fails
 *
 * @since 0.9.0
 * @param {() => Promise<T>} f - async function to try and maybe retry
 * @param {number} [retries=0] - number of times to retry the function if it fails; default is 0 (no retries)
 * @param {number} [delay=1000] - initial delay in milliseconds between retries; default is 1000ms
 * @returns {Promise<Result<T, E>>} - promise that resolves to the result of the function or fails with the last error encountered
 */
const task = (f, retries = 0, delay = 1000) => {
    const attemptTask = async (retries, delay) => {
        const r = result(async () => await f());
        return await match({
            [TYPE_FAIL]: async (error) => {
                if (retries < 1)
                    return fail(error);
                await new Promise(resolve => setTimeout(resolve, delay));
                return attemptTask(retries - 1, delay * 2); // retry with exponential backoff
            },
        })(r);
    };
    return attemptTask(retries, delay);
};
/**
 * Helper function to execute a series of functions in sequence
 *
 * @since 0.9.0
 * @param {((v: unknown) => unknown)[]} fs
 * @returns
 */
const flow = (...fs) => fs.reduce((acc, f) => callFunction(f, acc));
/**
 * Match a result type against a set of case handlers
 *
 * @since 0.9.0
 * @param {Cases<T, E, U>} cases - object with case handlers for pattern matching
 * @returns {<T, E extends Error>(result: Result<T, E>) => Result<U, E>} - value from the matching case handler, or the original value if no match is found
 */
const match = (cases) => (result) => {
    const handler = cases[result[Symbol.toStringTag]] || cases.else;
    const getProperty = (obj, prop) => (obj && prop in obj && obj[prop]) || undefined;
    const value = maybe(getProperty(result, 'value'))
        .or(getProperty(result, 'error'))
        .get();
    return maybe(handler)
        .guard(isFunction)
        .map(handler => handler(value))
        .or(value)
        .get();
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
        const r = result(fn);
        match({
            [TYPE_FAIL]: error => log(error, msg, LOG_ERROR)
        })(r);
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const addToQueue = (map) => 
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    (key, fn) => {
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

/* === Constants === */
const TYPE_STATE = 'State';
const TYPE_COMPUTED = 'Computed';
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
    const r = result(fn);
    match({
        [TYPE_FAIL]: error => log(error, 'Error during reactive computation', LOG_ERROR)
    })(r);
    active = prev;
};
/* === Exported Functions === */
/**
 * Check if a given variable is a state signal
 *
 * @since 0.7.0
 * @param {unknown} value - variable to check
 * @returns {boolean} true if supplied parameter is a state signal
 */
const isState = (value) => isObjectOfType(value, TYPE_STATE);
const isComputed = (value) => isObjectOfType(value, TYPE_COMPUTED);
const isSignal = (value) => isState(value) || isComputed(value);
/**
 * Define a reactive state
 *
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const state = (value) => {
    const targets = new Set();
    return {
        [Symbol.toStringTag]: TYPE_STATE,
        get() {
            autotrack(targets);
            return value;
        },
        set(updater) {
            const old = value;
            value = isFunction(updater) && updater.length ? updater(value) : updater;
            if (!Object.is(value, old))
                autorun(targets);
        },
        get targets() {
            return [...targets];
        },
    };
};
/**
 * Create a derived state from a existing states
 *
 * @since 0.1.0
 * @param {() => T} fn - compute function to derive state
 * @returns {Computed<T>} result of derived state
 */
const computed = (fn, memo = false) => {
    const targets = new Set();
    let value;
    let stale = true;
    const notify = () => {
        stale = true;
        if (memo)
            autorun(targets);
    };
    return {
        [Symbol.toStringTag]: TYPE_COMPUTED,
        get() {
            autotrack(targets);
            if (!memo || stale)
                reactive(() => {
                    value = fn();
                    stale = isNullish(value);
                }, notify);
            return value;
        },
        get targets() {
            return [...targets];
        },
    };
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const run = () => reactive(() => maybe(fn(enqueue))
        .guard(isFunction)
        .map(cleanupFn => cleanup(fn, cleanupFn)), run);
    run();
};

/* === Constants === */
const TYPE_UI = 'UI';
/* === Exported Functions === */
const ui = (host, target = host) => ({
    [Symbol.toStringTag]: TYPE_UI,
    host,
    target
});
const self = (host) => ok(ui(host));
const first = (host) => (selector) => maybe(host.root.querySelector(selector)).map((target) => ui(host, target));
const all = (host) => (selector) => Array.from(host.root.querySelectorAll(selector)).map(target => ui(host, target));

/* === Internal Functions === */
const isAttributeParser = (value) => isFunction(value) && !!value.length;
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
    return isAttributeParser(parser) ? parser(maybe(value), host, old) : value;
};

/* === Constants === */
const DEBUG_PROP = 'debug';
/* === Exported Class === */
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
    static observedAttributes;
    static consumedContexts;
    static providedContexts;
    /**
     * Define a custom element in the custom element registry
     *
     * @since 0.5.0
     * @param {string} tag - name of the custom element
     */
    static define(tag) {
        const r = result(() => UIElement.registry.define(tag, this));
        match({
            [TYPE_FAIL]: error => log(tag, error.message, LOG_ERROR),
            [TYPE_OK]: () => log(tag, 'Registered custom element')
        })(r);
    }
    /**
     * @since 0.9.0
     * @property {Map<PropertyKey, Signal<any>>} signals - map of observable properties
     */
    signals = new Map();
    /**
     * @since 0.9.0
     * @property {ElementInternals | undefined} internals - native internal properties of the custom element
     */
    internals;
    /**
     * @since 0.8.1
     * @property {UI<Element>[]} self - single item array of UI object for this element
     */
    self = self(this);
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
        if (this[DEBUG_PROP])
            log(`${valueString(old)} => ${valueString(value)}`, `Attribute "${name}" of ${elementName(this)} changed`);
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
        if (isString(this.getAttribute(DEBUG_PROP)))
            this[DEBUG_PROP] = true;
        if (this[DEBUG_PROP])
            log(elementName(this), 'Connected');
    }
    disconnectedCallback() {
        if (this[DEBUG_PROP])
            log(elementName(this), 'Disconnected');
    }
    adoptedCallback() {
        if (this[DEBUG_PROP])
            log(elementName(this), 'Adopted');
    }
    /**
     * Check whether a state is set
     *
     * @since 0.2.0
     * @param {any} key - state to be checked
     * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
     */
    has(key) {
        return this.signals.has(key);
    }
    /**
     * Get the current value of a state
     *
     * @since 0.2.0
     * @param {any} key - state to get value from
     * @returns {T | undefined} current value of state; undefined if state does not exist
     */
    get(key) {
        const unwrap = (v) => !isDefinedObject(v) ? v // shortcut for non-object values
            : isFunction(v) ? unwrap(v())
                : isSignal(v) || isResult(v) ? unwrap(v.get())
                    : v;
        const value = unwrap(this.signals.get(key));
        if (this[DEBUG_PROP])
            log(value, `Get current value of state ${valueString(key)} in ${elementName(this)}`);
        return value;
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
        if (isFail(value)) { // reject Fail, log error and return
            log(value.error, `Unhandled error before trying to set state '${key}' in <${this.localName}>`, LOG_ERROR);
            return;
        }
        const v = isResult(value) ? value.get() : value; // unwrap Ok or None
        if (this[DEBUG_PROP])
            log(v, `Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to`);
        // State does not exist => create new state
        if (!this.signals.has(key)) {
            this.signals.set(key, isSignal(v) ? v : state(v));
            // State already exists => update state
        }
        else if (update) {
            const state = this.signals.get(key);
            // Value is a Signal => replace state with new signal
            if (isSignal(v)) {
                if (this[DEBUG_PROP])
                    log(v.get(), `Existing state ${valueString(key)} in ${elementName(this)} is replaced by new signal`);
                this.signals.set(key, v);
                state.targets.forEach(notify => notify()); // notify dependent computed states and effects
                // Value is not a Signal => set existing state to new value
            }
            else {
                if (isState(state))
                    state.set(v);
                else
                    log(v, `Computed state ${valueString(key)} in ${elementName(this)} cannot be set`, LOG_ERROR);
            }
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
        if (this[DEBUG_PROP])
            log(key, `Delete state ${valueString(key)} from ${elementName(this)}`);
        return this.signals.delete(key);
    }
    /**
     * Get array of first sub-element matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-element
     * @returns {UI<Element>[]} - array of zero or one UI objects of matching sub-element
     */
    first = first(this);
    /**
     * Get array of all sub-elements matching a given selector within the custom element
     *
     * @since 0.8.1
     * @param {string} selector - selector to match sub-elements
     * @returns {UI<Element>[]} - array of UI object of matching sub-elements
     */
    all = all(this);
}

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
 * @since 0.9.0
 * @param {UIElement} host - UIElement instance to initialize context for
 * @return {boolean} - true if context provider was initialized successfully, false otherwise
 */
const useContext = (host) => {
    const proto = host.constructor;
    // context consumers
    const consumed = proto.consumedContexts || [];
    /* for (const context of consumed)
        host.set(String(context), undefined, false) */
    setTimeout(() => {
        for (const context of consumed)
            host.dispatchEvent(new ContextRequestEvent(context, (value) => host.set(String(context), value)));
    });
    // context providers
    const provided = proto.providedContexts || [];
    if (!provided.length)
        return false;
    host.addEventListener(CONTEXT_REQUEST, (e) => {
        const { context, callback } = e;
        if (!provided.includes(context) || !isFunction(callback))
            return;
        e.stopPropagation();
        callback(host.signals.get(String(context)));
    });
    return true;
};

/* === Exported Type === */
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
    for (const [key, source = key] of Object.entries(stateMap)) {
        const value = isPropertyKey(source) ? ui.host.signals.get(source) // shorthand for signals with PropertyKey keys
            : isSignal(source) ? source // just copy the signal reference
                // : isNullaryFunction(source) ? computed(source) // create a computed signal
                : isFunction(source) ? state(source) // create a state signal with a function value
                    : ui.host.signals.get(source); // map keys can be anything, so try this as last resort
        ui.target.set(key, value);
    }
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
 * @param {StateLike<unknown>} state - state key
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
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<boolean>}
 */
const asBoolean = (value) => maybe(isDefined(value.get()));
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<number>}
 */
const asInteger = (value) => value.map(v => parseInt(v, 10)).filter(Number.isFinite);
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<number>}
 */
const asNumber = (value) => value.map(parseFloat).filter(Number.isFinite);
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<string>}
 */
const asString = (value) => value;
/**
 * Parse an attribute as a tri-state value (true, false, mixed)
 *
 * @since 0.9.0
 * @param {string[]} valid - array of valid values
 */
const asEnum = (valid) => (value) => value.filter(v => valid.includes(v.toLowerCase()));
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {Maybe<string>} value - maybe string value
 * @returns {Maybe<unknown>}
 */
const asJSON = (value) => {
    const r = result(() => value.map(v => JSON.parse(v)));
    return match({
        [TYPE_FAIL]: error => {
            log(error, 'Failed to parse JSON', LOG_ERROR);
            return none();
        }
    })(r);
};

/* === Exported Functions === */
/**
 * Auto-effect for setting properties of a target element according to a given state
 *
 * @since 0.9.0
 * @param {StateLike<T>} state - state bounded to the element property
 * @param {ElementUpdater} updater - updater object containing key, read, update, and delete methods
 */
const updateElement = (state, updater) => (ui) => {
    const { key, read, update } = updater;
    const { host, target } = ui;
    const fallback = read(target);
    if (!isFunction(state)) {
        const value = isString(state) && isString(fallback)
            ? parse(host, state, fallback)
            : fallback;
        host.set(state, value, false);
    }
    effect((enqueue) => {
        const current = read(target);
        const value = isFunction(state) ? state(current) : host.get(state);
        if (!Object.is(value, current)) {
            const action = isNull(value) && updater.delete ? updater.delete
                : isNullish(value) ? update(fallback)
                    : update(value);
            enqueue(target, key, action);
        }
    });
    return ui;
};
/**
 * Set text content of an element
 *
 * @since 0.8.0
 * @param {StateLike<string>} state - state bounded to the text content
 */
const setText = (state) => updateElement(state, {
    key: 't',
    read: (element) => element.textContent || '',
    update: (value) => (element) => () => {
        Array.from(element.childNodes)
            .filter(node => !isComment(node))
            .forEach(node => node.remove());
        element.append(document.createTextNode(value));
    }
});
/**
 * Set property of an element
 *
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike<unknown>} state - state bounded to the property value
 */
const setProperty = (key, state = key) => updateElement(state, {
    key: `p:${String(key)}`,
    read: (el) => el[key],
    update: (value) => (el) => () => el[key] = value,
});
/**
 * Set attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike<string>} state - state bounded to the attribute value
 */
const setAttribute = (name, state = name) => updateElement(state, {
    key: `a:${name}`,
    read: (el) => el.getAttribute(name),
    update: (value) => (el) => () => el.setAttribute(name, value),
    delete: (el) => () => el.removeAttribute(name)
});
/**
 * Toggle a boolan attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike<boolean>} state - state bounded to the attribute existence
 */
const toggleAttribute = (name, state = name) => updateElement(state, {
    key: `a:${name}`,
    read: (element) => element.hasAttribute(name),
    update: (value) => (element) => () => element.toggleAttribute(name, value)
});
/**
 * Toggle a classList token of an element
 *
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike<boolean>} state - state bounded to the class existence
 */
const toggleClass = (token, state = token) => updateElement(state, {
    key: `c:${token}`,
    read: (el) => el.classList.contains(token),
    update: (value) => (el) => () => el.classList.toggle(token, value)
});
/**
 * Set a style property of an element
 *
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike<string>} state - state bounded to the style property value
 */
const setStyle = (prop, state = prop) => updateElement(state, {
    key: `s:${prop}`,
    read: (element) => element.style.getPropertyValue(prop),
    update: (value) => (element) => () => element.style.setProperty(prop, value),
    delete: (element) => () => element.style.removeProperty(prop)
});

/* === Constants === */
const ARIA_PREFIX = 'aria';
const ROLES = {
    alert: 'alert',
    alertdialog: 'alertdialog',
    application: 'application',
    button: 'button',
    checkbox: 'checkbox',
    columnheader: 'columnheader',
    combobox: 'combobox',
    dialog: 'dialog',
    grid: 'grid',
    gridcell: 'gridcell',
    heading: 'heading',
    link: 'link',
    listbox: 'listbox',
    listitem: 'listitem',
    log: 'log',
    marquee: 'marquee',
    menu: 'menu',
    menubar: 'menubar',
    menuitem: 'menuitem',
    menuitemcheckbox: 'menuitemcheckbox',
    menuitemradio: 'menuitemradio',
    option: 'option',
    progressbar: 'progressbar',
    radio: 'radio',
    radiogroup: 'radiogroup',
    row: 'row',
    rowheader: 'rowheader',
    scrollbar: 'scrollbar',
    searchbox: 'searchbox',
    separator: 'separator',
    slider: 'slider',
    spinbutton: 'spinbutton',
    status: 'status',
    switch: 'switch',
    tab: 'tab',
    table: 'table',
    tablist: 'tablist',
    tabpanel: 'tabpanel',
    textbox: 'textbox',
    timer: 'timer',
    tree: 'tree',
    treegrid: 'treegrid',
    treeitem: 'treeitem',
};
const STATES = {
    atomic: 'atomic',
    autocomplete: ['autocomplete', 'AutoComplete'],
    busy: 'busy',
    checked: 'checked',
    colcount: ['colcount', 'ColCount'],
    colindex: ['colindex', 'ColIndex'],
    colspan: ['colspan', 'ColSpan'],
    controls: 'controls',
    current: 'current',
    description: 'description',
    disabled: 'disabled',
    expanded: 'expanded',
    haspopup: ['haspopup', 'HasPopup'],
    hidden: 'hidden',
    keyshortcuts: ['keyshortcuts', 'KeyShortcuts'],
    label: 'label',
    level: 'level',
    live: 'live',
    modal: 'modal',
    multiline: ['multiline', 'MultiLine'],
    multiselectable: ['multiselectable', 'MultiSelectable'],
    orientation: 'orientation',
    placeholder: 'placeholder',
    posinset: ['posinset', 'PosInSet'],
    pressed: 'pressed',
    readonly: ['readonly', 'ReadOnly'],
    relevant: 'relevant',
    required: 'required',
    roledescription: ['roledescription', 'RoleDescription'],
    rowcount: ['rowcount', 'RowCount'],
    rowindex: ['rowindex', 'RowIndex'],
    rowspan: ['rowspan', 'RowSpan'],
    selected: 'selected',
    setsize: ['setsize', 'SetSize'],
    sorted: 'sorted',
    valuemax: ['valuemax', 'ValueMax'],
    valuemin: ['valuemin', 'ValueMin'],
    valuenow: ['valuenow', 'ValueNow'],
    valuetext: ['valuetext', 'ValueText'],
};
const ENUM_TRISTATE = ['false', 'mixed', 'true'];
const ENUM_CURRENT = ['date', 'false', 'location', 'page', 'step', 'time', 'true'];
// const ENUM_INVALID = ['false', 'grammar', 'spelling', 'true']
const ROLES_CHECKED = [
    ROLES.checkbox,
    ROLES.menuitemcheckbox,
    ROLES.menuitemradio,
    ROLES.option,
    ROLES.radio,
    ROLES.switch,
    ROLES.treeitem
];
const ROLES_EXPANDED = [
    ROLES.application,
    ROLES.button,
    ROLES.checkbox,
    ROLES.columnheader,
    ROLES.combobox,
    ROLES.gridcell,
    ROLES.link,
    ROLES.listbox,
    ROLES.menuitem,
    ROLES.menuitemcheckbox,
    ROLES.menuitemradio,
    ROLES.row,
    ROLES.rowheader,
    ROLES.switch,
    ROLES.tab,
    ROLES.treeitem
];
/* const ROLES_INVALID = [
    ROLES.application,
    ROLES.checkbox,
    ROLES.columnheader,
    ROLES.combobox,
    ROLES.gridcell,
    ROLES.listbox,
    ROLES.radiogroup,
    ROLES.rowheader,
    ROLES.searchbox,
    ROLES.slider,
    ROLES.spinbutton,
    ROLES.switch,
    ROLES.textbox,
    ROLES.tree,
    ROLES.treegrid,
] */
/* const ROLES_LIVE = [
    ROLES.alert,
    ROLES.log,
    ROLES.marquee,
    ROLES.status,
    ROLES.timer,
] */
const ROLES_SELECTED = [
    ROLES.columnheader,
    ROLES.gridcell,
    ROLES.option,
    ROLES.row,
    ROLES.rowheader,
    ROLES.tab,
    ROLES.treeitem,
];
/* === Internal Functions === */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const getPair = (internal) => {
    if (Array.isArray(internal))
        return internal;
    return [internal, ARIA_PREFIX + capitalize(internal)];
};
const hasRole = (role, allowedRoles) => allowedRoles.includes(role);
const validateRole = (role, allowedRoles, host, key) => {
    if (hasRole(role, allowedRoles))
        return true;
    log(role, `Role for ${elementName(host)} does not support aria-${key}. Use one of ${valueString(allowedRoles)}`, LOG_WARN);
    return false;
};
const booleanInternal = (host, state, allowedRoles) => {
    const role = host.role;
    const [key, prop] = getPair(state);
    if (Array.isArray(allowedRoles) && !validateRole(role, allowedRoles, host, key))
        return false;
    toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host);
    return true;
};
const stringInternal = (host, state, parser, allowedRoles) => {
    const role = host.role;
    const [key, prop] = getPair(state);
    if (Array.isArray(allowedRoles) && !validateRole(role, allowedRoles, host, key))
        return false;
    setInternal(key, `${ARIA_PREFIX}${prop}`, parser)(host);
    return true;
};
/* === Exported Functions === */
/**
 * Auto-effect for setting internals of a Web Component according to a given state
 *
 * @since 0.9.0
 * @param {StateLike<T>} state - state bounded to the element internal
 * @param {InternalsUpdater<E, T>} updater - updater object containing key, read, update, and delete methods
 */
const updateInternal = (state, updater) => (host) => {
    if (!host.internals)
        return;
    const { key, parser, initial, read, update } = updater;
    const proto = host.constructor;
    proto.attributeMap[key] = parser;
    host.set(state, initial(host), false);
    effect((enqueue) => {
        const current = read(host);
        const value = isFunction(state) ? state(current) : host.get(state);
        const action = isNullish(value) && updater.delete
            ? updater.delete
            : update(value);
        if (!Object.is(value, current))
            enqueue(host, key, action);
    });
};
/**
 * Toggle an internal state of an element based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const toggleInternal = (name, ariaProp) => updateInternal(name, {
    key: `i-${name}`,
    parser: asBoolean,
    initial: (el) => el.hasAttribute(name),
    read: (el) => el.internals.states.has(name),
    update: (value) => (el) => () => {
        el.internals.states[value ? 'add' : 'delete'](name);
        if (ariaProp) {
            el.internals[ariaProp] = String(value);
            el.setAttribute(`${ARIA_PREFIX}-${name}`, String(value));
        }
        el.toggleAttribute(name, value);
    }
});
/**
 * Set ElementInternals ARIA property and attribute based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const setInternal = (name, ariaProp, parser) => updateInternal(name, {
    key: `i-${name}`,
    parser,
    initial: (el) => el.getAttribute(`aria-${name}`),
    read: (el) => parse(el, name, el.internals[ariaProp]),
    update: (value) => (el) => () => {
        el.internals[ariaProp] = value;
        el.setAttribute(`${ARIA_PREFIX}-${name}`, value);
    },
    delete: (el) => () => {
        el.internals[ariaProp] = undefined;
        el.removeAttribute(`${ARIA_PREFIX}-${name}`);
    }
});
/**
 * Use element internals; will setup the global disabled and hidden states if they are observed attributes
 */
const useInternals = (host) => {
    if (!host.internals)
        host.internals = host.attachInternals();
    const proto = host.constructor;
    const map = new Map([
        [STATES.busy, useBusy],
        [STATES.current, useCurrent],
        [STATES.disabled, useDisabled],
        [STATES.hidden, useHidden],
    ]);
    const role = host.role;
    if (ROLES_CHECKED.includes(role))
        map.set(STATES.checked, useChecked);
    if (ROLES_EXPANDED.includes(role))
        map.set(STATES.expanded, useExpanded);
    if (role === ROLES.button)
        map.set(STATES.pressed, usePressed);
    if (ROLES_SELECTED.includes(role))
        map.set(STATES.selected, useSelected);
    for (const [attr, hook] of map) {
        if (proto.observedAttributes.includes(attr))
            hook(host);
    }
    return true;
};
/**
 * Use a busy state for a live region and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the busy state was successfully setup
 */
const useBusy = (host) => {
    host.internals.ariaLive = 'polite';
    return booleanInternal(host, STATES.busy);
};
/**
 * Use a checked state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @param {boolean} [isTriState=false] - whether to support tri-state checked state
 * @returns {boolean} - whether the checked state was successfully setup
 */
const useChecked = (host, isTriState = false) => {
    const role = host.role;
    const [key, prop] = getPair(STATES.checked);
    if (!validateRole(role, ROLES_CHECKED, host, key))
        return false;
    const allowsTriState = [ROLES.checkbox, ROLES.menuitemcheckbox, ROLES.option];
    if (isTriState && !hasRole(role, allowsTriState) && isTriState) {
        log(role, `Role for ${elementName(host)} does not support tri-state aria-checked. Use one of ${valueString(allowsTriState)} instead.`, LOG_WARN);
        isTriState = false;
    }
    if (isTriState)
        setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host);
    else
        toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host);
    return true;
};
const useCurrent = (host, isEnumState = false) => {
    if (isEnumState)
        stringInternal(host, STATES.current, asEnum(ENUM_CURRENT));
    else
        booleanInternal(host, STATES.current);
    return true;
};
/**
 * Use a disabled state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the disabled state was successfully setup
 */
const useDisabled = (host) => booleanInternal(host, STATES.disabled);
/**
 * Use an expanded state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the expanded state was successfully setup
 */
const useExpanded = (host) => booleanInternal(host, STATES.expanded, ROLES_EXPANDED);
/**
 * Use a hidden state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the hidden state was successfully setup
 */
const useHidden = (host) => booleanInternal(host, STATES.hidden);
/**
 * Use an invalid state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the invalid state was successfully setup
 ** /
const useInvalid = (host: UIElement): boolean => {
    log(host, 'Invalid state is not yet supported.', LOG_WARN)
    // Implementation pending - we need to use checkValidity() / setValidity() instead of boolean internal
    return false
} */
/**
 * Use a pressed state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the pressed state was successfully setup
 */
const usePressed = (host, isTriState = false) => {
    const role = host.role;
    const [key, prop] = getPair(STATES.pressed);
    if (!validateRole(role, [ROLES.button], host, key))
        return false;
    if (isTriState)
        setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host);
    else
        toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host);
    return true;
};
/**
 * Use a selected state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the selected state was successfully setup
 */
const useSelected = (host) => booleanInternal(host, STATES.selected, ROLES_SELECTED);

export { LOG_DEBUG, LOG_ERROR, LOG_INFO, LOG_WARN, TYPE_COMPUTED, TYPE_FAIL, TYPE_NONE, TYPE_OK, TYPE_STATE, TYPE_UI, UIElement, all, asBoolean, asEnum, asInteger, asJSON, asNumber, asString, callFunction, computed, effect, elementName, emit, fail, first, flow, isComment, isComputed, isDefined, isDefinedObject, isFail, isFunction, isNone, isNull, isNullish, isNumber, isObject, isObjectOfType, isOk, isPropertyKey, isResult, isSignal, isState, isString, isSymbol, log, match, maybe, none, off, ok, on, parse, pass, result, self, setAttribute, setInternal, setProperty, setStyle, setText, state, task, toggleAttribute, toggleClass, toggleInternal, ui, updateElement, useBusy, useChecked, useContext, useCurrent, useDisabled, useExpanded, useHidden, useInternals, usePressed, useSelected, valueString };
