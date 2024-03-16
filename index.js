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
 * @param {any} f variable to check
 * @returns {boolean} true if supplied parameter is a function
 */
const isFunction = f => typeof f === 'function';

/**
 * Set up a reactive property on an object; defines the property if not already there; otherwise assign the current value
 * 
 * @param {Object} o object on which to define the property
 * @param {string} p key of the property to be defined or modified
 * @param {any} v value of the property to be modified in case the property already exists
 * @param {Object} d descriptor for the property being defined in case the property does not exist yet
 * @returns {Object} object that was passed to the function, with the specified property added or modified
 */
const setReactive = (o, p, v, d) => Object.hasOwn(o, p) ? o[p] = v : Object.defineProperty(o, p, d);

/**
 * Get the set of effects associated to the cause getter function in the reactive map
 * 
 * @param {Object} g getter function of the cause as key for the lookup
 * @returns {Set} set of effects associated to the cause
 */
const getEffects = g => {
	!reactiveMap.has(g) && reactiveMap.set(g, new Set());
	return reactiveMap.get(g);
};

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
	 * Main method to define a new reactive property, called `cause` in UIElement; updates the value of the property already exists
	 * 
	 * @param {string} name name of the reactive property to be assigned to `this` object instance
	 * @param {any} value value to be assigned to the reactive property; may be a function to be evaluated when its value is retrieved
	 */
	cause(name, value) {
		const getter = () => {
			activeEffect && getEffects(getter).add(activeEffect); // track
			return isFunction(value) ? value() : value;
		};
		setReactive(this, name, value, {
			get: () => getter(),
			set(updater) {
				const old = value;
				value = isFunction(updater) ? updater(value) : updater;
				(value !== old) && getEffects(getter).forEach(effect => effect()); // trigger
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
	chain(target, prop, name) {
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
	effect(handler) {
		const next = () => {
			activeEffect = next; // register the current effect
			const cleanup = handler(); // execute handler function
			isFunction(cleanup) && setTimeout(cleanup, 0); // execute cleanup function on idle
			activeEffect = null; // unregister the current effect
		};
		requestAnimationFrame(next); // wait for the next animation frame to bundle DOM updates
	}

}