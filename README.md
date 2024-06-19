# ui-element.js

UIElement - the "look ma, no JS framework!" library bringing signals-based reactivity to vanilla Web Components

## What is UIElement?

`UIElement` is a base class for your reactive Web Components. It extends the native `HTMLElement` class and adds 1 static function, 1 public property and 5 methods that allow you to implement inter- and intra-component reactivity with ease. You extend the base class `UIElement` and call the static `define()` function on it to register a tag name in the `CustomElementsRegistry`.

`UIElement` will parse attributes in the `attributeChangedCallback()` and assign the values to reactive states according to the mapping to key and primitive type in the `attributeMap` property of your component. By declaratively setting `static observedAttributes` and `attributeMap` you will almost never have to override `attributeChangedCallback()`. Your reactive states will be automatically setup with initial values from attributes.

`UIElement` implements a `Map`-like interface on top of `HTMLElement` to access and modify reactive states. After the reactive state has been created via an observed attribute or `this.set()`, you may use property accessors as a shorthand. We don't auto-convert from kebab-case to camelCase and vice versa, though. The method names `this.has()`, `this.get()`, `this.set()` and `this.delete()` and the property accessors feel familar to JavaScript developers and mirror what you already know.

In the `connectedCallback()` you setup references to inner elements, add event listeners and pass reactive states to sub-components. Additionally, for every independent reactive state you define what happens when it changes in ther callback of `this.effect()`. `UIElement` will automatically trigger these effects and bundle the surgical DOM updates when the browser refreshes the view on the next animation frame.

`UIElement` is fast. In fact, faster than any JavaScript framework. Only direct surgical DOM updates in vanilla JavaScript can beat its performance. But then, you have no loose coupling of components and need to parse attributes and track changes yourself. This tends to get tedious and messy rather quickly. `UIElement` provides a structured way to keep your components simple, consistent and self-contained.

`UIElement` is tiny. 644 bytes gzipped over the wire. And it has zero dependiences. If you want to understand how it works, you have to study the source code of [one single file](./index.js).

That's all.

## What is UIElement intentionally not?

`UIElement` does not do many of the things JavaScript frameworks do.

Most importantly, it does not render components. We suggest, you render components (eighter Light DOM children or Declarative Shadow DOM) on the server side. There are existing solutions like [WebC](https://github.com/11ty/webc) or [Enhance](https://github.com/enhance-dev/enhance) that allow you to declare and render Web Components on the server side with (almost) pure HTML, CSS and JavaScript. `UIElement` is proven to work with either WebC or Enhance. But you could use any tech stack able to render HTML. There is no magic involved besides the building blocks of any website: HTML, CSS and JavaScript. `UIElement` does not make any assumptions about the structure of the inner HTML. In fact, it is up to you to reference inner elements and do surgical DOM updates in effects. This also means, there is no new language or format to learn. HTML, CSS and modern JavaScript (ES6) is all you need to know to develop your own web components with `UIElement`.

`UIElement` does no routing. It is strictly for single-page applications or reactive islands. But of course, you can reuse the same components on many different pages, effectively creating tailored single-page applications for every page you want to enhance with rich interactivity. We believe, this is the most efficient way to build rich multi-page applications, as only the scripts for the elements used on the current page are loaded, not a huge bundle for the whole app.

`UIElement` uses no Virtual DOM and doesn't do any dirty-checking or DOM diffing. Consider these approaches by JavaScript frameworks as technical debt, not needed anymore.

A warning: `UIElement` is so fast because it does only the bare minimum. We don't care about memoization and don't guard against possible glitches introduced by side-effects in computed signals. It's your responsability to ensure your computed signals and effect callbacks are pure in the sense, that they always produce the same results, no matter how often they are called. It is also up to you to cache the result of expensive function calls before or after you pass it through the reactive signals chain.

## Getting Started

Installation:

```sh
npm install @efflore/ui-element
```

In JavaScript:

```js
import UIElement from '@efflore/ui-element';

(class extends UIElement {
  static observedAttributes = ['value'];
  attributeMap = new Map([['value', 'integer']]);

  connectedCallback() {
    this.querySelector('.decrement').onclick = () => this.value = v => --v;
    this.querySelector('.increment').onclick = () => this.value = v => ++v;

    this.effect(() => this.querySelector('span').textContent = this.value);
  }
}).define('my-counter');
```

In HTML:

```html
<style>
  my-counter {
    display: flex;
    flex-direction: row;
    gap: 1rem;

    p {
      margin-block: 0.2rem;
    }
  }
</style>
<my-counter value="42">
  <p>Count: <span>42</span></p>
  <div>
    <button class="decrement">–</button>
    <button class="increment">+</button>
  </div>
</my-counter>
<script type="module" src="index.js"></script>
```

Important: Make sure you either bundle JavaScript on the server side or reference the same external module script for `UIElement` from the client side! Inter-component reactivity won't work because if `UIElement` is a different instance in multiple modules.

So, for example, for server side:

```js
import UIElement from '@efflore/ui-element';

(class extends UIElement {
  ...
}).define('my-counter');

(class extends UIElement {
  ...
}).define('my-input');

(class extends UIElement {
  ...
}).define('my-slider');
```

Or from client side:

```html
<script type="module" src="js/ui-element.js"></script>
<script defer src="js/my-counter.js"></script>
<script defer src="js/my-input.js"></script>
<script defer src="js/my-slider.js"></script>
```
