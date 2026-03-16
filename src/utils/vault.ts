// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/vault.ts
// ❯ @desc Vault tree building and filter logic.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryPathLabel, getCategoryPathParts } from "@utils/category";
import { parseTags } from "@utils/tag";

// ❯ TYPES
export type VaultPost = {
	id: string;
	data: {
		title: string;
		tags: string[];
		category?: string | string[] | null;
		published: Date | string;
		routeName?: string;
	};
};

export type YearGroup = {
	year: number;
	posts: VaultPost[];
};

export type CategoryNode = {
	name: string;
	years: YearGroup[];
};

export type VaultFilters = {
	tags: string[];
	categories: string[];
	uncategorized: string | null;
	yearFilter: number | null;
	searchQuery: string;
};

export type SortMode = "date-desc" | "date-asc" | "title-asc" | "title-desc";

// ❯ CONSTANTS
// @gogogo vault tree - category order for tree structure
export const CATEGORY_ORDER = ["APP!", "HOW!", "WHO!"];

// ❯ HELPERS
// @docs Checks if post category matches any target (supports hierarchical paths).
export function isCategoryMatch(
	category: string | string[] | null | undefined,
	targets: string[],
): boolean {
	const postParts = getCategoryPathParts(category);
	if (!postParts || postParts.length === 0) return false;
	return targets.some((target) => {
		const targetParts = target
			.split(" / ")
			.map((p) => p.trim())
			.filter((p) => p.length > 0);
		if (targetParts.length === 0 || targetParts.length > postParts.length)
			return false;
		return targetParts.every((part, i) => part === postParts[i]);
	});
}

function groupByYear(posts: VaultPost[], sortAsc: boolean): YearGroup[] {
	const byYear = new Map<number, VaultPost[]>();
	for (const p of posts) {
		const y = new Date(p.data.published).getFullYear();
		const list = byYear.get(y) ?? [];
		list.push(p);
		byYear.set(y, list);
	}
	return Array.from(byYear.entries())
		.sort((a, b) => (sortAsc ? a[0] - b[0] : b[0] - a[0]))
		.map(([year, posts]) => ({ year, posts }));
}

// @docs Builds category→year→posts tree from filtered posts.
// @hint Uses CATEGORY_ORDER for primary categories; uncategorized last.
export function buildVaultTree(
	posts: VaultPost[],
	filters: VaultFilters,
	sortMode: SortMode,
): CategoryNode[] {
	let filtered = posts.map((p) => ({
		...p,
		data: { ...p.data, published: new Date(p.data.published) },
	}));

	if (filters.tags.length > 0) {
		filtered = filtered.filter((p) =>
			parseTags(p.data.tags).some((t) => filters.tags.includes(t)),
		);
	}
	if (filters.categories.length > 0) {
		filtered = filtered.filter((p) =>
			isCategoryMatch(p.data.category, filters.categories),
		);
	}
	if (filters.uncategorized !== null) {
		filtered = filtered.filter(
			(p) => !getCategoryPathLabel(p.data.category),
		);
	}
	if (
		filters.yearFilter !== null &&
		!Number.isNaN(filters.yearFilter)
	) {
		filtered = filtered.filter(
			(p) => new Date(p.data.published).getFullYear() === filters.yearFilter,
		);
	}
	const q = filters.searchQuery.trim().toLowerCase();
	if (q) {
		filtered = filtered.filter((p) =>
			p.data.title.toLowerCase().includes(q),
		);
	}

	const sorted = filtered.slice();
	if (sortMode === "date-desc") {
		sorted.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
	} else if (sortMode === "date-asc") {
		sorted.sort((a, b) => a.data.published.getTime() - b.data.published.getTime());
	} else if (sortMode === "title-asc") {
		sorted.sort((a, b) => a.data.title.localeCompare(b.data.title));
	} else {
		sorted.sort((a, b) => b.data.title.localeCompare(a.data.title));
	}

	const byCategory = new Map<string, VaultPost[]>();
	for (const p of sorted) {
		const label =
			getCategoryPathLabel(p.data.category) ?? i18n(I18nKey.uncategorized);
		const list = byCategory.get(label) ?? [];
		list.push(p);
		byCategory.set(label, list);
	}

	const sortAsc = sortMode === "date-asc";
	const ucLabel = i18n(I18nKey.uncategorized);
	const seen = new Set<string>();
	const nodes: CategoryNode[] = [];

	for (const cat of CATEGORY_ORDER) {
		const postsInCat = byCategory.get(cat);
		if (postsInCat?.length) {
			seen.add(cat);
			nodes.push({ name: cat, years: groupByYear(postsInCat, sortAsc) });
		}
	}
	const ucPosts = byCategory.get(ucLabel);
	if (ucPosts?.length) {
		nodes.push({ name: ucLabel, years: groupByYear(ucPosts, sortAsc) });
	}
	for (const [label, postsInCat] of byCategory) {
		if (seen.has(label) || label === ucLabel) continue;
		seen.add(label);
		nodes.push({ name: label, years: groupByYear(postsInCat, sortAsc) });
	}
	return nodes;
}
