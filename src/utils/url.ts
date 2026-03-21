// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/url.ts
// ❯ @desc URL generation utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { CollectionEntry } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { CATEGORY_SEPARATOR } from "@utils/category";

// ❯ PATH UTILITIES
// ❯ @doc Compares two paths for equality.
export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

// ❯ @doc Joins URL parts and normalizes slashes.
function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

// ❯ @doc Removes markdown file extensions.
export function removeFileExtension(id: string): string {
	return id.replace(/\.(md|mdx|markdown)$/i, "");
}

// ❯ POST URLS
// ❯ @doc Generates post URL from slug.
export function getPostUrlBySlug(slug: string): string {
	const slugWithoutExt = removeFileExtension(slug);
	return url(`/posts/${slugWithoutExt}/`);
}

// ❯ @doc Generates post URL from route name.
export function getPostUrlByRouteName(routeName: string): string {
	const cleanRouteName = routeName.replace(/^\/+/, "");
	return url(`/posts/${cleanRouteName}/`);
}

// ❯ @doc Gets post URL with route name priority.
export function getPostUrl(post: CollectionEntry<"posts">): string;
export function getPostUrl(post: {
	id: string;
	data: { routeName?: string };
}): string;
export function getPostUrl(post: any): string {
	if (post.data.routeName) {
		return getPostUrlByRouteName(post.data.routeName);
	}
	return getPostUrlBySlug(post.id);
}

// ❯ CTF WRITEUP URLS
// ❯ @doc Canonical path for content/ctf writeups (not under /posts/).
export function getCtfWriteupUrl(
	entry: CollectionEntry<"ctf"> | { id: string },
): string {
	const slug = removeFileExtension(entry.id);
	return url(`/ctf/writeups/${slug}/`);
}

// ❯ @doc Resolves prev/next links by collection id (slug path).
export function getCtfWriteupUrlBySlug(slug: string): string {
	const clean = removeFileExtension(slug);
	return url(`/ctf/writeups/${clean}/`);
}

// ❯ @doc Generates category vault URL.
export function getCategoryUrl(category: string | string[] | null): string {
	if (!category) return url("/vault/?uncategorized=true");
	const parts = Array.isArray(category)
		? category
				.map((item) => String(item).trim())
				.filter((item) => item.length > 0)
		: [category.trim()];
	const label = parts.join(CATEGORY_SEPARATOR).trim();
	if (
		!label ||
		label.toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	) {
		return url("/vault/?uncategorized=true");
	}
	return url(`/vault/?category=${encodeURIComponent(label)}`);
}

// ❯ @doc Generates tag vault URL.
export function getTagUrl(tag: string): string {
	if (!tag) return url("/vault/");
	return url(`/vault/?tag=${encodeURIComponent(tag.trim())}`);
}

// ❯ @doc Extracts directory path from file path.
export function getDir(path: string): string {
	const pathWithoutExt = removeFileExtension(path);
	const lastSlashIndex = pathWithoutExt.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return pathWithoutExt.substring(0, lastSlashIndex + 1);
}

// ❯ @doc Gets directory from file path.
export function getFileDirFromPath(filePath: string): string {
	return filePath.replace(/^src\//, "").replace(/\/[^/]+$/, "");
}

// ❯ @doc Builds URL with base path.
export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
