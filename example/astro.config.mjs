// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkLinkCard from 'remark-link-card-plus';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [
      [
        remarkLinkCard, {
          cache: true,
          shortenUrl: true,
        }
      ],
    ],
  },
});
