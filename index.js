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

/* === Types === */
/* === Constants === */
const LOG_DEBUG = 'debug';
const LOG_INFO = 'info';
const LOG_WARN = 'warn';
const LOG_ERROR = 'error';
/* === Default Export */
const log = (value, msg, level = LOG_DEBUG) => {
    if ([LOG_ERROR, LOG_WARN].includes(level))
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
const parse = (host, name, value, old = undefined) => maybe(host.constructor.attributeMap[name])
    .guard(isAttributeParser)
    .map(parser => parser(maybe(value), host, old))
    .or(value)
    .get();

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
    /* for (const context of consumed)
        host.set(String(context), undefined, false) */
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
        callback(host.signals.get(String(context)));
    });
};

/* === Constants === */
const DEBUG_STATE = 'debug';
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
        : isDefined(value) ? value.toString()
            : 'undefined';
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
        if (isString(this.getAttribute(DEBUG_STATE)))
            this.set(DEBUG_STATE, true);
        initContext(this);
        // syncInternals(this)
        log(elementName(this), 'Connected');
    }
    disconnectedCallback() {
        log(elementName(this), 'Disconnected');
    }
    adoptedCallback() {
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
        return log(unwrap(this.signals.get(key)), `Get current value of state ${valueString(key)} in ${elementName(this)}`);
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
        log(v, `Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to`);
        if (!this.signals.has(key)) {
            this.signals.set(key, isSignal(v) ? v : state(v));
        }
        else if (update) {
            const state = this.signals.get(key);
            if (isSignal(v)) {
                log(v.get(), `Existing state ${valueString(key)} in ${elementName(this)} is replaced by new signal`);
                this.signals.set(key, v);
                state.targets.forEach(notify => notify()); // notify dependent computed states and effects
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
        return log(this.signals.delete(key), `Delete state ${valueString(key)} from ${elementName(this)}`);
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
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<boolean>}
 */
const asBoolean = (value) => maybe(isDefined(value.get()));
/**
 * Parse an attribute as a number forced to integer
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asInteger = (value) => value.map(v => parseInt(v, 10)).filter(Number.isFinite);
/**
 * Parse an attribute as a number
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<number>}
 */
const asNumber = (value) => value.map(parseFloat).filter(Number.isFinite);
/**
 * Parse an attribute as a string
 *
 * @since 0.7.0
 * @param {Maybe<string>} value - maybe string value or nothing
 * @returns {Maybe<string>}
 */
const asString = (value) => value;
/**
 * Parse an attribute as a JSON serialized object
 *
 * @since 0.7.2
 * @param {Maybe<string>} value - maybe string value or nothing
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

/* === Internal Functions === */
/**
 * Auto-effect for setting properties of a target element according to a given state
 *
 * @since 0.8.0
 * @param {UI} ui - UI object of host UIElement and target element to update properties
 * @param {StateLike<T>} state - state to be set to the host element
 * @param {string} prop - property name to be updated
 * @param {() => T} getter - getter function to retrieve current value in the DOM
 * @param {(value: T) => (element: E) => () => void} setter - callback to be executed when state is changed
 * @returns {UI} object with host and target
 */
const autoEffect = (ui, state, prop, getter, setter, remover) => {
    const fallback = getter();
    if (!isFunction(state)) {
        const value = isString(state) && isString(fallback) ? parse(ui.host, state, fallback) : fallback;
        ui.host.set(state, value, false);
    }
    effect((enqueue) => {
        const current = getter();
        const value = isFunction(state) ? state(current) : ui.host.get(state);
        if (!Object.is(value, current)) {
            const action = remover && isNull(value) ? remover
                : isNullish(value) ? setter(fallback)
                    : setter(value);
            enqueue(ui.target, prop, action);
        }
    });
    return ui;
};
/* === Exported Functions === */
/**
 * Set text content of an element
 *
 * @since 0.8.0
 * @param {StateLike<string>} state - state bounded to the text content
 */
const setText = (state) => (ui) => autoEffect(ui, state, 't', () => ui.target.textContent || '', (value) => (element) => () => {
    Array.from(element.childNodes)
        .filter(node => !isComment(node))
        .forEach(node => node.remove());
    element.append(document.createTextNode(value));
});
/**
 * Set property of an element
 *
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateLike<unknown>} state - state bounded to the property value
 */
const setProperty = (key, state = key) => (ui) => autoEffect(ui, state, `p-${String(key)}`, () => ui.target[key], (value) => (element) => () => element[key] = value);
/**
 * Set attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateLike<string>} state - state bounded to the attribute value
 */
const setAttribute = (name, state = name) => (ui) => autoEffect(ui, state, `a-${name}`, () => ui.target.getAttribute(name), (value) => (element) => () => element.setAttribute(name, value), (element) => () => element.removeAttribute(name));
/**
 * Toggle a boolan attribute of an element
 *
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateLike<boolean>} state - state bounded to the attribute existence
 */
const toggleAttribute = (name, state = name) => (ui) => autoEffect(ui, state, `a-${name}`, () => ui.target.hasAttribute(name), (value) => (element) => () => element.toggleAttribute(name, value));
/**
 * Toggle a classList token of an element
 *
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateLike<boolean>} state - state bounded to the class existence
 */
const toggleClass = (token, state = token) => (ui) => autoEffect(ui, state, `c-${token}`, () => ui.target.classList.contains(token), (value) => (element) => () => element.classList.toggle(token, value));
/**
 * Set a style property of an element
 *
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateLike<string>} state - state bounded to the style property value
 */
const setStyle = (prop, state = prop) => (ui) => autoEffect(ui, state, `s-${prop}`, () => ui.target.style.getPropertyValue(prop), (value) => (element) => () => element.style.setProperty(prop, value), (element) => () => element.style.removeProperty(prop));

/* === Exported Functions === */
/**
 * Toggle an internal state of an element based on given state
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const toggleInternal = (host, name, ariaProp) => {
    if (!host.internals)
        return;
    host.set(name, host.hasAttribute(name), false);
    effect((enqueue) => {
        const current = host.internals.states.has(name);
        const value = host.get(name);
        if (!Object.is(value, current)) {
            enqueue(host, `i-${name}`, value
                ? (el) => () => {
                    el.internals.states.add(name);
                    if (ariaProp) {
                        el.internals[ariaProp] = 'true';
                        el.setAttribute(`aria-${name}`, 'true');
                    }
                    el.toggleAttribute(name, true);
                }
                : (el) => () => {
                    el.internals.states.delete(name);
                    if (ariaProp) {
                        el.internals[ariaProp] = 'false';
                        el.setAttribute(`aria-${name}`, 'false');
                    }
                    el.toggleAttribute(name, false);
                });
        }
    });
};
/**
 * Set ElementInternals ARIA property and attribute based on given state
 *
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const setInternal = (host, name, ariaProp) => {
    if (!host.internals)
        return;
    host.set(name, parse(host, name, host.getAttribute(name)), false);
    effect((enqueue) => {
        const current = host.internals[ariaProp];
        const value = String(host.get(name));
        if (value !== current) {
            enqueue(host, `i-${name}`, isDefined(value)
                ? (el) => () => {
                    el.internals[ariaProp] = value;
                    el.setAttribute(`aria-${name}`, value);
                }
                : (el) => () => {
                    el.internals[ariaProp] = undefined;
                    el.removeAttribute(`aria-${name}`);
                });
        }
    });
};
/**
 * Synchronize internal states of an element with corresponding HTML attributes and aria properties
 *
 * @param host host UIElement to sync internals
 */
const syncInternals = (host) => {
    if (!host.internals)
        host.internals = host.attachInternals();
    const proto = host.constructor;
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const addInternals = (map, internals) => internals.forEach((internal) => map.set(internal, capitalize(internal)));
    const role = host.role;
    const boolInternals = new Map([]);
    addInternals(boolInternals, [
        'disabled',
        'hidden',
    ]);
    const numberInternals = new Map();
    const stringInternals = new Map([
        ['keyshortcuts', 'KeyShortcuts'],
    ]);
    addInternals(stringInternals, [
        'controls',
        'description',
        'label',
    ]);
    addInternals(proto.attributeMap['current'] === asBoolean ? boolInternals : stringInternals, ['current']);
    if (role)
        stringInternals.set('roledescription', 'RoleDescription');
    if (host.hasAttribute('aria-live')) {
        addInternals(boolInternals, ['atomic', 'busy']);
        addInternals(stringInternals, ['live', 'relevant']);
    }
    if (['textbox', 'combobox'].includes(role))
        stringInternals.set('autocomplete', 'AutoComplete');
    if (['checkbox', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'].includes(role))
        addInternals(proto.attributeMap['checked'] === asBoolean ? boolInternals : stringInternals, ['checked']);
    if (['table', 'grid', 'treegrid'].includes(role)) {
        numberInternals.set('colcount', 'ColCount');
        numberInternals.set('colindex', 'ColIndex');
        numberInternals.set('colspan', 'ColSpan');
        numberInternals.set('rowcount', 'RowCount');
        numberInternals.set('rowindex', 'RowIndex');
        numberInternals.set('rowspan', 'RowSpan');
    }
    if (['button', 'link', 'treeitem', 'grid', 'row', 'listbox', 'tabpanel', 'menuitem', 'combobox'].includes(role))
        addInternals(boolInternals, ['expanded']);
    if (['button', 'link', 'menuitem', 'combobox', 'gridcell'].includes(role))
        (proto.attributeMap['haspopup'] === asBoolean ? boolInternals : stringInternals).set('haspopup', 'HasPopup');
    if (['heading', 'treeitem', 'listitem'].includes(role))
        numberInternals.set('level', 'Level');
    if (role === 'dialog')
        boolInternals.set('modal', 'Modal');
    if (role === 'textbox') {
        boolInternals.set('multiline', 'MultiLine');
        stringInternals.set('placeholder', 'Placeholder');
    }
    if (['listbox', 'grid', 'table', 'tree'].includes(role))
        boolInternals.set('multiselectable', 'MultiSelectable');
    if (['scrollbar', 'slider', 'separator', 'progressbar', 'tabpanel'].includes(role))
        stringInternals.set('orientation', 'Orientation');
    if (['listitem', 'treeitem'].includes(role))
        numberInternals.set('posinset', 'PosInSet');
    if (['button', 'switch'].includes(role))
        addInternals(proto.attributeMap['pressed'] === asBoolean ? boolInternals : stringInternals, ['pressed']);
    if (['textbox', 'gridcell', 'spinbutton'].includes(role))
        boolInternals.set('readonly', 'ReadOnly');
    if (['textbox', 'gridcell', 'spinbutton', 'combobox', 'listbox'].includes(role))
        boolInternals.set('required', 'Required');
    if (['gridcell', 'listitem', 'option', 'tab', 'treeitem'].includes(role))
        boolInternals.set('selected', 'Selected');
    if (['listitem', 'treeitem', 'option', 'row', 'tab'].includes(role))
        numberInternals.set('setsize', 'SetSize');
    if (['grid', 'treegrid', 'table'].includes(role))
        stringInternals.set('sorted', 'Sorted');
    if (['range', 'progressbar', 'slider', 'spinbutton'].includes(role)) {
        numberInternals.set('valuemax', 'ValueMax');
        numberInternals.set('valuemin', 'ValueMin');
        numberInternals.set('valuenow', 'ValueNow');
        stringInternals.set('valuetext', 'ValueText');
    }
    if (!proto.observedAttributes)
        return;
    for (const attr of proto.observedAttributes) {
        if (numberInternals.has(attr)) {
            if (!Object.hasOwn(proto.attributeMap, attr))
                proto.attributeMap[attr] = attr.slice(0, 5) === 'value' ? asNumber : asInteger;
            setInternal(host, attr, `aria${numberInternals.get(attr)}`);
        }
        else if (stringInternals.has(attr)) {
            setInternal(host, attr, `aria${stringInternals.get(attr)}`);
        }
        else if (boolInternals.has(attr)) {
            if (!Object.hasOwn(proto.attributeMap, attr))
                proto.attributeMap[attr] = asBoolean;
            toggleInternal(host, attr, `aria${boolInternals.get(attr)}`);
        }
    }
};

export { LOG_DEBUG, LOG_ERROR, LOG_INFO, LOG_WARN, TYPE_COMPUTED, TYPE_FAIL, TYPE_NONE, TYPE_OK, TYPE_STATE, TYPE_UI, UIElement, all, asBoolean, asInteger, asJSON, asNumber, asString, callFunction, computed, effect, emit, fail, first, flow, isComment, isComputed, isDefined, isDefinedObject, isFail, isFunction, isNone, isNull, isNullish, isNumber, isObject, isObjectOfType, isOk, isPropertyKey, isResult, isSignal, isState, isString, isSymbol, log, match, maybe, none, off, ok, on, parse, pass, result, self, setAttribute, setInternal, setProperty, setStyle, setText, state, syncInternals, task, toggleAttribute, toggleClass, toggleInternal, ui };
