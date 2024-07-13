declare const TEXT_SUFFIX = "text";
declare const PROP_SUFFIX = "prop";
declare const ATTR_SUFFIX = "attr";
declare const CLASS_SUFFIX = "class";
declare const STYLE_SUFFIX = "style";
type FxElement = {
    (): Element;
    first: (selector: string) => FxElement | undefined;
    all: (selector: string) => FxElement[];
    [TEXT_SUFFIX]: {
        set: (content: string) => void;
    };
    [PROP_SUFFIX]: {
        get: (key: PropertyKey) => unknown;
        set: (key: PropertyKey, value: unknown) => unknown;
    };
    [ATTR_SUFFIX]: {
        get: (name: string) => string | null;
        set: (name: string, value: string | boolean | undefined) => boolean | void;
    };
    [CLASS_SUFFIX]: {
        get: (token: string) => boolean;
        set: (token: string, force: boolean | undefined) => boolean;
    };
    [STYLE_SUFFIX]: {
        get: (property: string) => string | null;
        set: (property: string, value: string | undefined) => void;
    };
};
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @param {Element} element
 * @returns {FxElement}
 */
declare const $: (element: Element) => FxElement;
export { $ as default, TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX };
