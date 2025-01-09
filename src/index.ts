import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Html, Link, Root, Text } from "mdast";
import client from "open-graph-scraper";
import type { ErrorResult } from "open-graph-scraper/types/lib/types";
import sanitizeHtml from "sanitize-html";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const defaultSaveDirectory = "public";
const defaultOutputDirectory = "/remark-link-card-plus/";

type Options = {
  cache?: boolean;
  shortenUrl?: boolean;
  thumbnailPosition?: "right" | "left";
};

type LinkCardData = {
  title: string;
  description: string;
  faviconUrl: string;
  ogImageUrl?: string;
  displayUrl: string;
  url: URL;
};

const defaultOptions: Options = {
  cache: false,
  shortenUrl: true,
  thumbnailPosition: "right",
};

const remarkLinkCard: Plugin<[Options], Root> =
  (userOptions: Options) => async (tree) => {
    const options = { ...defaultOptions, ...userOptions };
    const transformers: (() => Promise<void>)[] = [];

    const addTransformer = (url: string, index: number) => {
      transformers.push(async () => {
        const data = await getLinkCardData(new URL(url), options);
        const linkCardNode = createLinkCardNode(data, options);
        if (index !== undefined) {
          tree.children.splice(index, 1, linkCardNode);
        }
      });
    };

    const isValidUrl = (value: string): boolean => {
      if (!URL.canParse(value)) return false;

      const basicUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
      if (!basicUrlPattern.test(value)) return false;

      return true;
    };

    visit(tree, "paragraph", (paragraph, index, parent) => {
      if (parent?.type !== "root" || paragraph.children.length !== 1) return;

      let unmatchedLink: Link;
      let processedUrl: string;

      visit(paragraph, "link", (linkNode) => {
        const hasOneChildText =
          linkNode.children.length === 1 &&
          linkNode.children[0].type === "text";
        if (!hasOneChildText) return;

        const childText = linkNode.children[0] as Text;
        if (!isSameUrlValue(linkNode.url, childText.value)) {
          unmatchedLink = linkNode;
          return;
        }

        if (index !== undefined) {
          processedUrl = linkNode.url;
          addTransformer(linkNode.url, index);
        }
      });

      visit(paragraph, "text", (textNode) => {
        if (!isValidUrl(textNode.value)) return;
        if (processedUrl === textNode.value) return;

        // NOTE: Skip card conversion if the link text and URL are different, e.g., [https://example.com](https://example.org)
        if (
          unmatchedLink &&
          textNode.value === (unmatchedLink.children[0] as Text).value &&
          textNode.position?.start.line === unmatchedLink.position?.start.line
        ) {
          return;
        }

        if (index !== undefined) {
          addTransformer(textNode.value, index);
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

const isSameUrlValue = (a: string, b: string) => {
  try {
    return new URL(a).toString() === new URL(b).toString();
  } catch (_) {
    return false;
  }
};

const getOpenGraph = async (targetUrl: URL) => {
  try {
    const { result } = await client({
      url: targetUrl.toString(),
      timeout: 10000,
    });
    return result;
  } catch (error) {
    const ogError = error as ErrorResult;
    console.error(
      `[remark-link-card-plus] Error: Failed to get the Open Graph data of ${ogError.result.requestUrl} due to ${ogError.result.error}.`,
    );
    return undefined;
  }
};

const getFaviconImageSrc = async (url: URL) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;

  const res = await fetch(faviconUrl, {
    method: "HEAD",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return "";

  return faviconUrl;
};

const getLinkCardData = async (url: URL, options: Options) => {
  const ogResult = await getOpenGraph(url);
  const title = ogResult?.ogTitle || url.hostname;
  const description = ogResult?.ogDescription || "";

  let faviconUrl = await getFaviconImageSrc(url);
  if (options.cache) {
    try {
      const faviconFilename = await downloadImage(
        new URL(faviconUrl),
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
      );
      faviconUrl = faviconFilename
        ? path.join(defaultOutputDirectory, faviconFilename)
        : faviconUrl;
    } catch (error) {
      console.error(
        `[remark-link-card-plus] Error: Failed to download favicon from ${faviconUrl}\n ${error}`,
      );
    }
  }

  let ogImageUrl =
    ogResult?.ogImage &&
    ogResult.ogImage.length > 0 &&
    URL.canParse(ogResult?.ogImage[0].url)
      ? ogResult?.ogImage?.[0].url
      : "";

  if (ogImageUrl) {
    if (options.cache) {
      const imageFilename = await downloadImage(
        new URL(ogImageUrl),
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
      );
      ogImageUrl = imageFilename
        ? path.join(defaultOutputDirectory, imageFilename)
        : ogImageUrl;
    }
  }

  let displayUrl = options.shortenUrl ? url.hostname : url.toString();
  try {
    displayUrl = decodeURI(displayUrl);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Cannot decode url: "${url}"\n ${error}`,
    );
  }

  return {
    title,
    description,
    faviconUrl,
    ogImageUrl,
    displayUrl,
    url,
  };
};

const downloadImage = async (url: URL, saveDirectory: string) => {
  const hash = createHash("sha256").update(decodeURI(url.href)).digest("hex");
  const filename = hash + path.extname(url.pathname);
  const saveFilePath = path.join(saveDirectory, filename);

  try {
    await access(saveFilePath);
    return filename;
  } catch (_) {}

  try {
    await access(saveDirectory);
  } catch (_) {
    await mkdir(saveDirectory, { recursive: true });
  }

  try {
    const response = await fetch(url.href, {
      signal: AbortSignal.timeout(10000),
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFile(saveFilePath, buffer);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Failed to download image from ${url.href}\n ${error}`,
    );
    return undefined;
  }

  return filename;
};

const className = (value: string) => {
  const prefix = "remark-link-card-plus";
  return `${prefix}__${value}`;
};

const createLinkCardNode = (data: LinkCardData, options: Options): Html => {
  const { title, description, faviconUrl, ogImageUrl, displayUrl, url } = data;
  const isThumbnailLeft = options.thumbnailPosition === "left";

  const thumbnail = ogImageUrl
    ? `
<div class="${className("thumbnail")}">
  <img src="${ogImageUrl}" class="${className("image")}" alt="ogImage">
</div>`.trim()
    : "";

  const mainContent = `
<div class="${className("main")}">
  <div class="${className("content")}">
    <div class="${className("title")}">${sanitizeHtml(title)}</div>
    <div class="${className("description")}">${sanitizeHtml(description)}</div>
  </div>
  <div class="${className("meta")}">
    ${faviconUrl ? `<img src="${faviconUrl}" class="${className("favicon")}" width="14" height="14" alt="favicon">` : ""}
    <span class="${className("url")}">${sanitizeHtml(displayUrl)}</span>
  </div>
</div>
`
    .replace(/\n\s*\n/g, "\n")
    .trim();

  const content = isThumbnailLeft
    ? `
${thumbnail}
${mainContent}`
    : `
${mainContent}
${thumbnail}`;

  return {
    type: "html",
    value: `
<div class="${className("container")}">
  <a href="${url.toString()}" target="_blank" rel="noreferrer noopener" class="${className("card")}">
    ${content.trim()}
  </a>
</div>
`.trim(),
  };
};

export default remarkLinkCard;
