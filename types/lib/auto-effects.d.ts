import { UIElement } from '../ui-element';
declare const syncText: (state: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
declare const syncProp: (key: PropertyKey, state?: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
declare const syncAttr: (name: string, state?: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
declare const syncBool: (name: string, state?: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
declare const syncClass: (token: string, state?: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
declare const syncStyle: (prop: string, state?: PropertyKey) => (host: UIElement, target: HTMLElement) => void;
export { syncText, syncProp, syncAttr, syncBool, syncClass, syncStyle };
