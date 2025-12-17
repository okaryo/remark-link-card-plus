# remark-link-card-plus

[![CI](https://github.com/okaryo/remark-link-card-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/okaryo/remark-link-card-plus/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/remark-link-card-plus)](https://www.npmjs.com/package/remark-link-card-plus)

[English](./README.md) | 日本語

テキストリンクをリンクカードに変換する [remark](https://github.com/remarkjs/remark) プラグインです。[remark-link-card](https://github.com/gladevise/remark-link-card) をベースに改良されています。

> **Note**: このリポジトリは [okaryo/remark-link-card-plus](https://github.com/okaryo/remark-link-card-plus) のフォークで、`ogTransformer` に相対パス解決や `self://` プレフィックスによるローカル画像サポートなどの機能が追加されています。

オリジナル版を[デモページ](https://remark-link-card-plus.pages.dev/)で動作を確認できます。

## 機能

`remark-link-card-plus` はオリジナルの `remark-link-card` をフォークし、以下の変更を加えています：

### オリジナルからの変更点

* **TypeScript サポート**: 型安全性と開発体験の向上のため、TypeScript で完全に書き直されています。
* **別タブで開く**: リンクカード内のリンクは `target="_blank"` で新しいタブで開きます。
* **リスト内のリンクは変換しない**: リストアイテム（`listItem`）内のリンクはリンクカードに変換されません。
* **サムネイル位置のカスタマイズ**: サムネイルをカードの左右どちらに表示するか選択できます。
* **画像・ファビコン表示のオプション**: `noThumbnail` と `noFavicon` オプションでサムネイルやファビコンを非表示にできます。
* **OG データトランスフォーマー**: `ogTransformer` オプションで、リンクカードのレンダリング前にタイトル、説明、ファビコン、画像などの Open Graph データをカスタマイズできます。
  * **相対パスサポート**: `imageUrl` と `faviconUrl` に相対パス（例: `/images/sample.png`、`../sample.png`）を設定でき、ターゲット URL を基準に解決されます。
  * **`self://` プレフィックス**: `self://` プレフィックスを使用して、自サイトでホストされている画像を参照できます（例: `self:///images/local.png` は出力で `/images/local.png` になります）。
* **拡張子による除外**: `ignoreExtensions` オプションで、特定のファイル拡張子（例: `.mp4`、`.pdf`）を持つ URL のリンクカード変換をスキップできます。

### 維持されている機能

* **オプションサポート**:
  * `cache`: 高速な読み込みとローカル保存のために画像をキャッシュします。
  * `shortenUrl`: リンクカードに URL のホスト名のみを表示します。
* **カスタマイズ可能なスタイリング**: 提供されたクラス名を使用してカードを自由にスタイリングできます（クラス名が若干更新されています）。

## インストール

```sh
npm i remark-link-card-plus
```

## 使い方

### 基本的な例

```js
import { remark } from "remark";
import remarkLinkCard from "remark-link-card-plus";

const exampleMarkdown = `
# サンプル Markdown

## リンクカードデモ

このような単独のリンク:

https://github.com

はリンクカードに変換されます。

[GitHub](https://github.com) のようなインラインリンクは変換**されません**。

https://example.com/video.mp4 のようなファイルへのリンクは \`ignoreExtensions\` オプションで除外できます。
`;

(async () => {
  const result = await remark()
    .use(remarkLinkCard, { cache: true, shortenUrl: true, ignoreExtensions: [".mp4", ".pdf"] })
    .process(exampleMarkdown);

  console.log(result.value);
})();
```

以下のような変換結果が得られます。

```md
# サンプル Markdown

## リンクカードデモ

このような単独のリンク:

<div class="remark-link-card-plus__container">
  <a href="https://github.com/" target="_blank" rel="noreferrer noopener" class="remark-link-card-plus__card">
    <div class="remark-link-card-plus__main">
      <div class="remark-link-card-plus__content">
        <div class="remark-link-card-plus__title">GitHub · Build and ship software on a single, collaborative platform</div>
        <div class="remark-link-card-plus__description">Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.</div>
      </div>
      <div class="remark-link-card-plus__meta">
        <img src="https://www.google.com/s2/favicons?domain=github.com" class="remark-link-card-plus__favicon" width="14" height="14" alt="">
        <span class="remark-link-card-plus__url">github.com</span>
      </div>
    </div>
    <div class="remark-link-card-plus__thumbnail">
      <img src="https://github.githubassets.com/assets/home24-5939032587c9.jpg" class="remark-link-card-plus__image" alt="">
    </div>
  </a>
</div>

はリンクカードに変換されます。

[GitHub](https://github.com) のようなインラインリンクは変換**されません**。

https://example.com/video.mp4 のようなファイルへのリンクは `ignoreExtensions` オプションで除外できます。
```

### Astro での使用例

[Astro](https://astro.build) プロジェクトでも `remark-link-card-plus` を使用できます。以下は `astro.config.mjs` の設定例です：

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import remarkLinkCard from "remark-link-card-plus";

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [
        remarkLinkCard, {
          cache: true,
          shortenUrl: true,
          thumbnailPosition: "right",
          noThumbnail: false,
          noFavicon: false,
          ignoreExtensions: [".mp4", ".pdf"],
          ogTransformer: (og, url) => {
            if (url.hostname === "github.com") {
              return { ...og, title: `GitHub: ${og.title}` };
            }
            if (og.title === og.description) {
              return { ...og, description: "カスタム説明文" };
            }
            return og;
          }
        },
      ],
    ],
  },
});

// 最小構成の場合
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkLinkCard],
  },
});
```

### JSON でオーバーライドを管理する

リンクカードのカスタマイズを別の JSON ファイルで管理することで、メンテナンスが容易になります：

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import remarkLinkCard from "remark-link-card-plus";
import linkcardOverrides from "./src/data/linkcard-overrides.json";

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [
        remarkLinkCard, {
          ogTransformer: (og, url) => {
            const override = linkcardOverrides[url.href];
            if (!override) return og;
            return { ...og, ...override };
          },
        },
      ],
    ],
  },
});
```

```jsonc
// src/data/linkcard-overrides.json
{
  "https://pagespeed.web.dev/": {
    "description": "あらゆるデバイスでウェブページを高速に",
    "imageUrl": "self:///images/web-dev/graphic-home-hero.png",
    "faviconUrl": "self:///images/web-dev/pagespeed_64dp.png"
  },
  "https://abehiroshi.la.coocan.jp/": {
    "title": "阿部 寛のホームページ",
    "imageUrl": "/abe-top-20190328-2.jpg"
  }
}
```

このアプローチにより：

* 設定ファイルを変更せずに特定の URL の OG データをオーバーライドできます
* OG 画像が利用できない、または不適切なサイトに対して `self://` プレフィックスでローカル画像を使用できます
* ターゲット URL のオリジンを基準に解決される相対パスを使用できます

## オプション

| オプション | 型 | デフォルト | 説明 |
|------------|------|---------|------|
| `cache` | boolean | `false` | Open Graph 画像とファビコンをローカルにキャッシュします。画像は `process.cwd()/public/remark-link-card-plus/` に保存され、パスは `/remark-link-card-plus/` から始まります。これによりリンク先サイトへの負荷が軽減され、冗長なネットワークリクエストを避けることでビルドパフォーマンスが向上します。 |
| `shortenUrl` | boolean | `true` | リンクカードに完全な URL ではなくホスト名のみを表示します。 |
| `thumbnailPosition` | string | `right` | カード内のサムネイルの位置を指定します。`"left"` または `"right"` を指定できます。 |
| `noThumbnail` | boolean | `false` | `true` の場合、Open Graph サムネイル画像を表示しません。生成されるリンクカード HTML にはサムネイル用の `<img>` タグが含まれません。 |
| `noFavicon` | boolean | `false` | `true` の場合、リンクカードにファビコンを表示しません。生成されるリンクカード HTML にはファビコン用の `<img>` タグが含まれません。 |
| `ogTransformer` | `(og: OgData, url: URL) => OgData` | `undefined` | レンダリング前に Open Graph データを変換するコールバック。元の OG データと処理対象の URL を受け取ります。`OgData` は `{ title: string; description: string; faviconUrl?: string; imageUrl?: string }` の構造を持ちます。<br />`imageUrl` と `faviconUrl` には、ターゲット URL を基準に解決される相対パス（例: `/images/x.png`、`../x.png`）、または自サイトでホストされる画像用の `self://` プレフィックス（例: `self:///images/x.png`）を使用できます。 |
| `ignoreExtensions` | string[] | `[]` | 指定されたファイル拡張子（例: `[".mp4", ".pdf"]`）を持つ URL のリンクカード変換をスキップします。これらのリンクは元の Markdown のまま残されます。マッチングは大文字小文字を区別せず、完全一致する拡張子のみが除外されます。 |

## スタイリング

リンクカードは以下のクラス名を使用してスタイリングできます：

```css
.remark-link-card-plus__container {}

.remark-link-card-plus__card {}

.remark-link-card-plus__main {}

.remark-link-card-plus__content {}

.remark-link-card-plus__title {}

.remark-link-card-plus__description {}

.remark-link-card-plus__meta {}

.remark-link-card-plus__favicon {}

.remark-link-card-plus__url {}

.remark-link-card-plus__thumbnail {}

.remark-link-card-plus__image {}
```

これらのスタイルは必要に応じて自由にカスタマイズしてください。
