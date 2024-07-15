import type IUIElement from "../ui-element";
import autoApply from "./auto-apply";

/* === Constants === */

const HOVER_SUFFIX = 'hover';
const FOCUS_SUFFIX = 'focus';
const EFFECT_CLASS = 'ui-effect';

/* === Exported function === */

/**
 * Add event listeners to UIElement and sub-elements to auto-highlight targets when hovering or focusing on elements with given attribute
 * 
 * @since 0.7.0
 * @param {UIElement} el - UIElement to apply event listeners to
 * @param {string} [className=EFFECT_CLASS] - CSS class to be added to highlighted targets
 */
const highlightTargets = (el: IUIElement, className: string = EFFECT_CLASS) => {
  [HOVER_SUFFIX, FOCUS_SUFFIX].forEach(suffix => {
    const [onOn, onOff] = suffix === HOVER_SUFFIX
      ? ['mouseenter','mouseleave']
      : ['focus', 'blur'];
    autoApply(el, suffix, (
      node: Element,
      value: string
    ): void => {
      const key = value.trim();
      const on = (type: string, force: boolean) =>
        node.addEventListener(type, () => {
          for (const target of el.targets(key))
            target.classList.toggle(className, force);
        });
      on(onOn, true);
      on(onOff, false);
    });
  });
}

export { highlightTargets as default };