# remark-link-card-plus ローカルパス対応の実装解説

## 概要

このドキュメントは、`ogTransformer` で `imageUrl` や `faviconUrl` にローカルパス（例: `/images/card.png`）を指定できるようにするための実装について解説します。

---

## 背景と課題

### オリジナルの挙動

オリジナルの実装では、`ogTransformer` で値を設定しても以下の問題が発生していました：

1. **`getOgImageUrl` 関数**: `URL.canParse()` でローカルパスが `false` となり、空文字が返される
2. **`getFaviconUrl` 関数**: ローカルパスが `URL.canParse()` に失敗し、リンク先の origin と結合されてしまう（例: `/images/foo.png` → `https://example.com/images/foo.png`）

### 単純なローカルパス判定の問題点

最初のアプローチとして「`/` で始まるパスをすべてローカルパスとして扱う」実装を試みましたが、以下の問題が発生しました：

1. **OG スクレイパーが返す相対パスとの区別ができない**
   - OG スクレイパーが返す `/favicon.ico` は `https://example.com/favicon.ico` に変換されるべき
   - `ogTransformer` で設定した `/images/local.png` はそのまま使用されるべき

2. **他のオプションとの整合性**
   - `ogTransformer` で値を設定した場合、`getFaviconUrl` / `getOgImageUrl` をスキップすると `noThumbnail` / `noFavicon` オプションが機能しなくなる
   - `ogTransformer` でリモートURLを設定した場合も `cache` オプションが機能しなくなる

---

## 最終的な実装

### 設計方針

1. `ogTransformer` で明示的に変更された値かどうかを追跡する
2. 変更された値のうち、`/` で始まるもののみをローカルパスとして扱う
3. `noThumbnail` / `noFavicon` / `cache` などのオプションは常に機能させる

### 実装の詳細

#### 1. `getLinkCardData` 関数の変更

`ogTransformer` が `faviconUrl` / `imageUrl` を変更したかどうかを検出し、フラグとして渡します。

```typescript
const getLinkCardData = async (url: URL, options: Options) => {
  const ogRawResult = await getOpenGraph(url);
  const rawOgData: OgData = {
    title: ogRawResult?.ogTitle || "",
    description: ogRawResult?.ogDescription || "",
    faviconUrl: ogRawResult?.favicon,
    imageUrl: extractOgImageUrl(ogRawResult),
  };

  const ogData = options.ogTransformer
    ? options.ogTransformer(rawOgData, url)
    : rawOgData;

  // ogTransformer で明示的に設定されたかどうかを検出
  const isTransformedFavicon =
    options.ogTransformer !== undefined &&
    ogData.faviconUrl !== rawOgData.faviconUrl;
  const isTransformedImage =
    options.ogTransformer !== undefined &&
    ogData.imageUrl !== rawOgData.imageUrl;

  const title = ogData.title || url.hostname;
  const description = ogData.description || "";
  const faviconUrl = await getFaviconUrl(
    url,
    ogData.faviconUrl,
    options,
    isTransformedFavicon,  // フラグを渡す
  );
  const ogImageUrl = await getOgImageUrl(
    ogData.imageUrl,
    options,
    isTransformedImage,  // フラグを渡す
  );
  // ...
};
```

#### 2. `getFaviconUrl` 関数の変更

`isTransformed` パラメータを追加し、`ogTransformer` で明示的に設定されたローカルパスのみをそのまま返します。

```typescript
const getFaviconUrl = async (
  url: URL,
  ogFavicon: string | undefined,
  options: Options,
  isTransformed: boolean,  // 追加
) => {
  if (options.noFavicon) return "";

  let faviconUrl = ogFavicon;

  // ogTransformer で明示的に設定されたローカルパスはそのまま返す（変換・キャッシュしない）
  if (isTransformed && faviconUrl?.startsWith("/")) {
    return faviconUrl;
  }

  // OG スクレイパーが返した相対パスは絶対URLに変換（従来の挙動を維持）
  if (faviconUrl && !URL.canParse(faviconUrl)) {
    try {
      faviconUrl = new URL(faviconUrl, url.origin).toString();
    } catch (error) {
      // エラーログ
      faviconUrl = undefined;
    }
  }

  if (!faviconUrl) {
    faviconUrl = await getFaviconImageSrc(url);
  }

  if (faviconUrl && options.cache) {
    // キャッシュ処理（変更なし）
  }

  return faviconUrl;
};
```

#### 3. `getOgImageUrl` 関数の変更

同様に `isTransformed` パラメータを追加します。

```typescript
const getOgImageUrl = async (
  imageUrl: string | undefined,
  options: Options,
  isTransformed: boolean,  // 追加
) => {
  if (options.noThumbnail) return "";

  // ogTransformer で明示的に設定されたローカルパスはそのまま返す（キャッシュしない）
  if (isTransformed && imageUrl?.startsWith("/")) {
    return imageUrl;
  }

  const isValidUrl = imageUrl && imageUrl.length > 0 && URL.canParse(imageUrl);
  if (!isValidUrl) return "";

  let ogImageUrl = imageUrl;

  if (ogImageUrl && options.cache) {
    // キャッシュ処理（変更なし）
  }

  return ogImageUrl;
};
```

---

## 挙動の比較表

| ケース | 入力 | isTransformed | 結果 |
|--------|------|---------------|------|
| OGスクレイパーが `/favicon.ico` を返す | `/favicon.ico` | `false` | `https://example.com/favicon.ico` に変換 |
| `ogTransformer` で `/images/local.png` を設定 | `/images/local.png` | `true` | そのまま `/images/local.png` を返す |
| `ogTransformer` でリモートURL設定 + `cache: true` | `https://cdn.example.com/img.png` | `true` | キャッシュされる |
| `ogTransformer` でローカルパス設定 + `noThumbnail: true` | `/images/local.png` | - | 空文字を返す（表示抑制が機能） |
| `ogTransformer` でローカルパス設定 + `noFavicon: true` | `/images/local.png` | - | 空文字を返す（表示抑制が機能） |

---

## テストケース

以下のテストケースで動作を検証しています：

```typescript
// ローカルパスがそのまま使用される
test("should preserve local image path starting with /", async () => {
  const { value } = await remark()
    .use(remarkLinkCard, {
      ogTransformer: (og) => ({
        ...og,
        imageUrl: "/images/local-card.png",
      }),
    })
    .process(markdown);

  expect(value.toString()).toContain('src="/images/local-card.png"');
});

// OGスクレイパーの相対パスは絶対URLに変換される
test("resolves relative favicon URLs into absolute ones", async () => {
  // OGスクレイパーが favicon: "/relative-path-favicon.ico" を返すようモック
  const { value } = await remark()
    .use(remarkLinkCard, {})
    .process(markdown);

  expect(value.toString()).toContain(
    'src="https://example.com/relative-path-favicon.ico"'
  );
});

// noThumbnail オプションが ogTransformer 設定時も機能する
test("should respect noThumbnail option even when ogTransformer sets imageUrl", async () => {
  const { value } = await remark()
    .use(remarkLinkCard, {
      noThumbnail: true,
      ogTransformer: (og) => ({
        ...og,
        imageUrl: "/images/local-card.png",
      }),
    })
    .process(markdown);

  expect(value.toString()).not.toContain("/images/local-card.png");
});

// ogTransformer で設定したリモートURLがキャッシュされる
test("should cache remote URL set by ogTransformer", async () => {
  const { value } = await remark()
    .use(remarkLinkCard, {
      cache: true,
      ogTransformer: (og) => ({
        ...og,
        imageUrl: "https://example.com/custom-image.png",
      }),
    })
    .process(markdown);

  expect(value.toString()).toContain("/remark-link-card-plus/");
  expect(value.toString()).not.toContain("https://example.com/custom-image.png");
});
```

---

## 使用例

```typescript
import remarkLinkCard from "remark-link-card-plus";

// 特定のドメインにローカル画像を使用
remarkLinkCard({
  ogTransformer: (og, url) => {
    if (url.hostname === "example.com") {
      return {
        ...og,
        imageUrl: "/images/example-card.png",
        faviconUrl: "/images/example-favicon.png",
      };
    }
    return og;
  },
});
```
