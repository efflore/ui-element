declare const TEXT_SUFFIX = "text";
declare const PROP_SUFFIX = "prop";
declare const ATTR_SUFFIX = "attr";
declare const CLASS_SUFFIX = "class";
declare const STYLE_SUFFIX = "style";
type UIRef = {
    (): Element;
    first: (selector: string) => UIRef | undefined;
    all: (selector: string) => UIRef[];
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
 * Check if a given variable is defined
 *
 * @param {any} value - variable to check if it is defined
 * @returns {boolean} true if supplied parameter is defined
 */
declare const isDefined: (value: any) => value is {} | null;
/**
 * Wrapper around a native DOM element for DOM manipulation
 *
 * @param {Element} element - native DOM element to wrap
 * @returns {UIRef} - UIRef instance for the given element
 */
declare const uiRef: (element: Element) => UIRef;
export { uiRef as default, TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX, isDefined };
