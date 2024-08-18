/* === Types === */
/* === Exported Functions === */
const isOfType = (type) => (value) => typeof value === type;
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
/* === Internal Functions === */
const success = (value) => ({
    map: (f) => attempt(() => f(value)),
    /* chain: <B>(f: (a: A) => Attempt<B, E>): Attempt<B, E> => f(value),
    ap: <B>(fab: Attempt<(a: A) => B, E>): Attempt<B, E> =>
      fab.fold(reason => failure(reason), f => success(f(value))), */
    fold: (_, onSuccess) => onSuccess(value),
    catch: () => { }
});
const failure = (reason) => ({
    map: () => failure(reason),
    /* chain: () => failure(reason),
    ap: () => failure(reason), */
    fold: (onFailure) => onFailure(reason),
    catch: (f) => f(reason)
});
/* === Default Export === */
const attempt = (operation) => {
    try {
        return success(operation());
    }
    catch (reason) {
        return failure(reason);
    }
};

/* === Types === */
/* type Log<A> = {
  (): A
  map: <B>(f: (a: A) => B, mapMsg?: string, mapLevel?: LogLevel) => Log<B>
  chain: <B>(f: (a: A) => Log<B>) => Log<B>
} */
/* === Constants === */
const LOG_DEBUG = 'debug';
const LOG_WARN = 'warn';
const LOG_ERROR = 'error';
/* === Internal Functions === */
const shouldLog = (level) => (level === LOG_WARN) || (level === LOG_ERROR);
/* === Default Export */
const log = (value, msg, level = LOG_DEBUG) => {
    if (shouldLog(level))
        console[level](msg, value);
    return value;
};

/* === Exported Function === */
const scheduler = () => {
    const effectQueue = new Map();
    const cleanupQueue = new Map();
    let requestId;
    const requestTick = () => {
        if (requestId)
            cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(flush);
    };
    const enqueue = (element, prop, fn) => {
        if (!effectQueue.has(element))
            effectQueue.set(element, new Map());
        const elEffects = effectQueue.get(element);
        if (!elEffects.has(prop))
            elEffects.set(prop, fn);
        requestTick();
    };
    const cleanup = (effect, fn) => {
        if (!cleanupQueue.has(effect))
            cleanupQueue.set(effect, fn);
        requestTick();
    };
    const run = (fn, msg) => {
        attempt(fn).catch(reason => log(reason, msg, LOG_ERROR));
    };
    const flush = () => {
        requestId = null;
        for (const [el, elEffect] of effectQueue) {
            for (const [prop, fn] of elEffect)
                run(fn, ` Effect ${prop} on ${el?.localName || 'unknown'} failed`);
        }
        effectQueue.clear();
        for (const fn of cleanupQueue.values())
            run(fn, 'Cleanup failed');
        cleanupQueue.clear();
    };
    queueMicrotask(flush); // initial flush when the call stack is empty
    return { enqueue, cleanup };
};

/* === Internal === */
// hold the currently active effect
let activeEffect;
// hold schuduler instance
const { enqueue, cleanup } = scheduler();
/**
 * Run all effects in the provided set
 *
 * @param {Set<Effect | Computed<unknown>>} effects
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
const isState = (value) => isDefinedObject(value) && hasMethod(value, 'set');
/**
 * Check if a given variable is a reactive computed state
 *
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value) => isDefinedObject(value) && hasMethod(value, 'run') && 'effects' in value;
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
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = (value) => {
    const s = () => {
        if (activeEffect)
            s.effects.add(activeEffect);
        return value;
    };
    s.effects = new Set(); // set of listeners
    s.set = (updater) => {
        const old = value;
        value = isFunction(updater) && !isSignal(updater) ? updater(value) : updater;
        if (!Object.is(value, old))
            autorun(s.effects);
    };
    return s;
};
/**
 * Define what happens when a reactive state changes
 *
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn) => {
    const targets = new Set();
    const n = () => {
        const prev = activeEffect;
        activeEffect = n;
        const cleanupFn = fn((element, prop, callback) => {
            enqueue(element, prop, callback);
            if (!targets.has(element))
                targets.add(element);
        });
        if (isFunction(cleanupFn))
            cleanup(n, cleanupFn);
        activeEffect = prev;
    };
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

/* === Internal Functions === */
/**
 * Unwrap any value wrapped in a function
 *
 * @since 0.8.0
 * @param {any} value - value to unwrap if it's a function
 * @returns {any} - unwrapped value, but might still be in a maybe or attempt container
 */
const unwrap = (value) => isFunction(value) ? unwrap(value()) : value;
/**
 * Get root for element queries within the custom element
 *
 * @since 0.8.0
 * @param {UIElement} element
 * @returns {Element | ShadowRoot}
 */
const getRoot = (element) => element.shadowRoot || element;
/* === Default export === */
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
        attempt(() => !this.registry.get(tag) && this.registry.define(tag, this))
            .catch(error => log(tag, error.message, LOG_ERROR));
    }
    // @private hold states – use `has()`, `get()`, `set()` and `delete()` to access and modify
    #states = new Map();
    /**
     * @since 0.8.0
     * @property {HTMLElement[]} self - UI object for this element
     */
    self = [this];
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
        const parser = this.constructor.attributeMap[name];
        this.set(name, isFunction(parser) ? parser(maybe(value), this, old)[0] : value);
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
    disconnectedCallback() { }
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
     * @param {T | ((old: T | undefined) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
     * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
     */
    set(key, value, update = true) {
        if (!this.#states.has(key)) {
            this.#states.set(key, isSignal(value) ? value : cause(value));
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
     * @param {PropertyKey} key - state to be deleted
     * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
     */
    delete(key) {
        return this.#states.delete(key);
    }
    /**
     * Return the signal for a state
     *
     * @since 0.8.0
     * @param {PropertyKey} key - state to get signal for
     * @returns {Signal<T> | undefined} signal for the given state; undefined if
     */
    signal(key) {
        return this.#states.get(key);
    }
    /**
     * Get array of first sub-element matching a given selector within the custom element
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-element
     * @returns {Element[]} - array of zero or one matching sub-element
     */
    first(selector) {
        return maybe(getRoot(this).querySelector(selector));
    }
    /**
     * Get array of all sub-elements matching a given selector within the custom element
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-elements
     * @returns {Element[]} - array of matching sub-elements
     */
    all(selector) {
        return Array.from(getRoot(this).querySelectorAll(selector));
    }
}

/* === Exported Function === */
/**
 * Pass states from one UIElement to another
 *
 * @since 0.8.0
 * @param stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
const pass = (host, stateMap) => 
/**
 * Partially applied function that connects to params of UI map function
 *
 * @param ui - source UIElement to pass states from
 * @returns - Promise that resolves to UI object of the target UIElement, when it is defined and got passed states
 */
async function (target) {
    await host.constructor.registry.whenDefined(target.localName);
    for (const [key, source] of Object.entries(stateMap))
        target.set(key, isSignal(source) ? source
            : isFunction(source) ? cause(source)
                : host.signal(source));
    return target;
};

/* === Exported Function === */
/**
 * Add event listener to a host element and update a state when the event occurs
 *
 * @since 0.8.0
 * @param {string} event - event name to listen to
 * @param {PropertyKey} state - state key to update when the event occurs
 * @param {(e: Event, v: T) => T | undefined} setter - function to set the state when the event occurs; return a nullish value to cancel the update
 * @returns - returns a function to remove the event listener when no longer needed
 */
const on = (event, state, setter) => 
/**
 * Partially applied function to connect to params of UI map function
 *
 * @param {E} target - target element to listen to events
 * @returns - returns ui object of the target
 */
function (target) {
    const handler = (e) => this.set(state, (v) => setter(e, v) ?? v); // if the setter returns nullish, we return the old value
    target.addEventListener(event, handler);
    return target;
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
const asJSON = (value) => value.map(v => attempt(() => JSON.parse(v)).fold(error => log(undefined, `Failed to parse JSON: ${error.message}`, LOG_ERROR), v => v));

/* === Internal Functions === */
const autoEffect = (host, state, target, prop, fallback, onNothing, onSomething) => {
    const remover = onNothing;
    const setter = (value) => onSomething(value);
    host.set(state, fallback, false);
    effect((enqueue) => {
        if (host.has(state)) {
            const value = host.get(state);
            if (isNullish(value))
                enqueue(target, prop, remover);
            else
                enqueue(target, prop, setter(value));
        }
    });
    return target;
};
/* === Exported Functions === */
const setText = (state) => function (target) {
    const fallback = target.textContent || '';
    const setter = (value) => () => {
        Array.from(target.childNodes).filter(isComment).forEach(match => match.remove());
        target.append(document.createTextNode(value));
    };
    return autoEffect(this, state, target, `text ${String(state)}`, fallback, setter(fallback), setter);
};
const setProperty = (key, state = key) => function (target) {
    const setter = (value) => () => target[key] = value;
    return autoEffect(this, state, target, `property ${String(key)}`, target[key], setter(null), setter);
};
const setAttribute = (name, state = name) => function (target) {
    return autoEffect(this, state, target, `attribute ${String(name)}`, target.getAttribute(name), () => target.removeAttribute(name), (value) => () => target.setAttribute(name, value));
};
const toggleAttribute = (name, state = name) => function (target) {
    const setter = (value) => () => target.toggleAttribute(name, value);
    return autoEffect(this, state, target, `attribute ${String(name)}`, target.hasAttribute(name), setter(false), setter);
};
const toggleClass = (token, state = token) => function (target) {
    return autoEffect(this, state, target, `class ${String(token)}`, target.classList.contains(token), () => target.classList.remove(token), (value) => () => target.classList.toggle(token, value));
};
const setStyle = (prop, state = prop) => function (target) {
    return autoEffect(this, state, target, `style ${String(prop)}`, target.style[prop], () => target.style.removeProperty(prop), (value) => () => target.style[prop] = String(value));
};

export { UIElement, asBoolean, asInteger, asJSON, asNumber, asString, attempt, effect, log, maybe, on, pass, setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass };
