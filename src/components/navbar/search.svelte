<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/navbar/search.svelte
// ❯ @desc Spotlight-style search overlay with command mode, fuzzy search,
//        quick access, keyboard navigation, and localStorage history.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@components/common/icon.svelte";
import {
	buildEasterEgg,
	buildHelpLines,
	executeCommandAction,
	isUnixEasterEgg,
	matchCommands,
	parseCommandInput,
} from "@utils/commands";
import { navigateToPage } from "@utils/navigation";
import {
	loadSearchIndex,
	matchPageAliases,
	performSearch,
} from "@utils/search";
import { onDestroy, onMount } from "svelte";
import type { SearchCommand, SearchSource } from "@/types/config";
import type { SearchIndexItem, SearchResult } from "@utils/search";
import type { CommandMatch, EasterEggResult } from "@utils/commands";

// ❯ PROPS
// ❯ @hint sources and commands are passed from navbar.astro via searchConfig
let {
	sources = [] as SearchSource[],
	commands = [] as SearchCommand[],
}: {
	sources: SearchSource[];
	commands: SearchCommand[];
} = $props();

// ❯ STATE
let isOpen = $state(false);
let inputValue = $state("");
let selectedIndex = $state(-1);
let isLoading = $state(false);
let indexCache = $state<SearchIndexItem[] | null>(null);

// ❯ Results state
let searchResults = $state<SearchResult[]>([]);
let pageMatches = $state<{ kind: "page"; label: string; url: string; source: SearchSource; score: number }[]>([]);
let commandMatches = $state<CommandMatch[]>([]);
let easterEgg = $state<EasterEggResult | null>(null);
let helpLines = $state<string[] | null>(null);

// ❯ History state (localStorage)
let history = $state<Array<{ url: string; title: string; type: string }>>([]);

// ❯ Portal element (moved to document.body for proper stacking)
let overlayEl: HTMLDivElement;
let inputEl = $state<HTMLInputElement | null>(null);

// ❯ DERIVED
let isCommandMode = $derived(inputValue.startsWith(">"));
let cleanInput = $derived(
	isCommandMode ? parseCommandInput(inputValue) : inputValue.trim(),
);
let placeholder = $derived(
	isCommandMode ? "> type a command... (try 'help')" : "$ search...",
);
let hasResults = $derived(
	searchResults.length > 0 ||
		pageMatches.length > 0 ||
		commandMatches.length > 0 ||
		easterEgg !== null ||
		helpLines !== null,
);
let showEmpty = $derived(isOpen && !cleanInput && !isLoading);
let showResults = $derived(isOpen && (hasResults || (cleanInput.length > 0 && !isLoading)));

// ❯ All navigable items (for keyboard nav)
type NavItem =
	| { kind: "page"; url: string; label: string; source: SearchSource }
	| { kind: "content"; url: string; title: string }
	| { kind: "command"; action: string; label: string }
	| { kind: "history"; url: string; title: string };

let navItems = $derived<NavItem[]>([
	...pageMatches.map((p) => ({
		kind: "page" as const,
		url: p.url,
		label: p.label,
		source: p.source,
	})),
	...commandMatches.map((m) => ({
		kind: "command" as const,
		action: m.command.action,
		label: m.command.label,
	})),
	...searchResults.map((r) => ({
		kind: "content" as const,
		url: r.item.url,
		title: r.item.title,
	})),
]);

// ❯ HISTORY MANAGEMENT
// ❯ @doc Loads click history from localStorage.
function loadHistory(): void {
	try {
		const raw = localStorage.getItem("cybalp_search_history");
		history = raw ? JSON.parse(raw) : [];
	} catch {
		history = [];
	}
}

// ❯ @doc Saves a visited item to history (max 10 entries).
function saveToHistory(url: string, title: string, type: string): void {
	try {
		const entry = { url, title, type };
		const filtered = history.filter((h) => h.url !== url);
		const updated = [entry, ...filtered].slice(0, 10);
		history = updated;
		localStorage.setItem("cybalp_search_history", JSON.stringify(updated));
	} catch {
		// ignore storage errors
	}
}

// ❯ PANEL CONTROL
function open(): void {
	isOpen = true;
	selectedIndex = -1;
	loadHistory();
	preloadIndex();
	// Focus input on next tick
	requestAnimationFrame(() => inputEl?.focus());
}

function close(): void {
	isOpen = false;
	inputValue = "";
	selectedIndex = -1;
	clearResults();
}

function clearResults(): void {
	searchResults = [];
	pageMatches = [];
	commandMatches = [];
	easterEgg = null;
	helpLines = null;
}

// ❯ INDEX PRELOADING
// ❯ @doc Starts index fetch in background so first search is instant.
async function preloadIndex(): Promise<void> {
	if (indexCache !== null) return;
	isLoading = true;
	try {
		indexCache = await loadSearchIndex();
	} finally {
		isLoading = false;
	}
}

// ❯ NAVIGATION
// ❯ @doc Handles result click — saves to history and navigates.
//        If the URL contains a fragment (#), stores the target in sessionStorage
//        so the destination page can scroll to and highlight the element after load.
function handleNavigate(url: string, title: string, type: string, external = false): void {
	close();
	saveToHistory(url, title, type);
	if (external) {
		window.open(url, "_blank", "noopener,noreferrer");
		return;
	}

	// ❯ @docs For anchor URLs (/page/#element-id), store the fragment so the page
	// can pick it up after Swup's transition completes and scroll/highlight accordingly.
	if (url.includes("#")) {
		const [path, fragment] = url.split("#");
		sessionStorage.setItem("cybalp_search_target", fragment);
		navigateToPage(path || url);
	} else {
		navigateToPage(url);
	}
}

// ❯ @doc Handles command execution.
function handleCommand(action: string, label: string): void {
	close();
	saveToHistory("#cmd:" + action, label, "command");
	executeCommandAction(action);
}

// ❯ KEYBOARD NAVIGATION
function handleKeydown(e: KeyboardEvent): void {
	if (!isOpen) return;

	if (e.key === "Escape") {
		e.preventDefault();
		close();
		return;
	}

	if (e.key === "ArrowDown") {
		e.preventDefault();
		selectedIndex = Math.min(selectedIndex + 1, navItems.length - 1);
		return;
	}

	if (e.key === "ArrowUp") {
		e.preventDefault();
		selectedIndex = Math.max(selectedIndex - 1, -1);
		return;
	}

	if (e.key === "Enter") {
		e.preventDefault();
		const item = navItems[selectedIndex];
		if (!item) return;

		if (item.kind === "command") {
			handleCommand(item.action, item.label);
		} else if (item.kind === "page") {
			handleNavigate(item.url, item.label, item.kind, false);
		} else if (item.kind === "content" || item.kind === "history") {
			const isExternal = item.url.startsWith("http");
			handleNavigate(item.url, item.title, item.kind, isExternal);
		}
	}
}

// ❯ SEARCH EXECUTION
// ❯ @doc Debounce timer ref for search input.
let debounceTimer: ReturnType<typeof setTimeout>;

// ❯ @doc Runs search or command matching based on current input.
async function runSearch(value: string): Promise<void> {
	clearResults();
	const clean = value.startsWith(">")
		? parseCommandInput(value)
		: value.trim();

	if (!clean) return;

	// ❯ COMMAND MODE
	if (value.startsWith(">")) {
		if (clean === "help") {
			helpLines = buildHelpLines(commands);
			return;
		}
		if (isUnixEasterEgg(clean)) {
			easterEgg = buildEasterEgg(clean);
			return;
		}
		commandMatches = matchCommands(clean, commands);
		return;
	}

	// ❯ SEARCH MODE
	// Page alias navigation (instant, no index needed)
	pageMatches = matchPageAliases(clean, sources);

	// ❯ @docs Only show results from enabled sources — works even if the index was built with more sources.
	const enabledSourceIds = new Set(
		sources.filter((s) => s.enabled).map((s) => s.id),
	);

	// Content search (needs index)
	if (indexCache !== null) {
		searchResults = performSearch(clean, indexCache, enabledSourceIds);
	} else {
		isLoading = true;
		try {
			const idx = await loadSearchIndex();
			indexCache = idx;
			searchResults = performSearch(clean, idx, enabledSourceIds);
		} finally {
			isLoading = false;
		}
	}
}

// ❯ EFFECTS
$effect(() => {
	const value = inputValue;
	clearTimeout(debounceTimer);
	if (!value.trim() || !isOpen) {
		clearResults();
		return;
	}
	debounceTimer = setTimeout(() => runSearch(value), 200);
});

// ❯ Reset selectedIndex when results change
$effect(() => {
	void searchResults.length;
	void commandMatches.length;
	void pageMatches.length;
	selectedIndex = -1;
});

// ❯ LIFECYCLE
onMount(() => {
	// ❯ Portal: move overlay to document.body for correct fixed positioning
	document.body.appendChild(overlayEl);

	// ❯ Global Ctrl+K / Cmd+K shortcut
	const handleGlobalKey = (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "k") {
			e.preventDefault();
			isOpen ? close() : open();
			return;
		}
		if (e.key === "Escape" && isOpen) {
			close();
		}
	};
	document.addEventListener("keydown", handleGlobalKey);

	// ❯ Close on Swup page transitions
	const closeOnNav = () => close();
	document.addEventListener("swup:contentReplaced", closeOnNav);

	loadHistory();

	return () => {
		document.removeEventListener("keydown", handleGlobalKey);
		document.removeEventListener("swup:contentReplaced", closeOnNav);
		clearTimeout(debounceTimer);
	};
});

onDestroy(() => {
	overlayEl?.remove();
	clearTimeout(debounceTimer);
});

// ❯ BADGE LABELS
const TYPE_LABELS: Record<string, string> = {
	post: "POST",
	code: "CODE",
	moment: "LOG",
	album: "MEDIA",
};
const TYPE_ICONS: Record<string, string> = {
	post: "material-symbols:article",
	code: "material-symbols:code",
	moment: "material-symbols:book",
	album: "material-symbols:photo-library",
};
</script>

<!-- ❯ NAVBAR BUTTON (stays in navbar DOM) -->
<div
	id="search-bar"
	class="hidden lg:flex transition-all items-center h-11 rounded-lg terminal-search
        btn-plain scale-animation active:scale-90 w-11"
	role="button"
	tabindex="0"
	aria-label="Search (Ctrl+K)"
	onclick={open}
	onkeydown={(e) => e.key === "Enter" && open()}
>
	<Icon
		icon="material-symbols:search"
		class="absolute text-[1.25rem] pointer-events-none left-1/2 -translate-x-1/2 transition my-auto"
	></Icon>
</div>

<button
	onclick={open}
	aria-label="Search Panel"
	class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-90 flex items-center justify-center terminal-search-mobile border border-green-500/20 hover:border-green-500/40"
>
	<Icon
		icon="material-symbols:search"
		class="text-[1.25rem] text-green-400 dark:text-green-500"
	></Icon>
</button>

<!-- ❯ OVERLAY PORTAL (moved to document.body in onMount) -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={overlayEl}>
	{#if isOpen}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="search-overlay-backdrop"
			onclick={close}
			aria-hidden="true"
		></div>

		<!-- Panel -->
		<div
			class="search-overlay-panel"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-label="Search"
			onkeydown={handleKeydown}
		>
			<!-- ❯ Input Row -->
			<div class="search-input-row">
				<span class="search-prompt">{isCommandMode ? ">" : "$"}</span>
				<Icon
					icon="material-symbols:search"
					class="search-input-icon"
				></Icon>
				<input
					bind:this={inputEl}
					bind:value={inputValue}
					{placeholder}
					class="search-input"
					autocomplete="off"
					spellcheck={false}
					aria-label="Search input"
				/>
				{#if inputValue}
					<button
						class="search-clear-btn"
						onclick={() => { inputValue = ""; inputEl?.focus(); }}
						aria-label="Clear"
						type="button"
					>
						<Icon icon="material-symbols:close" class="text-sm" />
					</button>
				{:else}
					<span class="search-cursor">_</span>
				{/if}
				<kbd class="search-kbd">ESC</kbd>
			</div>

			<!-- ❯ Results / Empty state container -->
			<div class="search-body">

				<!-- ❯ EMPTY STATE: Quick Access -->
				{#if showEmpty}
					{#if history.length > 0}
						<div class="search-section-label">Recent</div>
						{#each history.slice(0, 3) as item, i}
							<button
								class="search-result-row {selectedIndex === i ? 'is-selected' : ''}"
								onclick={() => handleNavigate(item.url, item.title, item.type)}
								type="button"
							>
								<span class="search-result-badge badge-history">
									{TYPE_LABELS[item.type] ?? "→"}
								</span>
								<span class="search-result-title">{item.title}</span>
							</button>
						{/each}
					{/if}

					{#if sources.filter(s => s.enabled).length > 0}
						<div class="search-section-label">Go to</div>
						{#each sources.filter(s => s.enabled) as source}
							<button
								class="search-result-row"
								onclick={() => handleNavigate(source.url, source.label, "page")}
								type="button"
							>
								<span class="search-result-badge badge-page">PAGE</span>
								<span class="search-result-title">{source.label}</span>
								<span class="search-result-url">{source.url}</span>
							</button>
						{/each}
					{/if}

					<div class="search-hint">
						Type to search · <kbd class="search-kbd-inline">&gt;</kbd> for commands · <kbd class="search-kbd-inline">↑↓</kbd> navigate · <kbd class="search-kbd-inline">↵</kbd> select
					</div>
				{/if}

				<!-- ❯ LOADING INDICATOR -->
				{#if isLoading && cleanInput}
					<div class="search-loading">
						<span class="search-loading-dot"></span>
						<span class="search-loading-dot"></span>
						<span class="search-loading-dot"></span>
						<span class="ml-2 text-xs text-green-400/60 font-mono">loading index...</span>
					</div>
				{/if}

				<!-- ❯ EASTER EGG -->
				{#if easterEgg}
					<div class="search-easter-egg">
						<span class="font-mono text-yellow-400 text-sm">$ {easterEgg.input}</span>
						<p class="mt-1 text-sm text-green-400/80">{easterEgg.response}</p>
					</div>
				{/if}

				<!-- ❯ HELP OUTPUT -->
				{#if helpLines}
					<div class="search-help">
						{#each helpLines as line}
							<p class="font-mono text-xs text-green-400/80 leading-6">{line || "\u00a0"}</p>
						{/each}
					</div>
				{/if}

				<!-- ❯ PAGE NAVIGATION RESULTS (alias matches) — always rendered first -->
				{#if pageMatches.length > 0}
					{#each pageMatches as match, i}
						{@const idx = i}
						<button
							class="search-result-row search-page-nav-row {selectedIndex === idx ? 'is-selected' : ''}"
							onclick={() => handleNavigate(match.url, match.label, "page")}
							type="button"
						>
							<Icon icon="material-symbols:arrow-forward" class="text-base text-cyan-400/80 flex-shrink-0" />
							<span class="search-page-nav-label">{match.label}</span>
							<span class="search-page-nav-url">{match.url}</span>
						</button>
					{/each}
				{/if}

				<!-- ❯ COMMAND RESULTS -->
				{#if commandMatches.length > 0}
					<div class="search-section-label">Commands</div>
					{#each commandMatches as match, i}
						{@const idx = pageMatches.length + i}
						<button
							class="search-result-row {selectedIndex === idx ? 'is-selected' : ''}"
							onclick={() => handleCommand(match.command.action, match.command.label)}
							type="button"
						>
							{#if match.command.icon}
								<Icon icon={match.command.icon} class="text-base text-green-400/70 flex-shrink-0 mr-1" />
							{/if}
							<span class="search-result-badge badge-cmd">CMD</span>
							<span class="search-result-title">{match.command.label}</span>
						</button>
					{/each}
				{/if}

				<!-- ❯ CONTENT SEARCH RESULTS -->
				{#if searchResults.length > 0}
					<div class="search-section-label">Results</div>
					{#each searchResults as result, i}
						{@const idx = pageMatches.length + commandMatches.length + i}
						<button
							class="search-result-row {selectedIndex === idx ? 'is-selected' : ''}"
							onclick={() => handleNavigate(result.item.url, result.item.title, result.item.type)}
							type="button"
						>
							<span class="search-result-badge badge-{result.item.type}">
								{TYPE_LABELS[result.item.type] ?? "?"}
							</span>
							<div class="search-result-content">
								<span class="search-result-title">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html result.highlightedTitle}
									{#if result.item.meta?.language}
										<span class="search-lang-badge">{result.item.meta.language}</span>
									{/if}
								</span>
								{#if result.snippet}
									<p class="search-result-excerpt">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html result.snippet}
									</p>
								{/if}
							</div>
						</button>
					{/each}
				{/if}

				<!-- ❯ NO RESULTS -->
				{#if cleanInput && !isLoading && !hasResults && !showEmpty}
					<div class="search-no-results">
						<span class="font-mono text-green-500/40 text-sm">$ grep -r "{cleanInput}" / — not found</span>
						<p class="text-xs text-green-400/40 mt-1">
							{isCommandMode ? "No matching commands. Try `> help`." : "No results. Try different keywords."}
						</p>
					</div>
				{/if}

			</div>
		</div>
	{/if}
</div>

<style>
	/* ❯ OVERLAY BACKDROP */
	:global(.search-overlay-backdrop) {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	/* ❯ PANEL */
	:global(.search-overlay-panel) {
		position: fixed;
		z-index: 9999;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(680px, calc(100vw - 2rem));
		max-height: min(520px, calc(100vh - 4rem));
		display: flex;
		flex-direction: column;
		border-radius: 14px;
		background: rgba(13, 18, 26, 0.97);
		border: 1px solid rgba(34, 197, 94, 0.25);
		box-shadow:
			0 0 0 1px rgba(34, 197, 94, 0.08),
			0 20px 60px rgba(0, 0, 0, 0.6),
			0 0 40px rgba(34, 197, 94, 0.06);
		font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
		overflow: hidden;
	}

	/* ❯ INPUT ROW */
	:global(.search-input-row) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(34, 197, 94, 0.12);
		flex-shrink: 0;
	}

	:global(.search-prompt) {
		color: rgba(34, 197, 94, 0.7);
		font-size: 0.8rem;
		flex-shrink: 0;
		user-select: none;
	}

	:global(.search-input-icon) {
		font-size: 1rem;
		color: rgba(34, 197, 94, 0.5);
		flex-shrink: 0;
	}

	:global(.search-input) {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: rgba(134, 239, 172, 0.9);
		font-size: 0.875rem;
		font-family: inherit;
		caret-color: rgba(34, 197, 94, 0.9);
	}

	:global(.search-input::placeholder) {
		color: rgba(34, 197, 94, 0.25);
	}

	:global(.search-input::selection) {
		background: rgba(34, 197, 94, 0.25);
	}

	:global(.search-cursor) {
		color: rgba(34, 197, 94, 0.972);
		font-size: 0.8rem;
		animation: blink 1.2s step-end infinite;
	}

	:global(.search-clear-btn) {
		color: rgba(34, 197, 94, 0.4);
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}

	:global(.search-clear-btn:hover) {
		color: rgba(34, 197, 94, 0.8);
	}

	:global(.search-kbd) {
		font-size: 0.6rem;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid rgba(34, 197, 94, 0.15);
		color: rgba(34, 197, 94, 0.3);
		background: rgba(34, 197, 94, 0.04);
		flex-shrink: 0;
		font-family: inherit;
	}

	/* ❯ BODY / RESULTS */
	:global(.search-body) {
		overflow-y: auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	:global(.search-body::-webkit-scrollbar) {
		width: 4px;
	}

	:global(.search-body::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.search-body::-webkit-scrollbar-thumb) {
		background: rgba(34, 197, 94, 0.15);
		border-radius: 2px;
	}

	/* ❯ SECTION LABEL */
	:global(.search-section-label) {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(134, 239, 172, 0.4);
		padding: 0.5rem 0.5rem 0.25rem;
		user-select: none;
	}

	/* ❯ RESULT ROW */
	:global(.search-result-row) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.625rem;
		border-radius: 8px;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.12s;
		color: inherit;
		font-family: inherit;
	}

	:global(.search-result-row:hover),
	:global(.search-result-row.is-selected) {
		background: rgba(34, 197, 94, 0.07);
		border: none;
		outline: none;
	}

	:global(.search-result-row.is-selected) {
		outline: 1px solid rgba(34, 197, 94, 0.2);
		outline-offset: -1px;
	}

	/* ❯ PAGE NAVIGATION ROW (alias match — always first) */
	:global(.search-page-nav-row) {
		border: 1px solid rgba(14, 165, 233, 0.15) !important;
		background: rgba(14, 165, 233, 0.04) !important;
		margin-bottom: 2px;
	}

	:global(.search-page-nav-row:hover),
	:global(.search-page-nav-row.is-selected) {
		background: rgba(14, 165, 233, 0.1) !important;
		border-color: rgba(14, 165, 233, 0.3) !important;
	}

	:global(.search-page-nav-label) {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(125, 211, 252, 0.95);
		letter-spacing: 0.01em;
	}

	:global(.search-page-nav-url) {
		font-size: 0.65rem;
		color: rgba(14, 165, 233, 0.4);
		margin-left: auto;
		flex-shrink: 0;
	}

	/* ❯ BADGES */
	:global(.search-result-badge) {
		display: inline-flex;
		align-items: center;
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		margin-top: 2px;
		text-transform: uppercase;
	}

	:global(.badge-post) {
		background: rgba(99, 102, 241, 0.15);
		color: rgba(165, 180, 252, 0.9);
		border: 1px solid rgba(99, 102, 241, 0.2);
	}

	:global(.badge-code) {
		background: rgba(34, 197, 94, 0.12);
		color: rgba(134, 239, 172, 0.9);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	:global(.badge-moment) {
		background: rgba(251, 191, 36, 0.1);
		color: rgba(253, 224, 71, 0.9);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}

	:global(.badge-album) {
		background: rgba(236, 72, 153, 0.1);
		color: rgba(249, 168, 212, 0.9);
		border: 1px solid rgba(236, 72, 153, 0.2);
	}

	:global(.badge-page) {
		background: rgba(14, 165, 233, 0.1);
		color: rgba(125, 211, 252, 0.9);
		border: 1px solid rgba(14, 165, 233, 0.2);
	}

	:global(.badge-cmd) {
		background: rgba(168, 85, 247, 0.1);
		color: rgba(216, 180, 254, 0.9);
		border: 1px solid rgba(168, 85, 247, 0.2);
	}

	:global(.badge-history) {
		background: rgba(107, 114, 128, 0.1);
		color: rgba(156, 163, 175, 0.7);
		border: 1px solid rgba(107, 114, 128, 0.15);
	}

	/* ❯ RESULT CONTENT */
	:global(.search-result-content) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	:global(.search-result-title) {
		font-size: 0.82rem;
		color: rgba(167, 243, 208, 0.95);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.search-result-url) {
		font-size: 0.65rem;
		color: rgba(9, 157, 63, 0.3);
		margin-left: auto;
		flex-shrink: 0;
	}

	:global(.search-result-excerpt) {
		font-size: 0.72rem;
		color: rgba(18, 212, 89, 0.793);
		line-height: 1.4;
		font-family: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	:global(.search-lang-badge) {
		display: inline-block;
		margin-left: 6px;
		padding: 0 5px;
		border-radius: 3px;
		font-size: 0.55rem;
		background: rgba(34, 197, 94, 0.08);
		color: rgba(34, 197, 94, 0.5);
		border: 1px solid rgba(34, 197, 94, 0.12);
		vertical-align: middle;
	}

	/* ❯ MARK HIGHLIGHT */
	:global(.search-overlay-panel mark) {
		background: rgba(251, 191, 36, 0.25);
		color: rgba(253, 224, 71, 0.95);
		border-radius: 2px;
		padding: 0 1px;
	}

	/* ❯ LOADING */
	:global(.search-loading) {
		display: flex;
		align-items: center;
		padding: 1rem;
		gap: 4px;
	}

	:global(.search-loading-dot) {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: rgba(34, 197, 94, 0.5);
		animation: loading-pulse 1.2s ease-in-out infinite;
	}

	:global(.search-loading-dot:nth-child(2)) {
		animation-delay: 0.2s;
	}

	:global(.search-loading-dot:nth-child(3)) {
		animation-delay: 0.4s;
	}

	/* ❯ EASTER EGG */
	:global(.search-easter-egg) {
		padding: 0.75rem 0.75rem;
		border-radius: 8px;
		background: rgba(251, 191, 36, 0.05);
		border: 1px solid rgba(251, 191, 36, 0.1);
		margin: 0.25rem 0;
	}

	/* ❯ HELP OUTPUT */
	:global(.search-help) {
		padding: 0.75rem;
		border-radius: 8px;
		background: rgba(34, 197, 94, 0.04);
		border: 1px solid rgba(34, 197, 94, 0.1);
		margin: 0.25rem 0;
	}

	/* ❯ NO RESULTS */
	:global(.search-no-results) {
		padding: 1.5rem 0.75rem;
		text-align: center;
	}

	/* ❯ HINT BAR */
	:global(.search-hint) {
		font-size: 0.65rem;
		color: rgba(34, 197, 94, 0.2);
		text-align: center;
		padding: 0.75rem 0.5rem 0.25rem;
		user-select: none;
	}

	:global(.search-kbd-inline) {
		font-size: 0.6rem;
		padding: 1px 4px;
		border-radius: 3px;
		border: 1px solid rgba(34, 197, 94, 0.15);
		color: rgba(34, 197, 94, 0.35);
		background: rgba(34, 197, 94, 0.04);
		font-family: inherit;
	}

	/* ❯ ANIMATIONS */
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	@keyframes loading-pulse {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
		40% { transform: scale(1); opacity: 1; }
	}

	/* ❯ MOBILE: push panel to top on small screens */
	@media (max-width: 640px) {
		:global(.search-overlay-panel) {
			top: 1rem;
			left: 1rem;
			right: 1rem;
			width: auto;
			transform: none;
			max-height: calc(100vh - 2rem);
		}
	}
</style>
