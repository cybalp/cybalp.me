// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/search.ts
// ❯ @desc Client-side search engine. Fuzzy matching, multi-field scoring, and result highlighting.
//        Fetches /search-index.json once and caches it for instant subsequent searches.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { SearchSource } from "@/types/config";

// ❯ @docs Defined here (not re-exported from the page endpoint) to avoid ambiguous JSON import resolution.
export interface SearchIndexItem {
	id: string;
	type: "post" | "code" | "moment" | "album";
	source: string;
	title: string;
	content: string;
	url: string;
	tags?: string[];
	meta?: {
		language?: string;
		date?: string;
		category?: string;
		location?: string;
	};
}

// ❯ TYPES
export interface SearchResult {
	item: SearchIndexItem;
	score: number;
	snippet: string;
	highlightedTitle: string;
}

export interface PageNavigationResult {
	kind: "page";
	label: string;
	url: string;
	source: SearchSource;
	score: number;
}

export type AnyResult = SearchResult | PageNavigationResult;

// ❯ STATE
// ❯ @doc In-memory cache of the search index — fetched once, reused for all searches.
let indexCache: SearchIndexItem[] | null = null;
let fetchPromise: Promise<SearchIndexItem[]> | null = null;

// ❯ INDEX LOADING
// ❯ @doc Fetches /search-index.json with deduplication — concurrent callers share one fetch.
export async function loadSearchIndex(): Promise<SearchIndexItem[]> {
	if (indexCache !== null) return indexCache;
	if (fetchPromise !== null) return fetchPromise;

	fetchPromise = fetch("/search-index.json")
		.then((res) => {
			if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`);
			return res.json() as Promise<SearchIndexItem[]>;
		})
		.then((data) => {
			indexCache = data;
			fetchPromise = null;
			return data;
		})
		.catch((err) => {
			fetchPromise = null;
			console.error("[search] Index load failed:", err);
			return [];
		});

	return fetchPromise;
}

// ❯ FUZZY MATCHING
// ❯ @doc Computes trigram similarity between exactly TWO SHORT strings (words), not sentences.
//        Dice coefficient on 3-char ngrams. "btrffs" vs "btrfs" → ~0.57 → match.
function trigramSimilarity(a: string, b: string): number {
	const na = a.toLowerCase().trim();
	const nb = b.toLowerCase().trim();
	if (na === nb) return 1;
	if (na.length < 2 || nb.length < 2) return 0;
	if (na.length < 3 || nb.length < 3) {
		return nb.includes(na) || na.includes(nb) ? 0.5 : 0;
	}

	const getTrigrams = (s: string): Set<string> => {
		const set = new Set<string>();
		for (let i = 0; i <= s.length - 3; i++) {
			set.add(s.slice(i, i + 3));
		}
		return set;
	};

	const ta = getTrigrams(na);
	const tb = getTrigrams(nb);
	let intersection = 0;
	for (const t of ta) {
		if (tb.has(t)) intersection++;
	}
	return (2 * intersection) / (ta.size + tb.size);
}

// ❯ @doc Compares a query token against EACH WORD in a text, returns best similarity.
//        This is the key fix: "btrffs" matches "btrfs" in "BTRFS Error" because we
//        compare word-by-word instead of against the full sentence.
function bestWordSimilarity(token: string, text: string): number {
	const words = text.toLowerCase().split(/[\s\-_/]+/).filter((w) => w.length >= 2);
	if (!words.length) return 0;
	return Math.max(...words.map((w) => trigramSimilarity(token, w)));
}

// ❯ HIGHLIGHTING
// ❯ @doc Wraps matched tokens in <mark> tags for display. Safe against XSS — escapes HTML first.
export function highlightText(text: string, tokens: string[]): string {
	if (!tokens.length || !text) return text;
	const escaped = (t: string) =>
		t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = tokens
		.filter((t) => t.length > 0)
		.map(escaped)
		.join("|");
	if (!pattern) return text;
	const regex = new RegExp(`(${pattern})`, "gi");
	return text.replace(regex, "<mark>$1</mark>");
}

// ❯ @doc Extracts a ~200-char snippet from content, centered on the first match.
export function extractSnippet(
	content: string,
	tokens: string[],
	maxLength = 200,
): string {
	if (!content) return "";
	const lower = content.toLowerCase();
	let startIdx = 0;

	for (const token of tokens) {
		const idx = lower.indexOf(token.toLowerCase());
		if (idx !== -1) {
			startIdx = Math.max(0, idx - 60);
			break;
		}
	}

	const raw = content.slice(startIdx, startIdx + maxLength);
	const prefix = startIdx > 0 ? "..." : "";
	const suffix = startIdx + maxLength < content.length ? "..." : "";
	return prefix + raw + suffix;
}

// ❯ SCORING
// ❯ @doc Scores a single item against tokenized query. Higher = better match.
function scoreItem(item: SearchIndexItem, tokens: string[]): number {
	if (!tokens.length) return 0;

	let score = 0;
	const titleLower = item.title.toLowerCase();
	const contentLower = item.content.toLowerCase();
	const tagsStr = (item.tags ?? []).join(" ").toLowerCase();
	const langStr = (item.meta?.language ?? "").toLowerCase();

	for (const token of tokens) {
		const tl = token.toLowerCase();

		// ❯ Title scoring — exact/prefix/contains first, then word-level fuzzy
		if (titleLower === tl) {
			score += 100;
		} else if (titleLower.startsWith(tl)) {
			score += 80;
		} else if (titleLower.includes(tl)) {
			score += 60;
		} else {
			// ❯ @docs Word-level fuzzy: compare token against each title word separately.
			// "btrffs" → splits "BTRFS Error" into ["btrfs","error"] → sim("btrffs","btrfs")≈0.57 → match
			const sim = bestWordSimilarity(tl, titleLower);
			if (sim > 0.44) score += Math.round(sim * 55);
		}

		// ❯ Tag scoring
		if (tagsStr.includes(tl)) score += 50;
		else {
			const sim = bestWordSimilarity(tl, tagsStr);
			if (sim > 0.5) score += Math.round(sim * 35);
		}

		// ❯ Language scoring (for code items)
		if (langStr === tl || langStr.includes(tl)) score += 40;

		// ❯ Content scoring — word-level fuzzy on first 400 chars
		if (contentLower.includes(tl)) {
			score += 30;
		} else {
			const sim = bestWordSimilarity(tl, contentLower.slice(0, 400));
			if (sim > 0.44) score += Math.round(sim * 22);
		}
	}

	// ❯ Multi-token bonus: reward items that match more tokens
	const matchedTokenCount = tokens.filter(
		(t) =>
			titleLower.includes(t.toLowerCase()) ||
			contentLower.includes(t.toLowerCase()) ||
			tagsStr.includes(t.toLowerCase()),
	).length;
	if (matchedTokenCount > 1) score += matchedTokenCount * 15;

	return score;
}

// ❯ PAGE ALIAS MATCHING
// ❯ @doc Checks if query matches a source's page aliases for quick navigation.
export function matchPageAliases(
	query: string,
	sources: SearchSource[],
): PageNavigationResult[] {
	const q = query.toLowerCase().trim();
	if (!q) return [];

	return sources
		.filter((s) => s.enabled)
		.flatMap((source) => {
			const match = source.aliases.some(
				(alias) =>
					alias.toLowerCase() === q ||
					alias.toLowerCase().startsWith(q) ||
					q.startsWith(alias.toLowerCase()),
			);
			if (!match) return [];
			return [
				{
					kind: "page" as const,
					label: `Go to ${source.label}`,
					url: source.url,
					source,
					score: 200,
				},
			];
		})
		.sort((a, b) => b.score - a.score);
}

// ❯ MAIN SEARCH
// ❯ @doc Performs full search over the cached index. Returns scored, highlighted results.
//        enabledSources filters items by source id — even if index was built with more sources,
//        only items from enabled sources are returned. This makes config changes take effect
//        without needing to re-fetch the index.
export function performSearch(
	query: string,
	index: SearchIndexItem[],
	enabledSources?: Set<string>,
	maxResults = 20,
): SearchResult[] {
	const tokens = query
		.trim()
		.split(/\s+/)
		.filter((t) => t.length > 1);

	if (!tokens.length) return [];

	const filteredIndex =
		enabledSources && enabledSources.size > 0
			? index.filter((item) => enabledSources.has(item.source))
			: index;

	const scored = filteredIndex
		.map((item) => ({ item, score: scoreItem(item, tokens) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, maxResults);

	return scored.map(({ item, score }) => {
		const rawSnippet = extractSnippet(item.content, tokens);
		return {
			item,
			score,
			snippet: highlightText(rawSnippet, tokens),
			highlightedTitle: highlightText(item.title, tokens),
		};
	});
}
