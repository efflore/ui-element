# ui-element.js

UIElement - the "look ma, no JS framework!" library bringing signals-based reactivity to vanilla Web Components

Version 0.8.5

## What is UIElement?

`UIElement` is a base class for your reactive Web Components. It extends the native `HTMLElement` class and adds a public property and a few methods that allow you to implement inter- and intra-component reactivity with ease. You extend the base class `UIElement` and call the static `define()` method on it to register a tag name in the `CustomElementsRegistry`.

`UIElement` will parse attributes in the `attributeChangedCallback()` and assign the values to reactive states according to the mapping to key and primitive type in the `attributeMap` property of your component. By declaratively setting `static observedAttributes` and `static attributeMap` you will almost never have to override `attributeChangedCallback()`. Your reactive states will be automatically setup with initial values from attributes.

`UIElement` implements a `Map`-like interface on top of `HTMLElement` to access and modify reactive states. The method names `this.has()`, `this.get()`, `this.set()` and `this.delete()` feel familar to JavaScript developers and mirror what you already know.

To bind events on, pass states to, and execute effects on elements, UIElement offers a chainable API on `this.self`, `this.first(selector)` or `this.all(selector)` with a `map()` method - just like arrays.

For example, `this.self.map(on('click', () => this.set('clicked', true))` binds an event handler for `'click'` on the custom element itself, setting its `'clicked'` state to `true`. With `this.all('sub-component').map(pass({ color: 'color' }))` you pass the `'color'` state on `this` to every instance of `<sub-component>` in the DOM subtree.

There are 7 pre-defined auto-effects that can be applied on elements with `this.[self|first(selector)|all(selector)].map()`:

- `setText(state)`: set text content of the target element to the value of state; expects a state of type string; will preserve comment nodes inside the element
- `setProperty(key, state=key)`: set a property of the target element to the value of state; accepts a state of any type
- `setAttribute(name, state=name)`: set or remove an attribute on the element to the value of state; expects a state of type string (set) or undefined (remove)
- `toggleAttribute(name, state=name)`: toggles a boolean attribute on the element according to the value of state; expects a state of type boolean
- `toggleClass(token, state=token)`: toggles a class on the element according to the value of state; expects a state of type boolean
- `setStyle(prop, state=prop)`: set an inline style on the element to the value of state; expects a state of type string for the CSS property value
- `emit(event, state=event)`: dispatch a custom event with the value of state as detail; accepts a state of any type

You can define custom effects with `effect()`, either in the `connectedCallback()` or in a mapped function on `this.[self|first(selector)|all(selector)]`. `UIElement` will automatically trigger these effects and bundle the fine-grained DOM updates.

`UIElement` is fast. In fact, faster than any JavaScript framework. Only direct fine-grained DOM updates in vanilla JavaScript can beat its performance. But then, you have no loose coupling of components and need to parse attributes and track changes yourself. This tends to get tedious and messy rather quickly. `UIElement` provides a structured way to keep your components simple, consistent and self-contained.

`UIElement` is tiny. Around 2kB gzipped over the wire. And it has zero dependiences.

That's all.

## What is UIElement intentionally not?

`UIElement` does not do many of the things JavaScript frameworks do.

Most importantly, it **does not render components**. We suggest, you render components (eighter Light DOM children or Declarative Shadow DOM) on the server side. There are existing solutions like [WebC](https://github.com/11ty/webc) or [Enhance](https://github.com/enhance-dev/enhance) that allow you to declare and render Web Components on the server side with (almost) pure HTML, CSS and JavaScript. `UIElement` is proven to work with either WebC or Enhance. But you could use any tech stack able to render HTML. There is no magic involved besides the building blocks of any website: HTML, CSS and JavaScript. `UIElement` does not make any assumptions about the structure of the inner HTML. In fact, it is up to you to reference inner elements and do fine-grained DOM updates in effects. This also means, there is no new language or format to learn. HTML, CSS and modern JavaScript (ES6) is all you need to know to develop your own web components with `UIElement`.

`UIElement` **does no routing**. It is strictly for single-page applications or reactive islands. But of course, you can reuse the same components on many different pages, effectively creating tailored single-page applications for every route you want to enhance with rich interactivity. We believe, this is the most efficient way to build rich multi-page applications, as only the scripts for the elements used on the current page are loaded, not a huge bundle for the whole app. We also avoid the double-data problem server-side rendering frameworks have, transmitting the initial state as HTML and the data for client-side use again as JSON.

`UIElement` uses no Virtual DOM and doesn't do any dirty-checking or DOM diffing. Consider these approaches by JavaScript frameworks as technical debt, not needed anymore.

⚠️ **Caution**: `UIElement` is so fast because it does only the bare minimum. We don't care about memoization and don't guard against possible glitches introduced by side-effects in computed signals. It's your responsibility to ensure your computed signals and effect callbacks are pure in the sense, that they always produce the same results, no matter how often they are called. It is also up to you to cache the result of expensive function calls before or after you pass it through the reactive signals chain.

## Getting Started

Installation:

```sh
npm install @efflore/ui-element
```

In JavaScript:

```js
import { UIElement, on, setText } from '@efflore/ui-element'

class MyCounter extends UIElement {
  static observedAttributes = ['value']
  attributeMap = {
    value: v => parseInt(v, 10)
  }

  connectedCallback() {
    this.first('.decrement').map(on('click', () => this.set('value', v => --v)))
    this.first('.increment').map(on('click', () => this.set('value', v => ++v)))
    this.first('span').map(setText('value'))
  }
}
MyCounter.define('my-counter')
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
}).define('my-counter')

(class extends UIElement {
  /* ... */
}).define('my-input')

(class extends UIElement {
  /* ... */
}).define('my-slider')
```

Or from client side:

```html
<script type="module" src="js/ui-element.js"></script>
<script defer src="js/my-counter.js"></script>
<script defer src="js/my-input.js"></script>
<script defer src="js/my-slider.js"></script>
```

## Advanced Usage

### Async Signals

Within the reactive chain everything is done synchronously. But you can have async reactive states as source signals. To do so, `set()` a reactive state to a function that creates a `Promise` and returns a fallback value while pending. The `Promise` should resolve by setting its own state to the promised value and reject by setting an error state. When the state is first accessed, the function will be executed. As soon as the promised value is available, dependent effects will be called to update the value.

#### Usage

```js
import { UIElement,  effect } from '@efflore/ui-element';

class LazyLoad extends UIElement {

  connectedCallback() {
    this.set('error', '');
    this.set('content', () => {
      fetch(this.getAttribute('src')) // TODO ensure 'src' attribute is a valid URL from a trusted source
        .then(async response => response.ok
          ? this.set('content', await response.text())
          : this.set('error', response.statusText)) // network request successful, but !response.ok
        .catch(error => this.set('error', error)); // network request failed
      return; // we don't return a fallback value
    });

    effect(() => {
      const error = this.get('error');
      if (!error) return;
      this.querySelector('.loading').remove(); // remove placeholder for pending state
      this.querySelector('.error').textContent = error;
    });

    effect(() => {
      const content = this.get('content');
      if (!content) return;
      const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' }); // we use shadow DOM to encapsulate styles
      shadow.innerHTML = content; // UNSAFE!, use only trusted sources in 'src' attribute
      this.querySelector('.loading').remove(); // remove placeholder for pending state
      this.querySelector('.error').remove(); // won't be needed anymore as request was successful
    });
  }
}
LazyLoad.define('lazy-load');
```

The effect callbacks are executed twice: first doing nothing and then updating as the `Promise` resolves or rejects. In this simple example it would not necessary to pipe `'error'` and `'content'` states through the reactive chain. But this pattern allows you to use the states in other components, for example a `<toast-message>` component to display the error, or to post-process the response text for a derived state, like rendered HTML from Markdown or CSV.

### Context

`UIElement` incorporates a context controller that implements the [Context Community Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) and makes observed contexts available as reactive states.

Context consumers request a context through `ContextRequestEvent`. The events then bubble up until it eventually finds a context provider which provides that specific context. Context provider then return a reactive state as value in the callback function. There's no need to manually subscribe to context changes. As the returned value is a signal, each `effect()` that uses the context will automatically be notified.

#### Context Provider Usage

```js
import { UIElement } from '@efflore/ui-element';

class MotionContext extends UIElement {
  static providedContexts = ['reduced-motion'];

  connectedCallback() {
    const mql = matchMedia('(prefers-reduced-motion)');
    this.set('reduced-motion', mql.matches);
    super.connectedCallback();
    mql.onchange = e => this.set('reduced-motion', e.matches);
  }
}
MotionContext.define('motion-context');
```

#### Context Consumer Usage

```js
import { UIElement, effect } from '@efflore/ui-element';

class MyAnimation extends UIElement {
  static consumedContexts = ['reduced-motion'];

  connectedCallback() {
    super.connectedCallback();
    effect(() => this.get('reduced-motion') ? subtleFadeIn() : pulsateAndMoveAround());
  }
}
MyAnimation.define('my-animation');
```

### Scheduling and Cleanup

If you use `effect()` with a callback function like `() => doMyEffectWork()`, it will do all the work synchronously. That might not be ideal for several reasons:

- If effect work is expensive and takes more time than a single tick, not all DOM updates of the effect might happen concurrently.
- If you `set()` a signal that is used in the effect, you risk producing an infite loop.
- `UIElement` doesn't know which DOM elements are targeted in the effect.

That's why the effect can be broken up into three phases to have more control:

1. *Preparation phase*: Do all the pure computational work and enqueue DOM instructions for concurrent repaint of affected elements.
2. *DOM update phase*: `UIElement` will flush all enqueued DOM instructions.
3. *Cleanup phase*: Returned cleanup function from effect callback will be called outside of tracking context.

An example:

```js
// in connectedCallback()
effect(enqueue => {

  // prepare
  const description = this.querySelector('span')
  const card = this.querySelector('.card')
  const value = this.get('value')

  // schedule for DOM update phase
  enqueue(description, 'text description', el => () => (el.textContent = value))
  enqueue(card, 'class highlight', el => () => el.classList.add('highlight'))

  // cleanup
  return () => setTimeout(() => card.classList.remove('highlight'), 200)
})
```

The second argument for `enqueue()` is an identifier for the DOM instruction. It serves as a key for deduplication within the same tick and as part of the error message if it fails. 

## Complementary Utilities

Since version 0.5.0 we include some additional scripts to complement `UIElement`.

⚠️ **Caution**: These scripts (besides Cause & Effect) are not well tested and are considered work-in-progress. Its API and implementation details might change at any time. We deliberatly don't provide them as installable packages yet, rather as a source of inspiration for you. Feel free to copy and adapt to your needs, at your own risk.

### Cause & Effect

Cause & Effect is the core reactivity engine of `UIElement`. You may also use it stand-alone, indepenent of `UIElement`.

It consists of three functions:

- `cause()` return a getter function for the current value with a `.set()` method to update the value
- `derive()` returns a getter function for the current value of the derived computation
- `effect()` accepts a callback function to be exectuted when used signals change

Cause & Effect is possibly the simplest way to turn JavaScript into a reactive language – with just around 800 bytes gezipped code. By default, Cause & Effect doesn't do any memoization for derived signals but recalculates their current values each time. Contrary to general expectations, this seems to be faster in most cases. If you however are performing expensive work in computed signals or rely on the count of execution times, you should turn memoization on, by setting the second parameter of `derive()` to `true`.

#### Usage Example

```js
import { cause, derive, effect } from './cause-effect'

const count = cause(0) // create a signal
const double = derive(() => count() * 2) // derive a computed signal
effect(() => {
  document.getElementById('my-count').textContent = count() // updates text of <*#my-count>
  document.getElementById('my-double').textContent = double() // updates text of <*#my-double>
})
count.set(42) // sets value of count signal and calls effect
```

[Source](./cause-effect.js)

### Debug Element

`DebugElement` is a base class that extends `UIElement`. It wraps `attributeChangeCallback`, `get()`, `set()`, `delete()`, and `pass()` to log changes to attributes, reads, writes and passes of reactive states to the console, if you set a `debug` boolean attribute on your custom element. This will set a `debug` reactive state on the element instance.

### Visibility Oberserver

Visibility Observer is a showcase how you can add composable functionality to `UIElement` components. It implements a simple `IntersectionObserver` to set a `visible` state as the element becomes visible or hidden. You might use this pattern to postpone expensive rendering or data fetching.

#### Usage

```js
import UIElement from '@efflore/ui-element';
import VisibilityObserver from './src/lib/visibility-observer';

class MyAnimation extends UIElement {

  connectedCallback() {
    super.connectedCallback(); // needed if you use context provider or consumer
    this.visibilityObserver = new VisibilityObserver(this); // sets and updates 'visible' state on `this`
    effect(() => this.get('visible') ? startAnimation() : stopAnimation());
  }

  disconnectedCallback() {
    this.visibilityObserver.disconnect();
  }
}

MyAnimation.define('my-animation');
```

[Source](./src/lib/visibility-observer.ts)