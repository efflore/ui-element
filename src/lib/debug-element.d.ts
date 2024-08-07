import UIElement, { type UIStateMap } from '../ui-element';
declare const DEV_MODE = true;
/**
 * Add debug capabilities to UIElement classes
 *
 * @since 0.5.0
 *
 * @class DebugElement
 * @extends {UIElement}
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
     * Wrap get() to log signal reads to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key - state to get
     * @returns {unknown} - current value of the state
     */
    get(key: PropertyKey): unknown;
    /**
     * Wrap set() to log signal writes to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key - state to be set
     * @param {unknown} value - value to be set
     * @param {boolean} [update=true] - whether to update the state
     */
    set(key: PropertyKey, value: unknown, update?: boolean): void;
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
     * @param {UIStateMap} states - states to be passed to the element
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry
     */
    pass(element: UIElement, states: UIStateMap, registry?: CustomElementRegistry): Promise<void>;
    /**
     * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
     *
     * @since 0.7.0
     * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
     */
    highlight(className?: string): void;
    /**
     * Log messages in debug mode
     *
     * @since 0.5.0
     * @param {string} msg - debug message to be logged
     */
    log(msg: string): void;
}
export { DEV_MODE, DebugElement as default };
