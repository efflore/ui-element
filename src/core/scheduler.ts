import type { Effect } from '../cause-effect';
import { log, LOG_ERROR } from './log';

/* === Exported Function === */

const scheduler = () => {
  const effectQueue = new Map()
  const cleanupQueue = new Map()
  let requestId: number

  const requestTick = () => {
    if (requestId) cancelAnimationFrame(requestId)
    requestId = requestAnimationFrame(flush)
  }

  const enqueue = (element: Element, prop: string, fn: (element: Element) => () => void) => {
    if (!effectQueue.has(element)) effectQueue.set(element, new Map())
    const elEffects = effectQueue.get(element)
    if (!elEffects.has(prop)) elEffects.set(prop, fn)
    requestTick()
  }

  const cleanup = (effect: Effect, fn: () => void) => {
    if (!cleanupQueue.has(effect)) cleanupQueue.set(effect, fn)
    requestTick()
  }

  const run = (fn: () => void, msg: string) => {
    try {
      fn()
    } catch (reason) {
      log(reason, msg, LOG_ERROR)
    }
  }

  const flush = () => {
    requestId = null
    for (const [el, elEffect] of effectQueue) {
      for (const [prop, fn] of elEffect)
        run(fn(el), ` Effect ${prop} on ${el?.localName || 'unknown'} failed`)
    }
    effectQueue.clear();
    for (const fn of cleanupQueue.values())
      run(fn, 'Cleanup failed')
    cleanupQueue.clear()
  }
  queueMicrotask(flush) // initial flush when the call stack is empty

  return { enqueue, cleanup }
}

export default scheduler
