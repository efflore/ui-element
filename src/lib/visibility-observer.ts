import type UIElement from '../ui-element';

const VISIBILITY_STATE = 'visible';

class VisibilityObserver {
  observer = null;

  /**
   * Set up IntersectionObserver for UIElement visibility state
   * 
   * @param {UIElement} element 
   */
  constructor(element: UIElement) {
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