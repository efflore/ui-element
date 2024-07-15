import type IUIElement from '../ui-element';

const VISIBILITY_STATE = 'visible';

class VisibilityObserver {
  observer: IntersectionObserver | void;

  /**
   * Set up IntersectionObserver for UIElement visibility state
   * 
   * @param {UIElement} element 
   */
  constructor(element: IUIElement) {
    element.set(VISIBILITY_STATE, false);

    this.observer = new IntersectionObserver(([entry]) => {
      element.set(VISIBILITY_STATE, entry.isIntersecting);
    }).observe(element);
  }

  disconnect() {
    this.observer && this.observer.disconnect();
  }
}

export default VisibilityObserver;