// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/content.config.ts
// ❯ @desc Content collection schemas: posts, ctf writeups, spec pages
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { defineCollection } from "astro:content";
import { getCategoryPathParts } from "@utils/category";
import { parseTags } from "@utils/tag";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// ❯ SCHEMAS
// ❯ @docs Coerces any value to Date; treats empty strings as undefined to avoid 
// ❯ Zod coercion errors on blank frontmatter fields
const dateSchema = z.preprocess((arg) => {
	if (typeof arg === "string" && arg.trim() === "") return undefined;
	return arg;
}, z.coerce.date());

const optionalDateSchema = z.preprocess((arg) => {
	if (typeof arg === "string" && arg.trim() === "") return undefined;
	return arg;
}, z.coerce.date().optional());

// ❯ @docs Accepts "a/b" string or ["a","b"] array — normalised to string[] via getCategoryPathParts
const categorySchema = z.preprocess(
	(arg) => {
		const parts = getCategoryPathParts(arg as any);
		return parts ?? arg;
	},
	z
		.union([z.string(), z.array(z.string())])
		.optional()
		.nullable()
		.default(""),
);

// ❯ @docs parseTags handles comma-separated strings, arrays, or undefined — always returns a 
// ❯ clean string[]
const tagsSchema = z.preprocess((arg) => {
	return parseTags(arg);
}, z.array(z.string()).optional().default([]));

// ❯ CTF WRITEUPS (not under posts — lives in ./src/content/ctf)
// ❯ @docs Same shape as blog posts minus category; URLs are /ctf/writeups/:slug/
const ctfCollection = defineCollection({
	loader: glob({
		pattern: "**/[^_]*.{md,mdx}",
		base: "./src/content/ctf",
		generateId: ({ entry }) => entry.replace(/\.(md|mdx|markdown)$/i, ""),
	}),
	schema: z.object({
		title: z.string(),
		published: dateSchema,
		updated: optionalDateSchema,
		description: z.string().optional().default(""),
		cover: z.string().optional().default(""),
		coverInContent: z.boolean().optional().default(false),
		tags: tagsSchema,
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		draft: z.boolean().optional().default(false),
		encrypted: z.boolean().optional().default(false),
		password: z.string().optional().default(""),
		routeName: z.string().optional(),
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

// ❯ COLLECTIONS
// ❯ @docs [^_]* pattern skips _ prefixed files (templates, staging drafts)
// ❯ @gogogo new collection
const postsCollection = defineCollection({
	loader: glob({
		pattern: "**/[^_]*.{md,mdx}",
		base: "./src/content/posts",
		generateId: ({ entry }) => entry.replace(/\.(md|mdx|markdown)$/i, ""),
	}),
	schema: z.object({
		title: z.string(),
		published: dateSchema,
		updated: optionalDateSchema,
		description: z.string().optional().default(""),
		cover: z.string().optional().default(""),
		coverInContent: z.boolean().optional().default(false),
		category: categorySchema,
		tags: tagsSchema,
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		draft: z.boolean().optional().default(false),
		encrypted: z.boolean().optional().default(false),
		password: z.string().optional().default(""),
		routeName: z.string().optional(),
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

// ❯ @docs Root-level .md/.mdx files with no enforced schema (about, uses, etc.)
const specCollection = defineCollection({
	loader: glob({ pattern: "[^_]*.{md,mdx}", base: "./src/content" }),
	schema: z.object({}),
});

// ❯ EXPORTS
export const collections = {
	posts: postsCollection,
	ctf: ctfCollection,
	spec: specCollection,
};
