import { isFunction, isNullish } from '../core/is-type'
import { parse } from '../core/parse'
import { effect } from '../core/cause-effect'
import type { StateLike, UIElement } from '../ui-element'
import type { Enqueue } from '../core/scheduler'
import { asBoolean, asInteger, asNumber } from './parse-attribute'

/* === Types === */

type InternalUpdater<E extends UIElement, T> = {
	key: string,
	initial: (element: E) => T,
    read: (element: E) => T,
    update: (value: T) => (element: E) => () => void
	delete?: (element: E) => () => void
}

/* === Constants === */

const ARIA_PREFIX = 'aria'

const ROLES = {
	button: 'button',
	checkbox: 'checkbox',
	combobox: 'combobox',
	dialog: 'dialog',
	grid: 'grid',
	gridcell: 'gridcell',
	heading: 'heading',
	link: 'link',
	listbox: 'listbox',
	listitem: 'listitem',
	menuitem: 'menuitem',
	menuitemcheckbox: 'menuitemcheckbox',
	menuitemradio: 'menuitemradio',
	option: 'option',
	progressbar: 'progressbar',
	radio: 'radio',
	range: 'range',
	row: 'row',
	scrollbar: 'scrollbar',
	separator: 'separator',
	slider: 'slider',
	spinbutton: 'spinbutton',
	switch: 'switch',
	tab: 'tab',
	table: 'table',
	tabpanel: 'tabpanel',
	textbox: 'textbox',
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
	updater: InternalUpdater<E, T>
) => (host: E): void => {
	if (!host.internals) return
	const { key, initial, read, update } = updater
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
	ariaProp: string
) => updateInternal(name, {
	key: `i-${name}`,
    initial:  (el: E) => el.getAttribute(name),
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
 * Synchronize internal states of an element with corresponding HTML attributes and aria properties
 * 
 * @param host host UIElement to sync internals
 */
const syncInternals = (host: UIElement) => {
	const proto = host.constructor as typeof UIElement
	if (!proto.observedAttributes) return

	const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
	const addInternals = (
		map: Map<string, string>,
		internals: (string | string[])[]
	) => internals.forEach((internal: string | string[]) =>
		Array.isArray(internal)
			? map.set(internal[0], internal[1])
			: internal && map.set(internal, capitalize(internal))
	)
	const hasRole = (role: string, allowedRoles: string[]) =>
		allowedRoles.includes(role)
	const isAutocompletable = (role: string) => hasRole(role, [
		ROLES.combobox,
		ROLES.textbox
	])
	const isCheckable = (role: string) => hasRole(role, [
		ROLES.checkbox,
		ROLES.menuitemcheckbox,
		ROLES.menuitemradio,
        ROLES.radio,
        ROLES.switch
	])
	const isExpandable = (role: string) => hasRole(role, [
		ROLES.button,
		ROLES.combobox,
		ROLES.grid,
		ROLES.link,
		ROLES.listbox,
		ROLES.menuitem,
		ROLES.row,
		ROLES.tabpanel,
		ROLES.treeitem
	])
	const isMultiSelectable = (role: string) => hasRole(role, [
		ROLES.listbox,
        ROLES.grid,
        ROLES.table,
        ROLES.tree,
	])
	const isPressable = (role: string) => hasRole(role, [
		ROLES.button,
        ROLES.switch,
	])
	const isSelectable = (role: string) => hasRole(role, [
		ROLES.gridcell,
        ROLES.listitem,
        ROLES.option,
        ROLES.tab,
		ROLES.treeitem
	])
	const isTabular = (role: string) => hasRole(role, [
		ROLES.grid,
		ROLES.table,
		ROLES.treegrid,
	])
	const maybeReadOnly = (role: string) => hasRole(role, [
		ROLES.gridcell,
        ROLES.spinbutton,
		ROLES.textbox,
	])
	const maybeRequired = (role: string) => hasRole(role, [
        ROLES.combobox,
		ROLES.listbox,
        ROLES.gridcell,
        ROLES.spinbutton,
		ROLES.textbox,
	])
	const mayHavePopup = (role: string) => hasRole(role, [
		ROLES.button,
		ROLES.link,
		ROLES.menuitem,
		ROLES.combobox,
		ROLES.gridcell,
	])
	const hasLevel = (role: string) => hasRole(role, [
		ROLES.heading,
		ROLES.listitem,
		ROLES.treeitem,
	])
	const hasOrientation = (role: string) => hasRole(role, [
		ROLES.tabpanel,
		ROLES.progressbar,
		ROLES.scrollbar,
		ROLES.separator,
		ROLES.slider,
	])
	const hasPosInSet = (role: string) => hasRole(role, [
		ROLES.listitem,
		ROLES.treeitem,
	])
	const hasSetSize = (role: string) => hasRole(role, [
		ROLES.listitem,
		ROLES.option,
		ROLES.row,
		ROLES.tab,
		ROLES.treeitem,
	])
	const hasNumericValue = (role: string) => hasRole(role, [
		ROLES.range,
		ROLES.progressbar,
		ROLES.slider,
		ROLES.spinbutton,
	])

	if (!host.internals) host.internals = host.attachInternals()
	const role = host.role

	const bools = new Map<string, string>([])
	addInternals(bools, [
		STATES.disabled, STATES.hidden,
		hasRole(role, [ROLES.dialog]) && STATES.modal,
		hasRole(role, [ROLES.textbox]) && STATES.multiline,
		isMultiSelectable(role) && STATES.multiselectable,
		maybeReadOnly(role) && STATES.readonly,
		maybeRequired(role) && STATES.required,
		isSelectable(role) && STATES.selected,
		hasNumericValue(role) && STATES.valuetext,
	])

	const numbers = new Map<string, string>()
	if (hasLevel(role)) addInternals(numbers, [STATES.level])
	if (hasPosInSet(role)) addInternals(numbers, [STATES.posinset])
	if (hasSetSize(role)) addInternals(numbers, [STATES.setsize])
	if (isTabular(role)) addInternals(numbers, [
		STATES.colcount,
		STATES.colindex,
		STATES.colspan,
		STATES.rowcount,
		STATES.rowspan,
		STATES.rowindex,
	])
	if (hasNumericValue(role)) addInternals(numbers, [
		STATES.valuemax,
		STATES.valuemin,
		STATES.valuenow
	])

	const strings = new Map<string, string>()
	addInternals(strings, [
		isAutocompletable(role) && STATES.autocomplete,
        STATES.controls,
		STATES.description,
		isExpandable(role) && STATES.expanded,
		STATES.keyshortcuts,
        STATES.label,
		hasOrientation(role) && STATES.orientation,
		hasRole(role, [ROLES.textbox]) && STATES.placeholder,
		role && STATES.roledescription,
		isTabular(role) && STATES.sorted,
	])

	// Conditional on whether parsed as boolean
	addInternals(
		proto.attributeMap[STATES.current] === asBoolean ? bools : strings,
		[STATES.current]
	)
	if (isCheckable(role)) addInternals(
		proto.attributeMap[STATES.checked] === asBoolean ? bools : strings,
		[STATES.checked]
	)
	if (mayHavePopup(role)) addInternals(
        proto.attributeMap[STATES.haspopup[0]] === asBoolean ? bools : strings,
        [STATES.haspopup]
    )
	if (isPressable(role)) addInternals(
        proto.attributeMap[STATES.pressed] === asBoolean ? bools : strings,
        [STATES.pressed]
    )

	// Conditional on aria-live attribute
	if (host.hasAttribute(`${ARIA_PREFIX}-${STATES.live}`)) {
		addInternals(bools, [STATES.atomic, STATES.busy])
		addInternals(strings, [STATES.live, STATES.relevant])
	}

	for (const attr of proto.observedAttributes) {
		if (numbers.has(attr)) {
			if (!Object.hasOwn(proto.attributeMap, attr))
				proto.attributeMap[attr] = attr.slice(0, 5) === 'value'
					? asNumber
					: asInteger
			setInternal(attr, `${ARIA_PREFIX}${numbers.get(attr)}`)(host)
		} else if (strings.has(attr)) {
			setInternal(attr, `${ARIA_PREFIX}${strings.get(attr)}`)(host)
		} else if (bools.has(attr)) {
			if (!Object.hasOwn(proto.attributeMap, attr))
				proto.attributeMap[attr] = asBoolean
            toggleInternal(attr, `${ARIA_PREFIX}${bools.get(attr)}`)(host)
		}
	}

}

export { syncInternals, toggleInternal, setInternal }