import {
	callFunction, isComment, isDefined, isDefinedObject, isFunction, isNull, isNullish,
	isNumber, isObject, isObjectOfType, isPropertyKey, isString, isSymbol
} from './src/core/is-type'
import { elementName, log, LOG_DEBUG, LOG_ERROR, LOG_INFO, LOG_WARN, valueString } from './src/core/log'
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
import { useContext } from './src/lib/context'
import { pass } from './src/lib/pass'
import { on, off, emit } from './src/lib/event'
import { asBoolean, asEnum, asInteger, asJSON, asNumber, asString } from './src/lib/parse-attribute'
import { setAttribute, setProperty, setStyle, setText, toggleAttribute, toggleClass, updateElement } from './src/lib/auto-effects'
import { setInternal, toggleInternal, useBusy, useChecked, useCurrent, useDisabled, useExpanded, useHidden, useInternals, usePressed, useSelected } from './src/lib/internals'

/**
 * @name UIElement
 * @version 0.9.0
 */

export {

	// General type guards and utility functions
	isString, isSymbol, isNumber, isObject, isPropertyKey, isFunction, callFunction,
	isNull, isNullish, isDefined, isDefinedObject, isObjectOfType, isComment,

	// Logging
	LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG, log, elementName, valueString,

	// Result types for safe handling of nullish values, errors, and promises
	TYPE_OK, TYPE_NONE, TYPE_FAIL, ok, none, fail, maybe, result, task, flow, match, isOk, isNone, isFail, isResult,

	// Cause & Effect signals state management
	TYPE_STATE, TYPE_COMPUTED, state, computed, effect, isState, isComputed, isSignal,

	// UI element access
	TYPE_UI, ui, self, first, all,

	// Base class
	UIElement,
	
	// Event handling and state passing
	on, off, emit, pass,

	// Context access
	useContext,

	// Attribute parsing
	parse, asBoolean, asInteger, asNumber, asString, asEnum, asJSON,

	// Auto-effect functions for DOM manipulation
	updateElement, setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle,

	// Element internals manipulation
	useInternals, toggleInternal, setInternal, useBusy, useChecked, useCurrent, useDisabled, useExpanded, useHidden, usePressed, useSelected,
}