---
title: "Remark Link Card Example"
description: "Demonstration of how the remark-link-card-plus plugin handles various types of links."
---

# remark-link-card-plus Demo

This page demonstrates how `remark-link-card-plus` converts links into cards or leaves them as plain text based on context.

## Styling the Link Cards

By default, `remark-link-card-plus` does not apply any styles to the generated link cards. You can fully customize the appearance by defining your own CSS classes. Below is the TailwindCSS applied to the link cards on this demo page as an example:

```css
.remark-link-card-plus__container {
  @apply mb-4;
}

.remark-link-card-plus__card {
  @apply h-32 flex bg-white overflow-hidden rounded-xl border border-slate-300 hover:bg-slate-100 hover:border-slate-500 transition-colors !no-underline;
}

.remark-link-card-plus__main {
  @apply flex flex-col flex-1 p-4;
}

.remark-link-card-plus__content {
}

.remark-link-card-plus__title {
  @apply text-lg font-semibold leading-6 line-clamp-2 text-gray-900 hover:!text-gray-900;
}

.remark-link-card-plus__description {
  @apply mt-1 text-sm text-gray-500 line-clamp-1;
}

.remark-link-card-plus__meta {
  @apply flex items-center mt-auto;
}

.remark-link-card-plus__favicon {
  @apply !my-0 mr-1 h-4 w-4;
}

.remark-link-card-plus__url {
  @apply text-xs text-gray-600;
}

.remark-link-card-plus__thumbnail {
  @apply h-32 w-1/3 md:max-w-64;
}

.remark-link-card-plus__image {
  @apply h-full w-full !my-0 object-cover;
}
```

Feel free to adjust or replace this CSS with your own styles to suit your needs.

---

## ✅ Links Converted to Cards

### 1. Bare Link on Its Own Line

Bare links written on their own line will be converted to a link card.

Example:

```markdown
https://github.com
```

Output:

https://github.com

---

### 2. `[text](url)` Format with Matching Text and URL

Links where the text and URL are identical will be converted to a link card.

Example:

```markdown
[https://github.com](https://github.com)
```

Output:

[https://github.com](https://github.com)

---

### 3. Links Ignored by Extension

If you configure `ignoreExtensions: [".mp4"]`, links to files with these extensions will not be converted to cards.

Example:

```markdown
https://example.com/video.mp4
```

Output:

https://example.com/video.mp4

---

## ❌ Links Not Converted to Cards

### 1. Link with Additional Text on the Same Line

If a link is on the same line as additional text, it will not be converted into a card.

Example:

```markdown
Visit the GitHub page here: https://github.com.
```

Output:

Visit the GitHub page here: https://github.com.

---

### 2. Multiple Links on a Single Line

If there are multiple links on the same line, none will be converted into cards.

Example:

```markdown
https://github.com https://example.com
```

Output:

https://github.com https://example.com

---

### 3. Links Inside a List

Links inside list items will not be converted into cards.

Example:

```markdown
- [GitHub](https://github.com)
- [Example](https://example.com)
```

Output:

- [GitHub](https://github.com)
- [Example](https://example.com)
