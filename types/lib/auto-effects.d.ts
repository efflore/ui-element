import type { StateLike } from '../ui-element';
import type { UI } from '../core/ui';
declare const setText: <E extends Element>(state: StateLike) => ({ host, target }: UI<E>) => UI<E>;
declare const setProperty: <E extends Element>(key: PropertyKey, state?: StateLike) => ({ host, target }: UI<E>) => UI<E>;
declare const setAttribute: <E extends Element>(name: string, state?: StateLike) => ({ host, target }: UI<E>) => UI<E>;
declare const toggleAttribute: <E extends Element>(name: string, state?: StateLike) => ({ host, target }: UI<E>) => UI<E>;
declare const toggleClass: <E extends Element>(token: string, state?: StateLike) => ({ host, target }: UI<E>) => UI<E>;
declare const setStyle: <E extends (HTMLElement | SVGElement | MathMLElement)>(prop: string, state?: StateLike) => ({ host, target }: UI<E>) => UI<E>;
export { setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle };
