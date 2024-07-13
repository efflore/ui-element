import UIElement from "../ui-element";
import { asBoolean, asInteger, asNumber, asString } from "../parse-attribute";
import { effect } from "../cause-effect";
import $ from "./fx-element";
import autoEffects from "./auto-effects";
import highlightTargets from "./highlight-targets";
import { DEV_MODE } from "./debug-element";

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
  attributeMap: import('../ui-element').FxAttributeMap = {},
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
      DEV_MODE && highlightTargets(this);
    }

    disconnectedCallback() {
      disconnect && disconnect(this);
    }
  };
  FxComponent.define(tag);
  return FxComponent;
};

export { component as default, UIElement, effect, $, asBoolean, asInteger, asNumber, asString };