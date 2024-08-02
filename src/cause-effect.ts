import { isFunction } from './is-type'

/* === Types === */

interface UIEffect {
  (): void
  run(): void
  targets?: Map<Element, Set<() => void>>
}

interface UIComputed<T> extends UIEffect {
  (): T
  effects: Set<UIEffect>
}

interface UIState<T> {
  (): T
  effects: Set<UIEffect>
  set(value: unknown): void
}

type UIDOMInstructionQueue = (
  element: Element,
  fn: () => void
) => void

type UIMaybeCleanup = void | (() => void)

type UIEffectCallback = (enqueue: UIDOMInstructionQueue) => UIMaybeCleanup

/* === Internal === */

// hold the currently active effect
let active: UIEffect | undefined

/**
 * Run all effects in the provided set
 * 
 * @param {Set<UIEffects>} effects 
 */
const autorun = (effects: Set<UIEffect>) => {
  for (const effect of effects)
    effect.run()
}

/* === Exported functions === */

/**
 * Check if a given variable is a reactive state
 * 
 * @param {unknown} value - variable to check if it is a reactive state
 * @returns {boolean} true if supplied parameter is a reactive state
 */
const isState = (value: unknown): value is UIState<unknown> => isFunction(value) && isFunction((value as UIState<unknown>).set)

/**
 * Define a reactive state
 * 
 * @since 0.1.0
 * @param {any} value - initial value of the state; may be a function for derived state
 * @returns {UIState<T>} getter function for the current value with a `set` method to update the value
 */
const cause = <T>(value: any): UIState<T> => {
  const state: UIState<T> = () => { // getter function
    active && state.effects.add(active)
    return value
  }
  state.effects = new Set<UIEffect>(); // set of listeners
  state.set = (updater: unknown) => { // setter function
    const old = value
    value = isFunction(updater) && !isState(updater)
      ? updater(old)
      : updater
    !Object.is(value, old) && autorun(state.effects)
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
const derive = <T>(fn: () => T, memo: boolean = false): UIComputed<T> => {
  let value: T
  let dirty = true
  const computed = () => {
    active && computed.effects.add(active)
    if (memo && !dirty) return value
    const prev = active
    active = computed
    value = fn()
    dirty = false
    active = prev
    return value
  }
  computed.effects = new Set<UIEffect>(); // set of listeners
  computed.run = () => {
    dirty = true
    memo && autorun(computed.effects)
  }
  return computed
}

/**
 * Define what happens when a reactive state changes
 * 
 * @since 0.1.0
 * @param {UIEffectCallback} fn - callback function to be executed when a state changes
 */
const effect = (fn: UIEffectCallback) => {
  const targets = new Map<Element, Set<() => void>>()
  const next = () => {
    const prev = active
    active = next
    const cleanup = fn((
      element: Element,
      domFn: () => void
    ): void => {
      !targets.has(element) && targets.set(element, new Set<() => void>())
      targets.get(element)?.add(domFn)
    })
    for (const domFns of targets.values()) {
      for (const domFn of domFns)
        domFn()
    }   
    active = prev
    isFunction(cleanup) && queueMicrotask(cleanup)
  }
  next.run = () => next()
  next.targets = targets
  next()
}

export { type UIState, type UIComputed, type UIEffect, type UIDOMInstructionQueue, isState, cause, derive, effect }
