import type { UIElement } from '../ui-element';
declare const setText: <E extends Element>(state: PropertyKey) => (host: UIElement, element: E) => E;
declare const setProperty: <E extends Element>(key: PropertyKey, state?: PropertyKey) => (host: UIElement, element: E) => E;
declare const setAttribute: <E extends Element>(name: string, state?: PropertyKey) => (host: UIElement, element: E) => E;
declare const toggleAttribute: <E extends Element>(name: string, state?: PropertyKey) => (host: UIElement, element: E) => E;
declare const toggleClass: <E extends Element>(token: string, state?: PropertyKey) => (host: UIElement, element: E) => E;
declare const setStyle: <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state?: PropertyKey) => (host: UIElement, element: E) => E;
export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle };
