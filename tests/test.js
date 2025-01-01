const fs = require('fs');
const HTMLParser = require('node-html-parser');
const remark = require('remark');
const remarkHtmll = require('remark-html');
const { default: remarkEmbdder } = require('@remark-embedder/core');
const renderToString = require('next-mdx-remote/render-to-string');
const rlc = require('../index.js');

const doc = fs.readFileSync('./tests/fixture.md', 'utf8');

const inlineLinksSample = `
[example](http://example.com/) is inline link

[remark-link-card](https://www.npmjs.com/package/remark-link-card) is inline link
`.trim();

const multipleLinksSample = `
http://example.com/ http://example.com/ http://example.com/
`.trim();

// Bare links are converted link cards.
// test('convert bare links to link cards', async () => {
//   const result = await remark().use(rlc).process(doc);
//   expect(result.contents).toContain('</a>');

//   // console.log(result.contents);
// });

// Inline links are not converted to link cards.
// test('Inline links are not converted to link cards.', async () => {
//   const result = await remark().use(rlc).process(inlineLinksSample);
//   expect(result.contents.trim()).toEqual(inlineLinksSample);

//   // console.log(result.contents);
// });

// // Multiple links in one line are not converted to link cards
// test('Multiple links in one line are not converted to link cards', async () => {
//   const result = await remark().use(rlc).process(multipleLinksSample);
//   expect(result.contents.trim()).toEqual(multipleLinksSample);

//   // console.log(result.contents);
// });

// test('Multiple links in one line are not converted to link cards with next-mdx-remote', async () => {
//   const mdxSource = await renderToString(multipleLinksSample, {
//     mdxOptions: {
//       remarkPlugins: [rlc],
//     },
//   });
//   expect(mdxSource.renderedOutput.trim()).toEqual(
//     `<p><a href="http://example.com/">http://example.com/</a> <a href="http://example.com/">http://example.com/</a> <a href="http://example.com/">http://example.com/</a></p>`.trim()
//   );

//   // console.log(mdxSource.renderedOutput);
// });

// Decode Url
const encodedUrl =
  'https://example.com/%E3%83%86%E3%82%B9%E3%83%88/foo%E3%83%90%E3%83%BC/#%E3%81%AF%E3%81%98%E3%82%81%E3%81%AB';
const decodedUrl = 'https://example.com/テスト/fooバー/#はじめに';
// test('Decode Url', async () => {
//   const result = await remark().use(rlc).process(encodedUrl);

//   expect(result.contents.trim()).toContain(decodedUrl);
//   // console.log(result.contents);
// });

// Use cache ogImage
// test('Use cache ogImage', async () => {
//   const result = await remark()
//     .use(rlc, { cache: true })
//     .process('https://www.npmjs.com/package/remark-link-card');

//   const parsedOutput = HTMLParser.parse(result.contents);
//   const imageElements = parsedOutput.querySelectorAll('img');
//   imageElements.map((element) => {
//     expect(element.getAttribute('src').startsWith('/remark-link-card/')).toBe(
//       true
//     );
//   });
//   // console.log(result.contents);
// });

// Shorten URL
test('Shorten URL', async () => {
  const text = `
## Header Example

* list item example
  * https://github.com
  * list item 2
`;
  const result = await remark()
    .use(rlc, { shortenUrl: true })
    .process(text);

  console.log("-------------")
  console.log(result)
  console.log("-------------")

  expect(result.contents.trim()).toContain(
    '<a class="rlc-container" href="https://www.npmjs.com/package/remark-link-card">'
  );
  expect(result.contents.trim()).toContain(
    '<span class="rlc-url">www.npmjs.com</span>'
  );
  console.log(result.contents);
});

// With remark-embedder
// If remark-embedder conversion data exists, remark-link-card does nothing.
const CodeSandboxTransformer = {
  name: 'CodeSandbox',
  // shouldTransform can also be async
  shouldTransform(url) {
    const { host, pathname } = new URL(url);
    return (
      ['codesandbox.io', 'www.codesandbox.io'].includes(host) &&
      pathname.includes('/s/')
    );
  },
  // getHTML can also be async
  getHTML(url) {
    const iframeUrl = url.replace('/s/', '/embed/');

    return `<iframe src="${iframeUrl}" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>`;
  },
};

const exampleMarkdown = `
This is a CodeSandbox:

https://codesandbox.io/s/css-variables-vs-themeprovider-df90h
`;

const expectedResult = `
<p>This is a CodeSandbox:</p>
<iframe src="https://codesandbox.io/embed/css-variables-vs-themeprovider-df90h" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
`.trim();

// test('Use remark-link-card with remark-embedder', async () => {
//   const result = await remark()
//     .use(remarkEmbdder, {
//       transformers: [CodeSandboxTransformer],
//     })
//     .use(rlc)
//     .use(remarkHtmll)
//     .process(exampleMarkdown);

//   expect(result.contents.trim()).toEqual(expectedResult);
//   // console.log(result.contents);
// });
