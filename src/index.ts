import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Root, Text } from "mdast";
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
    visit(tree, "paragraph", (paragraphNode, index) => {
      if (paragraphNode.children.length !== 1) return;

      visit(paragraphNode, "link", (linkNode) => {
        const hasOneChildText =
          linkNode.children.length === 1 &&
          linkNode.children[0].type === "text";
        if (!hasOneChildText) return;

        const childText = linkNode.children[0] as Text;
        if (!isSameUrlValue(linkNode.url, childText.value)) {
          return;
        }

        const url = new URL(linkNode.url);

        transformers.push(async () => {
          const data = await getLinkCardData(url, options);
          const linkCardNode = createLinkCardNode(data, options);

          if (index) {
            // @ts-expect-error `Element` is processed by hast
            tree.children.splice(index, 1, linkCardNode);
          }
        });
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
  if (options?.cache) {
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
    ogResult?.ogImage && ogResult.ogImage.length > 0
      ? ogResult?.ogImage?.[0].url
      : "";
  try {
    new URL(ogImageUrl).toString();
  } catch (_) {
    ogImageUrl = "";
  }

  if (ogImageUrl) {
    if (options?.cache) {
      const imageFilename = await downloadImage(
        new URL(ogImageUrl),
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
      );
      ogImageUrl = imageFilename
        ? path.join(defaultOutputDirectory, imageFilename)
        : ogImageUrl;
    }
  }

  return {
    title,
    description,
    faviconUrl,
    ogImageUrl,
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

type Element =
  | {
      type: "element";
      tagName: string;
      data: {
        hName: string;
        hProperties: Record<string, string | number>;
        hChildren: Element[];
      };
      properties: Record<string, string | number>;
      children: Element[];
    }
  | {
      type: "text";
      value: string;
    };
const hast = (type: string, attrs = {}, children: Element[] = []): Element => {
  return {
    type: "element",
    tagName: type,
    data: {
      hName: type,
      hProperties: attrs,
      hChildren: children,
    },
    properties: attrs,
    children,
  };
};

const text = (value = ""): Element => {
  const sanitized = sanitizeHtml(value);

  return {
    type: "text",
    value: sanitized,
  };
};

const className = (value: string) => {
  const prefix = "remark-link-card-plus";
  return `${prefix}__${value}`;
};

const createLinkCardNode = (data: LinkCardData, options: Options): Element => {
  const { title, description, faviconUrl, ogImageUrl, url } = data;
  const isThumbnailLeft = options.thumbnailPosition === "left";
  const thumbnail = ogImageUrl
    ? hast("div", { className: className("thumbnail") }, [
        hast("img", {
          src: ogImageUrl,
          className: className("image"),
          alt: "ogImage",
        }),
      ])
    : hast("div");

  return hast(
    "div",
    {
      className: className("container"),
    },
    [
      hast(
        "a",
        {
          className: className("card"),
          href: url.toString(),
          rel: "noreferrer noopener",
          target: "_blank",
        },
        [
          ...(isThumbnailLeft ? [thumbnail] : []),
          hast("div", { className: className("main") }, [
            hast("div", { className: className("content") }, [
              hast("div", { className: className("title") }, [text(title)]),
              hast("div", { className: className("description") }, [
                text(description),
              ]),
            ]),
            hast("div", { className: className("meta") }, [
              faviconUrl
                ? hast("img", {
                    className: className("favicon"),
                    src: faviconUrl,
                    width: 14,
                    height: 14,
                    alt: "favicon",
                  })
                : hast("div"),
              hast("span", { className: className("url") }, [
                text(url.hostname),
              ]),
            ]),
          ]),
          ...(!isThumbnailLeft ? [thumbnail] : []),
        ],
      ),
    ],
  );
};

export default remarkLinkCard;
