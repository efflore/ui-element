export default class VisibilityObserver {
    observer: any;
    /**
     * Set up IntersectionObserver for UIElement visibility state
     *
     * @param {import('../index').default} element
     */
    constructor(element: import('../index').default);
    disconnect(): void;
}
