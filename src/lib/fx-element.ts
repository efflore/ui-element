import { isDefined } from '../utils';

/* === Constants === */

const TEXT_SUFFIX = 'text';
const PROP_SUFFIX = 'prop';
const ATTR_SUFFIX = 'attr';
const CLASS_SUFFIX = 'class';
const STYLE_SUFFIX = 'style';

/* === Type definitions === */

type FxElement = {
  (): Element;
  first: (selector: string) => FxElement | undefined;
  all: (selector: string) => FxElement[];
  [TEXT_SUFFIX]: {
    set: (content: string) => void;
  };
  [PROP_SUFFIX]: {
    get: (key: PropertyKey) => unknown;
    set: (
      key: PropertyKey,
      value: unknown
    ) => unknown;
  };
  [ATTR_SUFFIX]: {
    get: (name: string) => string | null;
    set: (
      name: string,
      value: string | boolean | undefined
    ) => boolean | void;
  };
  [CLASS_SUFFIX]: {
    get: (token: string) => boolean;
    set: (
      token: string,
      force: boolean | undefined
    ) => boolean;
  };
  [STYLE_SUFFIX]: {
    get: (property: string) => string | null;
    set: (
      property: string,
      value: string | undefined
    ) => void;
  };
}

/* Internal functions === */

/**
 * Check if a given variable is an element which can have a style property
 * 
 * @param {Element} node - element to check if it is styleable
 * @returns {boolean} true if the node is styleable
 */
const isStylable = (node: Element): node is HTMLElement | SVGElement | MathMLElement =>
  node instanceof HTMLElement
  || node instanceof SVGElement
  || node instanceof MathMLElement;

/* === Exported function === */

/**
 * Wrapper around a native DOM element for DOM manipulation
 * 
 * @param {Element} element 
 * @returns {FxElement}
 */
const $ = (element: Element): FxElement => {
  const root = element.shadowRoot || element;
  const el = (): Element => element;
  el.first = (selector: string): FxElement | undefined => {
    const node = root.querySelector(selector);
    return node && $(node);
  };
  el.all = (selector: string): FxElement[] =>
    Array.from(root.querySelectorAll(selector)).map(node => $(node));
  el[TEXT_SUFFIX] = {
    get: (): string => element.textContent?.trim() || '',
    set: (content: string): void => {
      Array.from(element.childNodes)
        .filter(node => node.nodeType !== Node.COMMENT_NODE)
        .forEach(node => node.remove());
      element.append(document.createTextNode(content));
    }
  };
  el[PROP_SUFFIX] = {
    get: (key: PropertyKey): unknown => element[key],
    set: (
      key: PropertyKey,
      value: unknown
    ): unknown => (element[key] = value)
  };
  el[ATTR_SUFFIX] = {
    get: (name: string): string | null => element.getAttribute(name),
    set: (
      name: string,
      value: string | boolean | undefined
    ): boolean | void => (typeof value === 'boolean')
      ? element.toggleAttribute(name, value)
      : isDefined(value)
        ? element.setAttribute(name, value)
        : element.removeAttribute(name)
  };
  el[CLASS_SUFFIX] = {
    get: (token: string): boolean => element.classList.contains(token),
    set: (
      token: string,
      force: boolean | undefined
    ): boolean => element.classList.toggle(token, force)
  };
  isStylable(element) && (el[STYLE_SUFFIX] = {
    get: (prop: string): string => element.style.getPropertyValue(prop),
    set: (
      prop: string,
      value: string
    ): string | void => isDefined(value)
      ? element.style.setProperty(prop, value)
      : element.style.removeProperty(prop)
  });
  return el;
};

export { $ as default, TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX };