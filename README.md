# ui-element.js

UIElement - the "look ma, no JS framework!" library bringing signals-based reactivity to vanilla Web Components

## What is UIElement?

`UIElement` is a base class for your reactive Web Components. It extends the native `HTMLElement` class and adds a public property and a few methods that allow you to implement inter- and intra-component reactivity with ease. You extend the base class `UIElement` and call the static `define()` method on it to register a tag name in the `CustomElementsRegistry`.

`UIElement` will parse attributes in the `attributeChangedCallback()` and assign the values to reactive states according to the mapping to key and primitive type in the `attributeMap` property of your component. By declaratively setting `static observedAttributes` and `attributeMap` you will almost never have to override `attributeChangedCallback()`. Your reactive states will be automatically setup with initial values from attributes.

`UIElement` implements a `Map`-like interface on top of `HTMLElement` to access and modify reactive states. The method names `this.has()`, `this.get()`, `this.set()` and `this.delete()` feel familar to JavaScript developers and mirror what you already know.

In the `connectedCallback()` you setup references to inner elements, add event listeners and pass reactive states to sub-components (`this.pass()`). Additionally, for every independent reactive state you define what happens when it changes in the callback of `this.effect()`. `UIElement` will automatically trigger these effects and bundle the surgical DOM updates when the browser refreshes the view on the next animation frame.

`UIElement` is fast. In fact, faster than any JavaScript framework. Only direct surgical DOM updates in vanilla JavaScript can beat its performance. But then, you have no loose coupling of components and need to parse attributes and track changes yourself. This tends to get tedious and messy rather quickly. `UIElement` provides a structured way to keep your components simple, consistent and self-contained.

`UIElement` is tiny. 626 bytes gzipped over the wire. And it has zero dependiences. If you want to understand how it works, you have to study the source code of [one single file](./index.js).

That's all.

## What is UIElement intentionally not?

`UIElement` does not do many of the things JavaScript frameworks do.

Most importantly, it does not render components. We suggest, you render components (eighter Light DOM children or Declarative Shadow DOM) on the server side. There are existing solutions like [WebC](https://github.com/11ty/webc) or [Enhance](https://github.com/enhance-dev/enhance) that allow you to declare and render Web Components on the server side with (almost) pure HTML, CSS and JavaScript. `UIElement` is proven to work with either WebC or Enhance. But you could use any tech stack able to render HTML. There is no magic involved besides the building blocks of any website: HTML, CSS and JavaScript. `UIElement` does not make any assumptions about the structure of the inner HTML. In fact, it is up to you to reference inner elements and do surgical DOM updates in effects. This also means, there is no new language or format to learn. HTML, CSS and modern JavaScript (ES6) is all you need to know to develop your own web components with `UIElement`.

`UIElement` does no routing. It is strictly for single-page applications or reactive islands. But of course, you can reuse the same components on many different pages, effectively creating tailored single-page applications for every page you want to enhance with rich interactivity. We believe, this is the most efficient way to build rich multi-page applications, as only the scripts for the elements used on the current page are loaded, not a huge bundle for the whole app.

`UIElement` uses no Virtual DOM and doesn't do any dirty-checking or DOM diffing. Consider these approaches by JavaScript frameworks as technical debt, not needed anymore.

⚠️ **Caution**: `UIElement` is so fast because it does only the bare minimum. We don't care about memoization and don't guard against possible glitches introduced by side-effects in computed signals. It's your responsability to ensure your computed signals and effect callbacks are pure in the sense, that they always produce the same results, no matter how often they are called. It is also up to you to cache the result of expensive function calls before or after you pass it through the reactive signals chain.

## Getting Started

Installation:

```sh
npm install @efflore/ui-element
```

In JavaScript:

```js
import UIElement from '@efflore/ui-element';

class MyCounter extends UIElement {
  static observedAttributes = ['value'];
  attributeMap = new Map([['value', 'integer']]);

  connectedCallback() {
    this.querySelector('.decrement').onclick = () => this.set('value', v => --v);
    this.querySelector('.increment').onclick = () => this.set('value', v => ++v);
    this.effect(() => this.querySelector('span').textContent = this.get('value'));
  }
}

MyCounter.define('my-counter');
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

⚠️ **Caution**: Make sure you either bundle JavaScript on the server side or reference the same external module script for `UIElement` from the client side! Inter-component reactivity won't work because if `UIElement` is a different instance in multiple modules.

So, for example, for server side:

```js
import UIElement from '@efflore/ui-element';

(class extends UIElement {
  /* ... */
}).define('my-counter');

(class extends UIElement {
  /* ... */
}).define('my-input');

(class extends UIElement {
  /* ... */
}).define('my-slider');
```

Or from client side:

```html
<script type="module" src="js/ui-element.js"></script>
<script defer src="js/my-counter.js"></script>
<script defer src="js/my-input.js"></script>
<script defer src="js/my-slider.js"></script>
```

## Complementary Utilities

As of version 0.5.0 we include some additional scripts to complement `UIElement`.

⚠️ **Caution**: These scripts (besides Cause & Effect) are not well tested and are considered work-in-progress. Its API and implementation details might change at any time. We deliberatly don't provide them as installable packages yet, rather as a source of inspiration for you. Feel free to copy and adapt to your needs, at your own risk.

### Cause & Effect

Cause & Effect is the core reactivity engine of `UIElement`. You may also use it stand-alone, indepenent of `UIElement`.

It consists of three functions:

- `cause()` creates an object with `.get()` and `.set()` methods, duck-typing `Signal.State` objects
- `derive()` creates an object with a `.get()` method, duck-typing `Signal.Computed` objects
- `effect()` accepts a callback function to be exectuted when used signals change

Unlike the [TC39 Signals Proposal](https://github.com/tc39/proposal-signals), Cause & Effect uses a much simpler push-based approach, effectively just decorator functions around signal getters and setters. All work till DOM updates is done synchronously and eagerly. As long as your computed functions are pure and DOM side effects are kept to a minimum, this should pose no issues and is even faster than doing all the checks, memoization and scheduling in the more sophisticated push-then-pull approach of the Signals Proposal.

If you however want to use side-effects or expensive work in computed function or updating / rendering in the DOM in effects takes longer than an animation frame, you might encounter glitches. If that's what you are doing, you are better off with a mature, full-fledged JavaScript framework.

That said, we plan to offer a `UIElement` version with the Signals Proposal Polyfill instead of Cause & Effect in future versions as a drop-in replacement with the same API. As the Signals Proposal is still in early stage and they explicitely warn not to use the polyfill in production, we decided to do that not yet.

#### Usage

Stand-alone:

```js
import { cause, derive, effect } from './lib/cause-effect';
```

[Source](./lib/cause-effect.js)

In `UIElement`:

```js
import UIElement, { cause, derive } from '@efflore/ui-element';
```

The `effect()` function is a member method of `UIElement`. Unlike the stand-alone version it defers the execution of side-effects to the next animation frame. There's no point in updating the DOM earlier or more often than it could possibly be visible to the end-user. If you really need an synchronously executed effect, you may implemenent it like this:

```js
const effect = fn => derive(fn).get();
```

[Source](./index.js)

### Debug Element

`DebugElement` is a base class that extends `UIElement`. It wraps `attributeChangeCallback`, `get()`, `set()` to log changes to attributes, signal reads and writes to the console, if you set the `debug` property of your custom element to `true`.

#### Usage

```js
import DebugElement from './lib/debug-element.js';

class MyElement extends DebugElement {
  debug = true;
  /* ... */
}
```

Make sure the import of `UIElement` on the first line points to your installed package:

```js
import UIElement from '@efflore/ui-element';
```

[Source](./lib/debug-element.js)

### DOM Update

A few utility functions for surgical DOM updates in effects that streamline the interface and save tedious existance and change checks:

- `updateText()` preserves comment nodes in contrast to `element.textContent` assignments
- `updateProperty()` sets or deletes a property on an element
- `updateAttribute()` sets or removes an attribute on an element
- `toggleClass()` adds or removes a class on an element
- `updateStyle()` sets or removes a style property on an element

These utility function try to minimize DOM updates to the necessary. But of course, you can also use regular DOM API methods, as you interact with real DOM elements, not an abstraction thereof. If you know for sure, the target element exists, the passed value is valid and the DOM needs to be updated every time the source state changes, you may bypass the additional checks by these utility functions and use native DOM APIs instead.

#### Usage

```js
import { updateText, updateProperty, updateAttribute, toggleClass, updateStyle } from './lib/dom-update';
```

[Source](./lib/dom-update.js)

### Context Controller

Context Controller implements the [Context Community Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) and makes observed contexts available as reactive states. It provides three classes:

- `ContextRequestEvent` are dispatched from context comsumers and listened to by context providers
- `ContextProvider` expose consumable contexts through a static `providedContexts` array of context keys
- `ContextConsumer` request consumable contexts set in a static `observedContexts` array of context keys

#### Context Provider Usage

```js
import UIElement from '@efflore/ui-element';
import { ContextProvider } from './lib/context-controller';

class MotionContext extends UIElement {
  static providedContexts = ['reduced-motion'];

  connectedCallback() {
    this.contextProvider = new ContextProvider(this);
    const mql = matchMedia('(prefers-reduced-motion)');
    this.set('reduced-motion', mql.matches);
    mql.onchange = e => this.set('reduced-motion', e.matches);
  }

  disconnectedCallback() {
    this.contextProvider.disconnect();
  }
}

MotionContext.define('motion-context');
```

#### Context Consumer Usage

```js
import UIElement from '@efflore/ui-element';
import { ContextConsumer } from './lib/context-consumer';

class MyAnimation extends UIElement {
  static observedContexts = ['reduced-motion'];

  connectedCallback() {
    this.contextConsumer = new ContextConsumer(this);
    this.effect(() => this.get('reduced-motion') ? this.#subtleFadeIn() : this.#pulsateAndMoveAround());
  }

  disconnectedCallback() {
    this.contextConsumer.disconnect();
  }
}

MyAnimation.define('my-animation');
```

[Source](./lib/context-controller.js)

### Visibility Oberserver

Visibility Observer is a showcase how you can add composable functionality to `UIElement` components. It implements a simple `IntersectionObserver` to set a `visible` state as the element becomes visible or hidden. You might use this pattern to postpone expensive rendering or data fetching.

#### Usage

```js
import UIElement from '@efflore/ui-element';
import VisibilityObserver from './lib/visibility-observer';

class MyAnimation extends UIElement {

  connectedCallback() {
    this.visibilityObserver = new VisibilityObserver(this); // sets and updates 'visible' state on `this`
    this.effect(() => this.get('visible') ? this.#startAnimation() : this.#stopAnimation());
  }

  disconnectedCallback() {
    this.visibilityObserver.disconnect();
  }
}

MyAnimation.define('my-animation');
```

[Source](./lib/visibility-observer.js)