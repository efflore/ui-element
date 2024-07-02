/* === Internal Functions === */

/**
 * Check whether a value is not undefined
 * 
 * @param {any} value 
 * @returns {boolean}
 */
const _defined = value => typeof value !== 'undefined';

/**
 * Check whether to execute an effect handler
 * 
 * @param {Element} element - element to check
 * @param {any} value - new value
 * @param {any} old - old value
 * @returns {boolean} whether sanity check passed and equality check failed
 */
const _check = (element, value, old) => (element && value !== null) && (value !== old);

/**
 * Update text content of an element while preserving comments (unlike element.textContent assignment)
 * 
 * @param {Element} element - element to update
 * @param {any} content - new text content
 */
const t = (element, content) => {
  Array.from(element.childNodes).filter(node => node.nodeType !== Node.COMMENT_NODE).forEach(node => node.remove());
  element.append(document.createTextNode(content));
};

/**
 * Update property of an element
 * 
 * @param {Element} element - element to update
 * @param {PropertyKey} key - property to update
 * @param {any} value - new property value
 */
const p = (element, key, value) => _defined(value)
  ? (element[key] = value)
  : delete element[key];

/**
 * Update attribute of an element
 * 
 * @param {Element} element - element to update
 * @param {string} name - attribute to update
 * @param {string|boolean|undefined} value 
 */
const a = (element, name, value) => typeof value === 'boolean'
  ? element.toggleAttribute(name, value)
  : _defined(value)
    ? element.setAttribute(name, value)
    : element.removeAttribute(name);

/**
 * Update class token of an element
 * 
 * @param {Element} element - element to update
 * @param {string} token - class token to update
 * @param {boolean|undefined} force - whether to add or remove the token; if `undefined` the token will be toggled
 */
const c = (element, token, force) => element.classList.toggle(token, force);

/**
 * Update style property of an element
 * 
 * @param {HTMLElement} element - element to update
 * @param {string} name - style property to update
 * @param {string} value - new style property value
 */
const s = (element, name, value) => _defined(value) ? element.style.setProperty(name, value) : element.style.removeProperty(name);

/* === Exported Functions === */

/**
 * Update text content of an element while preserving comments
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {string|null} content - new text content; `null` for opt-out of update
 */
const setText = (element, content) => _check(element, content, element.textContent) && t(element, content);

/**
 * Update property of an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {PropertyKey} key - property to be updated
 * @param {any} value - new property value; `''` or `true` for boolean attribute; `null` for opt-out of update; `undefined` or `false` will delete existing property
 */
const setProp = (element, key, value) => _check(element, value, element[key]) && p(element, key, value);

/**
 * Update attribute of an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {string} name - attribute to be updated
 * @param {string|null} value - new attribute value; `null` for opt-out of update; `undefined` will remove existing attribute
 */
const setAttr = (element, name, value) => _check(element, value, element.getAttribute(name)) && a(element, name, value);

/**
 * Toggle class on an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be toggled
 * @param {string} token - class token to be toggled
 * @param {boolean|null|undefined} force - force toggle condition `true` or `false`; `null` for opt-out of update; `undefined` will toggle existing class
 */
const setClass = (element, token, force) => _check(element, force, element.classList.contains(token)) && c(element, token, force);

/**
 * Update style property of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {string} property - style property to be updated
 * @param {string|null|undefined} value - new style property value; `null` for opt-out of update; `undefined` will remove existing style property
 */
const setStyle = (element, property, value) => _check(element, value, element.style[property]) && s(element, property, value);

/**
 * Add DOM effects
 */
const autoEffects = (/** @type {import("../types").UIElement} */ element) => {
  const TEXT_ATTR = 'ui-text';
  const PROP_ATTR = 'ui-prop';
  const ATTR_ATTR = 'ui-attr';
  const CLASS_ATTR = 'ui-class';
  const STYLE_ATTR = 'ui-style';

  const root = element.shadowRoot || element;
  const addEffects = (/** @type {string} */ attr) => {
    root.querySelectorAll(`*[${attr}]`).forEach(/** @type {Element} */ node => {

      // update text content
      if (attr === TEXT_ATTR) {
        const key = node.getAttribute(attr);
        const fallback = node.textContent;
        element.set(key, fallback, false);
        element.effect((/** @type {import("../types").DOMEffects} */ scheduled) => {
          if (element.has(key)) {
            const content = element.get(key);
            scheduled(node, t).add([_defined(content) ? content : fallback]);
          }
        });
      
      // update properties, attributes, classes, and styles
      } else {
        const fallback = (/** @type {string} */ attr, /** @type {Element} */ node, /** @type {string} */ key) => {
          const getter = {
            [PROP_ATTR]: () => node[key],
            [ATTR_ATTR]: () => node.getAttribute(key),
            [CLASS_ATTR]: () => node.classList.contains(key),
            [STYLE_ATTR]: () => (node instanceof HTMLElement) && node.style[key],
          };
          return getter[attr](node, key);
        };
        const setter = {
          [PROP_ATTR]: p,
          [ATTR_ATTR]: a,
          [CLASS_ATTR]: c,
          [STYLE_ATTR]: s,
        };
        node.getAttribute(attr).split(';').map(s => s.trim()).forEach((/** @type {string} */ key) => {
          let [name, value] = key.split(':').map(s => s.trim());
          !value && (value = name);
          element.set(value, fallback(attr, node, name), false);
          element.effect((/** @type {(element: Element, fn: (...args: any[]) => any) => Set<any[]>} */ scheduled) => {
            element.has(value) && scheduled(node, setter[attr]).add([name, element.get(value)]);
          });
        });
      }

      // remove attribute
      node.removeAttribute(attr);
    });
  };
  [TEXT_ATTR, PROP_ATTR, ATTR_ATTR, CLASS_ATTR, STYLE_ATTR].forEach(attr => addEffects(attr));
};

export { setText, setProp, setAttr, setClass, setStyle, autoEffects };