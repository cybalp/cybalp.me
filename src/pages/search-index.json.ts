// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/search-index.json.ts
// ❯ @desc Static search index endpoint. Generates /search-index.json at build time.
//        Aggregates all enabled content sources into a single searchable JSON array.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { sortedAlbums } from "@utils/media";
import { sortedMoments } from "@utils/PersonalLog";
import { getSortedPracticalCodes } from "@utils/practical-codes";
import { removeFileExtension } from "@utils/url";
import type { SearchIndexItem } from "@utils/search";
import { searchConfig } from "@/config";

export const prerender = true;

// ❯ TYPES
// ❯ @docs Canonical type lives in @utils/search — imported here to ensure endpoint and client share the same shape.
export type { SearchIndexItem };

// ❯ UTILITIES
// ❯ @doc Strips common markdown syntax to produce clean plain text for indexing.
function stripMarkdown(md: string): string {
	return md
		.replace(/^---[\s\S]*?---\n?/m, "") // frontmatter
		.replace(/```[\s\S]*?```/g, "") // fenced code blocks
		.replace(/`[^`]*`/g, "") // inline code
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "") // images
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → keep text
		.replace(/^#{1,6}\s+/gm, "") // headings
		.replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
		.replace(/(\*|_)(.*?)\1/g, "$2") // italic
		.replace(/^[-*+]\s+/gm, "") // unordered list markers
		.replace(/^\d+\.\s+/gm, "") // ordered list markers
		.replace(/^>\s+/gm, "") // blockquotes
		.replace(/\n{3,}/g, "\n\n") // excess newlines
		.trim();
}

// ❯ @doc Checks if a source id is enabled in config.
function isSourceEnabled(sourceId: string): boolean {
	if (!searchConfig?.sources) return true;
	const source = searchConfig.sources.find((s) => s.id === sourceId);
	return source ? source.enabled : false;
}

// ❯ INDEX BUILDERS
// ❯ @doc Builds search index entries from blog posts collection.
async function buildPostsIndex(): Promise<SearchIndexItem[]> {
	if (!isSourceEnabled("posts")) return [];

	const posts = await getCollection("posts", ({ data }) =>
		import.meta.env.PROD ? data.draft !== true : true,
	);

	return posts.map((entry) => {
		const rawContent = stripMarkdown(entry.body ?? "");
		return {
			id: `post-${entry.id}`,
			type: "post" as const,
			source: "posts",
			title: entry.data.title,
			content: [
				entry.data.description ?? "",
				rawContent,
			]
				.join(" ")
				.slice(0, 800),
			url: `/posts/${entry.id}/`,
			tags: entry.data.tags ?? [],
			meta: {
				date: entry.data.published?.toISOString(),
				category: Array.isArray(entry.data.category)
					? entry.data.category.join("/")
					: entry.data.category ?? "",
			},
		};
	});
}

// ❯ @doc CTF writeups — src/content/ctf, URLs /ctf/writeups/:slug/
async function buildCtfWriteupsIndex(): Promise<SearchIndexItem[]> {
	if (!isSourceEnabled("ctf")) return [];

	const entries = await getCollection("ctf", ({ data }) =>
		import.meta.env.PROD ? data.draft !== true : true,
	);

	return entries.map((entry) => {
		const rawContent = stripMarkdown(entry.body ?? "");
		const slug = removeFileExtension(entry.id);
		return {
			id: `ctf-${entry.id}`,
			type: "ctf" as const,
			source: "ctf",
			title: entry.data.title,
			content: [entry.data.description ?? "", rawContent].join(" ").slice(0, 800),
			url: `/ctf/writeups/${slug}/`,
			tags: entry.data.tags ?? [],
			meta: {
				date: entry.data.published?.toISOString(),
				category: "CTF!",
			},
		};
	});
}

// ❯ @doc Builds search index entries from practical code snippets.
function buildCodesIndex(): SearchIndexItem[] {
	if (!isSourceEnabled("practicalCodes")) return [];

	return getSortedPracticalCodes().map((code) => ({
		id: `code-${code.id}`,
		type: "code" as const,
		source: "practicalCodes",
		title: code.title,
		content: [
			code.description ?? "",
			(code.tags ?? []).join(" "),
			code.code,
		]
			.join(" ")
			.slice(0, 600),
		url: `/practical-codes/#code-${code.id}`,
		tags: code.tags ?? [],
		meta: {
			language: code.language,
			date: code.date,
		},
	}));
}

// ❯ @doc Builds search index entries from PersonalLog moments.
function buildMomentsIndex(): SearchIndexItem[] {
	if (!isSourceEnabled("personalLog")) return [];

	return sortedMoments.map((moment) => ({
		id: `moment-${moment.id}`,
		type: "moment" as const,
		source: "personalLog",
		title: moment.title ?? moment.content.slice(0, 60),
		content: [moment.title ?? "", moment.content].join(" ").slice(0, 400),
		url: "/Personal/",
		meta: {
			date: moment.date,
		},
	}));
}

// ❯ @doc Builds search index entries from media albums.
function buildMediaIndex(): SearchIndexItem[] {
	if (!isSourceEnabled("media")) return [];

	return sortedAlbums
		.filter((album) => album.visible !== false)
		.map((album) => ({
			id: `album-${album.id}`,
			type: "album" as const,
			source: "media",
			title: album.title,
			content: [
				album.description ?? "",
				(album.tags ?? []).join(" "),
				album.location ?? "",
			]
				.join(" ")
				.trim(),
			url: `/media/${album.id}/`,
			tags: album.tags ?? [],
			meta: {
				date: album.date,
				location: album.location,
			},
		}));
}

// ❯ ROUTE HANDLER
export const GET: APIRoute = async () => {
	const [posts, ctfWriteups, codes, moments, media] = await Promise.all([
		buildPostsIndex(),
		buildCtfWriteupsIndex(),
		Promise.resolve(buildCodesIndex()),
		Promise.resolve(buildMomentsIndex()),
		Promise.resolve(buildMediaIndex()),
	]);

	const index: SearchIndexItem[] = [
		...posts,
		...ctfWriteups,
		...codes,
		...moments,
		...media,
	];

	return new Response(JSON.stringify(index), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
