import { log, LOG_ERROR } from './log'

/* === Types === */

type UnknownFunction = (...args: unknown[]) => unknown
type ElementFunction = (element: Element) => () => void
type Enqueue = (element: Element, prop: string, fn: ElementFunction) => void
type Cleanup = (key: unknown, fn: UnknownFunction) => void
type Scheduler = { enqueue: Enqueue, cleanup: Cleanup }

/* === Exported Function === */

/**
 * Schedules functions to be executed after the next animation frame or after all events have been dispatched
 * 
 * @since 0.8.0
 * @returns {Scheduler}
 */
const scheduler = (): Scheduler => {
	const effectQueue = new Map()
	const cleanupQueue = new Map()
	let requestId: number

	const run = (fn: () => void, msg: string) => {
		try {
			fn()
		} catch (reason) {
			log(reason, msg, LOG_ERROR)
		}
	}

	const flush = () => {
		requestId = null
		effectQueue.forEach((elEffect, el) =>
			elEffect.forEach((fn: ElementFunction, prop: string) =>
				run(fn(el), `Effect ${prop} on ${el?.localName || 'unknown'} failed`)
			)
		)
		effectQueue.clear()
		cleanupQueue.forEach(fn => run(fn, 'Cleanup failed'))
		cleanupQueue.clear()
	}

	const requestTick = () => {
		if (requestId) cancelAnimationFrame(requestId)
		requestId = requestAnimationFrame(flush)
	}

	const getEffectMap = (key: Element) => {
		if (!effectQueue.has(key)) effectQueue.set(key, new Map())
		return effectQueue.get(key)
	}

	const addToQueue = (map: Map<unknown, UnknownFunction>) =>
		(key: unknown, fn: UnknownFunction) => {
			const more = !map.has(key)
			map.set(key, fn)
			if (more) requestTick()
		}

	queueMicrotask(flush) // initial flush when the call stack is empty
	return {
		enqueue: (element: Element, prop: string, fn: ElementFunction) => addToQueue(getEffectMap(element))(prop, fn),
		cleanup: addToQueue(cleanupQueue)
	}
}

export { type Enqueue, type Cleanup, type Scheduler, scheduler }
