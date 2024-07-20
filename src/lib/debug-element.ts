import UIElement, { type UIStateMap } from '../ui-element';
import { isDefined } from './ui';

/* === Types === */

/* interface DebugElement extends UIElement {
  highlight: (className?: string) => void;
  log(msg: string): void;
}; */

/* === Constants === */

const DEV_MODE = true;
const DEBUG_STATE = 'debug';
const SELECTOR_PREFIX = 'data-';
const HOVER_SUFFIX = 'hover';
const FOCUS_SUFFIX = 'focus';
const EFFECT_CLASS = 'ui-effect';

/* === Internal variables and functions to the module === */

/**
 * Return a HyperScript string representation of the Element instance
 * 
 * @since 0.7.0
 * @param {Element} el 
 * @returns {string}
 */
const elementName = (el: Element): string =>
  `<${el.localName}${el.id && `#${el.id}`}${el.className && `.${el.className.replace(' ', '.')}`}>`;

/**
 * Return a string representation of a JavaScript variable
 * 
 * @since 0.7.0
 * @param {unknown} value 
 * @returns {string}
 */
const valueString = (value: unknown): string => typeof value === 'string'
  ? `"${value}"`
  : typeof value === 'object'
    ? JSON.stringify(value)
    : isDefined(value)
      ? value.toString()
      : 'undefined';

/* === Exported class === */

/**
 * Add debug capabilities to UIElement classes
 * 
 * @since 0.5.0
 * 
 * @class DebugElement
 * @extends {UIElement}
 */
class DebugElement extends UIElement {

  /**
   * Wrap connectedCallback to log to the console
   */
  connectedCallback() {
    (typeof this.getAttribute(DEBUG_STATE) === 'string') && this.set(DEBUG_STATE, true);
    this.log(`Connected ${elementName(this)}`);
  }

  /**
   * Wrap disconnectedCallback to log to the console
   */
  disconnectedCallback() {
    this.log(`Disconnected ${elementName(this)}`);
  }

  /**
   * Wrap adoptedCallback to log to the console
   */
  adoptedCallback() {
    this.log(`Adopted ${elementName(this)}`);
  }

  /**
   * Wrap attributeChangedCallback to log changes to the console
   * 
   * @since 0.5.0
   * @param {string} name
   * @param {string|undefined} old
   * @param {string|undefined} value
   */
  attributeChangedCallback(name: string, old: string | undefined, value: string | undefined) {
    this.log(`Attribute "${name}" of ${elementName(this)} changed from ${valueString(old)} to ${valueString(value)}`);
    super.attributeChangedCallback(name, old, value);
  }

  /**
   * Wrap get() to log signal reads to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to get
   * @returns {unknown} - current value of the state
   */
  get(key: PropertyKey): unknown {
    const value = super.get(key);
    this.log(`Get current value of state ${valueString(key)} in ${elementName(this)} (value: ${valueString(value)}) and track its use in effect`);
    return value;
  }

  /**
   * Wrap set() to log signal writes to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to be set
   * @param {unknown} value - value to be set
   * @param {boolean} [update=true] - whether to update the state
   */
  set(
    key: PropertyKey,
    value: unknown,
    update: boolean = true
  ): void {
    this.log(`Set ${update ? '' : 'default '}value of state ${valueString(key)} in ${elementName(this)} to ${valueString(value)} and trigger dependent effects`);
    super.set(key, value, update);
  }

  /**
   * Wrap delete() to log signal deletions to the console
   * 
   * @since 0.7.0
   * @param {PropertyKey} key - state to be deleted
   * @returns {boolean} - whether the state was deleted
   */
  delete(key: PropertyKey): boolean {
    this.log(`Delete state ${valueString(key)} from ${elementName(this)}`);
    return super.delete(key);
  }

  /**
   * Wrap pass() to log passed signals to the console
   * 
   * @since 0.7.0
   * @param {UIElement} element - UIElement to be passed to
   * @param {UIStateMap} states - states to be passed to the element
   * @param {CustomElementRegistry} [registry=customElements] - custom element registry
   */
  async pass(element: UIElement, states: UIStateMap, registry: CustomElementRegistry = customElements) {
    this.log(`Pass state(s) ${valueString(Object.keys(states))} to ${elementName(element as HTMLElement)} from ${elementName(this)}`);
    super.pass(element, states, registry);
  }

  /**
   * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
   * 
   * @since 0.7.0
   * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
   */
  highlight(className: string = EFFECT_CLASS) {
    [HOVER_SUFFIX, FOCUS_SUFFIX].forEach(suffix => {
      const [onOn, onOff] = suffix === HOVER_SUFFIX
        ? ['mouseenter','mouseleave']
        : ['focus', 'blur'];
      const attr = `${SELECTOR_PREFIX}-${this.localName}-${suffix}`;
      const apply = (node: Element) => {
        const key = this.getAttribute(attr).trim();
        const on = (type: string, force: boolean) =>
          node.addEventListener(type, () => {
            for (const target of this.targets(key))
              target.classList.toggle(className, force);
          });
        on(onOn, true);
        on(onOff, false);
        node.removeAttribute(attr);
      };

      this.hasAttribute(attr) && apply(this);
      for (const node of (this.shadowRoot || this).querySelectorAll(`[${attr}]`))
        apply(node);
    });
  };

  /**
   * Log messages in debug mode
   * 
   * @since 0.5.0
   * @param {string} msg - debug message to be logged
   */
  log(msg: string): void {
    this.has(DEBUG_STATE) && console.debug(msg);
  }
}

export { DEV_MODE, DebugElement as default };