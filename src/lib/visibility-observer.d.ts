import type IUIElement from '../ui-element';
declare class VisibilityObserver {
    observer: IntersectionObserver | void;
    /**
     * Set up IntersectionObserver for UIElement visibility state
     *
     * @param {UIElement} element
     */
    constructor(element: IUIElement);
    disconnect(): void;
}
export default VisibilityObserver;
