import { http } from "msw";
import { setupServer } from "msw/node";
import client from "open-graph-scraper";
import { remark } from "remark";
import html from "remark-html";
import markdown from "remark-parse";
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
        ogImage: { url: "http://example.com" },
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

const processor = remark().use(markdown).use(remarkLinkCard, {}).use(html);

describe("remark-link-card-plus", () => {
  test("Convert a line with only a link into a card", async () => {
    const input = `
## test

[https://example.com](https://example.com)

`;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<div><a href="https://example.com/"><div><div><div>Test Site Title</div><div>Test Description</div></div><div><img src="https://www.google.com/s2/favicons?domain=example.com" width="14" height="14" alt="favicon"><span>example.com</span></div></div><div><img src="http://example.com" alt="ogImage"></div></a></div>
`;
    expect(value.toString()).toBe(expected);
  });

  test("Does not convert if a link and text exist on the same line", async () => {
    const input = `
## test

[https://example.com](https://example.com) test
`;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<p><a href="https://example.com">https://example.com</a> test</p>
`;
    expect(value.toString()).toBe(expected);
  });

  test("Does not convert if link text and URL are different", async () => {
    const input = `
## test

[example](https://example.com)
`;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<p><a href="https://example.com">example</a></p>
`;
    expect(value.toString()).toBe(expected);
  });

  test("Does not show a favicon if the favicon request fails", async () => {
    server.use(
      http.head("https://www.google.com/s2/favicons", () => {
        return new Response(null, { status: 404 });
      }),
    );
    const input = `
## test

[https://example.com](https://example.com)
  `;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<div><a href="https://example.com/"><div><div><div>Test Site Title</div><div>Test Description</div></div><div><div></div><span>example.com</span></div></div><div><img src="http://example.com" alt="ogImage"></div></a></div>
`;
    expect(value.toString()).toBe(expected);
  });

  test("Does not show an og image if the URL format is invalid", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: for open-graph-scraper mock
    const mockedClient = vi.mocked(client as any);
    mockedClient.mockResolvedValueOnce({
      error: false,
      result: {
        ogTitle: "Test Site Title",
        ogDescription: "Test Description",
        ogImage: { url: "example.com" },
      },
    });

    const input = `
## test

[https://example.com](https://example.com)
  `;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<div><a href="https://example.com/"><div><div><div>Test Site Title</div><div>Test Description</div></div><div><img src="https://www.google.com/s2/favicons?domain=example.com" width="14" height="14" alt="favicon"><span>example.com</span></div></div><div></div></a></div>
`;
    expect(value.toString()).toBe(expected);
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

    const input = `
## test

[https://example.com](https://example.com)
`;
    const { value } = await processor.process(input);
    const expected = `<h2>test</h2>
<div><a href="https://example.com/"><div><div><div>evil title</div><div>evil description</div></div><div><img src="https://www.google.com/s2/favicons?domain=example.com" width="14" height="14" alt="favicon"><span>example.com</span></div></div><div></div></a></div>
`;
    expect(value.toString()).toBe(expected);
  });
});
