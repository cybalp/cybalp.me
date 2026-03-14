<!-- ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
<!-- ❯ @status OK! -->
<!-- ❯ @path ./src/components/navbar/translator.svelte -->
<!-- ❯ @desc Language translation selector component. -->
<!-- ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->

<script lang="ts">
// ❯ IMPORTS

import Icon from "@components/common/icon.svelte";
import { BREAKPOINT_LG } from "@constants/breakpoints";
import { onClickOutside } from "@utils/widget";
import { onDestroy, onMount } from "svelte";
import DropdownItem from "@/components/common/DropdownItem.svelte";
import DropdownPanel from "@/components/common/DropdownPanel.svelte";
import { siteConfig } from "@/config";
import { getSupportedTranslateLanguages } from "@/i18n/language";
import {
	getDefaultLanguage,
	getSiteLanguage,
	getTranslateLanguageFromConfig,
	setStoredLanguage,
} from "@/utils/language";

// ❯ STATE
let isOpen = $state(false);
let translatePanel: HTMLElement | undefined = $state();
let currentLanguage = $state("");

// ❯ CONFIGURATION
// ❯ @doc Gets supported languages from unified config.
const languages = getSupportedTranslateLanguages();

// ❯ @doc Gets source language from config file settings.
const sourceLanguage = getTranslateLanguageFromConfig(getDefaultLanguage());

// ❯ PANEL CONTROL
// ❯ @doc Toggles panel open/closed state.
function togglePanel() {
	isOpen = !isOpen;
}

// ❯ @doc Opens translation panel.
function openPanel() {
	isOpen = true;
}

// ❯ @doc Closes translation panel.
function closePanel() {
	isOpen = false;
}

// ❯ LANGUAGE SWITCHING
// ❯ @doc Changes translation language and updates UI state.
async function changeLanguage(languageCode: string) {
	try {
		// ❯ load script if not loaded
		if (
			!(window as any).translateScriptLoaded &&
			typeof (window as any).loadTranslateScript === "function"
		) {
			await (window as any).loadTranslateScript();
		}
		// ❯ verify script loaded
		if (!(window as any).translate) {
			console.warn("translate.js is not loaded");
			return;
		}
		const translate = (window as any).translate;
		const localLang = translate.language.getLocal();
		translate.changeLanguage(languageCode);
		// ❯ reset if switching to source language
		if (languageCode === localLang) {
			translate.reset();
		}
		setStoredLanguage(languageCode);
		currentLanguage = languageCode;
	} catch (error) {
		console.error("Failed to execute translation:", error);
	}
}

// ❯ EVENT HANDLERS
// ❯ @doc Closes panel when clicking outside.
function handleClickOutside(event: MouseEvent) {
	if (!isOpen) return;
	onClickOutside(event, "translate-panel", "translate-switch", () => {
		isOpen = false;
	});
}

// ❯ LIFECYCLE
// ❯ @doc Initializes event listeners and default language on mount.
onMount(() => {
	document.addEventListener("click", handleClickOutside);
	// ❯ prioritize cached language
	currentLanguage = getSiteLanguage();
});

onDestroy(() => {
	if (typeof document !== "undefined") {
		document.removeEventListener("click", handleClickOutside);
	}
});
</script>

<!-- ❯ RENDER -->
{#if siteConfig.translate?.enable}
<div class="relative z-50" role="menu" tabindex="-1" onmouseleave={closePanel}>
    <!-- ❯ Translation Button -->
    <button
        aria-label="Language Translation"
        class="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 flex items-center justify-center"
        id="translate-switch"
        onclick={() => { if (window.innerWidth < BREAKPOINT_LG) { openPanel(); } else { togglePanel(); } }}
        onmouseenter={openPanel}
    >
        <Icon icon="material-symbols:translate" class="text-[1.25rem] transition" />
    </button>
    <!-- ❯ Translation Panel -->
    <div id="translate-panel-wrapper" class="fixed top-14.5 pt-5 right-4 w-[calc(100vw-2rem)] max-w-64 md:absolute md:top-11 md:right-0 md:w-64 md:pt-5 transition-all z-50" class:float-panel-closed={!isOpen}>
        <DropdownPanel
            bind:element={translatePanel}
            id="translate-panel"
            class="p-4 w-full"
        >
            <div class="text-sm font-medium text-(--primary) mb-3 px-1">
                选择语言 / Select Language
            </div>
            <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {#each languages as lang}
                    <DropdownItem
                        isActive={currentLanguage === lang.code}
                        onclick={() => changeLanguage(lang.code)}
                        class="gap-3 p-2! h-auto!"
                        isLast={false}
                    >
                        <span class="text-lg transition">{lang.icon}</span>
                        <span class="text-sm transition grow text-left">{lang.name}</span>
                        {#if currentLanguage === lang.code}
                            <span class="ml-auto text-(--primary)">✓</span>
                        {/if}
                    </DropdownItem>
                {/each}
            </div>
        </DropdownPanel>
    </div>
</div>
{/if}

<!-- ❯ STYLES -->
<style>
/* ❯ Scrollbar Styles */
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--scrollbar-bg);
    border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-bg-hover);
}
</style>