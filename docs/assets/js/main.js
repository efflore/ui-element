import { UIElement, asInteger, on, setText } from 'index.min.js'

class MyCounter extends UIElement {
	static observedAttributes = ['count']
	static attributeMap = {
        count: asInteger
    }

	connectedCallback() {
		this.set('parity', () => this.get('count') % 2 ? 'odd' : 'even')
        this.first('.increment').map(on('click', () => this.set('count', v => ++v)))
        this.first('.decrement').map(on('click', () => this.set('count', v => --v)))
		this.first('.count').map(setText('count'))
		this.first('.parity').map(setText('parity'))
    }
}
MyCounter.define('my-counter')