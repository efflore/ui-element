type UnknownFunction = (...args: unknown[]) => unknown;
type ElementFunction = (element: Element) => () => void;
declare const scheduler: () => {
    enqueue: (element: Element, prop: string, fn: ElementFunction) => void;
    cleanup: (key: unknown, fn: UnknownFunction) => void;
};
export default scheduler;
