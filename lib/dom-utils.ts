import UIElement from '../index';
import { effect } from './cause-effect';

/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */

/* === Constants === */

const DEV_MODE = true;
const SELECTOR_PREFIX = 'data';
const TEXT_SUFFIX = 'text';
const PROP_SUFFIX = 'prop';
const ATTR_SUFFIX = 'attr';
const CLASS_SUFFIX = 'class';
const STYLE_SUFFIX = 'style';
const HOVER_SUFFIX = 'hover';
const FOCUS_SUFFIX = 'focus';

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is defined
 * 
 * @param {any} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = (value: any): value is {} | null => typeof value !== 'undefined';

/**
 * Check if a given variable is an element which can have a style property
 * 
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node: Element): node is HTMLElement | SVGElement | MathMLElement =>
  node instanceof HTMLElement
  || node instanceof SVGElement
  || node instanceof MathMLElement;

/**
 * Loop through all elements with the given attribute and call the provided callback function
 * 
 * @since 0.7.0
 * @param {UIElement} el - UIElement to iterate over
 * @param {string} attr - attribute name to look for
 * @param {(node: Element, value: string) => void} callback - callback function to be called for each element
 */
const autoApply = (
  el: UIElement,
  attr: string,
  callback: (
    node: Element,
    value: string
  ) => void
): void => {
  const apply = (node: Element) => {
    callback(node, node.getAttribute(attr));
    node.removeAttribute(attr);
  };
  el.hasAttribute(attr) && apply(el);
  for (const node of $(el).all(`[${attr}]`))
    apply(node());
}

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

type FxElement = {
  (): Element;
  first: (selector: string) => FxElement | undefined;
  all: (selector: string) => FxElement[];
  [TEXT_SUFFIX]: {
    set: (content: string) => void;
  };
  [PROP_SUFFIX]: {
    get: (key: PropertyKey) => unknown;
    set: (
      key: PropertyKey,
      value: unknown
    ) => unknown;
  };
  [ATTR_SUFFIX]: {
    get: (name: string) => string | null;
    set: (
      name: string,
      value: string | boolean | undefined
    ) => boolean | void;
  };
  [CLASS_SUFFIX]: {
    get: (token: string) => boolean;
    set: (
      token: string,
      force: boolean | undefined
    ) => boolean;
  };
  [STYLE_SUFFIX]: {
    get: (property: string) => string | null;
    set: (
      property: string,
      value: string | undefined
    ) => void;
  };
}

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @param {Element} element 
 * @returns {FxElement}
 */
const $ = (element: Element): FxElement => {
  const root = element.shadowRoot || element;
  const el = (): Element => element;
  el.first = (selector: string): FxElement | undefined => {
    const node = root.querySelector(selector);
    return node && $(node);
  };
  el.all = (selector: string): FxElement[] =>
    Array.from(root.querySelectorAll(selector)).map(node => $(node));
  el[TEXT_SUFFIX] = {
    get: (): string => element.textContent?.trim() || '',
    set: (content: string): void => {
      Array.from(element.childNodes)
        .filter(node => node.nodeType !== Node.COMMENT_NODE)
        .forEach(node => node.remove());
      element.append(document.createTextNode(content));
    }
  };
  el[PROP_SUFFIX] = {
    get: (key: PropertyKey): unknown => element[key],
    set: (
      key: PropertyKey,
      value: unknown
    ): unknown => (element[key] = value)
  };
  el[ATTR_SUFFIX] = {
    get: (name: string): string | null => element.getAttribute(name),
    set: (
      name: string,
      value: string | boolean | undefined
    ): boolean | void => (typeof value === 'boolean')
      ? element.toggleAttribute(name, value)
      : isDefined(value)
        ? element.setAttribute(name, value)
        : element.removeAttribute(name)
  };
  el[CLASS_SUFFIX] = {
    get: (token: string): boolean => element.classList.contains(token),
    set: (
      token: string,
      force: boolean | undefined
    ): boolean => element.classList.toggle(token, force)
  };
  isStylable(element) && (el[STYLE_SUFFIX] = {
    get: (prop: string): string => element.style.getPropertyValue(prop),
    set: (
      prop: string,
      value: string
    ): string | void => isDefined(value)
      ? element.style.setProperty(prop, value)
      : element.style.removeProperty(prop)
  });
  return el;
};

/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 * 
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
const autoEffects = (el: UIElement) => {

  [TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX].forEach(suffix => {
    const attr = `${SELECTOR_PREFIX}-${el.localName}-${suffix}`;

    const textCallback = (
      node: Element,
      value: string
    ): void => {
      const key = value.trim();
      const obj = $(node)[suffix];
      const fallback = obj.get();
      el.set(key, fallback, false);
      effect(enqueue => {
        if (el.has(key)) {
          const content = el.get(key);
          enqueue(node, () => obj.set(isDefined(content)
            ? content
            : fallback
          ));
        }
      });
    };

    const keyValueCallback = (
      node: Element,
      v: string
    ): void => {
      const splitted = (
        str: string,
        separator: string
      ) => str.split(separator).map(s => s.trim());
      splitted(v, ';').forEach((value: string) => {
        const [name, key = name] = splitted(value, ':');
        const obj = $(node)[suffix];
        el.set(key, obj.get(), false);
        effect(enqueue => {
          if (el.has(key)) {
            const value = el.get(key);
            enqueue(node, () => obj.set(name, value));
          }
        });
      });
    };

    autoApply(el, attr, suffix === TEXT_SUFFIX ? textCallback : keyValueCallback);
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
    const [onOn, onOff] = suffix === HOVER_SUFFIX
      ? ['mouseenter','mouseleave']
      : ['focus', 'blur'];
    autoApply(el, `${SELECTOR_PREFIX}-${el.localName}-${suffix}`, (
      node: Element,
      value: string
    ): void => {
      const key = value.trim();
      const on = (type: string, force: boolean) =>
        node.addEventListener(type, () => {
          for (const target of el.targets(key))
            target.classList.toggle(className, force);
        });
      on(onOn, true);
      on(onOff, false);
    });
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
  set(
    key: PropertyKey,
    value: any,
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
  log(msg: string): void {
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
const component = (
  tag: string,
  attributeMap: import('../index').AttributeMap = {},
  connect: (connect: UIElement) => void,
  disconnect: (disconnect: UIElement) => void
): typeof FxComponent => {
  const FxComponent = class extends UIElement {
    static observedAttributes = Object.keys(attributeMap);
    attributeMap = attributeMap;

    connectedCallback() {
      super.connectedCallback();
      connect && connect(this);
      autoEffects(this);
      highlightTargets(this);
    }

    disconnectedCallback() {
      // DEV_MODE && super.disconnectedCallback();
      disconnect && disconnect(this);
    }
  };
  FxComponent.define(tag);
  return FxComponent;
};

export { DEV_MODE, component, $, autoEffects, highlightTargets, DebugElement };