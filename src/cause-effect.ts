import { isFunction, isNullish, isObjectOfType } from './core/is-type'
import { log, LOG_ERROR } from './core/log'
import { type Enqueue, scheduler } from './core/scheduler'

/* === Types === */

type State<T> = {
	readonly [Symbol.toStringTag]: string
	get(): T
	set(value: T): void
}

type Computed<T> = {
	readonly [Symbol.toStringTag]: string
	get(): T
}

type Signal<T> = State<T> | Computed<T>
type Effect = () => void

type MaybeCleanup = void | (() => void)

type EffectCallback = (enqueue: Enqueue) => MaybeCleanup

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
	try {
		fn()
	} catch (error) {
		log(error, 'Error during reactive computation', LOG_ERROR)
	} finally {
		active = prev
	}
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
		}
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
		}
	}
}

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: EffectCallback) => {
	const run = () => reactive(() => {
		const cleanupFn = fn(enqueue)
		if (isFunction(cleanupFn)) cleanup(fn, cleanupFn)
	}, run)
	run()
}

export {
	type State, type Computed, type Signal, type Effect,
	isState, isComputed, isSignal, state, computed, effect
}
