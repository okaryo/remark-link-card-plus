import { visit } from "unist-util-visit";
import client from "open-graph-scraper";
import path from "path";
import { writeFile, access, mkdir } from "fs/promises";
import { createHash } from "crypto";
import type { Plugin } from "unified";
import sanitizeHtml from "sanitize-html";
import { ErrorResult } from "open-graph-scraper/types/lib/types";

const defaultSaveDirectory = 'public';
const defaultOutputDirectory = '/remark-link-card-plus/';

type Options = {
  cache?: boolean;
  shortenUrl?: boolean;
}

type OpenGraphResult = {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string; alt?: string };
};

type LinkCardData = {
  title: string;
  description: string;
  faviconUrl: string;
  ogImageUrl: string;
  ogImageAlt: string;
  url: URL;
};

const remarkLinkCard: Plugin<[Options]> = (options: Options) => async (tree: any) => {
  const transformers: (() => Promise<void>)[] = [];
  visit(tree, 'paragraph', (paragraphNode: any, index) => {
    if (paragraphNode.children.length !== 1) {
      return tree;
    }

    if (paragraphNode && paragraphNode.data !== undefined) {
      return tree;
    }

    visit(paragraphNode, 'text', (textNode: any) => {
      const urls = textNode.value.match(
        /(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/g
      );
      if (urls && urls.length === 1) {
        transformers.push(async () => {
          const data = await getLinkCardData(new URL(urls[0]), options);
          const linkCardNode = createLinkCardNode(data);

          paragraphNode.children = [linkCardNode];
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

const getOpenGraph = async (targetUrl: URL): Promise<OpenGraphResult | undefined> => {
  try {
    const { result } = await client({ url: targetUrl.toString(), timeout: 10000 });
    return result as OpenGraphResult;
  } catch (error) {
    const ogError = error as ErrorResult;
    console.error(
      `[remark-link-card-plus] Error: Failed to get the Open Graph data of ${ogError.result.requestUrl} due to ${ogError.result.error}.`
    );
    return undefined;
  }
};

const getFaviconImageSrc = async (url: URL) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;

  const res = await fetch(faviconUrl, { method: "HEAD", signal: AbortSignal.timeout(10000) });
  if (!res.ok) return "";

  return faviconUrl;
};

const getLinkCardData = async (url: URL, options: Options) => {
  const ogResult = await getOpenGraph(url);
  const title = (ogResult && ogResult.ogTitle) || url.hostname;
  const description = (ogResult && ogResult.ogDescription) || '';

  let faviconUrl = await getFaviconImageSrc(url)
  if (options && options.cache) {
    const faviconFilename = await downloadImage(
      new URL(faviconUrl),
      path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory)
    );
    faviconUrl = faviconFilename
      ? path.join(defaultOutputDirectory, faviconFilename)
      : faviconUrl;
  }

  let ogImageUrl = "";
  if (ogResult && ogResult.ogImage && ogResult.ogImage.url) {
    if (options && options.cache) {
      const imageFilename = await downloadImage(
        new URL(ogResult.ogImage.url),
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory)
      );
      ogImageUrl = imageFilename
        ? path.join(defaultOutputDirectory, imageFilename)
        : ogResult.ogImage.url;
    } else {
      ogImageUrl = ogResult.ogImage.url;
    }
  }
  const ogImageAlt = ogResult?.ogImage?.alt || title;

  return {
    title,
    description,
    faviconUrl,
    ogImageUrl,
    ogImageAlt,
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
  } catch (error) {}

  try {
    await access(saveDirectory);
  } catch (error) {
    await mkdir(saveDirectory, { recursive: true });
  }

  try {
    const response = await fetch(url.href, { signal: AbortSignal.timeout(10000) });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFile(saveFilePath, buffer);
  } catch (error) {
    console.error(
      `[remark-link-card-plus] Error: Failed to download image from ${url.href}\n ${error}`
    );
    return undefined;
  }

  return filename;
};

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
  const { title, description, faviconUrl, ogImageUrl, ogImageAlt, url } = data;
  return h(
    "a",
    {
      className: className("link"),
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
  );
}

export default remarkLinkCard;
