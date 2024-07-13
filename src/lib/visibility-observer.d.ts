declare class VisibilityObserver {
    observer: any;
    /**
     * Set up IntersectionObserver for UIElement visibility state
     *
     * @param {import('../ui-element').default} element
     */
    constructor(element: import('../ui-element').default);
    disconnect(): void;
}
export default VisibilityObserver;
