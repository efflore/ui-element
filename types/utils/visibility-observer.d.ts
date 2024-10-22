import type { UIElement } from '../ui-element';
declare class VisibilityObserver {
    observer: IntersectionObserver | void;
    /**
     * Set up IntersectionObserver for UIElement visibility state
     *
     * @param {UIElement} host - host UIElement for the observer
     */
    constructor(host: UIElement);
    disconnect(): void;
}
export default VisibilityObserver;
