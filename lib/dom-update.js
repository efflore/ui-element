/**
 * Update text content of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {string|null} content - new text content; `null` for opt-out of update
 */
const updateText = (element, content) => {
  if ((element && (content !== null)) && (content !== element.textContent)) {
    // preserve comments unlike element.textContent assignment
    Array.from(element.childNodes).filter(node => node.nodeType !== Node.COMMENT_NODE).forEach(node => node.remove());
    element.append(document.createTextNode(content));
  }
}

/**
 * Update property of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {PropertyKey} key - key of property to be updated
 * @param {any} value - new property value; `''` for boolean attribute; `null` for opt-out of update; `undefined` will delete existing property
 */
const updateProperty = (element, key, value) => {
  if (element && (value !== null) && (value !== element[key])) {
    (typeof value === 'undefined') ? delete element[key] : (element[key] = value);
  }
}

/**
 * Update attribute of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {string} name - name of attribute to be updated
 * @param {string|null} value - new attribute value; `null` for opt-out of update; `undefined` will remove existing attribute
 */
const updateAttribute = (element, name, value) => {
  if (element && (value !== null) && (value !== element.getAttribute(name))) {
    (typeof value === 'undefined') ? element.removeAttribute(name) : element.setAttribute(name, value);
  }
}

/**
 * Toggle class on an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be toggled
 * @param {string} token - name of class to be toggled
 * @param {boolean|null|undefined} force - force toggle condition `true` or `false`; `null` for opt-out of update; `undefined` will toggle existing class
 */
const toggleClass = (element, token, force) => {
  if (element && (force !== null) && (force !== element.classList.contains(token))) {
    element.classList.toggle(token, force);
  }
}

/**
 * Update style property of an element
 * 
 * @since 0.5.0
 * @param {HTMLElement} element - element to be updated
 * @param {string} property - name of style property to be updated
 * @param {string|null|undefined} value - new style property value; `null` for opt-out of update; `undefined` will remove existing style property
 */
const updateStyle = (element, property, value) => {
  if (element && (value !== null)) {
    (typeof value === 'undefined') ? element.style.removeProperty(property) : element.style.setProperty(property, value);
  }
}

export { updateText, updateProperty, updateAttribute, toggleClass, updateStyle };