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
 * Ensure passed parameter is a valid function or throw a TypeError
 * 
 * @param {Function} fn function to be checked
 * @param {HTMLElement} el current element
 * @param {string} what description of parameter expected to be a function
 * @returns 
 */
const assertFunction = (fn, el, what) => {
	if (!isFunction(fn)) {
		throw new TypeError(`${what} in ${el.localName} is not a function`);
	}
	return true;
}

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

// const log = msg => console.log(msg);

/* === Default export === */

/**
 * Base class for reactive custom elements, usually called UIElement; extends HTMLElement
 */
export default class extends HTMLElement {

	// hold [name, type] or just type map to be used on attributeChangedCallback
	attrs = {};

	/**
	 * Native callback function when an observed attribute of the custom element changes
	 * 
	 * @param {string} name name of the modified attribute
	 * @param {any} old old value of the modified attribute
	 * @param {any} value new value of the modified attribute
	 */
	attributeChangedCallback(name, old, value) {
		if (value !== old) {
			const mapProp = input => Array.isArray(input) ? input : [name, input];
			const [prop, type] = mapProp(this.attrs[name]);
			// this.debug && log(`Attribute ${name} of ${this.localName} changed from '${old}' to '${value}', parsed as ${type || 'string'} and assigned to ${prop}`);
			this.cause(prop, () => {
				if (isFunction(type)) {
					return type(value, old);
				}
				const parser = {
					boolean: v => typeof v === 'string' ? true : false,
					integer: v => parseInt(v, 10),
					number: v => parseFloat(v),
				};
				return parser[type] ? parser[type](value) : value;
			});
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
			activeEffect && getEffects(getter).add(activeEffect);
			// this.debug && log(`Get current value of ['${this.localName}'].${name} and track its use in effect`);
			return isFunction(value) ? value() : value;
		};
		// this.debug && !Object.hasOwn(this, name) && log(`Reactive property ['${this.localName}'].${name} defined`);
		setReactive(this, name, value, {
			get: () => getter(),
			set(updater) {
				const old = value;
				value = isFunction(updater) ? updater(value) : updater;
				// this.debug && log(`Set value of ['${this.localName}'].${name} to ${value} and trigger depending effects`);
				(value !== old) && getEffects(getter).forEach(effect => effect());
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
		// this.debug && log(`Reactive property ['${this.localName}'].${name} passed to ['${target.localName}'].${prop}`);
	}

	/**
	 * Derive a computed reactive property and assign it to a given target element
	 * 
	 * @param {HTMLElement} target element on which to assign the reactive property; may be `this` or a different element
	 * @param {string} prop name of the reactive property to be assigned on the target object
	 * @param {Function} fn callback function to be evaluated when its value is retrieved
	 */
	derive(target, prop, fn) {
		assertFunction(fn, this, 'Derive callback');
		setReactive(target, prop, fn.call(this), { get: fn.bind(this) });
		// this.debug && log(`Derived reactive property getter function attached to ['${target.localName}'].${prop}`);
	}

	/**
	 * Main method to define what happens when a reactive dependecy (`cause`) changes; function may return a cleanup function to be executed on idle
	 * 
	 * @param {Function} handler callback function to be executed when a reactive dependecy (`cause`) changes
	 * @returns {Promise} resolved or rejected Promise for effect to happen
	 */
	async effect(handler) {
		assertFunction(handler, this, 'Effect handler');
		const next = () => {
			activeEffect = next; // register the current effect
			const cleanup = handler(); // execute handler function
			isFunction(cleanup) && setTimeout(cleanup); // execute possibly returned cleanup function on next tick
			activeEffect = null; // unregister the current effect
		};
		return new Promise(resolve => requestAnimationFrame(resolve)).then(next); // wait for the next animation frame to bundle DOM updates
	}

}