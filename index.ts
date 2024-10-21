import {
	callFunction, isComment, isDefined, isDefinedObject, isFunction, isNull, isNullish,
	isNumber, isObject, isObjectOfType, isPropertyKey, isString, isSymbol
} from './src/core/is-type'
import { log, LOG_DEBUG, LOG_ERROR, LOG_INFO, LOG_WARN } from './src/core/log'
import {
	computed, effect, isComputed, isSignal, isState, state,
	TYPE_COMPUTED, TYPE_STATE
} from './src/core/cause-effect'
import {
	fail, flow, isFail, isNone, isOk, isResult, match, maybe, none, ok, result, task,
	TYPE_FAIL, TYPE_NONE, TYPE_OK
} from './src/core/maybe'
import { TYPE_UI, ui, self, first, all } from './src/core/ui'
import { parse } from './src/core/parse'
import { UIElement } from './src/ui-element'
import { pass } from './src/lib/pass'
import { on, off, emit } from './src/lib/event'
import { asBoolean, asInteger, asJSON, asNumber, asString } from './src/lib/parse-attribute'
import { setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass } from './src/lib/auto-effects'
import { setInternal, syncInternals, toggleInternal } from './src/lib/internals'

/**
 * @name UIElement
 * @version 0.9.0
 */

export {
	isString, isSymbol, isNumber, isObject, isPropertyKey, isFunction, callFunction,
	isNull, isNullish, isDefined, isDefinedObject, isObjectOfType, isComment,
	LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG, log,
	TYPE_OK, TYPE_NONE, TYPE_FAIL, ok, none, fail, maybe, result, task, flow, match, isOk, isNone, isFail, isResult,
	TYPE_STATE, TYPE_COMPUTED, state, computed, effect, isState, isComputed, isSignal,
	TYPE_UI, ui, self, first, all,
	UIElement, pass, on, off, emit,
	parse, asBoolean, asInteger, asNumber, asString, asJSON,
	setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle,
	syncInternals, toggleInternal, setInternal,
}