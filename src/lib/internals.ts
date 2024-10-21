import { isDefined } from '../core/is-type'
import { parse } from '../core/parse'
import { effect } from '../core/cause-effect'
import type { UIElement } from '../ui-element'
import type { Enqueue } from '../core/scheduler'
import { asBoolean, asInteger, asNumber } from './parse-attribute'

/* === Exported Functions === */

/**
 * Toggle an internal state of an element based on given state
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const toggleInternal = <E extends UIElement>(host: E, name: string, ariaProp?: string) => {
	if (!host.internals) return
	host.set(name, host.hasAttribute(name), false)
	effect((enqueue: Enqueue) => {
		const current = host.internals.states.has(name)
		const value = host.get(name)
		if (!Object.is(value, current)) {
			enqueue(host, `i-${name}`, value
				? (el: UIElement) => () => {
					el.internals.states.add(name)
					if (ariaProp) {
						el.internals[ariaProp] = 'true'
						el.setAttribute(`aria-${name}`, 'true')
					}
					el.toggleAttribute(name, true)
				}
				: (el: UIElement) => () => {
					el.internals.states.delete(name)
					if (ariaProp) {
						el.internals[ariaProp] = 'false'
						el.setAttribute(`aria-${name}`, 'false')
					}
					el.toggleAttribute(name, false)
				}
			)
		}
	})
}

/**
 * Set ElementInternals ARIA property and attribute based on given state
 * 
 * @since 0.9.0
 * @param {UIElement} host - host UIElement to update internals
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 */
const setInternal = <E extends UIElement>(host: E, name: string, ariaProp: string) => {
	if (!host.internals) return
	host.set(name, parse(host, name, host.getAttribute(name)), false)
	effect((enqueue: Enqueue) => {
		const current = host.internals[ariaProp]
		const value = String(host.get(name))
		if (value!== current) {
			enqueue(host, `i-${name}`, isDefined(value)
				? (el: UIElement) => () => {
					el.internals[ariaProp] = value
					el.setAttribute(`aria-${name}`, value)
				}
				: (el: UIElement) => () => {
					el.internals[ariaProp] = undefined
					el.removeAttribute(`aria-${name}`)
				}
			)
		}
	})
}

/**
 * Synchronize internal states of an element with corresponding HTML attributes and aria properties
 * 
 * @param host host UIElement to sync internals
 */
const syncInternals = (host: UIElement) => {
	if (!host.internals) host.internals = host.attachInternals()
	const proto = host.constructor as typeof UIElement
	const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
	const addInternals = (map: Map<string, string>, internals: string[]) =>
		internals.forEach((internal: string) => map.set(internal, capitalize(internal)))

	const role = host.role

	const boolInternals = new Map<string, string>([])
	addInternals(boolInternals, [
		'disabled',
		'hidden',
	])

	const numberInternals = new Map<string, string>()

	const stringInternals = new Map<string, string>([
		['keyshortcuts', 'KeyShortcuts'],
	])
	addInternals(stringInternals, [
        'controls',
		'description',
        'label',
	])

	addInternals(proto.attributeMap['current'] === asBoolean ? boolInternals : stringInternals, ['current'])
	if (role) stringInternals.set('roledescription', 'RoleDescription')
	if (host.hasAttribute('aria-live')) {
		addInternals(boolInternals, ['atomic', 'busy'])
		addInternals(stringInternals, ['live', 'relevant'])
	}
	if (['textbox', 'combobox'].includes(role))
		stringInternals.set('autocomplete', 'AutoComplete')
	if (['checkbox', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'].includes(role))
		addInternals(proto.attributeMap['checked'] === asBoolean ? boolInternals : stringInternals, ['checked'])
	if (['table', 'grid', 'treegrid'].includes(role)) {
		numberInternals.set('colcount', 'ColCount')
		numberInternals.set('colindex', 'ColIndex')
		numberInternals.set('colspan', 'ColSpan')
		numberInternals.set('rowcount', 'RowCount')
		numberInternals.set('rowindex', 'RowIndex')
		numberInternals.set('rowspan', 'RowSpan')
	}
	if (['button', 'link', 'treeitem', 'grid', 'row', 'listbox', 'tabpanel', 'menuitem', 'combobox'].includes(role))
		addInternals(boolInternals, ['expanded'])
	if (['button', 'link', 'menuitem', 'combobox', 'gridcell'].includes(role))
        (proto.attributeMap['haspopup'] === asBoolean ? boolInternals : stringInternals).set('haspopup', 'HasPopup')
	if (['heading', 'treeitem', 'listitem'].includes(role))
    	numberInternals.set('level', 'Level')
	if (role === 'dialog') boolInternals.set('modal', 'Modal')
	if (role === 'textbox') {
		boolInternals.set('multiline', 'MultiLine')
		stringInternals.set('placeholder', 'Placeholder')
	}
	if (['listbox', 'grid', 'table', 'tree'].includes(role))
		boolInternals.set('multiselectable', 'MultiSelectable')
	if (['scrollbar', 'slider', 'separator', 'progressbar', 'tabpanel'].includes(role))
        stringInternals.set('orientation', 'Orientation')
	if (['listitem', 'treeitem'].includes(role))
		numberInternals.set('posinset', 'PosInSet')
	if (['button', 'switch'].includes(role))
		addInternals(proto.attributeMap['pressed'] === asBoolean ? boolInternals : stringInternals, ['pressed'])
	if (['textbox', 'gridcell', 'spinbutton'].includes(role))
		boolInternals.set('readonly', 'ReadOnly')
	if (['textbox', 'gridcell', 'spinbutton', 'combobox', 'listbox'].includes(role))
		boolInternals.set('required', 'Required')
	if (['gridcell', 'listitem', 'option', 'tab', 'treeitem'].includes(role))
		boolInternals.set('selected', 'Selected')
	if (['listitem', 'treeitem', 'option', 'row', 'tab'].includes(role))
		numberInternals.set('setsize', 'SetSize')
	if (['grid', 'treegrid', 'table'].includes(role))
        stringInternals.set('sorted', 'Sorted')
	if (['range', 'progressbar', 'slider', 'spinbutton'].includes(role)) {
        numberInternals.set('valuemax', 'ValueMax')
        numberInternals.set('valuemin', 'ValueMin')
        numberInternals.set('valuenow', 'ValueNow')
		stringInternals.set('valuetext', 'ValueText')
    }

	if (!proto.observedAttributes) return
	for (const attr of proto.observedAttributes) {
		if (numberInternals.has(attr)) {
			if (!Object.hasOwn(proto.attributeMap, attr))
				proto.attributeMap[attr] = attr.slice(0, 5) === 'value' ? asNumber : asInteger
			setInternal(host, attr, `aria${numberInternals.get(attr)}`)
		} else if (stringInternals.has(attr)) {
			setInternal(host, attr, `aria${stringInternals.get(attr)}`)
		} else if (boolInternals.has(attr)) {
			if (!Object.hasOwn(proto.attributeMap, attr))
				proto.attributeMap[attr] = asBoolean
            toggleInternal(host, attr, `aria${boolInternals.get(attr)}`)
		}
	}

}

export { syncInternals, toggleInternal, setInternal }