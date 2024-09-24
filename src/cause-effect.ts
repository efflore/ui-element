import { isFunction, hasMethod, isDefinedObject } from './core/is-type'
import { log, LOG_ERROR } from './core/log'
import scheduler from './core/scheduler'

/* === Types === */

type State<T> = {
	(): T
	set(value: T): void
}

type Computed<T> = () => T

type Effect = () => void

type Signal<T> = State<T> | Computed<T>

type DOMInstruction = (
	element: Element,
	prop: string,
	callback: (element: Element) => () => void
) => void

type MaybeCleanup = void | (() => void)

type EffectCallback = (enqueue: DOMInstruction) => MaybeCleanup

/* === Internal === */

const { enqueue, cleanup } = scheduler()

// hold the currently active effect
let active: () => void | undefined

// hold schuduler instance
// const { enqueue, cleanup } = scheduler()

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


const reactive = (fn: () => void, notify: () => void) => {
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

/* === Exported functions === */

/**
 * Check if a given variable is a reactive state
 * 
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value: unknown): value is State<unknown> =>
	isDefinedObject(value) && hasMethod(value, 'set')

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = <T>(value: any): State<T> => {
	const targets = new Set<() => void>()
	const state: State<T> = (): T => { // getter function
		autotrack(targets)
		return value
	}
	state.set = (updater: unknown | ((value: T) => unknown)) => { // setter function
		const old = value
		value = isFunction(updater) && !isState(updater) ? updater(value) : updater
		if (!Object.is(value, old)) autorun(targets)
	}
	return state
}

/**
 * Create a derived state from an existing state
 * 
 * @since 0.1.0
 * @param {() => T} fn - existing state to derive from
 * @param {boolean} [memo=false] - whether to use memoization
 * @returns {UIComputed<T>} derived state
 */
const derive = <T>(fn: () => T, memo: boolean = false): Computed<T> => {
	const targets = new Set<() => void>()
	let value: T
	let stale = true
	return () => {
		autotrack(targets)
		if (!memo || stale) {
			reactive(() => {
				value = fn()
				stale = false
			}, () => {
				stale = true
				if (memo) autorun(targets)
			})
		}
		return value
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
	type State, type Computed, type Signal, type Effect, type DOMInstruction,
	isState, cause, derive, effect
}
