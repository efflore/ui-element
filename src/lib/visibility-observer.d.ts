import type UIElement from '../ui-element';
declare class VisibilityObserver {
    observer: any;
    /**
     * Set up IntersectionObserver for UIElement visibility state
     *
     * @param {UIElement} element
     */
    constructor(element: UIElement);
    disconnect(): void;
}
export default VisibilityObserver;
