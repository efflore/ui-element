import UIElement, { type UIAttributeMap } from "../ui-element";
import { effect } from "../cause-effect";
import { asBoolean, asInteger, asNumber, asString, asJSON } from "./parse-attribute";
import ui, { type UIRef } from "./ui";
import DebugElement, { DEV_MODE } from "./debug-element";

/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 * 
 * @since 0.7.2
 * @param {string} tag - custom element tag name
 * @param {UIAttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement | DebugElement, my: UIRef) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(host: UIElement | DebugElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
const component = (
  tag: string,
  attributeMap: UIAttributeMap = {},
  connect: (host: UIElement | DebugElement, my: UIRef) => void,
  disconnect: (host: UIElement | DebugElement) => void
): typeof UIComponent => {
  const UIComponent = class extends (DEV_MODE ? DebugElement : UIElement) {
    static observedAttributes = Object.keys(attributeMap);
    attributeMap = attributeMap;

    connectedCallback() {
      super.connectedCallback();
      connect && connect(this, ui(this));
    }

    disconnectedCallback() {
      DEV_MODE && super.disconnectedCallback();
      disconnect && disconnect(this);
    }
  };
  UIComponent.define(tag);
  return UIComponent;
};

export { component as default, UIElement, DebugElement, effect, ui, asBoolean, asInteger, asNumber, asString, asJSON };