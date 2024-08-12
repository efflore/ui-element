import { isFunction, hasMethod, isDefinedObject } from './core/is-type'
import type { IO } from './core/io'

/* === Types === */

interface Effect {
  (): void
  run(): void
  targets?: Map<Element, Set<IO<void>>>
}

interface Computed<T> extends Effect {
  (): T
  effects: Set<Effect | Computed<unknown>>
}

interface State<T> {
  (): T
  effects: Set<Effect | Computed<unknown>>
  set(value: T): void
}

type Signal<T> = State<T> | Computed<T>

type DOMInstructionQueue = (
  element: Element,
  fn: IO<unknown>
) => void

type MaybeCleanup = void | (() => void)

type EffectCallback = (enqueue: DOMInstructionQueue) => MaybeCleanup

/* === Internal === */

// hold the currently active effect
let activeEffect: Effect | undefined

/**
 * Run all effects in the provided set
 * 
 * @param {Set<Effect | Computed<unknown>>} effects 
 */
const autorun = (effects: Set<Effect | Computed<unknown>>) => {
  for (const effect of effects) effect.run()
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
 * Check if a given variable is a reactive computed state
 * 
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value: unknown): value is Computed<unknown> =>
  isDefinedObject(value) && hasMethod(value, 'run') && 'effects' in value

/**
 * Check if a given variable is a reactive signal (state or computed state)
 * 
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value: unknown): value is Signal<unknown> =>
  isState(value) || isComputed(value)

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {State<T>} getter function for the current value with a `set` method to update the value
 */
const cause = <T>(value: any): State<T> => {
  const s: State<T> = (): T => { // getter function
    if (activeEffect) s.effects.add(activeEffect)
    return value
  }
  s.effects = new Set<Effect | Computed<unknown>>() // set of listeners
  s.set = (updater: unknown | ((value: T) => unknown)) => { // setter function
    const old = value
    value = isFunction(updater) && !isSignal(updater) ? updater(value) : updater
    if (!Object.is(value, old)) autorun(s.effects)
  }
  return s
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
  let value: T
  let dirty = true
  const c = () => {
    if (activeEffect) c.effects.add(activeEffect)
    if (memo && !dirty) return value
    const prev = activeEffect
    activeEffect = c
    value = fn()
    dirty = false
    activeEffect = prev
    return value
  }
  c.effects = new Set<Effect | Computed<unknown>>(); // set of listeners
  c.run = () => {
    dirty = true
    if (memo) autorun(c.effects)
  }
  return c
}

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {EffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: EffectCallback) => {
  const targets = new Map<Element, Set<IO<void>>>()
  const n = () => {
    const prev = activeEffect
    activeEffect = n
    const cleanup = fn((element: Element, domFn: IO<void>): void => {
      if (!targets.has(element)) targets.set(element, new Set<IO<void>>())
      targets.get(element)?.add(domFn)
    })
    for (const domFns of targets.values()) {
      for (const domFn of domFns) domFn.run()
      domFns.clear()
    }   
    activeEffect = prev
    if (isFunction(cleanup)) queueMicrotask(cleanup)
  }
  n.run = () => n()
  n.targets = targets
  n()
}

export {
  type State, type Computed, type Signal, type Effect, type DOMInstructionQueue,
  isState, isSignal, cause, derive, effect
}
