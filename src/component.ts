import { isDefinedObject, isFunction } from './lib/is-type'
import { maybe } from './lib/maybe'
import { effect } from './cause-effect'
import { type UIAttributeMap, UIElement } from './ui-element'
import type { UnknownContext } from './lib/context-request'
import { asBoolean, asInteger, asNumber, asString, asJSON } from './lib/parse-attribute'
import { type UIRef, ui } from './lib/ui'

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

    disconnect: (() => void) | undefined

    connectedCallback(): void {
      super.connectedCallback()
      if (!isFunction(connect)) return
      const cleanup = connect(this, ui(this, this))
      if (isFunction(cleanup)) this.disconnect = cleanup
    }
    
    disconnectedCallback(): void {
      if ('disconnectedCallback' in superClass) super.disconnectedCallback()
      this.disconnect()
    }
  }
  UIComponent.define(tag)
  return UIComponent
}

export {
  type UIComponentProps,
  UIElement as default, maybe, effect, component, ui, asBoolean, asInteger, asNumber, asString, asJSON
}
