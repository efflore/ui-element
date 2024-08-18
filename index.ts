import { UIElement } from './src/ui-element'
import { effect } from './src/cause-effect'
import { maybe } from './src/core/maybe'
import { log } from './src/core/log'
import { pass } from './src/core/pass'
import { on } from './src/lib/event'
import { asBoolean, asInteger, asJSON, asNumber, asString } from './src/lib/parse-attribute'
import { setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass } from './src/lib/auto-effects'

/**
 * @name UIElement
 * @version 0.8.0
 */

export {
  UIElement, effect, maybe, pass, on, log,
  asBoolean, asInteger, asNumber, asString, asJSON,
  setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
}