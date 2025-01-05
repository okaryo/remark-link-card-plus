# remark-link-card-plus

[Remark](https://github.com/remarkjs/remark) plugin to convert text links to link cards, building upon and improving [remark-link-card](https://github.com/gladevise/remark-link-card).

## Features

`remark-link-card-plus` is a fork of the original `remark-link-card` with the following changes:

### Differences from the original:
* **TypeScript support**: Fully rewritten in TypeScript for improved type safety and developer experience.
* **Target blank**: Links in link cards now open in a new tab using `target="_blank"`.
* **No link cards in lists**: Links inside list items (`listItem`) are not converted into link cards.

### Retained features:
* **Options support**:
  * `cache`: Cache images for faster loading and local storage.
  * `shortenUrl`: Display only the hostname of URLs in link cards.
* **Customizable styling**: Cards can be styled freely using provided class names (note that class names have been slightly updated).

## Install

```sh
npm i remark-link-card-plus
```

## Usage

### Basic Example

```javascript
import { remark } from "remark";
import remarkLinkCard from "remark-link-card-plus";

const exampleMarkdown = `
# Example Markdown

## Link Card Demo

Bare links like this:

https://github.com

will be converted into a link card.

Inline links like [GitHub](https://github.com) will **not** be converted.
`;

(async () => {
  const result = await remark()
    .use(remarkLinkCard, { cache: true, shortenUrl: true })
    .process(exampleMarkdown);

  console.log(result.contents);
})();
```

### Astro Example

You can also use `remark-link-card-plus` in an [Astro](https://astro.build) project. Below is an example `astro.config.mjs` configuration:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkLinkCard from 'remark-link-card-plus';

export default defineConfig({
  integrations: [
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [
      [
        remarkLinkCard, {
          cache: true,
          shortenUrl: true,
        },
      ],
    ],
  },
});
```

## Options

| Option       | Type    | Default | Description                                                                 |
|--------------|---------|---------|-----------------------------------------------------------------------------|
| `cache`      | boolean | `false` | Caches Open Graph images and favicons locally. Images are saved to `process.cwd()/public/remark-link-card-plus/` and paths start with `/remark-link-card-plus/`. This reduces server load on the linked site. |
| `shortenUrl` | boolean | `true`  | Displays only the hostname of the URL in the link card instead of the full URL. |

## Styling

Link cards can be styled using the following class names:

```css
.remark-link-card-plus__container {}

.remark-link-card-plus__card {}

.remark-link-card-plus__main {}

.remark-link-card-plus__content {}

.remark-link-card-plus__title {}

.remark-link-card-plus__description {}

.remark-link-card-plus__meta {}

.remark-link-card-plus__favicon {}

.remark-link-card-plus__url {}

.remark-link-card-plus__thumbnail {}

.remark-link-card-plus__image {}
```

Feel free to customize these styles as needed.

## Demo Page

Check out the [demo page](#) to see `remark-link-card-plus` in action.
