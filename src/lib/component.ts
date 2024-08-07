import { isDefinedObject, isFunction } from "../is-type"
import { maybe } from "../maybe"
import { effect } from "../cause-effect"
import UIElement, { type UIAttributeMap } from "../ui-element"
import type { UnknownContext } from "../context-request"
import { asBoolean, asInteger, asNumber, asString, asJSON } from "./parse-attribute"
import ui, { type UIRef } from "./ui"

/* === Types === */

type UIComponentProps = {
  attributeMap?: UIAttributeMap
  consumedContexts?: UnknownContext[]
  providedContexts?: UnknownContext[]
}

/* === Default export === */

/**
 * Create a UIElement subclass for a custom element tag
 * 
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIComponentProps} props - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement, my: UIRef<Element>) => void | (() => void)} connect - callback to be called when the element is connected to the DOM; may return a disconnect callback to be called when the element is disconnected from the DOM
 * @param {typeof UIElement} superClass - parent class to extend; defaults to `UIElement`
 * @returns {typeof FxComponent} - custom element class
 */
const component = (
  tag: string,
  props: UIComponentProps = {},
  connect: (host: UIElement, my: UIRef<Element>) => void | (() => void),
  superClass: typeof UIElement = UIElement
): typeof UIComponent => {
  const UIComponent = class extends superClass {
    static observedAttributes: string[] = isDefinedObject(props.attributeMap) ? Object.keys(props.attributeMap) : []
    static attributeMap: UIAttributeMap = props.attributeMap || {}
    static providedContexts: UnknownContext[] = props.providedContexts || []
    static consumedContexts: UnknownContext[] = props.consumedContexts || []

    connectedCallback() {
      super.connectedCallback()
      if (!isFunction(connect)) return
      const disconnect = connect(this, ui(this, this))
      if (!isFunction(disconnect)) return
      this.disconnectedCallback = () => {
        super.disconnectedCallback()
        disconnect()
      }
    }
  }
  UIComponent.define(tag)
  return UIComponent
}

export { type UIComponentProps, UIElement as default, maybe, effect, component, ui, asBoolean, asInteger, asNumber, asString, asJSON }