# remark-link-card-plus

[![CI](https://github.com/okaryo/remark-link-card-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/okaryo/remark-link-card-plus/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/remark-link-card-plus)](https://www.npmjs.com/package/remark-link-card-plus)

[remark](https://github.com/remarkjs/remark) plugin to convert text links to link cards, building upon and improving [remark-link-card](https://github.com/gladevise/remark-link-card).

You can see it in action on the [demo page](https://remark-link-card-plus.pages.dev/).

## Features

`remark-link-card-plus` is a fork of the original `remark-link-card` with the following changes:

### Differences from the original:
* **TypeScript support**: Fully rewritten in TypeScript for improved type safety and developer experience.
* **Target blank**: Links in link cards now open in a new tab using `target="_blank"`.
* **No link cards in lists**: Links inside list items (`listItem`) are not converted into link cards.
* **Thumbnail position customization**: Select whether the thumbnail is displayed on the left or right of the card.
* **Optional image and favicon display**: Added `noThumbnail` and `noFavicon` options to hide thumbnails and favicons from link cards.
* **OG data transformer**: The `ogTransformer` option allows customization of Open Graph data such as the title, description, favicon, and image before rendering the link card.

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

```js
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

  console.log(result.value);
})();
```

You can get converted result like this.

```md
# Example Markdown

## Link Card Demo

Bare links like this:

<div class="remark-link-card-plus__container">
  <a href="https://github.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">GitHub · Build and ship software on a single, collaborative platform</div>
        <div class="remark-link-card-plus__description">Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=github.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">github.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="https://github.githubassets.com/assets/home24-5939032587c9.jpg" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

will be converted into a link card.

Inline links like [GitHub](https://github.com) will **not** be converted.
```

### Astro Example

You can also use `remark-link-card-plus` in an [Astro](https://astro.build) project. Below is an example `astro.config.mjs` configuration:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import remarkLinkCard from 'remark-link-card-plus';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [
        remarkLinkCard, {
          cache: true,
          shortenUrl: true,
          thumbnailPosition: "right",
          noThumbnail: false,
          noFavicon: false,
          ogTransformer: (og) => {
            if (og.title === og.description) {
              return { ...og, description: 'custom description' };
            }
            return og;
          }
        },
      ],
    ],
  },
});

// Here is minimal setup.
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkLinkCard],
  },
});
```

## Options

| Option       | Type    | Default | Description                                                                 |
|--------------|---------|---------|-----------------------------------------------------------------------------|
| `cache`      | boolean | `false` | Caches Open Graph images and favicons locally. Images are saved to `process.cwd()/public/remark-link-card-plus/` and paths start with `/remark-link-card-plus/`. This reduces server load on the linked site and improves build performance by avoiding redundant network requests. |
| `shortenUrl` | boolean | `true`  | Displays only the hostname of the URL in the link card instead of the full URL. |
| `thumbnailPosition` | string | `right`  | Specifies the position of the thumbnail in the card. Accepts `"left"` or `"right"`. |
| `noThumbnail` | boolean | `false` | If `true`, does not display the Open Graph thumbnail image. The generated link card HTML will not contain an `<img>` tag for the thumbnail. |
| `noFavicon`   | boolean | `false` | If `true`, does not display the favicon in the link card. The generated link card HTML will not contain an `<img>` tag for the favicon. |
| `ogTransformer` | `(og: OgData) => OgData` | `undefined` | A callback to transform the Open Graph data before rendering. `OgData` has the structure `{ title: string; description: string; faviconUrl?: string; imageUrl?: string }`. |

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
