const visit = require('unist-util-visit');
const ogs = require('open-graph-scraper');
const path = require('path');
const { writeFile, access, mkdir } = require('fs').promises;
const fetch = require('node-fetch');
const he = require('he');
const { createHash } = require('crypto');

const defaultSaveDirectory = 'public';
const defaultOutputDirectory = '/remark-link-card-plus/';

const rlc = (options) => {
  return async (tree) => {
    transformers = [];
    visit(tree, 'paragraph', (paragraphNode, index) => {
      if (paragraphNode.children.length !== 1) {
        return tree;
      }

      // If data exists, do nothing.
      if (paragraphNode && paragraphNode.data !== undefined) {
        return tree;
      }

      visit(paragraphNode, 'text', (textNode) => {
        const urls = textNode.value.match(
          /(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/g
        );
        if (urls && urls.length === 1) {
          transformers.push(async () => {
            // fetch data
            const data = await fetchData(urls[0], options);

            // create linkCardNode
            const linkCardHtml = createLinkCard(data);
            const linkCardNode = {
              type: 'html',
              value: linkCardHtml,
            };

            // Replace paragraph node with linkCardNode
            tree.children.splice(index, 1, linkCardNode);
          });
        }
      });
    });

    try {
      await Promise.all(transformers.map((t) => t()));
    } catch (error) {
      console.error(`[remark-link-card-plus] Error: ${error}`);
    }

    return tree;
  };
};

const getOpenGraph = async (targetUrl) => {
  try {
    const { result } = await ogs({ url: targetUrl, timeout: 10000 });
    return result;
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Failed to get the Open Graph data of ${error.result.requestUrl} due to ${error.result.error}.`
    );
    return undefined;
  }
};

const fetchData = async (targetUrl, options) => {
  // get open graph
  const ogResult = await getOpenGraph(targetUrl);
  // set title
  const parsedUrl = new URL(targetUrl);
  const title =
    (ogResult && ogResult.ogTitle && he.encode(ogResult.ogTitle)) ||
    parsedUrl.hostname;
  // set description
  const description =
    (ogResult && ogResult.ogDescription && he.encode(ogResult.ogDescription)) ||
    '';
  // set favicon src
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}`;
  let faviconSrc = '';
  if (options && options.cache) {
    faviconFilename = await downloadImage(
      faviconUrl,
      path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory)
    );
    faviconSrc =
      faviconFilename && path.join(defaultOutputDirectory, faviconFilename);
  } else {
    faviconSrc = faviconUrl;
  }
  // set open graph image src
  let ogImageSrc = '';
  if (ogResult && ogResult.ogImage && ogResult.ogImage.url) {
    if (options && options.cache) {
      const imageFilename = await downloadImage(
        ogResult.ogImage.url,
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory)
      );
      ogImageSrc =
        imageFilename && path.join(defaultOutputDirectory, imageFilename);
    } else {
      ogImageSrc = ogResult.ogImage.url;
    }
  }
  // set open graph image alt
  const ogImageAlt =
    // (ogResult && ogResult.ogImage && ogResult.ogImage.alt) || title;
    (ogResult &&
      ogResult.ogImage &&
      ogResult.ogImage.alt &&
      he.encode(ogResult.ogImage.alt)) ||
    title;

  // set display url
  let displayUrl =
    options && options.shortenUrl ? parsedUrl.hostname : targetUrl;

  try {
    displayUrl = decodeURI(displayUrl);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Cannot decode url: "${url}"\n ${error}`
    );
  }

  return {
    title,
    description,
    faviconSrc,
    ogImageSrc,
    ogImageAlt,
    displayUrl,
    url: targetUrl,
  };
};

const createLinkCard = (data) => {
  // create favicon element
  const faviconElement = data.faviconSrc
    ? `<img class="rlc-favicon" src="${data.faviconSrc}" alt="${data.title} favicon" width="16" height="16">`.trim()
    : '';

  // create description element
  const descriptionElement = data.description
    ? `<div class="rlc-description">${data.description}</div>`
    : '';

  // create image element
  const imageElement = data.ogImageSrc
    ? `<div class="rlc-image-container">
      <img class="rlc-image" src="${data.ogImageSrc}" alt="${data.ogImageAlt}" />
    </div>`.trim()
    : '';

  // create output HTML
  const outputHTML = `
<a class="rlc-container" href="${data.url}">
  <div class="rlc-info">
    <div class="rlc-title">${data.title}</div>
    ${descriptionElement}
    <div class="rlc-url-container">
      ${faviconElement}
      <span class="rlc-url">${data.displayUrl}</span>
    </div>
  </div>
  ${imageElement}
</a>
`.trim();

  return outputHTML;
};

const downloadImage = async (url, saveDirectory) => {
  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Failed to parse url "${url}"\n ${error}`
    );
  }
  const hash = createHash("sha256").update(decodeURI(targetUrl.href)).digest("hex");
  const filename = hash + path.extname(targetUrl.pathname);
  const saveFilePath = path.join(saveDirectory, filename);
  // check file existence(if it is existed, return filename)
  try {
    await access(saveFilePath);
    return filename;
  } catch (error) {}
  // check directory existence
  try {
    await access(saveDirectory);
  } catch (error) {
    // create directory if it is not existed
    await mkdir(saveDirectory, { recursive: true });
  }

  // fetch data
  try {
    const response = await fetch(targetUrl.href, {
      header: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
      },
      timeout: 10000,
    });
    const buffer = await response.buffer();
    writeFile(saveFilePath, buffer);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Failed to download image from ${targetUrl.href}\n ${error}`
    );
    return undefined;
  }

  return filename;
};

module.exports = rlc;
