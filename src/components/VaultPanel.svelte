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
}

// ❯ PROPS EXTRACTION
let { sortedPosts = [], categoryList = [], tagList = [] }: Props = $props();

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
	const onReduceChange = (e: MediaQueryListEvent) => {
		reducedMotion = e.matches;
	};
	mq.addEventListener("change", onReduceChange);
	window.addEventListener("popstate", syncFromUrl);
	return () => {
		mq.removeEventListener("change", onReduceChange);
		window.removeEventListener("popstate", syncFromUrl);
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
</script>

<!-- ❯ RENDER -->
<div class="vault-panel" class:reduced-motion={reducedMotion}>
	<!-- ❯ Toolbar: search, sort, expand/collapse, mobile filters -->
	<div class="vault-toolbar">
		<div class="vault-toolbar-left">
			<input
				type="search"
				class="vault-search"
				placeholder={i18n(I18nKey.vaultSearchPlaceholder)}
				aria-label={i18n(I18nKey.vaultSearchPlaceholder)}
				bind:value={searchQuery}
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

	<!-- @gogogo vault filters - mobile filter drawer -->
	<div
		id="vault-filter-drawer"
		class="vault-filter-drawer md:hidden"
		class:open={mobileFilterOpen}
		role="dialog"
		aria-label={i18n(I18nKey.vaultFilters)}
	>
		<button
			type="button"
			class="vault-filter-drawer-backdrop"
			aria-label="Close filters"
			onclick={() => (mobileFilterOpen = false)}
		></button>
		<div class="vault-filter-drawer-content">
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

	<!-- ❯ Active filter badge + Clear link -->
	{#if hasActiveFilters}
		<div class="vault-filter-bar">
			<span class="vault-filter-badges">
				{#each categories as cat}
					<span class="vault-filter-badge">{cat}</span>
				{/each}
				{#each tags as tag}
					<span class="vault-filter-badge">#{tag}</span>
				{/each}
				{#if uncategorized}
					<span class="vault-filter-badge">{i18n(I18nKey.uncategorized)}</span>
				{/if}
				{#if yearFilter !== null && !Number.isNaN(yearFilter)}
					<span class="vault-filter-badge">{yearFilter}</span>
				{/if}
			</span>
			<a href={vaultBaseUrl} class="vault-filter-clear">
				{i18n(I18nKey.vaultClearFilters)}
			</a>
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
								<a
									href={getPostUrl(post)}
									aria-label={post.data.title}
									class="tree-post group"
								>
									<span class="tree-post-date">{formatDateToMMDD(post.data.published)}</span>
									<span class="tree-post-title">{post.data.title}</span>
									<span class="tree-post-tags">
										{#each parseTags(post.data.tags) as tag}
											<span class="tree-post-tag">#{tag}</span>
										{/each}
									</span>
								</a>
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
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.vault-filter-clear:hover {
		opacity: 0.8;
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
		text-decoration: none;
		transition: background 0.2s ease, transform 0.15s ease;
		min-height: 2.25rem;
		border-radius: 0.375rem;
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

	.tree-post:hover .tree-post-title {
		color: var(--primary);
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
	}

	@media (max-width: 767px) {
		.tree-post-tags {
			display: none;
		}

		.tree-post {
			grid-template-columns: 2.75rem 1fr;
		}
	}
</style>
