import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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
};

type OpenGraphResult = {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string; alt?: string };
};

type LinkCardData = {
  title: string;
  description: string;
  faviconUrl: string;
  ogImageUrl?: string;
  url: URL;
};

const remarkLinkCard: Plugin<[Options]> = // biome-ignore lint/suspicious/noExplicitAny: FIXME
  (options: Options) => async (tree: any) => {
    const transformers: (() => Promise<void>)[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: FIXME
    visit(tree, "paragraph", (paragraphNode: any, index) => {
      if (paragraphNode.children.length !== 1) return;

      // biome-ignore lint/suspicious/noExplicitAny: FIXME
      visit(paragraphNode, "link", (linkNode: any) => {
        if (!isSameUrlValue(linkNode.url, linkNode.children.at(0)?.value)) {
          return;
        }

        const url = new URL(linkNode.url);

        transformers.push(async () => {
          const data = await getLinkCardData(url, options);
          const linkCardNode = createLinkCardNode(data);

          tree.children.splice(index, 1, linkCardNode);
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
}

const getOpenGraph = async (
  targetUrl: URL,
): Promise<OpenGraphResult | undefined> => {
  try {
    const { result } = await client({
      url: targetUrl.toString(),
      timeout: 10000,
    });
    return result as OpenGraphResult;
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
    const faviconFilename = await downloadImage(
      new URL(faviconUrl),
      path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
    );
    faviconUrl = faviconFilename
      ? path.join(defaultOutputDirectory, faviconFilename)
      : faviconUrl;
  }

  let ogImageUrl = ogResult?.ogImage?.url;
  try {
    new URL(ogImageUrl ?? "").toString();
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

// biome-ignore lint/suspicious/noExplicitAny: FIXME
const h = (type: string, attrs = {}, children: any[] = []) => {
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

const text = (value = "") => {
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

const createLinkCardNode = (data: LinkCardData) => {
  const { title, description, faviconUrl, ogImageUrl, url } = data;
  return h(
    "div",
    {
      className: className("wrapper"),
    },
    [
      h(
        "a",
        {
          className: className("card"),
          href: url.toString(),
          rel: "noreferrer noopener",
          target: "_blank",
        },
        [
          h("div", { className: className("main") }, [
            h("div", { className: className("content") }, [
              h("div", { className: className("title") }, [text(title)]),
              h("div", { className: className("description") }, [
                text(description),
              ]),
            ]),
            h("div", { className: className("meta") }, [
              faviconUrl
                ? h("img", {
                    className: className("favicon"),
                    src: faviconUrl,
                    width: 14,
                    height: 14,
                    alt: "favicon",
                  })
                : h("div"),
              h("span", { className: className("url") }, [text(url.hostname)]),
            ]),
          ]),
          ogImageUrl
            ? h("div", { className: className("thumbnail") }, [
                h("img", {
                  src: ogImageUrl,
                  className: className("image"),
                  alt: "ogImage",
                }),
              ])
            : h("div"),
        ],
      ),
    ],
  );
};

export default remarkLinkCard;
