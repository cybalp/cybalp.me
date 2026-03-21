// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/ctf.ts
// ❯ @desc CTF writeup collection loaders, vault merge, and sort helpers.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { type CollectionEntry, getCollection } from "astro:content";
import type { VaultPost } from "@utils/vault";
import { getCtfWriteupUrl } from "@utils/url";

// ❯ RAW LOAD
// ❯ @doc Draft filtering matches posts collection behaviour.
async function getRawSortedCtf() {
	const all = await getCollection("ctf", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	return all.sort((a, b) => {
		if (a.data.pinned && !b.data.pinned) return -1;
		if (!a.data.pinned && b.data.pinned) return 1;
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
}

// ❯ SORTED + NAV
// ❯ @doc Injects prev/next slugs for adjacent writeups (same pattern as getSortedPosts).
export async function getSortedCtfWriteups() {
	const sorted = await getRawSortedCtf();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].id;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].id;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

// ❯ VAULT
// ❯ @doc Maps CTF entries into VaultPost with explicit URL (not /posts/...).
export async function getSortedCtfForVault(): Promise<VaultPost[]> {
	const entries = await getRawSortedCtf();
	return entries.map((entry) => ({
		id: entry.id,
		data: {
			title: entry.data.title,
			tags: entry.data.tags ?? [],
			category: "CTF!",
			published: entry.data.published,
		},
		postUrl: getCtfWriteupUrl(entry),
	}));
}

// ❯ LIST HELPERS
export type CtfForList = {
	id: string;
	data: CollectionEntry<"ctf">["data"];
};

export async function getSortedCtfList(): Promise<CtfForList[]> {
	const sorted = await getRawSortedCtf();
	return sorted.map((post) => ({ id: post.id, data: post.data }));
}
