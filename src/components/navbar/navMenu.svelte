<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/navbar/navMenu.svelte
// ❯ @desc Mobile navigation menu with all display settings embedded.
//        On mobile, replaces the individual Translator / LightDarkSwitch /
//        DisplaySettings / WallpaperSwitch buttons with a single hamburger panel.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@components/common/icon.svelte";
import { url } from "@utils/url";
import { onClickOutside } from "@utils/widget";
import { onMount } from "svelte";
import type { NavbarLink } from "@/types/config";

// ❯ Theme imports
import { DARK_MODE, LIGHT_MODE, SYSTEM_MODE, WALLPAPER_BANNER, WALLPAPER_FULLSCREEN, WALLPAPER_NONE } from "@constants/constants";
import { getStoredTheme, setTheme } from "@utils/theme";
import { getHue, setHue, getDefaultHue } from "@utils/hue";
import { getStoredWallpaperMode, setWallpaperMode } from "@utils/wallpaper";
import { siteConfig } from "@/config";
import { getSupportedTranslateLanguages } from "@/i18n/language";
import { getSiteLanguage, setStoredLanguage } from "@/utils/language";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { LIGHT_DARK_MODE, WALLPAPER_MODE } from "@/types/config";

// ❯ PROPS
interface Props {
    links: NavbarLink[];
}
let { links }: Props = $props();

// ❯ STATE — menu panel
let isOpen = $state(false);

// ❯ STATE — theme
const themeSeq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, SYSTEM_MODE];
let themeMode: LIGHT_DARK_MODE = $state(siteConfig.defaultTheme || SYSTEM_MODE);

// ❯ STATE — hue color
let hue = $state(getDefaultHue());
const defaultHue = getDefaultHue();

// ❯ STATE — wallpaper
const wallpaperSeq: WALLPAPER_MODE[] = [WALLPAPER_BANNER, WALLPAPER_FULLSCREEN, WALLPAPER_NONE];
let wallpaperMode: WALLPAPER_MODE = $state(siteConfig.wallpaper.mode || WALLPAPER_BANNER);

// ❯ STATE — language
const languages = getSupportedTranslateLanguages();
let currentLanguage = $state("");
const translateEnabled = siteConfig.translate?.enable ?? false;

// ❯ PANEL CONTROL
function togglePanel() { isOpen = !isOpen; }

function handleClickOutside(event: MouseEvent) {
    if (!isOpen) return;
    onClickOutside(event, "nav-menu-panel", "nav-menu-switch", () => { isOpen = false; });
}

// ❯ THEME
function setThemeMode(mode: LIGHT_DARK_MODE) {
    themeMode = mode;
    setTheme(mode);
}

// ❯ HUE
function resetHue() { hue = defaultHue; }

// ❯ WALLPAPER
function setWallpaper(mode: WALLPAPER_MODE) {
    wallpaperMode = mode;
    setWallpaperMode(mode);
}

// ❯ LANGUAGE
async function changeLanguage(code: string) {
    try {
        if (!(window as any).translateScriptLoaded && typeof (window as any).loadTranslateScript === 'function') {
            await (window as any).loadTranslateScript();
        }
        if (!(window as any).translate) return;
        const translate = (window as any).translate;
        const localLang = translate.language.getLocal();
        translate.changeLanguage(code);
        if (code === localLang) translate.reset();
        setStoredLanguage(code);
        currentLanguage = code;
    } catch (e) {
        console.error('Translation failed:', e);
    }
}

// ❯ EFFECTS
$effect(() => { if (hue || hue === 0) setHue(hue); });

// ❯ LIFECYCLE
onMount(() => {
    themeMode = getStoredTheme();
    hue = getHue();
    wallpaperMode = getStoredWallpaperMode();
    currentLanguage = getSiteLanguage();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
});
</script>

<div class="relative md:hidden">
    <!-- ❯ HAMBURGER BUTTON -->
    <button
        aria-label="Menu"
        name="Nav Menu"
        class="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90"
        id="nav-menu-switch"
        onclick={togglePanel}
    >
        <Icon icon="material-symbols:menu-rounded" class="text-[1.25rem]"></Icon>
    </button>

    <!-- ❯ PANEL -->
    <div
        id="nav-menu-panel"
        class="float-panel fixed transition-all right-4 px-2 py-2 max-h-[85vh] overflow-y-auto w-72"
        class:float-panel-closed={!isOpen}
    >
        <!-- ❯ NAV LINKS — close menu on click so new page loads with menu closed -->
        {#each links as link}
            <div class="mobile-menu-item">
                <a
                    href={link.external ? link.url : url(link.url)}
                    class="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg gap-8
                           hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active) transition"
                    target={link.external ? "_blank" : null}
                    onclick={() => { isOpen = false; }}
                >
                    <div class="flex items-center transition text-black/75 dark:text-white/75 font-bold
                                group-hover:text-(--primary) group-active:text-(--primary)">
                        {#if link.icon}
                            <Icon icon={link.icon} class="text-[1.1rem] mr-2" />
                        {/if}
                        {link.name}
                    </div>
                    {#if !link.external}
                        <Icon icon="material-symbols:chevron-right-rounded" class="transition text-[1.25rem] text-(--primary)" />
                    {:else}
                        <Icon icon="fa6-solid:arrow-up-right-from-square" class="transition text-[0.75rem] text-black/25 dark:text-white/25 -translate-x-1" />
                    {/if}
                </a>
            </div>
        {/each}

        <!-- ❯ SETTINGS DIVIDER -->
        <div class="border-t border-dashed border-black/10 dark:border-white/10 my-2 mx-1"></div>

        <!-- ❯ THEME MODE -->
        <div class="px-2 mb-3">
            <div class="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-2 px-1">
                {i18n(I18nKey.lightMode).replace('Light', '').trim() || 'Theme'}
                <span class="normal-case font-normal opacity-70 ml-1">{i18n(I18nKey.lightMode)?.split(' ')[0]}</span>
            </div>
            <div class="flex gap-1.5">
                <!-- Light -->
                <button
                    class="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {themeMode === LIGHT_MODE ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setThemeMode(LIGHT_MODE)}
                    aria-label={i18n(I18nKey.lightMode)}
                >
                    <Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1rem]" />
                    <span>{i18n(I18nKey.lightMode)}</span>
                </button>
                <!-- Dark -->
                <button
                    class="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {themeMode === DARK_MODE ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setThemeMode(DARK_MODE)}
                    aria-label={i18n(I18nKey.darkMode)}
                >
                    <Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1rem]" />
                    <span>{i18n(I18nKey.darkMode)}</span>
                </button>
                <!-- System -->
                <button
                    class="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {themeMode === SYSTEM_MODE ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setThemeMode(SYSTEM_MODE)}
                    aria-label={i18n(I18nKey.systemMode)}
                >
                    <Icon icon="material-symbols:radio-button-partial-outline" class="text-[1rem]" />
                    <span>{i18n(I18nKey.systemMode)}</span>
                </button>
            </div>
        </div>

        <!-- ❯ THEME COLOR (HUE SLIDER) -->
        <div class="px-2 mb-3">
            <div class="flex items-center justify-between mb-2 px-1">
                <span class="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider">
                    {i18n(I18nKey.themeColor)}
                </span>
                <div class="flex items-center gap-1.5">
                    <span class="text-xs font-mono text-(--btn-content) bg-(--btn-regular-bg) px-1.5 py-0.5 rounded">
                        {hue}
                    </span>
                    {#if hue !== defaultHue}
                        <button
                            aria-label="Reset color"
                            class="btn-regular w-6 h-6 rounded flex items-center justify-center active:scale-90"
                            onclick={resetHue}
                        >
                            <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.7rem] text-(--btn-content)" />
                        </button>
                    {/if}
                </div>
            </div>
            <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded-sm select-none">
                <input
                    type="range" min="0" max="360" step="5"
                    bind:value={hue}
                    aria-label={i18n(I18nKey.themeColor)}
                    class="nav-menu-hue-slider w-full h-full"
                />
            </div>
        </div>

        <!-- ❯ WALLPAPER MODE -->
        <div class="px-2 mb-3">
            <div class="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-2 px-1">
                {i18n(I18nKey.wallpaperMode)}
            </div>
            <div class="flex gap-1.5">
                <!-- Banner -->
                <button
                    class="flex-1 flex items-center justify-center gap-1 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {wallpaperMode === WALLPAPER_BANNER ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setWallpaper(WALLPAPER_BANNER)}
                    aria-label={i18n(I18nKey.wallpaperBanner)}
                >
                    <Icon icon="material-symbols:image-outline" class="text-[1rem]" />
                    <span class="hidden xs:inline">{i18n(I18nKey.wallpaperBanner)}</span>
                </button>
                <!-- Fullscreen -->
                <button
                    class="flex-1 flex items-center justify-center gap-1 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {wallpaperMode === WALLPAPER_FULLSCREEN ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setWallpaper(WALLPAPER_FULLSCREEN)}
                    aria-label={i18n(I18nKey.wallpaperFullscreen)}
                >
                    <Icon icon="material-symbols:wallpaper" class="text-[1rem]" />
                    <span class="hidden xs:inline">{i18n(I18nKey.wallpaperFullscreen)}</span>
                </button>
                <!-- None -->
                <button
                    class="flex-1 flex items-center justify-center gap-1 rounded-lg h-9 text-xs font-medium transition
                           border border-transparent active:scale-95
                           {wallpaperMode === WALLPAPER_NONE ? 'bg-(--primary)/15 border-(--primary)/40 text-(--primary)' : 'btn-plain'}"
                    onclick={() => setWallpaper(WALLPAPER_NONE)}
                    aria-label={i18n(I18nKey.wallpaperNone)}
                >
                    <Icon icon="material-symbols:hide-image-outline" class="text-[1rem]" />
                    <span class="hidden xs:inline">{i18n(I18nKey.wallpaperNone)}</span>
                </button>
            </div>
        </div>

        <!-- ❯ LANGUAGE SELECTOR (only if translate enabled) -->
        {#if translateEnabled && languages.length > 0}
            <div class="border-t border-dashed border-black/10 dark:border-white/10 my-2 mx-1"></div>
            <div class="px-2">
                <div class="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider mb-2 px-1">
                    Language
                </div>
                <div class="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                    {#each languages as lang}
                        <button
                            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                                   hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active) active:scale-95
                                   {currentLanguage === lang.code ? 'text-(--primary) font-medium' : 'text-black/75 dark:text-white/75'}"
                            onclick={() => changeLanguage(lang.code)}
                        >
                            <span class="text-base">{lang.icon}</span>
                            <span class="grow text-left">{lang.name}</span>
                            {#if currentLanguage === lang.code}
                                <Icon icon="material-symbols:check-rounded" class="text-[0.9rem] text-(--primary)" />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
/* ❯ Hue slider inside the nav menu panel */
.nav-menu-hue-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 1.5rem;
    background-image: var(--color-selection-bar);
    transition: background-image 0.15s ease-in-out;
    cursor: pointer;
}
.nav-menu-hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 1rem;
    width: 0.5rem;
    border-radius: 0.125rem;
    background: rgba(255,255,255,0.7);
}
.nav-menu-hue-slider::-webkit-slider-thumb:hover { background: rgba(255,255,255,0.85); }
.nav-menu-hue-slider::-moz-range-thumb {
    height: 1rem;
    width: 0.5rem;
    border-radius: 0.125rem;
    border: none;
    background: rgba(255,255,255,0.7);
}
</style>
