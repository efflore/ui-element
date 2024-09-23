import { UIElement } from './src/ui-element'
import { effect } from './src/cause-effect'
import { maybe } from './src/core/maybe'
import { log } from './src/core/log'
import { pass } from './src/lib/pass'
import { on, off, emit } from './src/lib/event'
import { asBoolean, asInteger, asJSON, asNumber, asString } from './src/lib/parse-attribute'
import { setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass } from './src/lib/auto-effects'

/**
 * @name UIElement
 * @version 0.8.3
 */

export {
  UIElement, effect, maybe, log, pass, on, off, emit,
  asBoolean, asInteger, asNumber, asString, asJSON,
  setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
}