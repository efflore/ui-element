/* globals customElements, HTMLElement, requestAnimationFrame, setTimeout */

/**
 * @license
 * Copyright 2024 Esther Brunner
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* === Internal variables and functions to the module === */

// hold the currently active effect
let activeEffect = null;

// set up an empty WeakMap to hold the reactivity tree
const reactiveMap = new WeakMap();

/**
 * Check if a given variable is a function
 * 
 * @param {any} fn variable to check
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = fn => typeof fn === 'function';

/**
 * Turn a function which takes a callback function as first argument into a Promise
 * 
 * @param {Function} fn function that accepts a callback function as first parameter
 * @returns {Promise} Promise to which `.then(callback)` can be chained
 */
const promisify = fn => new Promise(resolve => fn(resolve));

/**
 * Set up a reactive property on an object; defines the property if not already there; otherwise assign the current value
 * 
 * @param {HTMLElement} target element on which to define the property
 * @param {string} prop key of the property to be defined or modified
 * @param {any} value value of the property to be modified in case the property already exists
 * @param {Object} descriptor descriptor for the property being defined in case the property does not exist yet
 */
const setReactive = (target, prop, value, descriptor) => {
	Object.hasOwn(target, prop) ? target[prop] = value : Object.defineProperty(target, prop, descriptor);
};

/**
 * Get the set of effects associated to the cause getter function in the reactive map
 * 
 * @param {Function} fn getter function of the reactive property as key for the lookup
 * @returns {Set} set of effects associated with the reactive property
 */
const getEffects = fn => {
	!reactiveMap.has(fn) && reactiveMap.set(fn, new Set());
	return reactiveMap.get(fn);
};

/**
 * Track the use of a getter function of a reactive property
 * 
 * @param {Function} fn getter function of the reactive property to add to the effects `Set`
 * @returns {Set} `Set` object with added value
 */
const track = fn => activeEffect && getEffects(fn).add(activeEffect);

/**
 * Trigger effects when a reactive property is set
 * 
 * @param {*} fn getter function of the reactive property as key for the lookup
 */
const trigger = async fn => {
	getEffects(fn).forEach(effect => effect());
	// const promises = Array.from(getEffects(fn)).map(effect => promisify(effect).catch(reason => console.error(reason)));
	// result = await Promise.all(promises).catch(reason => console.error(reason));
	// console.log(result);
}

/* === Exported helper functions === */

/**
 * Convenience function to syntax highlight `html` tagged template literals
 * 
 * @param {string[]} strings text parts of template literal
 * @param {...any} values expression to be inserted in the current position, whose value is converted to a string
 * @returns {string} processed template literal with replaced expressions
 */
export const html = (strings, ...values) => String.raw({ raw: strings }, ...values);

/**
 * Convenience function to define a custom element if it's name is not already taken in the CustomElementRegistry
 * 
 * @param {string} tag name of the custom element to be defined; must consist of at least two word joined with - (kebab case)
 * @param {HTMLElement} el class of custom element; must extend HTMLElement; may be an anonymous class
 * @returns {void}
 */
export const define = (tag, el) => customElements.get(tag) || customElements.define(tag, el);

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement; extends HTMLElement
 */
export default class extends HTMLElement {

	// hold references to HTML elements used in the class 
	ui = {};

	// hold setter functions to be called on attributeChangedCallback
	attributeChanged = {};

	/**
	 * Native callback function when an observed attribute of the custom element changes
	 * 
	 * @param {string} name name of the modified attribute
	 * @param {any} old old value of the modified attribute
	 * @param {any} value new value of the modified attribute
	 */
	attributeChangedCallback(name, old, value) {
		if (value !== old) {
			const method = this.attributeChanged[name];
			isFunction(method) ? method.call(this, value) : this.cause(name, value);
		};
	}

	/**
	 * Wrapper around `Object.hasOwn` to simplify conditional execution
	 * 
	 * @param {string} name name of property to be check on `this` object instance
	 * @returns {boolean} true if `this` has own property with the passed name
	 */
	has(name) {
		return Object.hasOwn(this, name);
	}

	/**
	 * Main method to define a new reactive property, called `cause` in UIElement; updates the value of the property already exists
	 * 
	 * @param {string} name name of the reactive property to be assigned to `this` object instance
	 * @param {any} value value to be assigned to the reactive property; may be a function to be evaluated when its value is retrieved
	 */
	cause(name, value) {
		const getter = () => {
			track(getter);
			return isFunction(value) ? value() : value;
		};
		setReactive(this, name, value, {
			get: () => getter(),
			set(updater) {
				const old = value;
				value = isFunction(updater) ? updater(value) : updater;
				(value !== old) && trigger(getter);
			}
		});
	}

	/**
	 * Pass a reactive property to a different HTMLElement; its property descriptor is copied so they reference the same getter and setter functions
	 * 
	 * @param {HTMLElement} target element on which to assign the reactive property
	 * @param {string} prop name of the reactive property to be assigned on the target object
	 * @param {string} name name of the reactive property on the source object instance (`this`)
	 */
	pass(target, prop, name) {
		setReactive(target, prop, this[name], Object.getOwnPropertyDescriptor(this, name));
	}

	/**
	 * Derive a computed reactive property and assign it to a given target element
	 * 
	 * @param {HTMLElement} target element on which to assign the reactive property; may be `this` or a different element
	 * @param {string} prop name of the reactive property to be assigned on the target object
	 * @param {Function} fn callback function to be evaluated when its value is retrieved
	 */
	derive(target, prop, fn) {
		setReactive(target, prop, fn.call(this), { get: fn.bind(this) });
	}

	/**
	 * Main method to define what happens when a reactive dependecy (`cause`) changes; function may return a cleanup function to be executed on idle
	 * 
	 * @param {Function} handler callback function to be executed when a reactive dependecy (`cause`) changes
	 */
	async effect(handler) {
		if (!isFunction(handler)) {
			throw new Error(`Effect handler in ${this.localName} is not a function`);
		}
		const next = () => {
			activeEffect = next; // register the current effect
			const cleanup = handler(); // execute handler function
			isFunction(cleanup) && setTimeout(cleanup); // execute possibly returned cleanup function on nextTick
			activeEffect = null; // unregister the current effect
		};
		requestAnimationFrame(next); // wait for the next animation frame to bundle DOM updates
	}

}