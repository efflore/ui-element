import { isFunction, hasMethod, isDefinedObject } from './lib/is-type'

/* === Types === */

interface UIEffect {
  (): void
  // type: symbol
  run(): void
  targets?: Map<Element, Set<() => void>>
}

interface UIComputed<T> extends UIEffect {
  (): T
  effects: Set<UIEffect | UIComputed<unknown>>
}

interface UIState<T> {
  (): T
  // type: symbol
  effects: Set<UIEffect | UIComputed<unknown>>
  set(value: T): void
}

type UISignal<T> = UIState<T> | UIComputed<T>

type UIDOMInstructionQueue = (
  element: Element,
  fn: () => void
) => void

type MaybeCleanup = void | (() => void)

type UIEffectCallback = (enqueue: UIDOMInstructionQueue) => MaybeCleanup

/* === Internal === */

// hold the currently active effect
let active: UIEffect | undefined

/**
 * Run all effects in the provided set
 * 
 * @param {Set<UIEffect | UIComputed<unknown>>} effects 
 */
const autorun = (effects: Set<UIEffect | UIComputed<unknown>>) => {
  for (const effect of effects) effect.run()
}

/* === Exported functions === */

/**
 * Check if a given variable is a reactive state
 * 
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value: unknown): value is UIState<unknown> =>
  isDefinedObject(value) && hasMethod(value, 'set')

/**
 * Check if a given variable is a reactive computed state
 * 
 * @param {unknown} value - variable to check if it is a reactive computed state
 */
const isComputed = (value: unknown): value is UIComputed<unknown> =>
  isDefinedObject(value) && hasMethod(value, 'run') && 'effects' in value

/**
 * Check if a given variable is a reactive signal (state or computed state)
 * 
 * @param {unknown} value - variable to check if it is a reactive signal
 */
const isSignal = (value: unknown): value is UISignal<unknown> =>
  isState(value) || isComputed(value)

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<T>} getter function for the current value with a `set` method to update the value
 */
const cause = <T>(value: any): UIState<T> => {
  const s: UIState<T> = (): T => { // getter function
    if (active) s.effects.add(active)
    return value
  }
  // s.type = TYPE_STATE
  s.effects = new Set<UIEffect | UIComputed<unknown>>() // set of listeners
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
const derive = <T>(fn: () => T, memo: boolean = false): UIComputed<T> => {
  let value: T
  let dirty = true
  const c = () => {
    if (active) c.effects.add(active)
    if (memo && !dirty) return value
    const prev = active
    active = c
    value = fn()
    dirty = false
    active = prev
    return value
  }
  // c.type = TYPE_COMPUTED
  c.effects = new Set<UIEffect | UIComputed<unknown>>(); // set of listeners
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
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: UIEffectCallback) => {
  const targets = new Map<Element, Set<() => void>>()
  const n = () => {
    const prev = active
    active = n
    const cleanup = fn((element: Element, domFn: () => void): void => {
      if (!targets.has(element)) targets.set(element, new Set<() => void>())
      targets.get(element)?.add(domFn)
    })
    for (const domFns of targets.values()) {
      for (const domFn of domFns) domFn()
      domFns.clear()
    }   
    active = prev
    if (isFunction(cleanup)) queueMicrotask(cleanup)
  }
  // n.type = TYPE_EFFECT
  n.run = () => n()
  n.targets = targets
  n()
}

export {
  type UIState, type UIComputed, type UISignal, type UIEffect, type UIDOMInstructionQueue,
  isState, isSignal, cause, derive, effect
}
