import { isFunction, isNullish, isObjectOfType } from './is-type'
import { log, LOG_ERROR } from './log'
import { TYPE_FAIL, maybe, result, match } from './maybe'
import { type Enqueue, scheduler } from './scheduler'

/* === Types === */

type State<T> = {
	readonly [Symbol.toStringTag]: string
	get(): T
	set(value: T): void
	get targets(): Array<() => void>
}

type Computed<T> = {
	readonly [Symbol.toStringTag]: string
	get(): T
	get targets(): Array<() => void>
}

type Signal<T> = State<T> | Computed<T>

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type EffectCallback = (enqueue: Enqueue) => void | Function

/* === Constants === */

const TYPE_STATE = 'State'
const TYPE_COMPUTED = 'Computed'

/* === Internal === */

// hold the currently active effect
let active: () => void | undefined

// hold schuduler instance
const { enqueue, cleanup } = scheduler()

/**
 * Add notify function of active listener to the set of listeners
 * 
 * @param {Set<() => void>} targets - set of current listeners
 */
const autotrack = (targets: Set<() => void>) => {
	if (active) targets.add(active)
}

/**
 * Run all notify function of dependent listeners
 * 
 * @param {Set<() => void>} targets 
 */
const autorun = (targets: Set<() => void>) =>
	targets.forEach(notify => notify())


/**
 * Run a function in a reactive context
 * 
 * @param {() => void} fn - function to run the computation or effect
 * @param {() => void} notify - function to be called when the state changes
 */
const reactive = (fn: () => void, notify: () => void): void => {
	const prev = active
	active = notify
	const r = result(fn)
	match({
		[TYPE_FAIL]: error => log(error, 'Error during reactive computation', LOG_ERROR)
	})(r)
	active = prev
}

/* === Exported Functions === */

/**
 * Check if a given variable is a state signal
 * 
 * @since 0.7.0
 * @param {unknown} value - variable to check
 * @returns {boolean} true if supplied parameter is a state signal
 */
const isState = (value: unknown): value is State<unknown> =>
	isObjectOfType(value, TYPE_STATE)

const isComputed = (value: unknown): value is Computed<unknown> =>
	isObjectOfType(value, TYPE_COMPUTED)

const isSignal = (value: unknown): value is Signal<unknown> =>
	isState(value) || isComputed(value)

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const state = <T>(value: T): State<T> => {
	const targets = new Set<() => void>()
	return {
		[Symbol.toStringTag]: TYPE_STATE,
        get(): T | undefined {
			autotrack(targets)
			return value
		},
        set(updater: unknown | ((v: T | undefined) => T | undefined)): void {
			const old = value
			value = isFunction(updater) && updater.length ? updater(value) : updater
			if (!Object.is(value, old)) autorun(targets)
		},
		get targets() {
			return [...targets]
		},
	}
}

/**
 * Create a derived state from a existing states
 * 
 * @since 0.1.0
 * @param {() => T} fn - compute function to derive state
 * @returns {Computed<T>} result of derived state
 */
const computed = <T>(fn: () => T | undefined, memo: boolean = false): Computed<T> => {
	const targets = new Set<() => void>()
	let value: T | undefined
	let stale = true
	const notify = () => {
		stale = true
		if (memo) autorun(targets)
	}
	return {
        [Symbol.toStringTag]: TYPE_COMPUTED,
		get(): T | undefined {
			autotrack(targets)
			if (!memo || stale) reactive(() => {
				value = fn()
				stale = isNullish(value)
			}, notify)
			return value
		},
		get targets() {
			return [...targets]
		},
	}
}

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: EffectCallback) => {
	const run = () => reactive(
		() => maybe(fn(enqueue))
			.guard(isFunction)
			.map(cleanupFn => cleanup(fn, cleanupFn)),
		run
	)
	run()
}

export {
	type State, type Computed, type Signal, type EffectCallback,
	TYPE_STATE, TYPE_COMPUTED,
	isState, isComputed, isSignal, state, computed, effect
}
