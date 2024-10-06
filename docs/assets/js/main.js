import {
	UIElement, maybe, pass, on, effect,
	asBoolean, asInteger,
	setText, setProperty, setAttribute, toggleAttribute, toggleClass
} from '@efflore/ui-element'
import Prism from './prism.min.js'

class MyCounter extends UIElement {
	static observedAttributes = ['count']
	static attributeMap = {
        count: asInteger
    }

	connectedCallback() {
		this.set('parity', () => this.get('count') % 2 ? 'odd' : 'even')
        this.first('.increment').forEach(on('click', () => this.set('count', v => ++v)))
        this.first('.decrement').forEach(on('click', () => this.set('count', v => --v)))
		this.first('.count').forEach(setText('count'))
		this.first('.parity').forEach(setText('parity'))
    }
}
MyCounter.define('my-counter')

class HelloWorld extends UIElement {
	connectedCallback() {
        this.first('span').forEach(setText('name'))
		this.first('input').forEach(on('input', e => this.set('name', e.target.value || undefined)))
	}
}
HelloWorld.define('hello-world')

class MySlider extends UIElement {
	connectedCallback() {
	
		// Initialize state for the active slide index
		this.set('active', 0)
	
		// Event listeners for navigation
		const total = this.querySelectorAll('.slide').length
		const getNewIndex = (prev, direction) => (prev + direction + total) % total
		this.first('.prev').map(on('click', () => this.set('active', v => getNewIndex(v, -1))))
		this.first('.next').map(on('click', () => this.set('active', v => getNewIndex(v, 1))))
	
		// Auto-effects for updating slides and dots
		this.all('.slide').map((ui, idx) => toggleClass('active', () => idx === this.get('active'))(ui))
		this.all('.dots span').map((ui, idx) => toggleClass('active', () => idx === this.get('active'))(ui))
	}
}
MySlider.define('my-slider')

class CodeBlock extends UIElement {
	static observedAttributes = ['collapsed']
	static attributeMap = {
		collapsed: asBoolean
	}

  	connectedCallback() {

		// Enhance code block with Prism.js
		const language = this.getAttribute('language') || 'html'
		const content = this.querySelector('code')
		this.set('code', content.textContent.trim(), false)
		effect(enqueue => {
			// Apply syntax highlighting while preserving Lit's marker nodes in Storybook
			const code = document.createElement('code')
			code.innerHTML = Prism.highlight(this.get('code'), Prism.languages[language], language)
			enqueue(content, 'h', el => () => {
				Array.from(el.childNodes)
					.filter(node => node.nodeType !== Node.COMMENT_NODE)
					.forEach(node => node.remove())
				Array.from(code.childNodes)
					.forEach(node => el.appendChild(node))
			})
		})

		// Copy to clipboard
		this.first('.copy').map(ui => on('click', async () => {
			const copyButton = ui.target
			const label = copyButton.textContent
			let status = 'success'
			try {
				await navigator.clipboard.writeText(content.textContent)
			} catch (err) {
				console.error('Error when trying to use navigator.clipboard.writeText()', err)
				status = 'error'
			}
			copyButton.set('disabled', true)
			copyButton.set('label', ui.host.getAttribute(`copy-${status}`))
			setTimeout(() => {
				copyButton.set('disabled', false)
				copyButton.set('label', label)
			}, status === 'success' ? 1000 : 3000)
		})(ui))

		// Expand
		this.first('.overlay').map(on('click', () => this.set('collapsed', false)))
		this.self.map(toggleAttribute('collapsed'))
	}
}
CodeBlock.define('code-block')

class TabList extends UIElement {
	static observedAttributes = ['accordion']
	static attributeMap = {
        accordion: asBoolean
    }
	static consumedContexts = ['media-viewport']

	connectedCallback() {
		super.connectedCallback()
		this.set('active', 0, false) // initial active tab

		// Dynamically adjust accordion based on viewport size
		setTimeout(() => {
			if (this.get('media-viewport'))
				this.set('accordion', () => ['xs', 'sm'].includes(this.get('media-viewport')))
		}, 0)

		// Reflect accordion attribute (may be used for styling)
		this.self.forEach(toggleAttribute('accordion'))

		// Hide accordion tab navigation when in accordion mode
		this.first('menu').forEach(setProperty('ariaHidden', 'accordion'))

		// Update active tab state and bind click handlers
		this.all('menu button')
			.map((ui, idx) => setProperty('ariaPressed', () => this.get('active') === idx)(ui))
			.forEach((ui, idx) => on('click', () => this.set('active', idx))(ui))

		// Pass open and collapsible states to accordion panels
		this.all('accordion-panel').forEach((ui, idx) => pass({
			open: () => ui.host.get('active') === idx,
			collapsible: 'accordion'
		})(ui))
	}
}
TabList.define('tab-list')

class AccordionPanel extends UIElement {
	connectedCallback() {

		// Set defaults from attributes
		this.set('open', this.hasAttribute('open'), false)
		this.set('collapsible', this.hasAttribute('collapsible'), false)

		// Handle open and collapsible state changes
		this.self
		    .map(toggleAttribute('open'))
			.map(toggleAttribute('collapsible'))
			.forEach(setProperty('ariaHidden', () => !this.get('open') && !this.get('collapsible')))

		// Control inner details panel
		this.first('details')
			.map(setProperty('open'))
			.forEach(setProperty('ariaDisabled', () => !this.get('collapsible')))
	}
}
AccordionPanel.define('accordion-panel')

class InputButton extends UIElement {
	static observedAttributes = ['disabled']
	static attributeMap = {
		disabled: asBoolean
	}

	connectedCallback() {
		this.first('button')
			.map(setText('label'))
			.map(setProperty('disabled'))
	}
}
InputButton.define('input-button')

/* === Pure Functions === */

const isNumber = num => typeof num === 'number'
const parseNumber = (v, int = false) => int ? parseInt(v, 10) : parseFloat(v)

/* === Class Definition === */

class InputField extends UIElement {
	static observedAttributes = ['value', 'description']
	static attributeMap = {
		value: value => this.isNumber
			? value.map(v => parseNumber(v, this.isInteger)).filter(Number.isFinite)
			: value
	}

	connectedCallback() {
		this.input = this.querySelector('input')
		this.isNumber = this.input && this.input.type === 'number'
		this.isInteger = this.hasAttribute('integer')

		// set default states
		this.set('value', this.isNumber ? this.input.valueAsNumber : this.input.value, false)
		this.set('length', this.input.value.length)
		
		// derived states
		this.set('empty', () => !this.get('length'))

		// setup sub elements
		this.#setupErrorMessage()
		this.#setupDescription()
		this.#setupSpinButton()
		this.#setupClearButton()

		// handle input changes
		this.input.onchange = () => this.#triggerChange(this.isNumber ? this.input.valueAsNumber : this.input.value)
		this.input.oninput = () => this.set('length', this.input.value.length)

		// update value
		effect(async () => {
			const value = this.get('value')
			const validate = this.getAttribute('validate')
			if (value && validate) {
				// validate input value against a server-side endpoint
				await fetch(`${validate}?name=${this.input.name}value=${this.input.value}`)
				.then(async response => {
					const text = await response.text()
					this.input.setCustomValidity(text)
					this.set('error', text)
				})
				.catch(err => this.set('error', err.message))
			}
			if (this.isNumber && !isNumber(value)) // ensure value is a number if it is not already a number
				return this.set('value', parseNumber(value, this.isInteger)) // effect will be called again with numeric value
			if (this.isNumber && !Number.isNaN(value)) // change value only if it is a valid number
				this.input.value = value
		});
 	}

	/**
	 * Clear the input field
	 */
	clear() {
		this.input.value = ''
		this.set('value', '')
		this.set('length', 0)
		this.input.focus()
	}

	/**
	 * Trigger value-change event to commit the value change
	 * 
	 * @private
	 * @param {number|string|function} value - value to set
	 */
	#triggerChange = value => {
		this.set('value', value)
		this.set('error', this.input.validationMessage)
		if (typeof value === 'function')
			value = this.get('value')
		if (this.input.value !== String(value))
			this.dispatchEvent(new CustomEvent('value-change', {
				detail: value,
				bubbles: true
			}))
	}

	/**
	 * Setup error message
	 * 
	 * @private
	 */
	#setupErrorMessage() {
		const error = this.first('.error')

		// derived states
		this.set('ariaInvalid', () => String(Boolean(this.get('error'))))
		this.set('aria-errormessage', () => this.get('error')
			? error[0]?.target.id
			: undefined
		)

		// effects
		error
			.map(setText('error'))
		this.first('input')
			.map(setProperty('ariaInvalid'))
			.map(setAttribute('aria-errormessage'))
	}

	/**
	 * Setup description
	 * 
	 * @private
	 */
	#setupDescription() {
		const description = this.first('.description')
		if (!description[0])
			return // no description, so skip
		
		// derived states
		const input = this.first('input')
		const maxLength = this.input.maxLength
		const remainingMessage = maxLength && description[0].target.dataset.remaining
		const defaultDescription = description[0].target.textContent
		this.set('description', remainingMessage
			? () => {
				const length = this.get('length')
				return length > 0
					? remainingMessage.replace('${x}', maxLength - length)
					: defaultDescription
			}
			: defaultDescription
		)
		this.set('aria-describedby', () => this.get('description')
			? description[0].target.id
			: undefined
		)

		// effects
		description.forEach(setText('description'))
		input.forEach(setAttribute('aria-describedby'))
	}

	/**
	 * Setup spin button
	 * 
	 * @private
	 */
	#setupSpinButton() {
		const spinButton = this.querySelector('.spinbutton')
		if (!this.isNumber || !spinButton)
			return // no spin button, so skip

		const getNumber = attr => maybe(parseNumber(this.input[attr], this.isInteger)).filter(Number.isFinite)[0]
		const tempStep = parseNumber(spinButton.dataset.step, this.isInteger)
		const [step, min, max] = Number.isFinite(tempStep)
			? [tempStep, getNumber('min'), getNumber('max')]
			: []

		// bring value to nearest step
		const nearestStep = v => {
			const steps = Math.round((max - min) / step)
			let zerone = Math.round((v - min) * steps / (max - min)) / steps // bring to 0-1 range
			zerone = Math.min(Math.max(zerone, 0), 1) // keep in range in case value is off limits
			const value = zerone * (max - min) + min
			return this.isInteger ? Math.round(value) : value
		}

		/**
		 * Step down
		 * 
		 * @param {number} [stepDecrement=step] - value to increment by
		 */
		this.stepDown = (stepDecrement = step) => this.#triggerChange(v => nearestStep(v - stepDecrement))

		/**
		 * Step up
		 * 
		 * @param {number} [stepIncrement=step] - value to increment by
		 */
		this.stepUp = (stepIncrement = step) => this.#triggerChange(v => nearestStep(v + stepIncrement))

		// derived states
		this.set('decrement-disabled', () => isNumber(min) && (this.get('value') - step < min))
		this.set('increment-disabled', () => isNumber(max) && (this.get('value') + step > max))

		// handle spin button clicks and update their disabled state
		this.first('.decrement')
			.map(setProperty('disabled', 'decrement-disabled'))
			.forEach(on('click', e => this.stepDown(e.shiftKey ? step * 10 : step)))
		this.first('.increment')
			.map(setProperty('disabled', 'increment-disabled'))
			.forEach(on('click', e => this.stepUp(e.shiftKey ? step * 10 : step)))

		// handle arrow key events
		this.input.onkeydown = e => {
			if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
				e.stopPropagation()
				e.preventDefault()
				if (e.key === 'ArrowDown')
					this.stepDown(e.shiftKey ? step * 10 : step)
				if (e.key === 'ArrowUp')
					this.stepUp(e.shiftKey ? step * 10 : step)
			}
		}
	}

	/**
	 * Setup clear button
	 * 
	 * @private
	 */
	#setupClearButton() {
		this.first('.clear')
			.map(toggleClass('hidden', 'empty'))
			.forEach(on('click', () => {
				this.clear()
				this.input.focus()
			}))
	}

}
InputField.define('input-field')

class InputCheckbox extends UIElement {
	static observedAttributes = ['checked']
	static attributeMap = {
		checked: asBoolean,
	}

	connectedCallback() {
		this.first('input')
			.map(on('change', e => this.set('checked', Boolean(e.target.checked))))
			.map(setProperty('checked'))
		this.self
			.map(toggleAttribute('checked'))
	}
}
InputCheckbox.define('input-checkbox')

export class InputRadiogroup extends UIElement {
	static observedAttributes = ['value']

	connectedCallback() {
		this.self
		    .map(setAttribute('value'))
        this.all('input')
			.map(on('change', e => this.set('value', e.target.value)))
		this.all('label')
		    .map(ui => toggleClass(
				'selected',
				() => ui.host.get('value') === ui.target.querySelector('input').value
			)(ui))
    }
}
InputRadiogroup.define('input-radiogroup')

class LazyLoad extends UIElement {
	static observedAttributes = ['src']
	static attributeMap = {
        src: v => v.map(src => {
				let url = ''
				try {
					url = new URL(src, location.href) // ensure 'src' attribute is a valid URL
					if (url.origin !== location.origin) { // sanity check for cross-origin URLs
						throw new TypeError('Invalid URL origin')
					}
				} catch (error) {
					console.error(error, url)
					url = ''
				}
				return url.toString()
			})
    }

	connectedCallback() {

		// show / hide loading message
		this.first('.loading')
			.forEach(setProperty('ariaHidden', () => !!this.get('error')))

		// set and show / hide error message
		this.first('.error')
			.map(setText('error'))
			.forEach(setProperty('ariaHidden', () => !this.get('error')))

		// load content from provided URL
		effect(enqueue => {
			const src = this.get('src')
			if (!src) return // silently fail if no valid URL is provided
			fetch(src)
				.then(async response => {
					if (response.ok) {
						const content = await response.text()
						enqueue(this.root, 'h', el => () => {
							// UNSAFE!, use only trusted sources in 'src' attribute
							el.innerHTML = content
							el.querySelectorAll('script').forEach(script => {
								const newScript = document.createElement('script')
								newScript.appendChild(document.createTextNode(script.textContent))
								el.appendChild(newScript)
								script.remove()
							})
						})
						this.set('error', '')
                    } else {
						this.set('error', response.status + ':'+ response.statusText)
					}
				})
				.catch(error => this.set('error', error))
		})
	}
}
LazyLoad.define('lazy-load')

const MEDIA_MOTION = 'media-motion'
const MEDIA_THEME = 'media-theme'
const MEDIA_VIEWPORT = 'media-viewport'
const MEDIA_ORIENTATION = 'media-orientation'

class MediaContext extends UIElement {
	static providedContexts = [MEDIA_MOTION, MEDIA_THEME, MEDIA_VIEWPORT, MEDIA_ORIENTATION]

	connectedCallback() {
		super.connectedCallback()

		const THEME_LIGHT = 'light'
		const THEME_DARK = 'dark'
		const VIEWPORT_XS = 'xs'
		const VIEWPORT_SM = 'sm'
		const VIEWPORT_MD = 'md'
		const VIEWPORT_LG = 'lg'
		const VIEWPORT_XL = 'xl'
		const ORIENTATION_LANDSCAPE = 'landscape'
		const ORIENTATION_PORTRAIT = 'portrait'

		const getBreakpoints = () => {
			const parseBreakpoint = breakpoint => {
				const attr = this.getAttribute(breakpoint)?.trim()
				if (!attr) return null
				const unit = attr.match(/em$/) ? 'em' : 'px'
				const value = maybe(parseFloat(attr)).filter(Number.isFinite)[0]
				return value ? value + unit : null
			}
			const sm = parseBreakpoint(VIEWPORT_SM) || '32em'
			const md = parseBreakpoint(VIEWPORT_MD) || '48em'
			const lg = parseBreakpoint(VIEWPORT_LG) || '72em'
			const xl = parseBreakpoint(VIEWPORT_XL) || '108em'
			return { sm, md, lg, xl }
		}
		const breakpoints = getBreakpoints()

		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
		const colorScheme = matchMedia('(prefers-color-scheme: dark)')
		const screenSmall = matchMedia(`(min-width: ${breakpoints.sm})`)
		const screenMedium = matchMedia(`(min-width: ${breakpoints.md})`)
		const screenLarge = matchMedia(`(min-width: ${breakpoints.lg})`)
		const screenXLarge = matchMedia(`(min-width: ${breakpoints.xl})`)
		const screenOrientation = matchMedia('(orientation: landscape)')

		const getViewport = () => {
			if (screenXLarge.matches) return VIEWPORT_XL
            if (screenLarge.matches) return VIEWPORT_LG
            if (screenMedium.matches) return VIEWPORT_MD
            if (screenSmall.matches) return VIEWPORT_SM
            return VIEWPORT_XS
		}

		// set initial values
		this.set(MEDIA_MOTION, reducedMotion.matches)
		this.set(MEDIA_THEME, colorScheme.matches ? THEME_DARK : THEME_LIGHT)
		this.set(MEDIA_VIEWPORT, getViewport())
		this.set(MEDIA_ORIENTATION, screenOrientation.matches ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT)

		// event listeners
		reducedMotion.addEventListener(
			'change',
			e => this.set(MEDIA_MOTION, e.matches)
		)
		colorScheme.addEventListener(
			'change',
			e => this.set(MEDIA_THEME, e.matches ? THEME_DARK : THEME_LIGHT)
		)
		screenSmall.addEventListener('change', () => this.set(MEDIA_VIEWPORT, getViewport()))
		screenMedium.addEventListener('change', () => this.set(MEDIA_VIEWPORT, getViewport()))
		screenLarge.addEventListener('change', () => this.set(MEDIA_VIEWPORT, getViewport()))
		screenXLarge.addEventListener('change', () => this.set(MEDIA_VIEWPORT, getViewport()))
		screenOrientation.addEventListener(
			'change',
			e => this.set(MEDIA_THEME, e.matches ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT)
		)
	}
}
MediaContext.define('media-context')

class TodoForm extends UIElement {
	connectedCallback() {
		const inputField = this.querySelector('input-field')

        this.first('form')
			.map(on('submit', e => {
				e.preventDefault()
				setTimeout(() => {
					this.dispatchEvent(new CustomEvent('add-todo', {
						bubbles: true,
						detail: inputField.get('value')
					}))
					inputField.clear()
				}, 0)
			}))
		
		this.first('input-button')
			.map(pass({
				disabled: () => inputField.get('empty')
			}))
    }
}
TodoForm.define('todo-form')

class TodoApp extends UIElement {
    connectedCallback() {
		const [todoList, todoFilter] = ['todo-list', 'input-radiogroup']
			.map(selector => this.querySelector(selector))

		// event listener on own element
        this.self
            .map(on('add-todo', e => todoList?.addItem(e.detail)))
        
        // coordinate todo-count
		this.first('todo-count')
            .map(pass({ active: () => todoList?.get('count').active }))

        // coordinate todo-list
        this.first('todo-list')
            .map(pass({ filter: () => todoFilter?.get('value') }))

        // coordinate .clear-completed button
        this.first('.clear-completed')
            .map(on('click', () => todoList?.clearCompleted()))
            .map(pass({ disabled: () => !todoList?.get('count').completed }))
    }
}
TodoApp.define('todo-app')

class TodoCount extends UIElement {
	connectedCallback() {
        this.set('active', 0, false)
		this.first('.count')
			.map(setText('active'))
		this.first('.singular')
		    .map(setProperty('ariaHidden', () => this.get('active') > 1))
		this.first('.plural')
		    .map(setProperty('ariaHidden', () => this.get('active') === 1))
		this.first('.remaining')
			.map(setProperty('ariaHidden', () => !this.get('active')))
		this.first('.all-done')
			.map(setProperty('ariaHidden', () => !!this.get('active')))
    }
}
TodoCount.define('todo-count')

class TodoList extends UIElement {
    connectedCallback() {
        this.set('filter', 'all') // set initial filter
		this.#updateList()

		// event listener and attribute on own element
        this.self
            .map(on('click', e => {
                if (e.target.localName === 'button') this.removeItem(e.target)
            }))
            .map(setAttribute('filter'))

        // update count on each change
        this.set('count', () => {
            const tasks = this.get('tasks').map(el => el.signal('checked'))
            const completed = tasks.filter(fn => fn()).length
            const total = tasks.length
            return {
				active: total - completed,
				completed,
				total
			}
        })
    }

    addItem = task => {
        const template = this.querySelector('template').content.cloneNode(true)
        template.querySelector('span').textContent = task
        this.querySelector('ol').appendChild(template)
        this.#updateList()
    }

    removeItem = element => {
        element.closest('li').remove()
        this.#updateList()
    }

    clearCompleted = () => {
        this.get('tasks')
            .filter(el => el.get('checked'))
            .forEach(el => el.parentElement.remove())
        this.#updateList()
    }

	#updateList() {
        this.set('tasks', Array.from(this.querySelectorAll('input-checkbox')))
    }

}
TodoList.define('todo-list')
