import { attempt } from './attempt';
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

  const enqueue = (element: Element, prop: string, callback: () => void) => {
    if (!effectQueue.has(element)) effectQueue.set(element, new Map())
    const elEffects = effectQueue.get(element)
    if (!elEffects.has(prop)) elEffects.set(prop, callback)
    requestTick()
  }

  const cleanup = (element: Element, callback: () => void) => {
    if (!cleanupQueue.has(element)) cleanupQueue.set(element, callback)
    requestTick()
  }

  const run = (callback: () => void, msg: string) => {
    attempt(callback).catch(reason => log(reason, msg, LOG_ERROR))
  }

  const flush = () => {
    requestId = null
    let action = `Couldn't apply effect `
    const unknown = `unknown element`
    for (const [el, elEffect] of effectQueue) {
      for (const [prop, effect] of elEffect) {
        run(effect, action + `${prop} on ${el?.localName || unknown}`)
      }
    }
    effectQueue.clear();
    action = `Couldn't clean up after effect for `
    for (const [el, cleanup] of cleanupQueue) {
      run(cleanup, action + (el?.localName || unknown))
    }
    cleanupQueue.clear()
  }
  queueMicrotask(flush) // initial flush when the call stack is empty

  return {
    enqueue,
    cleanup,
    flush
  }
}

export default scheduler
