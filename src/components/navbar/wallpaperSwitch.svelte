<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/navbar/wallpaperSwitch.svelte
// ❯ @desc Wallpaper mode switcher component.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import Icon from "@components/common/icon.svelte";
import {
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
} from "@constants/constants";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getStoredWallpaperMode, setWallpaperMode } from "@utils/wallpaper";
import { onClickOutside } from "@utils/widget";
// ❯ IMPORTS
import { onMount } from "svelte";
import DropdownItem from "@/components/common/DropdownItem.svelte";
import DropdownPanel from "@/components/common/DropdownPanel.svelte";
import { siteConfig } from "@/config";
import { BREAKPOINT_LG } from "@/constants/breakpoints";
import type { WALLPAPER_MODE } from "@/types/config";

// ❯ STATE
const seq: WALLPAPER_MODE[] = [
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
];
let mode: WALLPAPER_MODE = $state(
	siteConfig.wallpaper.mode || WALLPAPER_BANNER,
);
let isOpen = $state(false);

// ❯ FUNCTIONS
// ❯ Wallpaper Mode Switching
// ❯ @doc Updates wallpaper mode and persists to storage.
function switchWallpaperMode(newMode: WALLPAPER_MODE) {
	mode = newMode;
	setWallpaperMode(newMode);
}

// ❯ @doc Cycles through wallpaper sequence: banner → fullscreen → none → banner.
function toggleWallpaperMode() {
	let i = 0;
	for (; i < seq.length; i++) {
		if (seq[i] === mode) {
			break;
		}
	}
	switchWallpaperMode(seq[(i + 1) % seq.length]);
}

// ❯ Panel Control
// ❯ @doc Opens wallpaper mode panel.
function openPanel() {
	isOpen = true;
}

// ❯ @doc Closes wallpaper mode panel.
function closePanel() {
	isOpen = false;
}

// ❯ EVENT HANDLERS
// ❯ @doc Closes panel when clicking outside component boundaries.
function handleClickOutside(event: MouseEvent) {
	if (!isOpen) return;
	onClickOutside(event, "wallpaper-mode-panel", "wallpaper-mode-switch", () => {
		isOpen = false;
	});
}

// ❯ LIFECYCLE
onMount(() => {
	mode = getStoredWallpaperMode();
	document.addEventListener("click", handleClickOutside);
	return () => {
		document.removeEventListener("click", handleClickOutside);
	};
});
</script>

<!-- ❯ RENDER -->
<div class="relative z-50" role="menu" tabindex="-1" onmouseleave={closePanel}>
    <button aria-label="Wallpaper Mode" role="menuitem" class="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 flex items-center justify-center" id="wallpaper-mode-switch" onmouseenter={openPanel} onclick={() => { if (window.innerWidth < BREAKPOINT_LG) { openPanel(); } else { toggleWallpaperMode(); } }}>
        <div class="absolute inset-0 flex items-center justify-center" class:opacity-0={mode !== WALLPAPER_BANNER}>
            <Icon icon="material-symbols:image-outline" class="text-[1.25rem]"></Icon>
        </div>
        <div class="absolute inset-0 flex items-center justify-center" class:opacity-0={mode !== WALLPAPER_FULLSCREEN}>
            <Icon icon="material-symbols:wallpaper" class="text-[1.25rem]"></Icon>
        </div>
        <div class="absolute inset-0 flex items-center justify-center" class:opacity-0={mode !== WALLPAPER_NONE}>
            <Icon icon="material-symbols:hide-image-outline" class="text-[1.25rem]"></Icon>
        </div>
    </button>
    <div id="wallpaper-mode-panel" class="absolute transition top-11 -right-2 pt-5" class:float-panel-closed={!isOpen}>
        <DropdownPanel>
            <DropdownItem
                    isActive={mode === WALLPAPER_BANNER}
                    isLast={false}
                    onclick={() => switchWallpaperMode(WALLPAPER_BANNER)}
            >
                <Icon icon="material-symbols:image-outline" class="text-[1.25rem] mr-3"></Icon>
                {i18n(I18nKey.wallpaperBanner)}
            </DropdownItem>
            <DropdownItem
                    isActive={mode === WALLPAPER_FULLSCREEN}
                    isLast={false}
                    onclick={() => switchWallpaperMode(WALLPAPER_FULLSCREEN)}
            >
                <Icon icon="material-symbols:wallpaper" class="text-[1.25rem] mr-3"></Icon>
                {i18n(I18nKey.wallpaperFullscreen)}
            </DropdownItem>
            <DropdownItem
                    isActive={mode === WALLPAPER_NONE}
                    isLast={true}
                    onclick={() => switchWallpaperMode(WALLPAPER_NONE)}
            >
                <Icon icon="material-symbols:hide-image-outline" class="text-[1.25rem] mr-3"></Icon>
                {i18n(I18nKey.wallpaperNone)}
            </DropdownItem>
        </DropdownPanel>
    </div>
</div>
