import UIElement, { type UIAttributeMap, type UIContextMap } from "../ui-element"
import { is, effect } from "../cause-effect"
import type { UnknownContext } from "../context-request"
import { asBoolean, asInteger, asNumber, asString, asJSON } from "./parse-attribute"
import ui, { type UIRef, isDefined } from "./ui"

/* === Types === */

type UIComponentProps = {
  attributeMap?: UIAttributeMap
  contextMap?: UIContextMap
  providedContexts?: UnknownContext[]
}

/* === Internal functions === */

/**
 * Check if a given value is an object
 * 
 * @param {unknown} value - value to check if it is an object
 * @returns {boolean} true if supplied parameter is an object
 */
const isObject = (value: unknown): value is Record<string, unknown> => isDefined(value) && is('object', value)

/**
 * Retrieve all enumarable keys from an object as an array; defaults to an empty array
 * 
 * @param {unknown} obj - object to retrieve keys from
 * @returns {string[]} - array of enumarable keys
 */
const fromKeys = (obj: Record<string, unknown>): string[] => isObject(obj) ? Object.keys(obj) : []

/* === Default export === */

/**
 * Create a UIElement subclass for a custom element tag
 * 
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {UIComponentProps} props - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement, my: UIRef) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(host: UIElement) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @param {typeof UIElement} superClass - parent class to extend; defaults to `UIElement`
 * @returns {typeof FxComponent} - custom element class
 */
const component = (
  tag: string,
  props: UIComponentProps = {},
  connect: (host: UIElement, my: UIRef) => void,
  disconnect: (host: UIElement) => void,
  superClass: typeof UIElement = UIElement
): typeof UIComponent => {
  const UIComponent = class extends superClass {
    static observedAttributes: string[] = fromKeys(props.attributeMap)
    static providedContexts: UnknownContext[] = props.providedContexts || []
    static consumedContexts: UnknownContext[] = fromKeys(props.contextMap).map(context => ({ __context__: context }))
    attributeMap: UIAttributeMap = props.attributeMap || {}
    contextMap: UIContextMap = props.contextMap || {}

    connectedCallback() {
      super.connectedCallback()
      connect && connect(this, ui(this))
    }

    disconnectedCallback() {
      super.disconnectedCallback()
      disconnect && disconnect(this)
    }
  }
  UIComponent.define(tag)
  return UIComponent
}

export { type UIComponentProps, UIElement as default, effect, component, ui, asBoolean, asInteger, asNumber, asString, asJSON }