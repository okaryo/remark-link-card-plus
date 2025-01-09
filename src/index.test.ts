import { http } from "msw";
import { setupServer } from "msw/node";
import client from "open-graph-scraper";
import { remark } from "remark";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import remarkLinkCard from "./index";

vi.mock("open-graph-scraper", () => {
  return {
    default: vi.fn().mockResolvedValue({
      error: false,
      result: {
        ogTitle: "Test Site Title",
        ogDescription: "Test Description",
        ogImage: [{ url: "http://example.com" }],
      },
    }),
  };
});

const server = setupServer(
  http.head("https://www.google.com/s2/favicons", () => {
    return new Response(null, { status: 200 });
  }),
);

beforeAll(() => server.listen());
beforeEach(() => server.resetHandlers());
afterAll(() => server.close());

const processor = remark().use(remarkLinkCard, {});

const removeLineLeadingSpaces = (input: string) => {
  return input
    .split("\n")
    .map((line) => line.trimStart())
    .join("\n");
};

describe("remark-link-card-plus", () => {
  describe("Basic usage", () => {
    test("Convert a line with only a link into a card", async () => {
      const input = `## test

https://example.com

https://example.com/path

<https://example.com>

<https://example.com/path>

[https://example.com](https://example.com)

[https://example.com/path](https://example.com/path)
`;
      const { value } = await processor.process(input);
      const expected = `## test

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

<div class="remark-link-card-plus__container">
  <a href="https://example.com/path" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

<div class="remark-link-card-plus__container">
  <a href="https://example.com/path" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>

<div class="remark-link-card-plus__container">
  <a href="https://example.com/path" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>
`;
      expect(removeLineLeadingSpaces(value.toString())).toBe(
        removeLineLeadingSpaces(expected),
      );
    });

    test("Does not convert if a link and text exist on the same line", async () => {
      const input = `## test

[example link](https://example.com/path) test
`;
      const { value } = await processor().process(input);
      const expected = `## test

[example link](https://example.com/path) test
`;
      expect(value.toString()).toBe(expected);
    });

    test("Does not convert if link text and URL are different", async () => {
      const input = `## test

[example](https://example.com)
`;
      const { value } = await processor().process(input);
      const expected = `## test

[example](https://example.com)
`;
      expect(value.toString()).toBe(expected);
    });

    test("Does not convert links inside list items to link cards", async () => {
      const input = `## test

* list
  * https://example.com
  * [https://example.com](https://example.com)
  * <https://example.com>
  * https://example.com/path
  * [https://example.com/path](https://example.com/path)
  * <https://example.com/path>


* https://example.com
* [https://example.com](https://example.com)
* <https://example.com>
* https://example.com/path
* [https://example.com/path](https://example.com/path)
* <https://example.com/path>
`;
      const { value } = await processor().process(input);
      const expected = `## test

* list
  * https://example.com
  * <https://example.com>
  * <https://example.com>
  * https://example.com/path
  * <https://example.com/path>
  * <https://example.com/path>

* https://example.com

* <https://example.com>

* <https://example.com>

* https://example.com/path

* <https://example.com/path>

* <https://example.com/path>
`;
      expect(value.toString()).toBe(expected);
    });

    test("Does not convert if link text is a URL but different from the link URL", async () => {
      const input = `## test

[https://example.com](https://example.org)
`;

      const { value } = await processor.process(input);
      const expected = `## test

[https://example.com](https://example.org)
`;

      expect(removeLineLeadingSpaces(value.toString())).toBe(
        removeLineLeadingSpaces(expected),
      );
    });

    test("Does not show a favicon if the favicon request fails", async () => {
      server.use(
        http.head("https://www.google.com/s2/favicons", () => {
          return new Response(null, { status: 404 });
        }),
      );
      const input = `## test

[https://example.com](https://example.com)
`;
      const { value } = await processor().process(input);
      const expected = `## test

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
    </div>
  </a>
</div>
`;
      expect(removeLineLeadingSpaces(value.toString())).toBe(
        removeLineLeadingSpaces(expected),
      );
    });

    test("Does not show an og image if the URL format is invalid", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: for open-graph-scraper mock
      const mockedClient = vi.mocked(client as any);
      mockedClient.mockResolvedValueOnce({
        error: false,
        result: {
          ogTitle: "Test Site Title",
          ogDescription: "Test Description",
          ogImage: [{ url: "example.com" }],
        },
      });

      const input = `## test

[https://example.com](https://example.com)
`;
      const { value } = await processor.process(input);
      const expected = `## test

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">Test Site Title</div>
        <div class="remark-link-card-plus__description">Test Description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
  </a>
</div>
`;
      expect(removeLineLeadingSpaces(value.toString())).toBe(
        removeLineLeadingSpaces(expected),
      );
    });

    test("title and description are sanitized", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: for open-graph-scraper mock
      const mockedClient = vi.mocked(client as any);
      mockedClient.mockResolvedValueOnce({
        error: false,
        result: {
          ogTitle: "evil title<script>alert(1)</script>",
          ogDescription: "evil description<script>alert(1)</script>",
        },
      });

      const input = `## test

[https://example.com](https://example.com)
`;
      const { value } = await processor.process(input);
      const expected = `## test

<div class="remark-link-card-plus__container">
  <a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">evil title</div>
        <div class="remark-link-card-plus__description">evil description</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=example.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="favicon">
        <span class="remark-link-card-plus__url">example.com</span>
      </div>
    </div>
  </a>
</div>
`;
      expect(removeLineLeadingSpaces(value.toString())).toBe(
        removeLineLeadingSpaces(expected),
      );
    });

    test("Does not convert invalid URLs like 'Example:' into cards (URLs that pass `URL.canParse` but are not valid links)", async () => {
      const input = `## test

Example:
`;
      const { value } = await processor.process(input);
      const expected = `## test

Example:
`;
      expect(value.toString()).toBe(expected);
    });
  });

  describe("Options", () => {
    describe("cache", () => {
      test("Caches ogImage if cache option is enabled", async () => {
        // biome-ignore lint/suspicious/noExplicitAny: for open-graph-scraper mock
        const mockedClient = vi.mocked(client as any);
        mockedClient.mockResolvedValueOnce({
          error: false,
          result: {
            ogTitle: "Cached Title",
            ogDescription: "Cached Description",
            ogImage: { url: "http://example.com/cached-image.jpg" },
          },
        });

        const input = `## test

[https://example.com](https://example.com)
`;
        const processorWithCache = remark().use(remarkLinkCard, {
          cache: true,
        });
        const { value } = await processorWithCache.process(input);
        expect(value.toString()).toContain(`src="/remark-link-card-plus/`);
      });
    });

    describe("shortenUrl", () => {
      test("Shortens URL if shortenUrl option is enabled", async () => {
        const input = `## test

[https://example.com/long/path/to/resource](https://example.com/long/path/to/resource)
`;
        const processorWithShorten = remark().use(remarkLinkCard, {
          shortenUrl: true,
        });
        const { value } = await processorWithShorten.process(input);
        expect(value.toString()).toContain(
          `<span class="remark-link-card-plus__url">example.com</span>`,
        );
      });
    });

    describe("thumbnailPosition", () => {
      test("Places thumbnail on the right by default", async () => {
        const input = `## test

[https://example.com](https://example.com)
`;
        const processorWithDefaultThumbnail = remark().use(remarkLinkCard, {});
        const { value } = await processorWithDefaultThumbnail.process(input);
        expect(removeLineLeadingSpaces(value.toString())).toContain(
          `<img src="http://example.com" class="remark-link-card-plus__image" alt="ogImage">
</div>
</a>
`,
        );
      });

      test("Places thumbnail on the left when specified", async () => {
        const input = `## test

[https://example.com](https://example.com)
`;
        const processorWithLeftThumbnail = remark().use(remarkLinkCard, {
          thumbnailPosition: "left",
        });
        const { value } = await processorWithLeftThumbnail.process(input);
        expect(removeLineLeadingSpaces(value.toString())).toContain(
          `<a href="https://example.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
<div class="remark-link-card-plus__thumbnail">
`,
        );
      });

      test("Does not include thumbnail div if ogImageUrl is missing", async () => {
        // biome-ignore lint/suspicious/noExplicitAny: for open-graph-scraper mock
        const mockedClient = vi.mocked(client as any);
        mockedClient.mockResolvedValueOnce({
          error: false,
          result: {
            ogTitle: "No Thumbnail Title",
            ogDescription: "No Thumbnail Description",
            ogImage: [],
          },
        });

        const input = `## test

[https://example.com](https://example.com)
`;
        const processorWithoutThumbnail = remark().use(remarkLinkCard, {
          thumbnailPosition: "left",
        });
        const { value } = await processorWithoutThumbnail.process(input);
        expect(value.toString()).not.toContain(`alt="ogImage"`);
      });
    });
  });
});
