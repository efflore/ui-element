import UIElement from "../ui-element";
import { effect } from "../cause-effect";
import { isDefined } from "../utils";
import autoApply from "./auto-apply";
import $, { TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX } from "./fx-element"; 

/* === Exported function === */

/**
 * Automatically apply effects to UIElement and sub-elements based on its attributes
 * 
 * @since 0.6.0
 * @param {UIElement} el - UIElement to apply effects to
 */
const autoEffects = (el: UIElement) => {

  [TEXT_SUFFIX, PROP_SUFFIX, ATTR_SUFFIX, CLASS_SUFFIX, STYLE_SUFFIX].forEach(suffix => {

    const textCallback = (
      node: Element,
      value: string
    ): void => {
      const key = value.trim();
      const obj = $(node)[suffix];
      const fallback = obj.get();
      el.set(key, fallback, false);
      effect(enqueue => {
        if (el.has(key)) {
          const content = el.get(key);
          enqueue(node, () => obj.set(isDefined(content)
            ? content
            : fallback
          ));
        }
      });
    };

    const keyValueCallback = (
      node: Element,
      v: string
    ): void => {
      const splitted = (
        str: string,
        separator: string
      ) => str.split(separator).map(s => s.trim());
      splitted(v, ';').forEach((value: string) => {
        const [name, key = name] = splitted(value, ':');
        const obj = $(node)[suffix];
        el.set(key, obj.get(), false);
        effect(enqueue => {
          if (el.has(key)) {
            const value = el.get(key);
            enqueue(node, () => obj.set(name, value));
          }
        });
      });
    };

    autoApply(el, suffix, suffix === TEXT_SUFFIX ? textCallback : keyValueCallback);
  });
}

export { autoEffects as default };