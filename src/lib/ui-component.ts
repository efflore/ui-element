import UIElement, { type UIAttributeMap } from "../ui-element";
import { effect } from "../cause-effect";
import { asBoolean, asInteger, asNumber, asString } from "./parse-attribute";
import uiRef from "./ui-ref";
import autoEffects from "./auto-effects";
import highlightTargets from "./highlight-targets";
import { DEV_MODE } from "./debug-element";

/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 * 
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIAttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(connect: UIElement) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(disconnect: UIElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
const uiComponent = (
  tag: string,
  attributeMap: UIAttributeMap = {},
  connect: (connect: UIElement) => void,
  disconnect: (disconnect: UIElement) => void
): typeof UIComponent => {
  const UIComponent = class extends UIElement {
    static observedAttributes = Object.keys(attributeMap);
    attributeMap = attributeMap;

    connectedCallback() {
      super.connectedCallback();
      connect && connect(this);
      autoEffects(this);
      DEV_MODE && highlightTargets(this);
    }

    disconnectedCallback() {
      disconnect && disconnect(this);
    }
  };
  UIComponent.define(tag);
  return UIComponent;
};

export { uiComponent as default, UIElement, effect, uiRef, asBoolean, asInteger, asNumber, asString };