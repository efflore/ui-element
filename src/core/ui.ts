import type { UIElement } from '../ui-element'
import { isObjectOfType } from './is-type'
import { maybe, ok } from './maybe'

/* === Types === */

type UI<T> = {
	readonly [Symbol.toStringTag]: string
	host: UIElement
    target: T
}

/* === Constants === */

const TYPE_UI = 'UI'

/* === Exported Functions === */

const ui = (host: UIElement, target: Element = host) => ({
	[Symbol.toStringTag]: TYPE_UI,
	host,
	target
})

const isUI = (value: unknown): value is UI<unknown> =>
	isObjectOfType(value, TYPE_UI)

const self = (host: UIElement) =>
	ok(ui(host))

const first = (host: UIElement) => (selector: string) => 
	maybe(host.root.querySelector(selector)).map((target: Element) => ui(host, target))

const all = (host: UIElement) => (selector: string) =>
	Array.from(host.root.querySelectorAll(selector)).map(target => ui(host, target))

export { type UI, ui, isUI, self, first, all }