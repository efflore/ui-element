# ui-element.js

UIElement - the "look ma, no JS framework!" library bringing signals-based reactivity to Web Components

## What is UIElement?

`UIElement` is a base class for your reactive Web Components. It extends the native `HTMLElement` class and adds 1 public property and 4 methods that allow you to implement inter- and intra-component reactivity with ease.

It will parse attributes in `attributeChangedCallback()` and assign the values to reactive properties according to the mapping to key and primitive type in the `attributeMapping` property of your component. By declaratively setting `static observedAttributes` and `attributeMapping` you will almost never have to override `attributeChangedCallback()`. Your reactive states will be automatically setup with initial values from attributes.

`UIElement` implements a `Map`-like interface on top of `HTMLElement` to access and modify reactive properties. This allows to use any value as key for reactive properties, as opposed to using direct properties on the element object. This way, we can avoid accidental name clashes with global HTML attributes, JavaScript reserved words or method names and don't have to convert from kebab-case to camelCase and vice versa. The method names `this.has()`, `this.get()`, `this.set()` and `this.delete()` feel familar to JavaScript developers and mirror what you already use to access and modify attributes.

In the `connectedCallback()` you setup references to inner elements, add event listeners and pass reactive properties to sub-components. Additionally, for every independent reactive property you define what happens when it changes with `this.effect()`. `UIElement` will automatically trigger these effects and bundle the surgical DOM updates when the browser refreshes the view.

That's all.

## What is UIElement intentionally not?

UIElement does not do many of the things JavaScript frameworks do.

Most importantly, it does not render components. We suggest, you render components (eighter Light DOM children or Declarative Shadow DOM) on the server side. There are existing solutions like [WebC](https://github.com/11ty/webc) or [Enhance](https://github.com/enhance-dev/enhance) that allow you to declare and render single-file components on the server side with (almost) pure HTML, CSS and JavaScript. UIElement is proven to work with either WebC or Enhance. But you could use any tech stack able to render HTML. There is no magic involved besides the building blocks of any website: HTML, CSS and JavaScript. UIElement does not make any assumptions about the structure of the inner HTML. In fact, it is up to you to reference inner elements and do surgical DOM updates in effects. This also means, there is no new language or format to learn. HTML, CSS and modern JavaScript (ES6) is all you need to know to develop your own web components with UIElement.

UIElement does no routing. It is strictly for single-page applications. But of course, you can reuse the same components on many different pages, effectively creating tailored single-page applications for every pages you want to enhance with rich interactivity. We believe, this is the most efficient way to build rich multi-page applications, as only the scripts for the elements used on the current page are loaded, not a huge bundle for the whole app.

UIElement uses no Virtual DOM and doesn't do any dirty-checking or DOM diffing. Consider these approaches by JavaScript frameworks as technical debt, not needed anymore.

## Getting Started

Installation:

```sh
npm install @efflore/ui-element
```

In JavaScript:

```js
import UIElement from '@efflore/ui-element';

customElements.define('my-counter', class extends UIElement {
  static observedAttributes = ['value'];

  attributeMapping = { value: 'integer' };

  connectedCallback() {
    this.querySelector('.decrement').onclick = () => this.set('value', v => v - 1);
    this.querySelector('.increment').onclick = () => this.set('value', v => v + 1);

    this.effect(() => this.querySelector('span').textContent = this.get('value'));
  }
});
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

Important: Make sure you either bundle JavaScript on the server side or reference the same external module script for UIElement from the client side! Inter-component reactivity won't work because if UIElement is a different instance in multiple modules.

So, for example, for server side:

```js
import UIElement from '@efflore/ui-element';

customElements.define('my-counter', class extends UIElement {
  ...
});

customElements.define('my-input', class extends UIElement {
  ...
});

customElements.define('my-slider', class extends UIElement {
  ...
});
```

Or from client side:

```html
<script type="module" src="js/ui-element.js"></script>
<script defer src="js/my-counter.js"></script>
<script defer src="js/my-input.js"></script>
<script defer src="js/my-slider.js"></script>
```
