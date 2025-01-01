# remark-link-card-plus

[Remark](https://github.com/remarkjs/remark) plugin to convert text links to link cards inspired by [gatsby-remark-link-card-plus](https://github.com/JaeYeopHan/gatsby-remark-link-card-plus)

## Requirements

* `Node.js` >= 12

## Install

```sh
npm i remark-link-card-plus
```

## Usage

Here is simple example.

```js
const remark = require('remark')
const rlc = require('remark-link-card-plus')

const exampleMarkdown = `
# remark-link-card-plus

## Bare links

Bare links are converted to link cards.

http://example.com/

https://www.npmjs.com/package/remark-link-card-plus

<http://example.com/>

<https://www.npmjs.com/package/remark-link-card-plus>

## Inline links

Inline links are **not** converted to link cards.

[example](http://example.com/) is inline link

[remark-link-card-plus](https://www.npmjs.com/package/remark-link-card-plus) is inline link

## Multiple links in one line

If there are multiple links in one line, they will **not** be converted to link cards.

http://example.com/ http://example.com/ http://example.com/
`;

(async () => {
 const result = await remark()
  .use(rlc)
  .process(exampleMarkdown)

 console.log(result.contents);
})();
```

You can get converted result like this.

```markdown
# remark-link-card-plus

## Bare links

Bare links are converted to link cards.

<a class="rlc-container" href="http://example.com/">
  <div class="rlc-info">
    <div class="rlc-title">Example Domain</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="https://www.google.com/s2/favicons?domain=example.com" alt="Example Domain favicon" width="16px" height="16px">
      <span class="rlc-url">http://example.com/</span>
    </div>
  </div>
</a>

<a class="rlc-container" href="https://www.npmjs.com/package/remark-link-card-plus">
  <div class="rlc-info">
    <div class="rlc-title">remark-link-card-plus</div>
    <div class="rlc-description">remark plugin to convert literal link to link card</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="https://www.google.com/s2/favicons?domain=www.npmjs.com" alt="remark-link-card-plus favicon" width="16px" height="16px">
      <span class="rlc-url">https://www.npmjs.com/package/remark-link-card-plus</span>
    </div>
  </div>
  <div class="rlc-image-container">
    <img class="rlc-image" src="https://static.npmjs.com/338e4905a2684ca96e08c7780fc68412.png" alt="remark-link-card-plus" width="100%" height="100%"/>
  </div>
</a>

<a class="rlc-container" href="http://example.com/">
  <div class="rlc-info">
    <div class="rlc-title">Example Domain</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="https://www.google.com/s2/favicons?domain=example.com" alt="Example Domain favicon" width="16px" height="16px">
      <span class="rlc-url">http://example.com/</span>
    </div>
  </div>
</a>

<a class="rlc-container" href="https://www.npmjs.com/package/remark-link-card-plus">
  <div class="rlc-info">
    <div class="rlc-title">remark-link-card-plus</div>
    <div class="rlc-description">remark plugin to convert literal link to link card</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="https://www.google.com/s2/favicons?domain=www.npmjs.com" alt="remark-link-card-plus favicon" width="16px" height="16px">
      <span class="rlc-url">https://www.npmjs.com/package/remark-link-card-plus</span>
    </div>
  </div>
  <div class="rlc-image-container">
    <img class="rlc-image" src="https://static.npmjs.com/338e4905a2684ca96e08c7780fc68412.png" alt="remark-link-card-plus" width="100%" height="100%"/>
  </div>
</a>

## Inline links

Inline links are **not** converted to link cards.

[example](http://example.com/) is inline link

[remark-link-card-plus](https://www.npmjs.com/package/remark-link-card-plus) is inline link

## Multiple links in one line

If there are multiple links in one line, they will **not** be converted to link cards.

http://example.com/ http://example.com/ http://example.com/
```

You can style link card like this.

```css
.rlc-container {
  width: 100%;
  max-width: 800px;
  max-height: 120px;
  margin: 0 auto 2rem;

  color: black;
  text-decoration: none;

  border: 1px solid black;
  border-radius: 0.25rem;
  display: flex;
  align-items: stretch;

  transition: background 200ms ease-in-out 0s, box-shadow 200ms ease-in-out 0s;
}

.rlc-container:hover{
  background-color: rgba(80,80,80, 0.1);
  box-shadow: 0 4px 5px 2px rgba(80,80,80, 0.2);
}

.rlc-info {
  overflow: hidden;
  padding: 0.5rem;
  flex: 4 1 100px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.rlc-title {
  font-size: 1.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rlc-description {
  font-size: 0.875rem;
  color: #333;
  overflow: hidden;
  line-height:1rem;
  height: 2rem;
}

.rlc-url-container {
  display: flex;
  align-items: center;
}

.rlc-favicon {
  margin-right: 4px;
  width: 16px;
  height: 16px;
}

.rlc-url {
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.rlc-image-container {
  position: relative;
  flex: 1 1 100px;
}

.rlc-image {
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-bottom-right-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}
```

## API

### `remark().use(rlc[, options])`

Convert text links to link cards.

##### `options`

###### `options.cache`

Cache image for [`next/image`](https://nextjs.org/docs/api-reference/next/image) (`bool`, default:`false`)

Automatically save open graph images and favicon images to `process.cwd()/public/remark-link-card-plus/`.

Automatically insert the path to images starting with `/remark-link-card-plus/` in the src attribute of img tags.

So, if `options.cache` is `true`, the output will look like this.

```markdown
# remark-link-card-plus

## Bare links

Bare links are converted to link cards.

<a class="rlc-container" href="http://example.com/">
  <div class="rlc-info">
    <div class="rlc-title">Example Domain</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="/remark-link-card-plus/87554a1e24413a0d430a2cc8d9c34f7480484021146aec6c0c4a04ac9234eff4" alt="Example Domain favicon" width="16px" height="16px">
      <span class="rlc-url">http://example.com/</span>
    </div>
  </div>
</a>

<a class="rlc-container" href="https://www.npmjs.com/package/remark-link-card-plus">
  <div class="rlc-info">
    <div class="rlc-title">remark-link-card-plus</div>
    <div class="rlc-description">remark plugin to convert literal link to link card</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="/remark-link-card-plus/a7c5d786c782c012d6858ff3722fe7eb4e6ed16c256acb1e94b1f2dfa07eb116" alt="remark-link-card-plus favicon" width="16px" height="16px">
      <span class="rlc-url">https://www.npmjs.com/package/remark-link-card-plus</span>
    </div>
  </div>
  <div class="rlc-image-container">
    <img class="rlc-image" src="/remark-link-card-plus/149ff70d1db431d33579f403c17d9a1bdeba3690260dfa7d268583024e26f772.png" alt="remark-link-card-plus" width="100%" height="100%"/>
  </div>
</a>
```

###### `options.shortenUrl`

Display only hostname of target URL (`bool`, default: `false`)

If `options.shortenUrl` is `true`, the output will look like this.

```markdown
<a class="rlc-container" href="https://www.npmjs.com/package/remark-link-card-plus">
  <div class="rlc-info">
    <div class="rlc-title">remark-link-card-plus</div>
    <div class="rlc-description">remark plugin to convert literal link to link card</div>
    <div class="rlc-url-container">
      <img class="rlc-favicon" src="https://www.google.com/s2/favicons?domain=www.npmjs.com" alt="remark-link-card-plus favicon" width="16px" height="16px">
      <span class="rlc-url">www.npmjs.com</span>
    </div>
  </div>
  <div class="rlc-image-container">
    <img class="rlc-image" src="https://static.npmjs.com/338e4905a2684ca96e08c7780fc68412.png" alt="remark-link-card-plus" width="100%" height="100%"/>
  </div>
</a>
```
