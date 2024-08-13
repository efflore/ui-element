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

/* type Maybe<A> = {
  map<B>(f: (a: A) => B): Maybe<B>
  fold: <B>(onNothing: () => B, onSomething: (value: A) => B) => B
} */
/* === Exported Functions === */
/* const nothing = <A>(): Maybe<A> => ({
  map: <B>(): Maybe<B> => nothing(),
  fold: <B>(onNothing: () => B): B => onNothing()
})

const something = <A>(value: A): Maybe<A> => ({
  map: <B>(f: (a: A) => B): Maybe<B> => something(f(value)),
  fold: <B>(_: () => B, onSomething: (value: A) => B): B => onSomething(value)
}) */
/* === Default Export === */
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

/* === Internal === */
// hold the currently active effect
let activeEffect;
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
    const targets = new Map();
    const n = () => {
        const prev = activeEffect;
        activeEffect = n;
        const cleanup = fn((element, domFn) => {
            if (!targets.has(element))
                targets.set(element, new Set());
            targets.get(element)?.add(domFn);
        });
        for (const domFns of targets.values()) {
            for (const domFn of domFns)
                domFn.run();
            domFns.clear();
        }
        activeEffect = prev;
        if (isFunction(cleanup))
            queueMicrotask(cleanup);
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
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @since 0.8.0
 * @param {UIElement} host - host UIElement for the UIRef instance
 * @param {Element[]} elements - native DOM elements to wrap
 * @returns {UI} - UIRef instance for the given element
 */
const ui = (host, elements) => ({
    elements,
    host,
    map: (f) => ui(host, elements.map(el => f(host, el)))
});

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
     * Get UI container of first sub-element matching a given selector within the custom element
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-element
     * @returns {UI<Element>} - UI container of matching sub-element (or empty UI if no match found)
     */
    first(selector) {
        return ui(this, maybe(getRoot(this).querySelector(selector)));
    }
    /**
     * Get UI container of all sub-elements matching a given selector within the custom element
     *
     * @since 0.8.0
     * @param {string} selector - selector to match sub-elements
     * @returns {UI<Element>} - UI container of matching sub-elements
     */
    all(selector) {
        return ui(this, Array.from(getRoot(this).querySelectorAll(selector)));
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
}

/* === Types === */
/* === Default export === */
const io = (effect) => ({
    run: () => effect(),
    // map: <B>(f: (a: A) => B): IO<B> => io(() => f(effect())),
    // chain: <B>(f: (a: A) => IO<B>): IO<B> => io(() => f(effect()).run())
});

/* === Exported Function === */
/**
 * Pass states from one UIElement to another
 *
 * @since 0.8.0
 * @param stateMap - map of states to be passed from `host` to `target`
 * @returns - partially applied function that can be used to pass states from `host` to `target`
 */
const pass = (stateMap) => 
/**
 * Partially applied function that connects to params of UI map function
 *
 * @param host - source UIElement to pass states from
 * @param target - destination UIElement to pass states to
 * @returns - Promise that resolves when target UIElement is defined and got passed states
 */
async (host, target) => {
    await host.constructor.registry.whenDefined(target.localName);
    /* if (!hasMethod(target, 'set')) {
      log(target, 'Expected UIElement', LOG_ERROR)
      return
    } */
    for (const [key, source] of Object.entries(stateMap))
        target.set(key, isSignal(source) ? source
            : isFunction(source) ? cause(source)
                : host.signal(source));
    return target;
};

export { UIElement, effect, io, maybe, pass, ui };
