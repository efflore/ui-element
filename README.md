# ui-element.js

UIElement - the "look ma, no JS framework!" library bringing signals-based reactivity to vanilla Web Components

Version 0.7.3

## What is UIElement?

`UIElement` is a base class for your reactive Web Components. It extends the native `HTMLElement` class and adds a public property and a few methods that allow you to implement inter- and intra-component reactivity with ease. You extend the base class `UIElement` and call the static `define()` method on it to register a tag name in the `CustomElementsRegistry`.

`UIElement` will parse attributes in the `attributeChangedCallback()` and assign the values to reactive states according to the mapping to key and primitive type in the `attributeMap` property of your component. By declaratively setting `static observedAttributes` and `attributeMap` you will almost never have to override `attributeChangedCallback()`. Your reactive states will be automatically setup with initial values from attributes.

`UIElement` implements a `Map`-like interface on top of `HTMLElement` to access and modify reactive states. The method names `this.has()`, `this.get()`, `this.set()` and `this.delete()` feel familar to JavaScript developers and mirror what you already know.

In the `connectedCallback()` you setup references to inner elements, add event listeners and pass reactive states to subcomponents (`this.pass()`). Additionally, for every independent reactive state you define what happens when it changes in an `effect()` callback. `UIElement` will automatically trigger these effects and bundle the fine-grained DOM updates.

`UIElement` is fast. In fact, faster than any JavaScript framework. Only direct fine-grained DOM updates in vanilla JavaScript can beat its performance. But then, you have no loose coupling of components and need to parse attributes and track changes yourself. This tends to get tedious and messy rather quickly. `UIElement` provides a structured way to keep your components simple, consistent and self-contained.

`UIElement` is tiny. 889 bytes gzipped over the wire. And it has zero dependiences. If you want to understand how it works, you have to study the source code of [one single file](./index.js).

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
import UIElement from '@efflore/ui-element';

class MyCounter extends UIElement {
  static observedAttributes = ['value'];
  attributeMap = { value: v => parseInt(v, 10) };

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

## Advanced Usage

### Async Signals

Within the reactive chain everything is done synchronously. But you can have async reactive states as source signals. To do so, `set()` a reactive state to a function that creates a `Promise` and returns a fallback value while pending. The `Promise` should resolve by setting its own state to the promised value and reject by setting an error state. When the state is first accessed, the function will be executed. As soon as the promised value is available, dependent effects will be called to update the value.

#### Usage

```js
import UIElement, { effect } from '@efflore/ui-element';

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
import UIElement from '@efflore/ui-element';

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
import UIElement from '@efflore/ui-element';

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

If you use `effect()` with a callback function like `() => doMyEffectWork()`, it will do all work synchronously. That might not be ideal for several reasons:

- If effect work is expensive and takes more time than a single tick, not all DOM updates of the effect might happen concurrently.
- If you `set()` a signal which is used in the effect, you risk producing an infite loop.
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
  const description = this.querySelector('span');
  const card = this.querySelector('.card');

  // schedule for DOM update phase
  enqueue(description, () => (description.textContent = this.get('value')));
  enqueue(card, () => card.classList.add('highlight'));

  // cleanup
  return () => setTimeout(() => card.classList.remove('highlight'), 200);
});
```

## Complementary Utilities

Since version 0.5.0 we include some additional scripts to complement `UIElement`.

⚠️ **Caution**: These scripts (besides Cause & Effect) are not well tested and are considered work-in-progress. Its API and implementation details might change at any time. We deliberatly don't provide them as installable packages yet, rather as a source of inspiration for you. Feel free to copy and adapt to your needs, at your own risk.

### Cause & Effect

Cause & Effect is the core reactivity engine of `UIElement`. You may also use it stand-alone, indepenent of `UIElement`.

It consists of three functions:

- `cause()` return a getter function for the current value with a `.set()` method to update the value
- `derive()` returns a getter function for the current value of the derived computation
- `effect()` accepts a callback function to be exectuted when used signals change

Cause & Effect is possibly the simplest way to turn JavaScript into a reactive language – with just 386 bytes gezipped code. By default, Cause & Effect doesn't do any memoization for derived signals but recalculates their current values each time. Contrary to general expectations, this seems to be faster in most cases. If you however are performing expensive work in computed signals or rely on the count of execution times, you should turn memoization on, by setting the second parameter of `derive()` to `true`.

#### Usage Example

```js
import { cause, derive, effect } from './cause-effect';

const count = cause(0); // create a signal
const double = derive(() => count() * 2); // derive a computed signal
effect(() => {
  document.getElementById('my-count').textContent = count(); // updates text of <*#my-count>
  document.getElementById('my-double').textContent = double(); // updates text of <*#my-double>
});
count.set(42); // sets value of count signal and calls effect
```

[Source](./cause-effect.js)

### Component and UI

We embrace progressive enhancement with `UIElement`. You can choose the right abstraction level of the library for your project:

1. **Minimal**: Cause & Effect – just the reactivity engine
2. **Default**: UIElement & Effect – base class for custom elements with a map of reactive states, observed attribute parsing and context controller
3. **Comfort**: Component & UI - boilerplate-reducing function components to create `UIElement` classes with UI wrapper for DOM elements and convenience methods for DOM updates (sort of tiny jQuery)

The last option comes with a bit more library code (around 1.6 kB gzipped), but allows you to write significantly less JavaScript. It's still very small compared to other libraries or full-fledged frameworks.

#### Component Usage

```html
<style>
  my-counter {
    /* ... */
  }
</style>
<my-counter value="42">
  <p>Count: <span>42</span></p>
  <div>
    <button class="decrement">–</button>
    <button class="increment">+</button>
  </div>
</my-counter>
<script type="module">
  import { component, asInteger } from './component';

  component('my-counter', {
    attributeMap: { // static observedAttributes is derived from the keys of optional `attributeMap` object
      value: v => asInteger
    },
    consumedContexts: [], // for static consumedContexts an array of keys can be provided optionally
    providedContexts: [], // for static providedContexts an array of keys can be provided optionally
  },
  (el, my) => {
    // `el` is `this` of your custom element
    // `my` is a UI reference of your custom element
    my.first('.decrement').on('click', () => el.set('value', v => --v));
    my.first('.increment').on('click', () => el.set('value', v => ++v));
    my.first('span').text('value');
  });
</script>
```

Where has the JavaScript gone? – It almost disappeared. To explain the magic:

1. Web Components observe `observedAttributes` and call the `attributeChangedCallback()` (keys of attribute map passed as second parameter)
2. `UIElement` **auto-parses** the `'value'` attribute as an integer and creates a state signal with the same key
3. `my.first('span').text('value');` looks for the first `span` in the DOM sub-tree and **auto-creates** an effect for it
4. `UIElement` **auto-tracks** the use of the `'value'` signal in the effect you did not even write
5. The `on('click')` handlers will increment or decrement the `'value'` signal value on button clicks
6. `UIElement` **auto-runs** the effect you did not even write again with a new `'value'` value
7. The effect knows which element's `textContent` to **auto-update**

 #### UI Usage

You can use the `ui()` function to create a wrapped reference to a DOM element:

```js
import { component, ui } from './component';

component('my-counter', {}, (el, my) => {
  // third parameter of component is called in connectedCallback()
  // `el` is `this` of your custom element
  // `my` is a UI reference of your custom the element with convenience methods to query sub-elements, bind events, and auto-create effects

  // console.log(my()); // calling the UI reference returns the native DOM element
  const count = my.first('.count'); // first does querySelector and returns a UI reference
  el.set('value', count().textContent); // get initial value from textContent instead of observed attribute
  my.first('.decrement').on('click', () => el.set('value', v => --v));
  my.first('.increment').on('click', () => el.set('value', v => ++v));

  // you can explicitly write your own effects ...
  /* effect(enqueue => {
    const double = my.first('.double');
    const value = el.get('value');
    enqueue(count(), () => count().textContent = value);
    enqueue(double(), () => double().textContent = value * 2);
    enqueue(my(), () => my().classList.toggle('odd', value % 2));
  }); */

  // ... or auto-create effects with UI reference methods
  count.text('value');
  el.set('double', () => el.get(value) * 2); // but then you have to first create a derived state for it
  my.first('.double').text('double');
  el.set('odd', () => el.get(value) % 2);
  my.class('odd');
});
```

On `UI` reference objects you can call these utility methods:

- `ref()` returns the native element
- `ref.setText()` replaces text content of element while preserving comment nodes; to be used in effects
- `ref.text()` auto-effect to replace text content while preserving comment nodes in contrast to `element.textContent` assignments
- `ref.prop()` auto-effect to set or delete a property on an element
- `ref.attr()` auto-effect to set or remove an attribute on an element
- `ref.bool()` auto-effect to toggle a boolean attribute on an element
- `ref.class()` auto-effect to add or remove a class on an element
- `ref.style()` auto-effect to set or remove a style property on an element

[Source](./component.js)

### Debug Element

`DebugElement` is a base class that extends `UIElement`. It wraps `attributeChangeCallback`, `get()`, `set()`, `delete()`, and `pass()` to log changes to attributes, reads, writes and passes of reactive states to the console, if you set a `debug` boolean attribute on your custom element. This will set a `debug` reactive state on the element instance.

#### Usage Example

```js
import DebugElement from './lib/debug-element.js';

class MyElement extends DebugElement {
  connectedCallback() {
    this.set('debug', true); // will enable debugging for all instances
    // use the 'debug' boolean attribute to enable debugging just for that specific instance
    super.connectedCallback(); // for context provider / consumer + debug logging
    /* ... */
  }
}
```

Make sure the imports of `UIElement` on the first line points to your installed package and replace the `isDefined` import by the actual function:

```js
import UIElement from '@efflore/ui-element';
const isDefined = value => typeof value !== 'undefined';
```

If you use Debug Element as your base class for custom elements, you may call `super.connectedCallback();` (and the other lifecycle callbacks) to log when your element connects to the DOM.

[Source](./src/lib/debug-element.ts)

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