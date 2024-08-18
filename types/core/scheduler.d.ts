import type { Effect } from '../cause-effect';
declare const scheduler: () => {
    enqueue: (element: Element, prop: string, fn: (element: Element) => () => void) => void;
    cleanup: (effect: Effect, fn: () => void) => void;
};
export default scheduler;
