---
# You can also start simply with 'default'
theme: "@kevintyj/design-docs/slides-theme"
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: https://cover.sli.dev
# some information about your slides (markdown enabled)
title: Welcome to Slidev
info: |
  ## Slidev Starter Template
  Presentation slides for developers.

  Learn more at [Sli.dev](https://sli.dev)
# apply unocss classes to the current slide
class: text-start
# https://sli.dev/features/drawing
drawings:
  persist: false
# slide transition: https://sli.dev/guide/animations.html#slide-transitions
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
# open graph
# seoMeta:
#  ogImage: https://cover.sli.dev

layout: default
transition: slide-left
---

---
layout: cover
transition: slide-down
---

## Introducing

# <img src="./icon.png" class="h-20 w-20 inline mr-2"/> @kevinty/design

<template v-slot:footer>
<div class="text-xl text-white relative flex justify-between items-center">
  <div>
    <img src="./l24badgedarkxl.svg" class="h-12 w-12"/>
  </div>
  <div class="relative flex gap-4">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="btn btn-secondary btn-square">
    <carbon:edit />
  </button>
  <a href="https://github.com/slidevjs/slidev" target="_blank" class="btn btn-square flex justify-center items-center">
    <carbon:logo-github />
  </a>
  </div>
</div>
</template>

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---
## layout: default
---

# Creating design systems is tedeous

Managing colors and tokens in multiple different projects across different teams has been hard.

- **Design->Dev handoff**: Going from figma variables to tailwind/css/json formats.
- **Managing and prototyping scales**: Creating accessible, good looking color palettes and spacing scales fast, for any brand.
  - Read more [here](https://ambient.kevintyj.com/)
- **Developer experience**: Maintaining _"Single source of truth"_ for design tokens without 5 different conventions.
  <br>
  <br>

Read more about [why](https://labtwofour.com/blog/)

---
layout: default
transition: fade
---

# @kevinty/design

<div class="grid grid-cols-1 gap-6">


### Generation Packages

| Package                 | Purpose (Output)              | Key Features                                                                    |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| [`color-generation-core`](https://github.com/kevintyj/design/tree/main/packages/color-generation-core) | Core color utilities (object) | Base color generation algorithms, returns object                                |
| [`color-generation-css`](https://github.com/kevintyj/design/tree/main/packages/color-generation-css)  | CSS color output (string)     | Takes output of core and returns an object of strings containing generated files |
| [`color-generation-json`](https://github.com/kevintyj/design/tree/main/packages/color-generation-json) | JSON color export (string)    | Takes output of core and returns an object of strings containing generated files |

</div>

---
layout: default
transition: fade
---

# @kevinty/design

<div class="grid grid-cols-1 gap-6">

### Generation Packages

| Package                   | Purpose                         | Key Features                                                        |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| [`spacing-generation-core`](https://github.com/kevintyj/design/tree/main/packages/spacing-generation-core) | Core spacing utilities (object) | Base spacing conversion to object                                  |
| [`spacing-generation-css`](https://github.com/kevintyj/design/tree/main/packages/spacing-generation-css)  | CSS spacing output (string)     | Takes output of core and returns an object of strings containing generated files                   |
| [`spacing-generation-json`](https://github.com/kevintyj/design/tree/main/packages/spacing-generation-json) | JSON spacing export (string)    | Takes output of core and returns an object of strings containing generated files                  |
| [`figma-to-json`](https://github.com/kevintyj/design/tree/main/packages/figma-to-json)           | Figma integration               | Conversion utils for figma output and json |

</div>

---
layout: default
transition: fade
---

# @kevinty/design

<div class="grid grid-cols-1 gap-6">

### Application Packages

| Package        | Purpose                | Key Features                                                  |
| -------------- | ---------------------- | ------------------------------------------------------------- |
| [`cli`](https://github.com/kevintyj/design/tree/main/packages/cli)          | Command-line interface | Design system generation, validation, multiple output formats |
| [`figma-plugin`](https://github.com/kevintyj/design/tree/main/packages/figma-plugin) | Figma integration      | Interactive UI, variable creation, design system management   |

</div>

---
layout: default
---

# Getting started

- ### Clone
  - `gh clone kevintyj/design`
- ### Install Dependencies
  - `bun install`
- ### Build
  - `bun run build`
- ### CLI
  - `bun run system:all`
  - or `bun run generate`

---
layout: center
class: text-center
transition: slide-up
---

# CLI Demo

---
layout: default
transition: fade
---

# Simple configuration

`base.js`

```js
// Color system configuration
export const constantsLight = {
	gray: "#878780",
	background: "#FFFFFF",
};

export const constantsDark = {
	gray: "#6F6D66",
	background: "#0F0F0E",
};

export const light = {
	blaze: "#FC4B32",
	autumn: "#311318",
  // Other colors
};

export const dark = {
	blaze: "#FD563D",
	autumn: "#30181B",
  // Other colors
};
```

---
layout: default
---

# Simple configuration

`base.js` (continued)

```js 
// Spacing system configuration
export const spacingMultiplier = 4;
export const remValue = 16; // Base font size for rem calculations

export const spacing = {
	"0": 0, // 0px
	"1px": 1, // absolute 1px
  "1": 4, // 1 * 4 = 4px
  // Other spacing values
};
```

---
layout: default
transition: fade
---

# Setting up requires a simple, compact config file

`figma-color.json`

```json
{
  "constantsLight": {
    "gray": "#878780",
    "background": "#FFFFFF"
  },
  "constantsDark": {
    "gray": "#6F6D66",
    "background": "#0F0F0E"
  },
  "light": {
    "blaze": "#FC4B32",
    "pink": "#F9486F"
  },
  "dark": {
    "blaze": "#FD563D",
    "pink": "#F55776"
  }
}
```

---
## layout: default
---

# Setting up requires a simple, compact config file

`figma-spacing.json`

```json
{
  "spacingMultiplier": 4,
  "remValue": 16,
  "spacing": {
    "0": 0,
    "px": 1,
    "2px": 2,
    "3px": 3,
    "1": 4,
    "5px": 5,
    "2": 8
  }
}
```


---
layout: center
class: text-center
transition: slide-up
---

# Figma Demo


---
layout: cover
---

# Learn More

[Documentation & Repository](https://github.com/kevintyj/design) · [Blog](https://labtwofour.com/blog)

github.com/kevintyj/design · labtwofour.com/blog


<template v-slot:footer>
<div class="text-xl text-white relative flex justify-between items-center">
  <div>
    <img src="./l24badgedarkxl.svg" class="h-12 w-12"/>
  </div>
  <div class="relative flex gap-4">
  <a href="https://github.com/slidevjs/slidev" target="_blank" class="btn btn-square flex justify-center items-center">
    <carbon:logo-github />
  </a>
  </div>
</div>
</template>