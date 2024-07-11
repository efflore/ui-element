const VISIBILITY_STATE = 'visible';

export default class VisibilityObserver {
  observer = null;

  /**
   * Set up IntersectionObserver for UIElement visibility state
   * 
   * @param {import('../index').default} element 
   */
  constructor(element: import('../index').default) {
    element.set(VISIBILITY_STATE, false);

    this.observer = new IntersectionObserver(([entry]) => {
      element.set(VISIBILITY_STATE, entry.isIntersecting);
    }).observe(element);
  }

  disconnect() {
    this.observer && this.observer.disconnect();
  }
}