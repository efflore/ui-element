declare const setText: <E extends Element>(state: PropertyKey) => (target: E) => E;
declare const setProperty: <E extends Element>(key: PropertyKey, state?: PropertyKey) => (target: E) => E;
declare const setAttribute: <E extends Element>(name: string, state?: PropertyKey) => (target: E) => E;
declare const toggleAttribute: <E extends Element>(name: string, state?: PropertyKey) => (target: E) => E;
declare const toggleClass: <E extends Element>(token: string, state?: PropertyKey) => (target: E) => E;
declare const setStyle: <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state?: PropertyKey) => (target: E) => E;
export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle };
