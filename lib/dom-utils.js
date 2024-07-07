import UIElement, { effect, unwrap } from '../index.js';

/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */

/* === Constants === */

const SELECTOR_PREFIX = 'data-';
const HOVER_SUFFIX = '-hover';
const FOCUS_SUFFIX = '-focus';
const FX_CLASS = 'ui-effect';
const TEXT_SUFFIX = '-text';
const PROP_SUFFIX = '-prop';
const ATTR_SUFFIX = '-attr';
const CLASS_SUFFIX = '-class';
const STYLE_SUFFIX = '-style';

/* === Internal variables and functions to the module === */

/**
 * Check if a given variable is defined
 * 
 * @param {any} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
const isDefined = value => typeof value !== 'undefined';

/**
 * Loop through all elements with the given attribute and call the provided callback function
 * 
 * @since 0.7.0
 * @param {UIElement} el
 * @param {string} attr 
 * @param {(node: Element) => void} callback
 */
const forAll = (el, attr, callback) => {
  for (const node of (el.shadowRoot || el).querySelectorAll(`[${attr}]`)) {
    callback(node);
    node.removeAttribute(attr);
  }
}

/* === Exported functions === */

/**
 * Replace text content of the DOM element while preserving comment nodes
 * 
 * @param {Element} element - DOM element to be updated
 * @param {string | (() => string) | null} fallback - unused; default for third parameter, so content can also be passed as second parameter
 * @param {string | (() => string) | undefined} [content=fallback] - new text content
 */
const setText = (element, fallback, content = fallback) => {
  Array.from(element.childNodes).filter(node => node.nodeType !== Node.COMMENT_NODE).forEach(node => node.remove());
  element.append(document.createTextNode(unwrap(content)));
};

/**
 * Set or delete a property of the DOM element
 * 
 * @param {Element} element - DOM element to be updated
 * @param {PropertyKey} key 
 * @param {any} value 
 */
const setProp = (element, key, value) => {
  isDefined(value) ? (element[key] = value) : delete element[key]; // don't unrap property assignments
};

/**
 * Set or remove an attribute of the DOM element
 * 
 * @param {Element} element - DOM element to be updated
 * @param {string} name 
 * @param {string | (() => string) | boolean | undefined} value 
 */const setAttr = (element, name, value) => {
  typeof value === 'boolean'
    ? element.toggleAttribute(name, value)
    : isDefined(value)
      ? element.setAttribute(name, unwrap(value))
      : element.removeAttribute(name);
};

/**
 * Add or remove a class on the DOM element
 * 
 * @param {Element} element - DOM element to be updated
 * @param {string} token 
 * @param {boolean | (() => boolean) | undefined} force 
 */
const setClass = (element, token, force) => {
  element.classList.toggle(token, unwrap(force));
};

/**
 * Set or remove a style property of the DOM element
 * 
 * @param {Element} element - DOM element to be updated
 * @param {string} prop 
 * @param {string | (() => string) | undefined} value 
 */
const setStyle = (element, prop, value) => {
  // @ts-ignore 'style' is not a property of Element, but it is a property of HTMLElement, SVGElement, MathMLElement
  isDefined(value) ? element.style.setProperty(prop, unwrap(value)) : element.style.removeProperty(prop);
};

/**
 * Automatically apply effects to the DOM element based on its attributes
 * 
 * @param {UIElement} el 
 */
const autoEffects = el => {    
  [TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX].forEach(suffix => {
    const attr = `${SELECTOR_PREFIX}${el.localName}${suffix}`;

    if (suffix === TEXT_SUFFIX) {
      forAll(el, attr, node => {
        const state = node.getAttribute(attr).trim();
        const fallback = node.textContent || '';
        el.set(state, fallback, false);
        effect(enqueue => {
          if (el.has(state)) {
            const content = el.get(state);
            enqueue(node, setText, true, isDefined(content) ? content : fallback);
          }
        });
      });

    } else {

      const fallback = (/** @type {Element} */ node, /** @type {string} */ key) => {
        const getter = {
          [PROP_SUFFIX]: () => node[key],
          [ATTR_SUFFIX]: () => node.getAttribute(key),
          [CLASS_SUFFIX]: () => node.classList.contains(key),
          [STYLE_SUFFIX]: () => (node instanceof HTMLElement) && node.style[key],
        };
        return getter[suffix]();
      };

      const updater = () => {
        const setter = {
          [PROP_SUFFIX]: setProp,
          [ATTR_SUFFIX]: setAttr,
          [CLASS_SUFFIX]: setClass,
          [STYLE_SUFFIX]: setStyle,
        };
        return setter[suffix];
      };

      forAll(el, attr, node => {
        const splitted = (/** @type {string} */ str, /** @type {string} */ separator) => str.split(separator).map(s => s.trim());
        splitted(node.getAttribute(attr), ';').forEach((/** @type {string} */ value) => {
          let [name, state] = splitted(value, ':');
          !state && (state = name);
          el.set(state, fallback(node, name), false);
          effect(enqueue => {
            el.has(state) && enqueue(node, updater(), name, el.get(state));
          });
        });
      });
    }
  });
}

/**
 * Add event listeners to the DOM element to auto-highlight targets when hovering or focusing on elements with given attribute
 * 
 * @param {UIElement} el 
 */
const highlightTargets = el => {
  if (!el.get('debug')) return;

  /**
   * Add event listeners to highlight targets when hovering or focusing on elements with given attribute
   * 
   * @param {string} attr - attribute name to look for
   * @param {string} on - event to turn target highlighting on
   * @param {string} off - event to turn target highlighting off
   */
  const addHandlers = (attr, on, off) => forAll(el, attr, node => {
    const key = node.getAttribute(attr).trim();
    node.addEventListener(on, () => {
      for (const target of el.targets(key)) target.classList.add(FX_CLASS);
    });
    node.addEventListener(off, () => {
      for (const target of el.targets(key)) target.classList.remove(FX_CLASS);
    });
  });

  addHandlers(`${SELECTOR_PREFIX}${el.localName}${HOVER_SUFFIX}`, 'mouseenter', 'mouseleave');
  addHandlers(`${SELECTOR_PREFIX}${el.localName}${FOCUS_SUFFIX}`, 'focus', 'blur');
}

/**
 * Create a UIElement subclass for a custom element tag
 * 
 * @param {string} tag 
 * @param {import('../types.js').AttributeMap} attributeMap 
 * @param {(connect: HTMLElement) => void} connect 
 * @param {(disconnect: HTMLElement) => void} disconnect 
 * @returns {CustomElementConstructor}
 */
const component = (tag, attributeMap = {}, connect, disconnect) => {
  const FxComponent = class extends UIElement {
    static observedAttributes = Object.keys(attributeMap);
    attributeMap = attributeMap;

    connectedCallback() {
      (typeof this.getAttribute('debug') === 'string') && this.set('debug', true);
      connect && connect(this);
      autoEffects(this);
      highlightTargets(this);
    }

    disconnectedCallback() {
      disconnect && disconnect(this);
    }
  };
  FxComponent.define(tag);
  return FxComponent;
};

export { component, setText, setAttr, setClass, setProp, setStyle, autoEffects, highlightTargets };