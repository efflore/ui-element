import UIElement from '../index';
/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */
declare const DEV_MODE = true;
/**
 * Replace text content of the DOM element while preserving comment nodes
 *
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string | (() => string) | null} fallback - unused; default for third parameter, so content can also be passed as second parameter
 * @param {string | (() => string) | undefined} [content=fallback] - new text content
 */
declare const setText: (element: Element, fallback: string | (() => string) | null, content?: string | (() => string) | undefined) => void;
/**
 * Set or delete a property of the DOM element
 *
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {PropertyKey} key
 * @param {any} value
 */
declare const setProp: (element: Element, key: PropertyKey, value: any) => void;
/**
 * Set or remove an attribute of the DOM element
 *
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} name
 * @param {string | (() => string) | boolean | undefined} value
 */
declare const setAttr: (element: Element, name: string, value: string | (() => string) | boolean | undefined) => void;
/**
 * Add or remove a class on the DOM element
 *
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} token - class to add or remove
 * @param {boolean | (() => boolean) | undefined} force - whether to forcefully add or remove the class
 */
declare const setClass: (element: Element, token: string, force: boolean | (() => boolean) | undefined) => void;
/**
 * Set or remove a style property of the DOM element
 *
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} prop - style property name
 * @param {string | (() => string) | undefined} value - style property value
 */
declare const setStyle: (element: Element, prop: string, value: string | (() => string) | undefined) => void;
/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 *
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
declare const autoEffects: (el: UIElement) => void;
/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 *
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className='ui-effect'] - CSS class to be added to highlighted targets
 */
declare const highlightTargets: (el: UIElement, className?: string) => void;
/**
 * Add debug capabilities to UIElement classes
 *
 * @since 0.5.0
 *
 * @class DebugElement
 * @extends {UIElement}
 * @type {import("../types.js").DebugElement}
 */
declare class DebugElement extends UIElement {
    /**
     * Wrap connectedCallback to log to the console
     */
    connectedCallback(): void;
    /**
     * Wrap disconnectedCallback to log to the console
     */
    disconnectedCallback(): void;
    /**
     * Wrap adoptedCallback to log to the console
     */
    adoptedCallback(): void;
    /**
     * Wrap attributeChangedCallback to log changes to the console
     *
     * @since 0.5.0
     * @param {string} name
     * @param {string|undefined} old
     * @param {string|undefined} value
     */
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    /**
     * Wrap set() to log signal reads to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key
     * @returns {any}
     */
    get(key: PropertyKey): any;
    /**
     * Wrap set() to log signal writes to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key - state to be set
     * @param {any} value - value to be set
     * @param {boolean} [update=true] - whether to update the state
     */
    set(key: PropertyKey, value: any, update?: boolean): void;
    /**
     * Wrap delete() to log signal deletions to the console
     *
     * @since 0.7.0
     * @param {PropertyKey} key - state to be deleted
     * @returns {boolean} - whether the state was deleted
     */
    delete(key: PropertyKey): boolean;
    /**
     * Wrap pass() to log passed signals to the console
     *
     * @since 0.7.0
     * @param {UIElement} element - UIElement to be passed to
     * @param {import('../types.js').FxStateMap} states - states to be passed to the element
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry
     * /
    async pass(element: UIElement, states: import('../types').FxStateMap, registry: CustomElementRegistry = customElements) {
      this.log(`Pass state(s) ${valueString(Object.keys(states))} to ${elementName(element)} from ${elementName(this)}`);
      super.pass(element, states, registry);
    } */
    /**
     * Log messages in debug mode
     *
     * @since 0.5.0
     * @param {string} msg - debug message to be logged
     */
    log(msg: string): void;
}
/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 *
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {import('../types.js').AttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(connect: FxComponent) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(disconnect: FxComponent) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
declare const component: (tag: string, attributeMap: import("../types.js").AttributeMap, connect: (connect: UIElement) => void, disconnect: (disconnect: UIElement) => void) => {
    new (): {
        attributeMap: import("../types.js").AttributeMap;
        connectedCallback(): void;
        disconnectedCallback(): void;
    };
    observedAttributes: string[];
};
export { DEV_MODE, component, setText, setAttr, setClass, setProp, setStyle, autoEffects, highlightTargets, DebugElement };
