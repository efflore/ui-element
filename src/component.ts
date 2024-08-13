import { isDefinedObject, isFunction } from './core/is-type'
import { maybe } from './core/maybe'
import { ui } from './core/ui'
import { io } from './core/io'
import { pass } from './core/pass.js'
import type { UnknownContext } from './core/context-request'
import { effect } from './cause-effect'
import { type AttributeMap, UIElement } from './ui-element'
import { asBoolean, asInteger, asNumber, asString, asJSON } from './lib/parse-attribute'
import { on } from './lib/event.js'
import { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle } from './lib/auto-effects.js'

/* === Types === */

type ComponentProps = {
  attributeMap?: AttributeMap
  consumedContexts?: UnknownContext[]
  providedContexts?: UnknownContext[]
}

/* === Default export === */

/**
 * Create a UIElement subclass for a custom element tag
 * 
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {ComponentProps} props - object of observed attributes and their corresponding state keys and parser functions
 * @param {(host: UIElement) => void | (() => void)} connect - callback to be called when the element is connected to the DOM; may return a disconnect callback to be called when the element is disconnected from the DOM
 * @param {typeof UIElement} superClass - parent class to extend; defaults to `UIElement`
 * @returns {typeof Component} - custom element class
 */
const component = (
  tag: string,
  props: ComponentProps = {},
  connect: (host: UIElement) => void | (() => void),
  superClass: typeof UIElement = UIElement
): typeof Component => {
  const Component = class extends superClass {
    static observedAttributes: string[] = isDefinedObject(props.attributeMap) ? Object.keys(props.attributeMap) : []
    static attributeMap: AttributeMap = props.attributeMap || {}
    static providedContexts: UnknownContext[] = props.providedContexts || []
    static consumedContexts: UnknownContext[] = props.consumedContexts || []

    disconnect: (() => void) | undefined

    connectedCallback(): void {
      super.connectedCallback()
      if (!isFunction(connect)) return
      const cleanup = connect(this)
      if (isFunction(cleanup)) this.disconnect = cleanup
    }
    
    disconnectedCallback(): void {
      if ('disconnectedCallback' in superClass) super.disconnectedCallback()
      this.disconnect()
    }
  }
  Component.define(tag)
  return Component
}

export {
  type ComponentProps,
  UIElement, effect, component, maybe, ui, io, pass, on,
  asBoolean, asInteger, asNumber, asString, asJSON,
  setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
}
