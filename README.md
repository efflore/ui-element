# ui-element.js

UIElement - minimal reactive framework based on Web Components

## What is UIElement?

UIElement is a base class for your reactive Web Components.
It extends the native HTMLElement class and adds 1 property and 5 methods that allow you to implement inter- and intra-component reactivity with ease.
It will parse attributes in 'attributeChangedCallback' and assign the values to reactive properties according to the mapping to name and primitive type in the 'attrs' property of your component.
You can define additional reactive properties 'cause()' and define what happens when a reactive property changes 'effect()' in the 'connectedCallback' of your Web Component.
Three helper methods allow you to check whether a reactive property is set 'has()', pass a reactive property to a child component 'pass()', and derive a new value from reactive properties 'derive()'.
That's all.

## What is UIElement intentionally not?

UIElement does not do things other full-fledged frontend or fullstack frameworks do.

Most importantly, it does not render components.
We suggest, you render components (eighter light DOM children or declarative shadow DOM) on the server side.
There are existing solutions like WebC in Eleventy or Enhance that allow you to declare and render single-file components on the server side with (almost) pure HTML, CSS and JavaScript.
UIElement is proven to work with either WebC or Enhance.
But you could use any tech-stack able to render HTML.
There is no magic involved besides the building blocks of any website: HTML, CSS and JavaScript.
UIElement does not make any assumptions about the structure of the inner HTML.
In fact, it is up to you to reference inner elements and do surgical DOM updates in effects.
This also means, there is no new language or format to learn.
You know HTML, CSS and modern JavaScript (ES6), then you know everything you need to know to develop your own web components with UIElement.

UIElement does no routing.
It is strictly for single-page applications.
But of course, you can reuse the same components on many different pages, effectively creating tailored single-page applications for every pages you want to enhance with rich interactivity.
This is the most efficient way to build rich multi-page applications, as only the scripts for the elements used on the current page are loaded, not a huge bundle for the whole app.

UIElement has no virtual DOM and does not do any dirty-checking.
Consider these approaches by other frameworks as technical debt, not needed anymore.

## Getting Started