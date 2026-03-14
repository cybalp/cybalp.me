<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/navbar/search.svelte
// ❯ @desc Search component with Pagefind integration.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import Icon from "@components/common/icon.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { navigateToPage } from "@utils/navigation";
import { url } from "@utils/url";
import { onClickOutside } from "@utils/widget";
// ❯ IMPORTS
import { onDestroy, onMount } from "svelte";
import DropdownPanel from "@/components/common/DropdownPanel.svelte";
import type { SearchResult } from "@/global";

// ❯ STATE MANAGEMENT
// ❯ Search Input
let keywordDesktop = $state("");
let keywordMobile = $state("");
// ❯ Search Results
let result: SearchResult[] = $state([]);
let isSearching = $state(false);
// ❯ Pagefind State
let pagefindLoaded = false;
let initialized = $state(false);
// ❯ UI State
let isDesktopSearchExpanded = $state(false);
let debounceTimer: NodeJS.Timeout;

// ❯ MOCK DATA
// ❯ @doc Mock search results for development environment.
const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "This Is a Fake Search Result",
		},
		excerpt:
			"Because the search cannot work in the <mark>dev</mark> environment.",
	},
	{
		url: url("/"),
		meta: {
			title: "If You Want to Test the Search",
		},
		excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
	},
];

// ❯ UI CONTROL
// ❯ @doc Toggles search panel visibility.
const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

// ❯ @doc Expands desktop search bar on hover.
const toggleDesktopSearch = () => {
	isDesktopSearchExpanded = !isDesktopSearchExpanded;
	if (isDesktopSearchExpanded) {
		setTimeout(() => {
			const input = document.getElementById(
				"search-input-desktop",
			) as HTMLInputElement;
			input?.focus();
		}, 0);
	}
};

// ❯ @doc Collapses desktop search if empty.
const collapseDesktopSearch = () => {
	if (!keywordDesktop) {
		isDesktopSearchExpanded = false;
	}
};

// ❯ @doc Handles input blur with delay for click events.
const handleBlur = () => {
	setTimeout(() => {
		isDesktopSearchExpanded = false;
		setPanelVisibility(false, true);
	}, 200);
};

// ❯ @doc Sets panel visibility state.
const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;
	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

// ❯ @doc Closes search panel and clears results.
const closeSearchPanel = (): void => {
	const panel = document.getElementById("search-panel");
	if (panel) {
		panel.classList.add("float-panel-closed");
	}
	keywordDesktop = "";
	keywordMobile = "";
	result = [];
};

// ❯ @doc Handles search result click navigation.
const handleResultClick = (event: Event, url: string): void => {
	event.preventDefault();
	closeSearchPanel();
	navigateToPage(url);
};

// ❯ SEARCH LOGIC
// ❯ @doc Performs search with Pagefind or mock data.
const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}
	if (!initialized) {
		return;
	}
	isSearching = true;
	try {
		let searchResults: SearchResult[] = [];
		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			const response = await window.pagefind.search(keyword);
			searchResults = await Promise.all(
				response.results.map((item) => item.data()),
			);
		} else if (import.meta.env.DEV) {
			searchResults = fakeResult;
		} else {
			searchResults = [];
			console.error("Pagefind is not available in production environment.");
		}
		result = searchResults;
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

// ❯ EVENT HANDLERS
// ❯ @doc Closes panel when clicking outside.
const handleClickOutside = (event: MouseEvent) => {
	const panel = document.getElementById("search-panel");
	if (!panel || panel.classList.contains("float-panel-closed")) {
		return;
	}
	onClickOutside(event, "search-panel", ["search-switch", "search-bar"], () => {
		const panel = document.getElementById("search-panel");
		panel?.classList.add("float-panel-closed");
		isDesktopSearchExpanded = false;
	});
};

// ❯ LIFECYCLE
onMount(() => {
	document.addEventListener("click", handleClickOutside);
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		console.log("Pagefind status on init:", pagefindLoaded);
	};
	if (import.meta.env.DEV) {
		console.log(
			"Pagefind is not available in development mode. Using mock data.",
		);
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		});
		document.addEventListener("pagefindloaderror", () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch();
		});
		setTimeout(() => {
			if (!initialized) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000);
	}
});

// ❯ EFFECTS
$effect(() => {
	if (initialized) {
		const keyword = keywordDesktop || keywordMobile;
		const isDesktop = !!keywordDesktop || isDesktopSearchExpanded;

		clearTimeout(debounceTimer);
		if (keyword) {
			debounceTimer = setTimeout(() => {
				search(keyword, isDesktop);
			}, 300);
		} else {
			result = [];
			setPanelVisibility(false, isDesktop);
		}
	}
});

$effect(() => {
	if (typeof document !== "undefined") {
		const navbar = document.getElementById("navbar");
		if (isDesktopSearchExpanded) {
			navbar?.classList.add("is-searching");
		} else {
			navbar?.classList.remove("is-searching");
		}
	}
});

onDestroy(() => {
	if (typeof document !== "undefined") {
		document.removeEventListener("click", handleClickOutside);
		const navbar = document.getElementById("navbar");
		navbar?.classList.remove("is-searching");
	}
	clearTimeout(debounceTimer);
});
</script>

<div
    id="search-bar"
    class="hidden lg:flex transition-all items-center h-11 rounded-lg terminal-search
        {isDesktopSearchExpanded ? 'bg-gray-900 dark:bg-gray-950 border border-green-500/30 hover:border-green-500/50 focus-within:border-green-500/70 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'btn-plain scale-animation active:scale-90'}
        {isDesktopSearchExpanded ? 'w-64' : 'w-11'}"
    role="button"
    tabindex="0"
    aria-label="Search"
    onmouseenter={() => {if (!isDesktopSearchExpanded) toggleDesktopSearch()}}
    onmouseleave={collapseDesktopSearch}
>
    {#if isDesktopSearchExpanded}
        <span class="absolute left-3 text-green-400 dark:text-green-500 font-mono text-xs pointer-events-none">$</span>
        <Icon icon="material-symbols:search" class="absolute text-[1.1rem] pointer-events-none ml-6 transition my-auto text-green-400/70 dark:text-green-500/70"></Icon>
    {:else}
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none left-1/2 -translate-x-1/2 transition my-auto"></Icon>
    {/if}
    <input id="search-input-desktop" placeholder="{isDesktopSearchExpanded ? 'search...' : ''}" bind:value={keywordDesktop}
        onfocus={() => {if (!isDesktopSearchExpanded) toggleDesktopSearch(); search(keywordDesktop, true)}}
        onblur={handleBlur}
        class="transition-all pl-12 text-sm bg-transparent outline-0 font-mono
            h-full {isDesktopSearchExpanded ? 'w-52' : 'w-0'} text-green-400 dark:text-green-500 placeholder:text-green-500/50 dark:placeholder:text-green-400/50"
    >
    {#if isDesktopSearchExpanded && !keywordDesktop}
        <span class="absolute right-3 text-green-500/30 dark:text-green-400/30 font-mono text-xs animate-pulse">_</span>
    {/if}
</div>

<button onclick={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-90 flex items-center justify-center terminal-search-mobile border border-green-500/20 hover:border-green-500/40">
    <Icon icon="material-symbols:search" class="text-[1.25rem] text-green-400 dark:text-green-500"></Icon>
</button>

<DropdownPanel
        id="search-panel"
        class="float-panel-closed absolute md:w-120 top-20 left-4 md:left-[unset] right-4 z-50 search-panel"
>
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl terminal-search-mobile
      bg-gray-900 dark:bg-gray-950 border border-green-500/30 hover:border-green-500/50 focus-within:border-green-500/70
      shadow-[0_0_10px_rgba(34,197,94,0.2)]
  ">
        <span class="absolute left-3 text-green-400 dark:text-green-500 font-mono text-xs pointer-events-none">$</span>
        <Icon icon="material-symbols:search" class="absolute text-[1.1rem] pointer-events-none ml-6 transition my-auto text-green-400/70 dark:text-green-500/70"></Icon>
        <input placeholder="search..." bind:value={keywordMobile}
               class="pl-12 absolute inset-0 text-sm bg-transparent outline-0 font-mono
               focus:w-60 text-green-400 dark:text-green-500 placeholder:text-green-500/50 dark:placeholder:text-green-400/50"
        >
        {#if !keywordMobile}
            <span class="absolute right-3 text-green-500/30 dark:text-green-400/30 font-mono text-xs animate-pulse">_</span>
        {/if}
    </div>
    {#each result as item}
        <a href={item.url}
           onclick={(e) => handleResultClick(e, item.url)}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active)">
            <div class="transition text-90 inline-flex font-bold group-hover:text-(--primary)">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-(--primary)"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</DropdownPanel>

<style>
    input:focus {
        outline: 0;
    }
    :global(.search-panel) {
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(34, 197, 94, 0.2);
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
    }
    :global(.terminal-search) {
        font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    }
    :global(.terminal-search-mobile) {
        font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    }
    :global(.terminal-search input::selection) {
        background: rgba(34, 197, 94, 0.3);
        color: rgb(34, 197, 94);
    }
    :global(.terminal-search-mobile input::selection) {
        background: rgba(34, 197, 94, 0.3);
        color: rgb(34, 197, 94);
    }
</style>