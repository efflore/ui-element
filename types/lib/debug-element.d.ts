import { UIElement } from '../ui-element';
import { DEV_MODE } from '../core/log';
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
     * @param {string | undefined} old
     * @param {string | undefined} value
     */
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    /**
     * Wrap get() to log signal reads to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key - state to get
     * @returns {unknown} - current value of the state
     */
    get<T>(key: PropertyKey): T;
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
}
export { DEV_MODE, DebugElement };
