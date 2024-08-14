declare const scheduler: () => {
    enqueue: (element: Element, prop: string, callback: () => void) => void;
    cleanup: (element: Element, callback: () => void) => void;
    flush: () => void;
};
export default scheduler;
