import UIElement, { effect, FxDOMInstruction, unwrap } from '../index';

/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */

/* === Constants === */

const DEV_MODE = true;
const SELECTOR_PREFIX = 'data-';
const TEXT_SUFFIX = '-text';
const PROP_SUFFIX = '-prop';
const ATTR_SUFFIX = '-attr';
const CLASS_SUFFIX = '-class';
const STYLE_SUFFIX = '-style';
const HOVER_SUFFIX = '-hover';
const FOCUS_SUFFIX = '-focus';

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is defined
 * 
 * @param {any} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = (value: any): boolean => typeof value !== 'undefined';

/**
 * Loop through all elements with the given attribute and call the provided callback function
 * 
 * @since 0.7.0
 * @param {UIElement} el - UIElement to iterate over
 * @param {string} attr - attribute name to look for
 * @param {(node: Element, value: string) => void} callback - callback function to be called for each element
 */
const forAll = (el: UIElement, attr: string, callback: (node: Element, value: string) => void) => {
  if (el.hasAttribute(attr)) {
    callback(el, el.getAttribute(attr));
    el.removeAttribute(attr);
  }
  for (const node of (el.shadowRoot || el).querySelectorAll(`[${attr}]`)) {
    callback(node, node.getAttribute(attr));
    node.removeAttribute(attr);
  }
}

/**
 * Return a HyperScript string representation of the Element instance
 * 
 * @since 0.7.0
 * @param {Element} el 
 * @returns {string}
 */
const elementName = (el: Element): string => `<${el.localName}${el.id && `#${el.id}`}${el.className && `.${el.className.replace(' ', '.')}`}>`;

/**
 * Return a string representation of a JavaScript variable
 * 
 * @since 0.7.0
 * @param {any} value 
 * @returns {string}
 */
const valueString = (value: any): string => typeof value === 'string'
  ? `"${value}"`
  : typeof value === 'object'
    ? JSON.stringify(value)
    : isDefined(value)
      ? value.toString()
      : 'undefined';

/* === Exported functions === */

/**
 * Replace text content of the DOM element while preserving comment nodes
 * 
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string | (() => string) | null} fallback - unused; default for third parameter, so content can also be passed as second parameter
 * @param {string | (() => string) | undefined} [content=fallback] - new text content
 */
const setText = (element: Element, fallback: string | (() => string) | null, content: string | (() => string) | undefined = fallback) => {
  Array.from(element.childNodes).filter(node => node.nodeType !== Node.COMMENT_NODE).forEach(node => node.remove());
  element.append(document.createTextNode((unwrap as () => string)(content)));
};

/**
 * Set or delete a property of the DOM element
 * 
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {PropertyKey} key 
 * @param {any} value 
 */
const setProp = (element: Element, key: PropertyKey, value: any) => {
  isDefined(value) ? (element[key] = value) : delete element[key]; // don't unrap property assignments
};

/**
 * Set or remove an attribute of the DOM element
 * 
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} name 
 * @param {string | (() => string) | boolean | undefined} value 
 */
const setAttr = (element: Element, name: string, value: string | (() => string) | boolean | undefined) => {
  typeof value === 'boolean'
    ? element.toggleAttribute(name, value)
    : isDefined(value)
      ? element.setAttribute(name, unwrap(value))
      : element.removeAttribute(name);
};

/**
 * Add or remove a class on the DOM element
 * 
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} token - class to add or remove
 * @param {boolean | (() => boolean) | undefined} force - whether to forcefully add or remove the class
 */
const setClass = (element: Element, token: string, force: boolean | (() => boolean) | undefined) => {
  element.classList.toggle(token, unwrap(force));
};

/**
 * Set or remove a style property of the DOM element
 * 
 * @since 0.6.0
 * @param {Element} element - DOM element to be updated
 * @param {string} prop - style property name
 * @param {string | (() => string) | undefined} value - style property value
 */
const setStyle = (element: Element, prop: string, value: string | (() => string) | undefined) => {
  // @ts-ignore 'style' is not a property of Element, but it is a property of HTMLElement, SVGElement, MathMLElement
  isDefined(value) ? element.style.setProperty(prop, unwrap(value)) : element.style.removeProperty(prop);
};

/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 * 
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
const autoEffects = (el: UIElement) => {

  [TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX].forEach(suffix => {
    const attr = `${SELECTOR_PREFIX}${el.localName}${suffix}`;

    const textCallback = (/** @type {Element} */ node: Element, /** @type {string} */ value: string) => {
      const state = value.trim();
      const fallback = node.textContent || '';
      el.set(state, fallback, false);
      effect(enqueue => {
        if (el.has(state)) {
          const content = el.get(state);
          enqueue(node, setText, true, isDefined(content) ? content : fallback);
        }
      });
    };

    const keyValueCallback = ( node: Element, v: string) => {
      const splitted = (str: string, separator: string) => str.split(separator).map(s => s.trim());
      
      const [fallback, updater]: [(() => string), FxDOMInstruction] = ({
        [PROP_SUFFIX]: [(key: string) => node[key], setProp],
        [ATTR_SUFFIX]: [(key: string) => node.getAttribute(key), setAttr],
        [CLASS_SUFFIX]: [(key: string) => node.classList.contains(key), setClass],
        [STYLE_SUFFIX]: [(key: string) => (node instanceof HTMLElement) && node.style[key], setStyle],
      })[suffix];

      splitted(v, ';').forEach((value: string) => {
        let [name, state] = splitted(value, ':');
        !state && (state = name);
        el.set(state, fallback(), false);
        effect(enqueue => {
          el.has(state) && enqueue(node, updater, name, el.get(state));
        });
      });
    };

    forAll(el, attr, suffix === TEXT_SUFFIX ? textCallback : keyValueCallback);
  });
}

/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 * 
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className='ui-effect'] - CSS class to be added to highlighted targets
 */
const highlightTargets = (el: UIElement, className: string = 'ui-effect') => {
  if (!DEV_MODE) return;

  [HOVER_SUFFIX, FOCUS_SUFFIX].forEach(suffix => {
    const [on, off] = suffix === HOVER_SUFFIX ? ['mouseenter','mouseleave'] : ['focus', 'blur'];

    const eventCallback = (/** @type {Element} */ node: Element, /** @type {string} */ value: string) => {
      const key = value.trim();
      const addListener = (/** @type {string} */ type: string, /** @type {boolean} */ force: boolean) => node.addEventListener(type, () => {
        for (const target of el.targets(key)) target.classList.toggle(className, force);
      });
      addListener(on, true);
      addListener(off, false);
    };

    forAll(el, `${SELECTOR_PREFIX}${el.localName}${suffix}`, eventCallback);
  });
}

/**
 * Add debug capabilities to UIElement classes
 * 
 * @since 0.5.0
 * 
 * @class DebugElement
 * @extends {UIElement}
 * @type {import("../types.js").DebugElement}
 */
class DebugElement extends UIElement {

  /**
   * Wrap connectedCallback to log to the console
   */
  connectedCallback() {
    (typeof this.getAttribute('debug') === 'string') && this.set('debug', true);
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
   * Wrap set() to log signal reads to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key 
   * @returns {any}
   */
  get(key: PropertyKey): any {
    const value = super.get(key);
    this.log(`Get current value of state ${valueString(key)} in ${elementName(this)} (value: ${valueString(value)}) and track its use in effect`);
    return value;
  }

  /**
   * Wrap set() to log signal writes to the console
   * 
   * @since 0.5.0
   * @param {PropertyKey} key - state to be set
   * @param {any} value - value to be set
   * @param {boolean} [update=true] - whether to update the state
   */
  set(key: PropertyKey, value: any, update: boolean = true) {
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
  log(msg: string) {
    this.has('debug') && console.debug(msg);
  }
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
const component = (tag: string, attributeMap: import('../types.js').AttributeMap = {}, connect: (connect: UIElement) => void, disconnect: (disconnect: UIElement) => void): typeof FxComponent => {
  const FxComponent = class extends (DEV_MODE ? DebugElement : UIElement) {
    static observedAttributes = Object.keys(attributeMap);
    attributeMap = attributeMap;

    connectedCallback() {
      super.connectedCallback();
      connect && connect(this);
      autoEffects(this);
      highlightTargets(this);
    }

    disconnectedCallback() {
      DEV_MODE && super.disconnectedCallback();
      disconnect && disconnect(this);
    }
  };
  FxComponent.define(tag);
  return FxComponent;
};

export { DEV_MODE, component, setText, setAttr, setClass, setProp, setStyle, autoEffects, highlightTargets, DebugElement };