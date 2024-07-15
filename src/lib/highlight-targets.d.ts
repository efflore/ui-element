import type IUIElement from "../ui-element";
/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 *
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
 */
declare const highlightTargets: (el: IUIElement, className?: string) => void;
export { highlightTargets as default };
