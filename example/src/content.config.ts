import { defineCollection } from 'astro:content';
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const entry = defineCollection({
  loader: glob({ base: "./src/content/demo", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { 'demo': entry };
