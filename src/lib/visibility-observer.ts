const VISIBILITY_STATE = 'visible';

class VisibilityObserver {
  observer = null;

  /**
   * Set up IntersectionObserver for UIElement visibility state
   * 
   * @param {import('../ui-element').default} element 
   */
  constructor(element: import('../ui-element').default) {
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