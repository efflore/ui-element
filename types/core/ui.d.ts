import type { UIElement } from '../ui-element';
type UI<T> = {
    readonly [Symbol.toStringTag]: string;
    host: UIElement;
    target: T;
};
declare const TYPE_UI = "UI";
declare const ui: (host: UIElement, target?: Element) => {
    [Symbol.toStringTag]: string;
    host: UIElement;
    target: Element;
};
declare const isUI: (value: unknown) => value is UI<unknown>;
declare const self: (host: UIElement) => import("./maybe").Ok<{
    [Symbol.toStringTag]: string;
    host: UIElement;
    target: Element;
}>;
declare const first: (host: UIElement) => (selector: string) => import("./maybe").None | import("./maybe").Ok<{
    [Symbol.toStringTag]: string;
    host: UIElement;
    target: Element;
}>;
declare const all: (host: UIElement) => (selector: string) => {
    [Symbol.toStringTag]: string;
    host: UIElement;
    target: Element;
}[];
export { type UI, TYPE_UI, ui, isUI, self, first, all };
