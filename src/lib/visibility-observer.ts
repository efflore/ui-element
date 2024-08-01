import type UIElement from '../ui-element'

const VISIBILITY_STATE = 'visible'

class VisibilityObserver {
  observer: IntersectionObserver | void

  /**
   * Set up IntersectionObserver for UIElement visibility state
   * 
   * @param {UIElement} host - host UIElement for the observer
   */
  constructor(host: UIElement) {
    host.set(VISIBILITY_STATE, false)

    this.observer = new IntersectionObserver(([entry]) => {
      host.set(VISIBILITY_STATE, entry.isIntersecting)
    }).observe(host)
  }

  disconnect() {
    this.observer && this.observer.disconnect()
  }
}

export default VisibilityObserver
