/**
 * Convenience function to define a custom element if it's name is not already taken in the CustomElementRegistry
 * 
 * @param {string} tag name of the custom element to be defined; must consist of at least two word joined with - (kebab case)
 * @param {HTMLElement} el class of custom element; must extend HTMLElement; may be an anonymous class
 */
export default function(tag, el) {
  !(el.prototype instanceof HTMLElement) && console.error(`Custom element class ${el.constructor.name} must extend HTMLElement`);
  try {
    customElements.get(tag) || customElements.define(tag, el);
  } catch (err) {
    console.error(err);
  }
}