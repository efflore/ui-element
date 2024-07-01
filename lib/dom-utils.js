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
const _check = (element, value, old) => (element  && value !== null) && (value !== old);

/**
 * Update text content of an element while preserving comments (unlike element.textContent assignment)
 * 
 * @param {Element} element - element to update
 * @param {any} content - new text content
 */
const _text = (element, content) => {
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
const _prop = (element, key, value) => _defined(value)
  ? (element[key] = value)
  : delete element[key];

/**
 * Update attribute of an element
 * 
 * @param {Element} element - element to update
 * @param {string} name - attribute to update
 * @param {string|boolean|undefined} value 
 * @returns {void|boolean} if toggled whether the attribute is there after the call or not
 */
const _attr = (element, name, value) => typeof value === 'boolean'
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
 * @returns {boolean} indicating whether token is in the list after the call or not
 */
const _class = (element, token, force) => element.classList.toggle(token, force);

/**
 * Update style property of an element
 * 
 * @param {HTMLElement} element - element to update
 * @param {string} name - style property to update
 * @param {string} value - new style property value
 * @returns {void|string} if removed to value before removal
 */
const _style = (element, name, value) => _defined(value) ? element.style.setProperty(name, value) : element.style.removeProperty(name);

/* === Exported Functions === */

/**
 * Update text content of an element while preserving comments
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {string|null} content - new text content; `null` for opt-out of update
 */
const setText = (element, content) => _check(element, content, element.textContent) && _text(element, content);

/**
 * Update property of an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {PropertyKey} key - property to be updated
 * @param {any} value - new property value; `''` or `true` for boolean attribute; `null` for opt-out of update; `undefined` or `false` will delete existing property
 */
const setProp = (element, key, value) => _check(element, value, element[key]) && _prop(element, key, value);

/**
 * Update attribute of an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be updated
 * @param {string} name - attribute to be updated
 * @param {string|null} value - new attribute value; `null` for opt-out of update; `undefined` will remove existing attribute
 */
const setAttr = (element, name, value) => _check(element, value, element.getAttribute(name)) && _attr(element, name, value);

/**
 * Toggle class on an element
 * 
 * @since 0.6.0
 * @param {Element} element - element to be toggled
 * @param {string} token - class token to be toggled
 * @param {boolean|null|undefined} force - force toggle condition `true` or `false`; `null` for opt-out of update; `undefined` will toggle existing class
 */
const setClass = (element, token, force) => _check(element, force, element.classList.contains(token)) && _class(element, token, force);

/**
 * Update style property of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {string} property - style property to be updated
 * @param {string|null|undefined} value - new style property value; `null` for opt-out of update; `undefined` will remove existing style property
 */
const setStyle = (element, property, value) => _check(element, value, element.style[property]) && _style(element, property, value);

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
    const setter = {
      [PROP_ATTR]: _prop,
      [ATTR_ATTR]: _attr,
      [CLASS_ATTR]: _class,
      [STYLE_ATTR]: _style,
    };

    root.querySelectorAll(`*[${attr}]`).forEach(/** @type {Element} */ node => {

      // update text content
      if (attr === TEXT_ATTR) {
        const key = node.getAttribute(attr);
        const fallback = node.textContent;
        element.set(key, fallback, false);
        element.effect(() => {
          if (element.has(key)) {
            const content = element.get(key);
            _text(node, _defined(content) ? content : fallback);
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
        node.getAttribute(attr).split(';').map(s => s.trim()).forEach((/** @type {string} */ key) => {
          let [name, value] = key.split(':').map(s => s.trim());
          !value && (value = name);
          element.set(value, fallback(attr, node, name), false);
          element.effect(() => element.has(value) && setter[attr](node, name, element.get(value)));
        });
      }

      // remove attribute
      node.removeAttribute(attr);
    });
  };
  addEffects(TEXT_ATTR);
  addEffects(PROP_ATTR);
  addEffects(ATTR_ATTR);
  addEffects(CLASS_ATTR);
  addEffects(STYLE_ATTR);
};

export { setText, setProp, setAttr, setClass, setStyle, autoEffects };