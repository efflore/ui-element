import UIElement from '../index';
/**
 * @name UIElement DOM Utils
 * @version 0.7.0
 */
declare const DEV_MODE = true;
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
/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 *
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
declare const autoEffects: (el: UIElement) => void;
/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 *
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className='ui-effect'] - CSS class to be added to highlighted targets
 */
declare const highlightTargets: (el: UIElement, className?: string) => void;
/**
 * Add debug capabilities to UIElement classes
 *
 * @since 0.5.0
 *
 * @class DebugElement
 * @extends {UIElement}
 * @type {import("../types.js").DebugElement}
 */
declare class DebugElement extends UIElement {
    /**
     * Wrap connectedCallback to log to the console
     */
    connectedCallback(): void;
    /**
     * Wrap disconnectedCallback to log to the console
     */
    disconnectedCallback(): void;
    /**
     * Wrap adoptedCallback to log to the console
     */
    adoptedCallback(): void;
    /**
     * Wrap attributeChangedCallback to log changes to the console
     *
     * @since 0.5.0
     * @param {string} name
     * @param {string|undefined} old
     * @param {string|undefined} value
     */
    attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
    /**
     * Wrap set() to log signal reads to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key
     * @returns {any}
     */
    get(key: PropertyKey): any;
    /**
     * Wrap set() to log signal writes to the console
     *
     * @since 0.5.0
     * @param {PropertyKey} key - state to be set
     * @param {any} value - value to be set
     * @param {boolean} [update=true] - whether to update the state
     */
    set(key: PropertyKey, value: any, update?: boolean): void;
    /**
     * Wrap delete() to log signal deletions to the console
     *
     * @since 0.7.0
     * @param {PropertyKey} key - state to be deleted
     * @returns {boolean} - whether the state was deleted
     */
    delete(key: PropertyKey): boolean;
    /**
     * Wrap pass() to log passed signals to the console
     *
     * @since 0.7.0
     * @param {UIElement} element - UIElement to be passed to
     * @param {import('../types.js').FxStateMap} states - states to be passed to the element
     * @param {CustomElementRegistry} [registry=customElements] - custom element registry
     * /
    async pass(element: UIElement, states: import('../types').FxStateMap, registry: CustomElementRegistry = customElements) {
      this.log(`Pass state(s) ${valueString(Object.keys(states))} to ${elementName(element)} from ${elementName(this)}`);
      super.pass(element, states, registry);
    } */
    /**
     * Log messages in debug mode
     *
     * @since 0.5.0
     * @param {string} msg - debug message to be logged
     */
    log(msg: string): void;
}
/**
 * Create a UIElement (or DebugElement in DEV_MODE) subclass for a custom element tag
 *
 * @since 0.7.0
 * @param {string} tag - custom element tag name
 * @param {import('../types.js').AttributeMap} attributeMap - object of observed attributes and their corresponding state keys and parser functions
 * @param {(connect: FxComponent) => void} connect - callback to be called when the element is connected to the DOM
 * @param {(disconnect: FxComponent) => void} disconnect - callback to be called when the element is disconnected from the DOM
 * @returns {typeof FxComponent} - custom element class
 */
declare const component: (tag: string, attributeMap: import("../index").AttributeMap, connect: (connect: UIElement) => void, disconnect: (disconnect: UIElement) => void) => {
    new (): {
        attributeMap: import("../index").AttributeMap;
        connectedCallback(): void;
        disconnectedCallback(): void;
        contextMap: import("../index").ContextMap;
        "__#1@#states": Map<any, any>;
        attributeChangedCallback(name: string, old: string | undefined, value: string | undefined): void;
        has(key: PropertyKey): boolean;
        get(key: PropertyKey): unknown;
        set(key: PropertyKey, value: unknown | import("./cause-effect").FxState, update?: boolean): void;
        delete(key: PropertyKey): boolean;
        pass(element: UIElement, states: import("../index").FxStateMap, registry?: CustomElementRegistry): Promise<void>;
        targets(key: PropertyKey): Set<Element>;
        accessKey: string;
        readonly accessKeyLabel: string;
        autocapitalize: string;
        dir: string;
        draggable: boolean;
        hidden: boolean;
        inert: boolean;
        innerText: string;
        lang: string;
        readonly offsetHeight: number;
        readonly offsetLeft: number;
        readonly offsetParent: Element | null;
        readonly offsetTop: number;
        readonly offsetWidth: number;
        outerText: string;
        popover: string | null;
        spellcheck: boolean;
        title: string;
        translate: boolean;
        attachInternals(): ElementInternals;
        click(): void;
        hidePopover(): void;
        showPopover(): void;
        togglePopover(force?: boolean): boolean;
        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
        readonly attributes: NamedNodeMap;
        readonly classList: DOMTokenList;
        className: string;
        readonly clientHeight: number;
        readonly clientLeft: number;
        readonly clientTop: number;
        readonly clientWidth: number;
        id: string;
        readonly localName: string;
        readonly namespaceURI: string | null;
        onfullscreenchange: (this: Element, ev: Event) => any;
        onfullscreenerror: (this: Element, ev: Event) => any;
        outerHTML: string;
        readonly ownerDocument: Document;
        readonly part: DOMTokenList;
        readonly prefix: string | null;
        readonly scrollHeight: number;
        scrollLeft: number;
        scrollTop: number;
        readonly scrollWidth: number;
        readonly shadowRoot: ShadowRoot | null;
        slot: string;
        readonly tagName: string;
        attachShadow(init: ShadowRootInit): ShadowRoot;
        checkVisibility(options?: CheckVisibilityOptions): boolean;
        closest<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K] | null;
        closest<K extends keyof SVGElementTagNameMap>(selector: K): SVGElementTagNameMap[K] | null;
        closest<K extends keyof MathMLElementTagNameMap>(selector: K): MathMLElementTagNameMap[K] | null;
        closest<E extends Element = Element>(selectors: string): E | null;
        computedStyleMap(): StylePropertyMapReadOnly;
        getAttribute(qualifiedName: string): string | null;
        getAttributeNS(namespace: string | null, localName: string): string | null;
        getAttributeNames(): string[];
        getAttributeNode(qualifiedName: string): Attr | null;
        getAttributeNodeNS(namespace: string | null, localName: string): Attr | null;
        getBoundingClientRect(): DOMRect;
        getClientRects(): DOMRectList;
        getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
        getElementsByTagName<K extends keyof HTMLElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<HTMLElementTagNameMap[K]>;
        getElementsByTagName<K extends keyof SVGElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<SVGElementTagNameMap[K]>;
        getElementsByTagName<K extends keyof MathMLElementTagNameMap>(qualifiedName: K): HTMLCollectionOf<MathMLElementTagNameMap[K]>;
        getElementsByTagName<K extends keyof HTMLElementDeprecatedTagNameMap>(qualifiedName: K): HTMLCollectionOf<HTMLElementDeprecatedTagNameMap[K]>;
        getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/1999/xhtml", localName: string): HTMLCollectionOf<HTMLElement>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/2000/svg", localName: string): HTMLCollectionOf<SVGElement>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/1998/Math/MathML", localName: string): HTMLCollectionOf<MathMLElement>;
        getElementsByTagNameNS(namespace: string | null, localName: string): HTMLCollectionOf<Element>;
        hasAttribute(qualifiedName: string): boolean;
        hasAttributeNS(namespace: string | null, localName: string): boolean;
        hasAttributes(): boolean;
        hasPointerCapture(pointerId: number): boolean;
        insertAdjacentElement(where: InsertPosition, element: Element): Element | null;
        insertAdjacentHTML(position: InsertPosition, text: string): void;
        insertAdjacentText(where: InsertPosition, data: string): void;
        matches(selectors: string): boolean;
        releasePointerCapture(pointerId: number): void;
        removeAttribute(qualifiedName: string): void;
        removeAttributeNS(namespace: string | null, localName: string): void;
        removeAttributeNode(attr: Attr): Attr;
        requestFullscreen(options?: FullscreenOptions): Promise<void>;
        requestPointerLock(): void;
        scroll(options?: ScrollToOptions): void;
        scroll(x: number, y: number): void;
        scrollBy(options?: ScrollToOptions): void;
        scrollBy(x: number, y: number): void;
        scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void;
        scrollTo(options?: ScrollToOptions): void;
        scrollTo(x: number, y: number): void;
        setAttribute(qualifiedName: string, value: string): void;
        setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void;
        setAttributeNode(attr: Attr): Attr | null;
        setAttributeNodeNS(attr: Attr): Attr | null;
        setHTMLUnsafe(html: string): void;
        setPointerCapture(pointerId: number): void;
        toggleAttribute(qualifiedName: string, force?: boolean): boolean;
        webkitMatchesSelector(selectors: string): boolean;
        readonly baseURI: string;
        readonly childNodes: NodeListOf<ChildNode>;
        readonly firstChild: ChildNode | null;
        readonly isConnected: boolean;
        readonly lastChild: ChildNode | null;
        readonly nextSibling: ChildNode | null;
        readonly nodeName: string;
        readonly nodeType: number;
        nodeValue: string | null;
        readonly parentElement: HTMLElement | null;
        readonly parentNode: ParentNode | null;
        readonly previousSibling: ChildNode | null;
        textContent: string | null;
        appendChild<T extends Node>(node: T): T;
        cloneNode(deep?: boolean): Node;
        compareDocumentPosition(other: Node): number;
        contains(other: Node | null): boolean;
        getRootNode(options?: GetRootNodeOptions): Node;
        hasChildNodes(): boolean;
        insertBefore<T extends Node>(node: T, child: Node | null): T;
        isDefaultNamespace(namespace: string | null): boolean;
        isEqualNode(otherNode: Node | null): boolean;
        isSameNode(otherNode: Node | null): boolean;
        lookupNamespaceURI(prefix: string | null): string | null;
        lookupPrefix(namespace: string | null): string | null;
        normalize(): void;
        removeChild<T extends Node>(child: T): T;
        replaceChild<T extends Node>(node: Node, child: T): T;
        readonly ELEMENT_NODE: 1;
        readonly ATTRIBUTE_NODE: 2;
        readonly TEXT_NODE: 3;
        readonly CDATA_SECTION_NODE: 4;
        readonly ENTITY_REFERENCE_NODE: 5;
        readonly ENTITY_NODE: 6;
        readonly PROCESSING_INSTRUCTION_NODE: 7;
        readonly COMMENT_NODE: 8;
        readonly DOCUMENT_NODE: 9;
        readonly DOCUMENT_TYPE_NODE: 10;
        readonly DOCUMENT_FRAGMENT_NODE: 11;
        readonly NOTATION_NODE: 12;
        readonly DOCUMENT_POSITION_DISCONNECTED: 1;
        readonly DOCUMENT_POSITION_PRECEDING: 2;
        readonly DOCUMENT_POSITION_FOLLOWING: 4;
        readonly DOCUMENT_POSITION_CONTAINS: 8;
        readonly DOCUMENT_POSITION_CONTAINED_BY: 16;
        readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32;
        dispatchEvent(event: Event): boolean;
        ariaAtomic: string | null;
        ariaAutoComplete: string | null;
        ariaBrailleLabel: string | null;
        ariaBrailleRoleDescription: string | null;
        ariaBusy: string | null;
        ariaChecked: string | null;
        ariaColCount: string | null;
        ariaColIndex: string | null;
        ariaColSpan: string | null;
        ariaCurrent: string | null;
        ariaDescription: string | null;
        ariaDisabled: string | null;
        ariaExpanded: string | null;
        ariaHasPopup: string | null;
        ariaHidden: string | null;
        ariaInvalid: string | null;
        ariaKeyShortcuts: string | null;
        ariaLabel: string | null;
        ariaLevel: string | null;
        ariaLive: string | null;
        ariaModal: string | null;
        ariaMultiLine: string | null;
        ariaMultiSelectable: string | null;
        ariaOrientation: string | null;
        ariaPlaceholder: string | null;
        ariaPosInSet: string | null;
        ariaPressed: string | null;
        ariaReadOnly: string | null;
        ariaRequired: string | null;
        ariaRoleDescription: string | null;
        ariaRowCount: string | null;
        ariaRowIndex: string | null;
        ariaRowSpan: string | null;
        ariaSelected: string | null;
        ariaSetSize: string | null;
        ariaSort: string | null;
        ariaValueMax: string | null;
        ariaValueMin: string | null;
        ariaValueNow: string | null;
        ariaValueText: string | null;
        role: string | null;
        animate(keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions): Animation;
        getAnimations(options?: GetAnimationsOptions): Animation[];
        after(...nodes: (Node | string)[]): void;
        before(...nodes: (Node | string)[]): void;
        remove(): void;
        replaceWith(...nodes: (Node | string)[]): void;
        innerHTML: string;
        readonly nextElementSibling: Element | null;
        readonly previousElementSibling: Element | null;
        readonly childElementCount: number;
        readonly children: HTMLCollection;
        readonly firstElementChild: Element | null;
        readonly lastElementChild: Element | null;
        append(...nodes: (Node | string)[]): void;
        prepend(...nodes: (Node | string)[]): void;
        querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
        querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
        querySelector<K extends keyof MathMLElementTagNameMap>(selectors: K): MathMLElementTagNameMap[K] | null;
        querySelector<K extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K): HTMLElementDeprecatedTagNameMap[K] | null;
        querySelector<E extends Element = Element>(selectors: string): E | null;
        querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
        querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>;
        querySelectorAll<K extends keyof MathMLElementTagNameMap>(selectors: K): NodeListOf<MathMLElementTagNameMap[K]>;
        querySelectorAll<K extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K): NodeListOf<HTMLElementDeprecatedTagNameMap[K]>;
        querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
        replaceChildren(...nodes: (Node | string)[]): void;
        readonly assignedSlot: HTMLSlotElement | null;
        readonly attributeStyleMap: StylePropertyMap;
        readonly style: CSSStyleDeclaration;
        contentEditable: string;
        enterKeyHint: string;
        inputMode: string;
        readonly isContentEditable: boolean;
        onabort: ((this: GlobalEventHandlers, ev: UIEvent) => any) | null;
        onanimationcancel: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationend: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationiteration: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationstart: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onauxclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onbeforeinput: ((this: GlobalEventHandlers, ev: InputEvent) => any) | null;
        onbeforetoggle: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onblur: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null;
        oncancel: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncanplay: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncanplaythrough: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onclose: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncontextmenu: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        oncopy: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        oncuechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncut: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        ondblclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        ondrag: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragend: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragenter: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragleave: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragover: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragstart: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondrop: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondurationchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onemptied: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onended: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onerror: OnErrorEventHandler;
        onfocus: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null;
        onformdata: ((this: GlobalEventHandlers, ev: FormDataEvent) => any) | null;
        ongotpointercapture: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        oninput: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oninvalid: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onkeydown: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onkeypress: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onkeyup: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onload: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadeddata: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadedmetadata: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onlostpointercapture: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onmousedown: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseenter: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseleave: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmousemove: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseout: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseover: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseup: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onpaste: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        onpause: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onplay: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onplaying: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onpointercancel: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerdown: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerenter: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerleave: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointermove: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerout: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerover: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerup: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onprogress: ((this: GlobalEventHandlers, ev: ProgressEvent) => any) | null;
        onratechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onreset: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onresize: ((this: GlobalEventHandlers, ev: UIEvent) => any) | null;
        onscroll: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onscrollend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onsecuritypolicyviolation: ((this: GlobalEventHandlers, ev: SecurityPolicyViolationEvent) => any) | null;
        onseeked: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onseeking: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselect: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselectionchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselectstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onslotchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onstalled: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onsubmit: ((this: GlobalEventHandlers, ev: SubmitEvent) => any) | null;
        onsuspend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontimeupdate: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontoggle: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontouchcancel?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchend?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchmove?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchstart?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontransitioncancel: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionend: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionrun: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionstart: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        onvolumechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwaiting: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationiteration: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkittransitionend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwheel: ((this: GlobalEventHandlers, ev: WheelEvent) => any) | null;
        autofocus: boolean;
        readonly dataset: DOMStringMap;
        nonce?: string;
        tabIndex: number;
        blur(): void;
        focus(options?: FocusOptions): void;
    };
    observedAttributes: string[];
    define(tag: string, registry?: CustomElementRegistry): void;
};
export { DEV_MODE, component, $, autoEffects, highlightTargets, DebugElement };
