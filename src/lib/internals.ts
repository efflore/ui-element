import { isFunction, isNullish } from '../core/is-type'
import { parse, type AttributeParser } from '../core/parse'
import { effect } from '../core/cause-effect'
import type { StateLike, UIElement } from '../ui-element'
import type { Enqueue } from '../core/scheduler'
import { asBoolean, asEnum } from './parse-attribute'
import { elementName, log, LOG_WARN, valueString } from '../core/log'

/* === Types === */

type InternalUpdater<E extends UIElement, T> = {
	key: string,
	parser: AttributeParser<T>,
	initial: (element: E) => T,
    read: (element: E) => T,
    update: (value: T) => (element: E) => () => void
	delete?: (element: E) => () => void
}

/* === Constants === */

const ARIA_PREFIX = 'aria'

const ROLES = {
	alert: 'alert',
	alertdialog: 'alertdialog',
	application: 'application',
	button: 'button',
	checkbox: 'checkbox',
	columnheader: 'columnheader',
	combobox: 'combobox',
	dialog: 'dialog',
	grid: 'grid',
	gridcell: 'gridcell',
	heading: 'heading',
	link: 'link',
	listbox: 'listbox',
	listitem: 'listitem',
	log: 'log',
	marquee: 'marquee',
	menu: 'menu',
	menubar: 'menubar',
	menuitem: 'menuitem',
	menuitemcheckbox: 'menuitemcheckbox',
	menuitemradio: 'menuitemradio',
	option: 'option',
	progressbar: 'progressbar',
	radio: 'radio',
	radiogroup: 'radiogroup',
	row: 'row',
	rowheader: 'rowheader',
	scrollbar: 'scrollbar',
	searchbox: 'searchbox',
	separator: 'separator',
	slider: 'slider',
	spinbutton: 'spinbutton',
	status: 'status',
	switch: 'switch',
	tab: 'tab',
	table: 'table',
	tablist: 'tablist',
	tabpanel: 'tabpanel',
	textbox: 'textbox',
	timer: 'timer',
	tree: 'tree',
	treegrid: 'treegrid',
	treeitem: 'treeitem',
}

const STATES = {
	atomic: 'atomic',
	autocomplete: ['autocomplete', 'AutoComplete'],
    busy: 'busy',
	checked: 'checked',
	colcount: ['colcount', 'ColCount'],
	colindex: ['colindex', 'ColIndex'],
	colspan: ['colspan', 'ColSpan'],
    controls: 'controls',
    current: 'current',
    description: 'description',
	disabled: 'disabled',
	expanded: 'expanded',
	haspopup: ['haspopup', 'HasPopup'],
    hidden: 'hidden',
    keyshortcuts: ['keyshortcuts', 'KeyShortcuts'],
    label: 'label',
	level: 'level',
    live: 'live',
	modal: 'modal',
	multiline: ['multiline', 'MultiLine'],
	multiselectable: ['multiselectable', 'MultiSelectable'],
	orientation: 'orientation',
	placeholder: 'placeholder',
	posinset: ['posinset', 'PosInSet'],
	pressed: 'pressed',
	readonly: ['readonly', 'ReadOnly'],
	relevant: 'relevant',
	required: 'required',
    roledescription: ['roledescription', 'RoleDescription'],
	rowcount: ['rowcount', 'RowCount'],
	rowindex: ['rowindex', 'RowIndex'],
	rowspan: ['rowspan', 'RowSpan'],
	selected: 'selected',
	setsize: ['setsize', 'SetSize'],
	sorted: 'sorted',
	valuemax: ['valuemax', 'ValueMax'],
	valuemin: ['valuemin', 'ValueMin'],
    valuenow: ['valuenow', 'ValueNow'],
    valuetext: ['valuetext', 'ValueText'],
}

const ENUM_TRISTATE = ['false', 'mixed', 'true']
const ENUM_CURRENT = ['date', 'false', 'location', 'page', 'step', 'time', 'true']
// const ENUM_INVALID = ['false', 'grammar', 'spelling', 'true']

const ROLES_CHECKED = [
	ROLES.checkbox,
	ROLES.menuitemcheckbox,
	ROLES.menuitemradio,
	ROLES.option,
	ROLES.radio,
	ROLES.switch,
	ROLES.treeitem
]

const ROLES_EXPANDED = [
	ROLES.application,
	ROLES.button,
	ROLES.checkbox,
	ROLES.columnheader,
	ROLES.combobox,
	ROLES.gridcell,
	ROLES.link,
	ROLES.listbox,
	ROLES.menuitem,
	ROLES.menuitemcheckbox,
	ROLES.menuitemradio,
	ROLES.row,
	ROLES.rowheader,
	ROLES.switch,
	ROLES.tab,
	ROLES.treeitem
]

/* const ROLES_INVALID = [
	ROLES.application,
	ROLES.checkbox,
	ROLES.columnheader,
	ROLES.combobox,
	ROLES.gridcell,
	ROLES.listbox,
	ROLES.radiogroup,
	ROLES.rowheader,
	ROLES.searchbox,
	ROLES.slider,
	ROLES.spinbutton,
	ROLES.switch,
	ROLES.textbox,
	ROLES.tree,
	ROLES.treegrid,
] */

/* const ROLES_LIVE = [
	ROLES.alert,
	ROLES.log,
	ROLES.marquee,
	ROLES.status,
	ROLES.timer,
] */

const ROLES_SELECTED = [
	ROLES.columnheader,
	ROLES.gridcell,
	ROLES.option,
	ROLES.row,
    ROLES.rowheader,
	ROLES.tab,
	ROLES.treeitem,
]

/* === Internal Functions === */

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const getPair = (internal: string | string[]) => {
	if (Array.isArray(internal)) return internal
	return [internal, ARIA_PREFIX + capitalize(internal)]
}

const hasRole = (role: string, allowedRoles: string[]) =>
	allowedRoles.includes(role)

const validateRole = (
	role: string,
	allowedRoles: string[],
	host: UIElement,
	key: string
) => {
	if (hasRole(role, allowedRoles)) return true
	log(role, `Role for ${elementName(host)} does not support aria-${key}. Use one of ${valueString(allowedRoles)}`, LOG_WARN)
	return false
}

const booleanInternal = (
	host: UIElement,
	state: string | string[],
	allowedRoles?: string[]
): boolean => {
	const role = host.role
    const [key, prop] = getPair(state)
	if (Array.isArray(allowedRoles) && !validateRole(role, allowedRoles, host, key))
		return false
    toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host)
    return true
}

const stringInternal = (
	host: UIElement,
	state: string | string[],
	parser: AttributeParser<string>,
	allowedRoles?: string[]
) => {
	const role = host.role
    const [key, prop] = getPair(state)
	if (Array.isArray(allowedRoles) && !validateRole(role, allowedRoles, host, key))
		return false
    setInternal(key, `${ARIA_PREFIX}${prop}`, parser)(host)
    return true
}

/* === Exported Functions === */

/**
 * Auto-effect for setting internals of a Web Component according to a given state
 * 
 * @since 0.9.0
 * @param {StateLike<T>} state - state bounded to the element internal
 * @param {InternalsUpdater<E, T>} updater - updater object containing key, read, update, and delete methods
 */
const updateInternal = <E extends UIElement, T>(
	state: StateLike<T>,
	updater: InternalUpdater<E, T>,
) => (host: E): void => {
	if (!host.internals) return
	const { key, parser, initial, read, update } = updater
	const proto = host.constructor as typeof UIElement
	proto.attributeMap[key] = parser
	host.set(state, initial(host), false)
	effect((enqueue: Enqueue) => {
		const current = read(host)
		const value = isFunction(state) ? state(current) : host.get<T>(state)
		const action = isNullish(value) && updater.delete
			? updater.delete
			: update(value)
		if (!Object.is(value, current)) enqueue(host, key, action)
	})
}

/**
 * Toggle an internal state of an element based on given state
 * 
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const toggleInternal = <E extends UIElement>(
	name: string,
	ariaProp?: string
) => updateInternal(name, {
	key: `i-${name}`,
	parser: asBoolean,
	initial:  (el: E) => el.hasAttribute(name),
    read: (el: E) => el.internals.states.has(name),
    update: (value: boolean) => (el: E) =>
		() => {
			el.internals.states[value ? 'add' : 'delete'](name)
			if (ariaProp) {
				el.internals[ariaProp] = String(value)
				el.setAttribute(`${ARIA_PREFIX}-${name}`, String(value))
			}
			el.toggleAttribute(name, value)
		}
})

/**
 * Set ElementInternals ARIA property and attribute based on given state
 * 
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const setInternal = <E extends UIElement>(
	name: string,
	ariaProp: string,
	parser: AttributeParser<unknown>
) => updateInternal(name, {
	key: `i-${name}`,
	parser,
    initial:  (el: E) => el.getAttribute(`aria-${name}`),
    read: (el: E) => parse(el, name, el.internals[ariaProp]),
    update: (value: any) => (el: E) =>
        () => {
			el.internals[ariaProp] = value
			el.setAttribute(`${ARIA_PREFIX}-${name}`, value)
		},
	delete: (el: E) => () => {
        el.internals[ariaProp] = undefined
        el.removeAttribute(`${ARIA_PREFIX}-${name}`)
    }
})

/**
 * Use element internals; will setup the global disabled and hidden states if they are observed attributes
 */
const useInternals = (host: UIElement): boolean => {
	if (!host.internals) host.internals = host.attachInternals()
	const proto = host.constructor as typeof UIElement
	const map = new Map<string, ((host: UIElement) => boolean)>([
        [STATES.busy, useBusy],
		[STATES.current, useCurrent],
		[STATES.disabled, useDisabled],
        [STATES.hidden, useHidden],
	])
	const role = host.role
	if (ROLES_CHECKED.includes(role)) map.set(STATES.checked, useChecked)
	if (ROLES_EXPANDED.includes(role)) map.set(STATES.expanded, useExpanded)
	if (role === ROLES.button) map.set(STATES.pressed, usePressed)
	if (ROLES_SELECTED.includes(role)) map.set(STATES.selected, useSelected)
	for (const [attr, hook] of map) {
		if (proto.observedAttributes.includes(attr)) hook(host)
	}
	return true
}

/**
 * Use a busy state for a live region and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the busy state was successfully setup
 */
const useBusy = (host: UIElement): boolean => {
	host.internals.ariaLive = 'polite'
	return booleanInternal(host, STATES.busy)
}

/**
 * Use a checked state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @param {boolean} [isTriState=false] - whether to support tri-state checked state
 * @returns {boolean} - whether the checked state was successfully setup
 */
const useChecked = (host: UIElement, isTriState: boolean = false): boolean => {
	const role = host.role
	const [key, prop] = getPair(STATES.checked)
	if (!validateRole(role, ROLES_CHECKED, host, key)) return false
	const allowsTriState = [ROLES.checkbox, ROLES.menuitemcheckbox, ROLES.option]
	if (isTriState && !hasRole(role, allowsTriState) && isTriState) {
		log(role, `Role for ${elementName(host)} does not support tri-state aria-checked. Use one of ${valueString(allowsTriState)} instead.`, LOG_WARN)
		isTriState = false
	}
	if (isTriState) setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host)
	else toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host)
	return true
}

const useCurrent = (host: UIElement, isEnumState: boolean = false): boolean => {
	if (isEnumState) stringInternal(host, STATES.current, asEnum(ENUM_CURRENT))
	else booleanInternal(host, STATES.current)
	return true
}

/**
 * Use a disabled state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the disabled state was successfully setup
 */
const useDisabled = (host: UIElement): boolean =>
	booleanInternal(host, STATES.disabled)

/**
 * Use an expanded state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the expanded state was successfully setup
 */
const useExpanded = (host: UIElement): boolean =>
	booleanInternal(host, STATES.expanded, ROLES_EXPANDED)

/**
 * Use a hidden state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the hidden state was successfully setup
 */
const useHidden = (host: UIElement): boolean =>
	booleanInternal(host, STATES.hidden)

/**
 * Use an invalid state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the invalid state was successfully setup
 ** /
const useInvalid = (host: UIElement): boolean => {
	log(host, 'Invalid state is not yet supported.', LOG_WARN)
	// Implementation pending - we need to use checkValidity() / setValidity() instead of boolean internal
	return false
} */

/**
 * Use a pressed state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the pressed state was successfully setup
 */
const usePressed = (host: UIElement, isTriState: boolean = false): boolean => {
    const role = host.role
    const [key, prop] = getPair(STATES.pressed)
	if (!validateRole(role, [ROLES.button], host, key)) return false
    if (isTriState) setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host)
	else toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host)
    return true
}

/**
 * Use a selected state and sync it with element internals and aria properties
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement
 * @returns {boolean} - whether the selected state was successfully setup
 */
const useSelected = (host: UIElement): boolean =>
	booleanInternal(host, STATES.selected, ROLES_SELECTED)

export {
	toggleInternal, setInternal, useBusy, useChecked, useCurrent, useInternals,
	useDisabled, useExpanded, useHidden, usePressed, useSelected,
}