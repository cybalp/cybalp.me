<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/VaultPanel.svelte
// ❯ @desc Vault post list: collapsible tree, search, sort, mobile filters.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { Category } from "@utils/content";
import type { Tag } from "@utils/tag";
import { getPostUrl, getTagUrl, url } from "@utils/url";
import {
	buildVaultTree,
	buildVaultFilterUrl,
	getYearsFromPosts,
	type CategoryNode,
	type VaultPost,
} from "@utils/vault";
import { formatDateToMMDD } from "@utils/date";
import { parseTags } from "@utils/tag";
import { onMount } from "svelte";

// @docs localStorage key for collapse state persistence.
// @hint STORAGE_KEY must match across sessions for persistence.
const STORAGE_KEY = "vault-tree-collapsed";
const DEBOUNCE_MS = 200;
const EXPAND_COLLAPSE_THRESHOLD = 5;

// ❯ TYPE DEFINITIONS
interface Props {
	sortedPosts?: VaultPost[];
	categoryList?: Category[];
	tagList?: Tag[];
	title?: string;
	description?: string;
}

// ❯ PROPS EXTRACTION
let { sortedPosts = [], categoryList = [], tagList = [], title = "", description = "" }: Props = $props();

// ❯ STATE MANAGEMENT
let tags = $state<string[]>([]);
let categories = $state<string[]>([]);
let uncategorized = $state<string | null>(null);
let yearFilter = $state<number | null>(null);
let collapsed = $state<Record<string, boolean>>({});
let searchQuery = $state("");
let searchDebounced = $state("");
let sortMode = $state<"date-desc" | "date-asc" | "title-asc" | "title-desc">("date-desc");
let mobileFilterOpen = $state(false);
let reducedMotion = $state(false);
let searchInputEl: HTMLInputElement | undefined;
let filterDrawerEl: HTMLDivElement | undefined;

// ❯ LIFECYCLE
// @hint Reads ?tag=, ?category=, ?uncategorized=, ?year= from URL.
function syncFromUrl() {
	const params = new URLSearchParams(window.location.search);
	tags = params.has("tag") ? params.getAll("tag") : [];
	categories = params.has("category") ? params.getAll("category") : [];
	uncategorized = params.get("uncategorized");
	const y = params.get("year");
	yearFilter = y ? Number.parseInt(y, 10) : null;
}

// @hint Persists collapse state to localStorage for cross-session restore.
function loadCollapsed() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Record<string, boolean>;
			collapsed = { ...collapsed, ...parsed };
		}
	} catch {
		/* ignore */
	}
}

function saveCollapsed() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
	} catch {
		/* ignore */
	}
}

onMount(() => {
	syncFromUrl();
	loadCollapsed();
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotion = mq.matches;
	const onReduceChange = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
	mq.addEventListener("change", onReduceChange);
	window.addEventListener("popstate", syncFromUrl);
	document.addEventListener("swup:contentReplaced", syncFromUrl);
	return () => {
		mq.removeEventListener("change", onReduceChange);
		window.removeEventListener("popstate", syncFromUrl);
		document.removeEventListener("swup:contentReplaced", syncFromUrl);
	};
});

// @docs Debounce search input to avoid filtering on every keystroke.
$effect(() => {
	const q = searchQuery;
	const t = setTimeout(() => {
		searchDebounced = q;
	}, DEBOUNCE_MS);
	return () => clearTimeout(t);
});

// ❯ UTILITY FUNCTIONS
function toggleCategory(name: string) {
	collapsed = { ...collapsed, [name]: !collapsed[name] };
	saveCollapsed();
}

function expandAll() {
	const next: Record<string, boolean> = {};
	for (const n of tree) next[n.name] = false;
	collapsed = next;
	saveCollapsed();
}

function collapseAll() {
	const next: Record<string, boolean> = {};
	for (const n of tree) next[n.name] = true;
	collapsed = next;
	saveCollapsed();
}

function handleCategoryKeydown(e: KeyboardEvent, name: string) {
	if (e.key === "Enter" || e.key === " ") {
		e.preventDefault();
		toggleCategory(name);
	}
}

// ❯ COMPUTED DATA
// @gogogo vault tree - tree structure built in @utils/vault
let tree = $derived(
	buildVaultTree(
		sortedPosts,
		{
			tags,
			categories,
			uncategorized,
			yearFilter,
			searchQuery: searchDebounced,
		},
		sortMode,
	),
);

function showYear(node: CategoryNode): boolean {
	return node.years.length > 1;
}

const hasActiveFilters = $derived(
	tags.length > 0 || categories.length > 0 || uncategorized !== null || (yearFilter !== null && !Number.isNaN(yearFilter)),
);

const totalFilteredCount = $derived(tree.reduce((sum, n) => sum + n.years.reduce((s, y) => s + y.posts.length, 0), 0));

const showExpandCollapse = $derived(tree.length >= EXPAND_COLLAPSE_THRESHOLD);

const vaultBaseUrl = url("/vault/");
const availableYears = $derived(getYearsFromPosts(sortedPosts));
const totalPostsCount = $derived(sortedPosts.length);
// Filtered/total format: "2/6" when filtered, "6" when not
const countDisplay = $derived(
	hasActiveFilters && totalFilteredCount !== totalPostsCount
		? `${totalFilteredCount}/${totalPostsCount}`
		: String(totalPostsCount),
);

// @docs Keep URL in sync with filter state for shareable links.
$effect(() => {
	const _ = { tags, categories, uncategorized, yearFilter };
	if (typeof window === "undefined") return;
	const path = (window.location.pathname || "/").replace(/\/$/, "");
	if (!path.endsWith("vault")) return;
	const u = buildVaultFilterUrl({ tags, categories, uncategorized, yearFilter });
	const want = u.replace(/\/vault\/?/, "/vault/");
	const have = ((window.location.pathname || "/") + (window.location.search || "")).replace(/\/vault\/?/, "/vault/");
	if (have !== want) window.history.replaceState(null, "", u);
});

function removeTag(t: string) {
	tags = tags.filter((x) => x !== t);
	pushUrl();
}
function removeCategory(c: string) {
	categories = categories.filter((x) => x !== c);
	pushUrl();
}
function removeUncategorized() {
	uncategorized = null;
	pushUrl();
}
function removeYear() {
	yearFilter = null;
	pushUrl();
}
function addTag(t: string) {
	if (!tags.includes(t)) tags = [...tags, t];
	pushUrl();
}
function pushUrl() {
	const u = buildVaultFilterUrl({ tags, categories, uncategorized, yearFilter });
	window.history.pushState(null, "", u);
}

// @docs Keyboard: / focus search, Escape clear/close drawer.
function handleKeydown(e: KeyboardEvent) {
	if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
		e.preventDefault();
		searchInputEl?.focus();
	} else if (e.key === "Escape") {
		searchQuery = "";
		mobileFilterOpen = false;
	}
}

// @docs Focus trap: when drawer opens, focus drawer content.
$effect(() => {
	if (mobileFilterOpen && filterDrawerEl) {
		const content = filterDrawerEl.querySelector(".vault-filter-drawer-content") as HTMLElement | null;
		content?.focus();
	}
});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- ❯ RENDER -->
<div class="vault-panel" class:reduced-motion={reducedMotion} role="region" aria-label="Vault post list">
	{#if title}
		<header class="vault-header">
			<div class="vault-header-text">
				<h1 class="vault-title arge-title">{title}</h1>
				{#if description}
					<p class="vault-description">{description}</p>
				{/if}
			</div>
			<span class="vault-count" aria-live="polite">{countDisplay}</span>
		</header>
	{/if}
	<!-- @gogogo vault toolbar - sticky, search, sort, expand/collapse -->
	<div class="vault-toolbar vault-toolbar-sticky">
		<div class="vault-toolbar-left">
			<input
				type="search"
				class="vault-search"
				placeholder={i18n(I18nKey.vaultSearchPlaceholder)}
				aria-label={i18n(I18nKey.vaultSearchPlaceholder)}
				bind:value={searchQuery}
				bind:this={searchInputEl}
			/>
			<select
				class="vault-sort"
				aria-label={i18n(I18nKey.vaultSortBy)}
				bind:value={sortMode}
			>
				<option value="date-desc">{i18n(I18nKey.vaultSortDateNewest)}</option>
				<option value="date-asc">{i18n(I18nKey.vaultSortDateOldest)}</option>
				<option value="title-asc">{i18n(I18nKey.vaultSortTitleA)}</option>
				<option value="title-desc">{i18n(I18nKey.vaultSortTitleZ)}</option>
			</select>
			{#if showExpandCollapse}
				<div class="vault-expand-collapse">
					<button type="button" class="vault-toolbar-btn" onclick={expandAll}>
						{i18n(I18nKey.vaultExpandAll)}
					</button>
					<button type="button" class="vault-toolbar-btn" onclick={collapseAll}>
						{i18n(I18nKey.vaultCollapseAll)}
					</button>
				</div>
			{/if}
		</div>
		<!-- @gogogo vault filters - mobile filter drawer trigger -->
		<button
			type="button"
			class="vault-mobile-filter-btn md:hidden"
			onclick={() => (mobileFilterOpen = !mobileFilterOpen)}
			aria-expanded={mobileFilterOpen}
			aria-controls="vault-filter-drawer"
		>
			{i18n(I18nKey.vaultFilters)}
		</button>
	</div>

	<!-- @gogogo vault filters - desktop: categories, tags, year -->
	<div class="vault-desktop-filters hidden md:flex">
		<div class="vault-filter-group">
			<span class="vault-filter-group-label">{i18n(I18nKey.categories)}</span>
			<div class="vault-filter-chips">
				<button type="button" class="vault-chip" class:active={categories.length === 0 && !uncategorized} onclick={() => { categories = []; uncategorized = null; pushUrl(); }}>
					{i18n(I18nKey.projectsAll)}
				</button>
				{#each categoryList as cat}
					<button
						type="button"
						class="vault-chip"
						class:active={categories.includes(cat.name)}
						onclick={() => {
							if (categories.includes(cat.name)) categories = categories.filter((c) => c !== cat.name);
							else { categories = [...categories, cat.name]; uncategorized = null; }
							pushUrl();
						}}
					>
						{cat.name} ({cat.count})
					</button>
				{/each}
				<button
					type="button"
					class="vault-chip"
					class:active={uncategorized !== null}
					onclick={() => {
						uncategorized = uncategorized ? null : "1";
						categories = [];
						pushUrl();
					}}
				>
					{i18n(I18nKey.uncategorized)}
				</button>
			</div>
		</div>
		<div class="vault-filter-group">
			<span class="vault-filter-group-label">{i18n(I18nKey.tags)}</span>
			<div class="vault-filter-chips">
				{#each tagList as tag}
					<button
						type="button"
						class="vault-chip"
						class:active={tags.includes(tag.name)}
						onclick={() => {
							if (tags.includes(tag.name)) tags = tags.filter((t) => t !== tag.name);
							else tags = [...tags, tag.name];
							pushUrl();
						}}
					>
						#{tag.name} ({tag.count})
					</button>
				{/each}
			</div>
		</div>
		{#if availableYears.length > 1}
			<div class="vault-filter-group vault-filter-year">
				<span class="vault-filter-group-label">{i18n(I18nKey.vaultYear)}</span>
				<select
					class="vault-year-select"
					aria-label={i18n(I18nKey.vaultYear)}
					value={yearFilter ?? ""}
					onchange={(e) => {
						const v = (e.currentTarget as HTMLSelectElement).value;
						yearFilter = v === "" ? null : Number.parseInt(v, 10);
						pushUrl();
					}}
				>
					<option value="">{i18n(I18nKey.vaultAllYears)}</option>
					{#each availableYears as y}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<!-- @gogogo vault filters - mobile filter drawer (focus trap when open) -->
	<div
		id="vault-filter-drawer"
		class="vault-filter-drawer md:hidden"
		class:open={mobileFilterOpen}
		role="dialog"
		aria-modal="true"
		aria-label={i18n(I18nKey.vaultFilters)}
		bind:this={filterDrawerEl}
	>
		<button
			type="button"
			class="vault-filter-drawer-backdrop"
			aria-label="Close filters"
			onclick={() => (mobileFilterOpen = false)}
		></button>
		<div class="vault-filter-drawer-content" tabindex="-1">
			<h3 class="vault-filter-drawer-title">{i18n(I18nKey.categories)}</h3>
			<div class="vault-filter-drawer-chips">
				<a href={vaultBaseUrl} class="vault-drawer-chip">{i18n(I18nKey.projectsAll)}</a>
				{#each categoryList as cat}
					<a href={cat.url} class="vault-drawer-chip">{cat.name} ({cat.count})</a>
				{/each}
			</div>
			<h3 class="vault-filter-drawer-title">{i18n(I18nKey.tags)}</h3>
			<div class="vault-filter-drawer-chips">
				{#each tagList as tag}
					<a href={getTagUrl(tag.name)} class="vault-drawer-chip">#{tag.name} ({tag.count})</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- ❯ Active filter badges with individual remove -->
	{#if hasActiveFilters}
		<div class="vault-filter-bar">
			<span class="vault-filter-badges">
				{#each categories as cat}
					<span class="vault-filter-badge">
						{cat}
						<button type="button" class="vault-badge-remove" aria-label={i18n(I18nKey.vaultRemoveFilter)} onclick={() => removeCategory(cat)}>×</button>
					</span>
				{/each}
				{#each tags as tag}
					<span class="vault-filter-badge">
						#{tag}
						<button type="button" class="vault-badge-remove" aria-label={i18n(I18nKey.vaultRemoveFilter)} onclick={() => removeTag(tag)}>×</button>
					</span>
				{/each}
				{#if uncategorized}
					<span class="vault-filter-badge">
						{i18n(I18nKey.uncategorized)}
						<button type="button" class="vault-badge-remove" aria-label={i18n(I18nKey.vaultRemoveFilter)} onclick={removeUncategorized}>×</button>
					</span>
				{/if}
				{#if yearFilter !== null && !Number.isNaN(yearFilter)}
					<span class="vault-filter-badge">
						{yearFilter}
						<button type="button" class="vault-badge-remove" aria-label={i18n(I18nKey.vaultRemoveFilter)} onclick={removeYear}>×</button>
					</span>
				{/if}
			</span>
			<button type="button" class="vault-filter-clear" onclick={() => { tags = []; categories = []; uncategorized = null; yearFilter = null; pushUrl(); }}>
				{i18n(I18nKey.vaultClearFilters)}
			</button>
		</div>
	{/if}

	<!-- ❯ Empty state -->
	{#if totalFilteredCount === 0}
		<div class="vault-empty">
			<p>{i18n(I18nKey.vaultNoResults)}</p>
			<a href={vaultBaseUrl} class="vault-empty-link">
				{i18n(I18nKey.vaultShowAll)}
			</a>
		</div>
	{:else}
		<div class="vault-tree">
			{#each tree as categoryNode, i}
				<div class="tree-branch">
					<button
						type="button"
						class="tree-category"
						onclick={() => toggleCategory(categoryNode.name)}
						onkeydown={(e) => handleCategoryKeydown(e, categoryNode.name)}
						aria-expanded={!collapsed[categoryNode.name]}
						aria-controls="tree-body-{i}"
					>
						<span class="tree-caret" class:collapsed={collapsed[categoryNode.name]}>▸</span>
						<span class="tree-category-name">{categoryNode.name}</span>
						<span class="tree-category-count">
							{categoryNode.years.reduce((sum, y) => sum + y.posts.length, 0)}
						</span>
					</button>

					<div
						id="tree-body-{i}"
						class="tree-body"
						class:collapsed={collapsed[categoryNode.name]}
						role="region"
					>
						<div class="tree-body-inner">
						{#each categoryNode.years as yearGroup}
							{#if showYear(categoryNode)}
								<div class="tree-year-row">
									<span class="tree-year-label">{yearGroup.year}</span>
								</div>
							{/if}
							{#each yearGroup.posts as post}
								<div class="tree-post group">
									<a href={post.postUrl ?? getPostUrl(post)} aria-label={post.data.title} class="tree-post-link">
										<span class="tree-post-date">{formatDateToMMDD(post.data.published)}</span>
										<span class="tree-post-title">{post.data.title}</span>
									</a>
									<span class="tree-post-tags">
										{#each parseTags(post.data.tags) as tag}
											<button type="button" class="tree-post-tag" onclick={(e) => { e.preventDefault(); e.stopPropagation(); addTag(tag); }}>#{tag}</button>
										{/each}
									</span>
								</div>
							{/each}
						{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ❯ STYLES -->
<style>
	.vault-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.vault-panel.reduced-motion .tree-body,
	.vault-panel.reduced-motion .vault-filter-drawer {
		transition: none;
	}

	.vault-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.vault-toolbar-sticky {
		position: sticky;
		top: 0;
		z-index: 10;
		padding-bottom: 0.5rem;
		margin-bottom: -0.25rem;
	}

	.vault-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.vault-header-text {
		min-width: 0;
	}

	.vault-title {
		font-size: 1.5rem;
		font-weight: 800;
		margin: 0 0 0.75rem;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.vault-title {
			font-size: 1.875rem;
		}
	}

	@media (min-width: 1024px) {
		.vault-title {
			font-size: 2.25rem;
		}
	}

	.vault-description {
		font-size: 0.9375rem;
		color: oklch(0.55 0.04 var(--hue));
		margin: 0;
	}

	.vault-count {
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: oklch(0.78 0.05 var(--hue));
		flex-shrink: 0;
	}

	.vault-toolbar-left {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.vault-search {
		flex: 1;
		min-width: 8rem;
		max-width: 16rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		border: 1px solid var(--line-divider);
		background: var(--btn-regular-bg);
		color: oklch(0.78 0.05 var(--hue));
	}

	.vault-search::placeholder {
		color: oklch(0.5 0.04 var(--hue));
	}

	.vault-sort {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		border-radius: 0.375rem;
		border: 1px solid var(--line-divider);
		background: var(--btn-regular-bg);
		color: oklch(0.78 0.05 var(--hue));
	}

	.vault-toolbar-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 0.25rem;
		border: 1px solid var(--line-divider);
		background: var(--btn-regular-bg);
		color: oklch(0.7 0.05 var(--hue));
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.vault-toolbar-btn:hover {
		background: var(--btn-regular-bg-hover);
	}

	.vault-mobile-filter-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.375rem;
		border: 1px solid var(--line-divider);
		background: color-mix(in oklch, var(--primary) 12%, transparent);
		color: var(--primary);
		cursor: pointer;
	}

	.vault-filter-drawer {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}

	.vault-filter-drawer.open {
		pointer-events: auto;
	}

	.vault-filter-drawer-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		background: oklch(0 0 0 / 0.4);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.25s ease;
		appearance: none;
	}

	.vault-filter-drawer.open .vault-filter-drawer-backdrop {
		opacity: 1;
	}

	.vault-filter-drawer-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 70vh;
		overflow-y: auto;
		background: var(--card-bg);
		border-radius: 1rem 1rem 0 0;
		padding: 1.25rem;
		transform: translateY(100%);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 -4px 24px oklch(0 0 0 / 0.2);
	}

	.vault-filter-drawer.open .vault-filter-drawer-content {
		transform: translateY(0);
	}

	.vault-filter-drawer-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: oklch(0.55 0.04 var(--hue));
		margin: 0 0 0.5rem;
	}

	.vault-filter-drawer-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.vault-drawer-chip {
		font-size: 0.8125rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		background: var(--btn-regular-bg);
		color: oklch(0.78 0.05 var(--hue));
		text-decoration: none;
		transition: background 0.2s ease;
	}

	.vault-drawer-chip:hover {
		background: var(--btn-regular-bg-hover);
		color: var(--primary);
	}

	.vault-filter-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: color-mix(in oklch, var(--primary) 8%, transparent);
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklch, var(--primary) 20%, transparent);
	}

	.vault-filter-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.vault-filter-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background: color-mix(in oklch, var(--primary) 15%, transparent);
		color: var(--primary);
	}

	.vault-filter-clear {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--primary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: opacity 0.2s ease;
	}

	.vault-filter-clear:hover {
		opacity: 0.8;
	}

	.vault-badge-remove {
		margin-left: 0.25rem;
		padding: 0 0.125rem;
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		opacity: 0.8;
	}

	.vault-badge-remove:hover {
		opacity: 1;
	}

	.vault-desktop-filters {
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--line-divider);
	}

	.vault-filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.vault-filter-group-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: oklch(0.55 0.04 var(--hue));
	}

	.vault-filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.vault-chip {
		font-size: 0.8125rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid var(--line-divider);
		background: var(--btn-regular-bg);
		color: oklch(0.78 0.05 var(--hue));
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.vault-chip:hover {
		background: var(--btn-regular-bg-hover);
		color: var(--primary);
	}

	.vault-chip.active {
		background: color-mix(in oklch, var(--primary) 15%, transparent);
		border-color: var(--primary);
		color: var(--primary);
	}

	.vault-filter-year {
		margin-left: auto;
	}

	.vault-year-select {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		border-radius: 0.375rem;
		border: 1px solid var(--line-divider);
		background: var(--btn-regular-bg);
		color: oklch(0.78 0.05 var(--hue));
		min-width: 6rem;
	}

	.vault-empty {
		text-align: center;
		padding: 2rem 1rem;
		color: oklch(0.55 0.04 var(--hue));
	}

	.vault-empty p {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
	}

	.vault-empty-link {
		display: inline-block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--primary);
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: color-mix(in oklch, var(--primary) 12%, transparent);
		transition: background 0.2s ease;
	}

	.vault-empty-link:hover {
		background: color-mix(in oklch, var(--primary) 20%, transparent);
	}

	.vault-tree {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.tree-branch {
		border-bottom: 1px solid var(--line-divider);
	}

	.tree-branch:last-child {
		border-bottom: none;
	}

	.tree-category {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.625rem 0;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		color: inherit;
		text-align: left;
		transition: background 0.2s ease, color 0.2s ease;
		border-radius: 0.375rem;
		margin: 0 0.125rem;
	}

	.tree-category:hover {
		background: color-mix(in oklch, var(--primary) 8%, transparent);
	}

	.tree-category:hover .tree-category-name {
		color: var(--primary);
	}

	.tree-caret {
		font-size: 0.6875rem;
		color: oklch(0.58 0.05 var(--hue));
		transition: transform 0.2s ease, color 0.2s ease;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		flex-shrink: 0;
		transform: rotate(90deg);
	}

	.tree-category:hover .tree-caret {
		color: var(--primary);
	}

	.tree-caret.collapsed {
		transform: rotate(0);
	}

	.tree-category-name {
		font-weight: 600;
		font-size: 0.9375rem;
		letter-spacing: 0.01em;
		color: oklch(0.8 0.05 var(--hue));
		transition: color 0.2s ease;
	}

	.tree-category-count {
		margin-left: auto;
		font-size: 0.6875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		padding: 0.1875rem 0.4375rem;
		border-radius: 0.25rem;
		background: color-mix(in oklch, var(--primary) 12%, transparent);
		color: oklch(0.65 0.06 var(--hue));
	}

	.tree-body {
		display: grid;
		grid-template-rows: 1fr;
		transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tree-body.collapsed {
		grid-template-rows: 0fr;
	}

	.tree-body-inner {
		min-height: 0;
		overflow: hidden;
		padding-left: 1.5rem;
		border-left: 1px solid var(--line-color);
		margin-left: 0.625rem;
	}

	.tree-year-row {
		padding: 0.375rem 0 0.25rem 0;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: oklch(0.52 0.04 var(--hue));
	}

	.tree-post {
		display: grid;
		grid-template-columns: 3rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.375rem 0.5rem;
		margin: 0.0625rem 0;
		min-height: 2.25rem;
		border-radius: 0.375rem;
	}

	.tree-post-link {
		grid-column: 1 / 3;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		min-width: 0;
	}

	.tree-post-link:hover .tree-post-title {
		color: var(--primary);
	}

	.tree-post:hover {
		background: var(--btn-plain-bg-hover);
	}

	.tree-post:active {
		background: var(--btn-plain-bg-active);
	}

	.tree-post-date {
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		color: oklch(0.5 0.04 var(--hue));
		flex-shrink: 0;
	}

	.tree-post-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: oklch(0.78 0.05 var(--hue));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.2s ease;
		min-width: 0;
	}

	.tree-post-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	.tree-post-tag {
		font-size: 0.625rem;
		font-weight: 500;
		color: oklch(0.55 0.05 var(--hue));
		padding: 0.125rem 0.375rem;
		border-radius: 0.2rem;
		background: color-mix(in oklch, var(--btn-regular-bg) 100%, transparent);
		border: 1px solid var(--line-divider);
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.tree-post-tag:hover {
		background: color-mix(in oklch, var(--primary) 15%, transparent);
		color: var(--primary);
	}

	@media (max-width: 767px) {
		.vault-header {
			margin-bottom: 1.5rem;
		}

		.vault-count {
			font-size: 1.125rem;
		}

		.vault-toolbar {
			gap: 0.625rem;
			row-gap: 0.75rem;
		}

		.vault-toolbar-left {
			flex: 1;
			min-width: min(100%, 12rem);
		}

		.vault-search {
			max-width: none;
		}

		.vault-mobile-filter-btn {
			min-height: 2.5rem;
			padding: 0.5rem 1rem;
		}

		.tree-post-tags {
			display: none;
		}

		.tree-post {
			grid-template-columns: 2.75rem 1fr;
		}
	}
</style>
