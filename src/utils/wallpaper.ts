// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/wallpaper.ts
// ❯ @desc Wallpaper mode management.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import {
	BANNER_HEIGHT,
	MAIN_PANEL_OVERLAPS_BANNER_HEIGHT,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
} from "@constants/constants";
import { siteConfig } from "@/config";
import type { WALLPAPER_MODE } from "@/types/config";

// ❯ GLOBAL TYPES
declare global {
	interface Window {
		initBannerCarousel?: () => void;
		initFullscreenWallpaperCarousel?: () => void;
		initSemifullScrollDetection?: () => void;
		bannerCarouselState?: {
			currentIndex: number;
			lastSwitchTime: number;
		};
		fullscreenWallpaperState?: {
			currentIndex: number;
			lastSwitchTime: number;
		};
		bannerCarouselTimer?: any;
		fullscreenWallpaperTimer?: any;
		currentBannerCarousel?: HTMLElement | null;
		currentFullscreenWallpaperCarousel?: HTMLElement | null;
	}
}

// ❯ NAVBAR TRANSPARENCY
// ❯ @doc Gets navbar transparency mode for wallpaper mode.
export function getNavbarTransparentModeForWallpaperMode(
	mode: WALLPAPER_MODE,
): string {
	if (mode === WALLPAPER_FULLSCREEN) {
		return siteConfig.wallpaper.fullscreen?.navbar?.transparentMode || "semi";
	}
	if (mode === WALLPAPER_BANNER) {
		return siteConfig.wallpaper.banner?.navbar?.transparentMode || "semifull";
	}
	return "semi";
}

// ❯ DOM UTILITIES
// ❯ @doc Gets wallpaper-related DOM elements.
const getElements = () => {
	if (typeof document === "undefined")
		return {
			navbar: null,
			bannerWrapper: null,
			banner: null,
			fullscreenContainer: null,
			mainContent: null,
		};
	return {
		navbar: document.getElementById("navbar"),
		bannerWrapper: document.getElementById("banner-wrapper"),
		banner: document.getElementById("banner"),
		fullscreenContainer: document.querySelector(
			"[data-fullscreen-wallpaper]",
		) as HTMLElement,
		mainContent: document.querySelector(".absolute.w-full.z-30") as HTMLElement,
	};
};

// ❯ @doc Executes callback if mode matches after delay.
function runIfMode(mode: WALLPAPER_MODE, callback: () => void, delay = 600) {
	setTimeout(() => {
		if (
			typeof document !== "undefined" &&
			document.documentElement.getAttribute("data-wallpaper-mode") === mode
		) {
			callback();
		}
	}, delay);
}
// ❯ LAYOUT ADJUSTMENT
// ❯ @doc Adjusts main content position for wallpaper mode.
function adjustMainContentPosition(
	mode: WALLPAPER_MODE | "banner" | "none" | "fullscreen",
) {
	const { mainContent } = getElements();
	if (!mainContent) return;
	mainContent.classList.remove("no-banner-layout");
	switch (mode) {
		case WALLPAPER_BANNER:
		case "banner":
			mainContent.style.top = `calc(${BANNER_HEIGHT}vh - ${MAIN_PANEL_OVERLAPS_BANNER_HEIGHT}rem)`;
			break;
		case WALLPAPER_FULLSCREEN:
		case "fullscreen":
		case WALLPAPER_NONE:
		case "none":
			mainContent.classList.add("no-banner-layout");
			mainContent.style.top = "5.5rem";
			break;
		default:
			mainContent.style.top = "5.5rem";
			break;
	}
}
// ❯ @doc Updates navbar transparency based on mode.
function updateNavbarTransparency(mode: WALLPAPER_MODE) {
	const { navbar } = getElements();
	if (!navbar) return;
	const transparentMode = getNavbarTransparentModeForWallpaperMode(mode);
	navbar.setAttribute("data-transparent-mode", transparentMode);
	if (
		transparentMode === "semifull" &&
		typeof window.initSemifullScrollDetection === "function"
	) {
		if ("requestIdleCallback" in window) {
			requestIdleCallback(() => window.initSemifullScrollDetection!());
		} else {
			setTimeout(() => window.initSemifullScrollDetection!(), 0);
		}
	}
}
// ❯ BANNER MODE
// ❯ @doc Initializes banner elements visibility.
function initBannerElements(banner: HTMLElement | null) {
	if (!banner) return;
	banner.classList.remove("opacity-0");
	banner.classList.add("opacity-100");
	const mobileBanner = document.querySelector(
		'.block.md\\:hidden[alt="Mobile banner"]',
	);
	if (mobileBanner) {
		mobileBanner.classList.remove("opacity-0");
		mobileBanner.classList.add("opacity-100");
	}
}
// ❯ @doc Shows banner wallpaper mode.
function showBannerMode() {
	const { bannerWrapper, fullscreenContainer, banner } = getElements();
	if (fullscreenContainer) {
		fullscreenContainer.style.opacity = "0";
		runIfMode(WALLPAPER_BANNER, () => {
			fullscreenContainer.classList.add("hidden");
		});
	}
	if (!bannerWrapper) {
		requestAnimationFrame(showBannerMode);
		return;
	}
	const isAlreadyVisible =
		typeof document !== "undefined" &&
		!bannerWrapper.classList.contains("hidden") &&
		!document.documentElement.classList.contains("banner-hiding");
	if (!isAlreadyVisible && typeof document !== "undefined") {
		document.documentElement.classList.remove("banner-hiding");
		document.documentElement.classList.add("banner-transitioning");
		bannerWrapper.classList.remove("hidden");
		void bannerWrapper.offsetHeight;
		document.documentElement.classList.remove("banner-transitioning");
		document.documentElement.classList.add("show-banner-animation");
		setTimeout(() => {
			document.documentElement.classList.remove("show-banner-animation");
		}, 1200);
	}
	bannerWrapper.classList.remove("opacity-0");
	bannerWrapper.classList.add("opacity-100");
	if (typeof window.initBannerCarousel === "function") {
		window.initBannerCarousel();
	} else {
		setTimeout(() => {
			initBannerElements(banner);
		}, 100);
	}
}
// ❯ FULLSCREEN MODE
// ❯ @doc Shows fullscreen wallpaper mode.
function showFullscreenMode() {
	const { bannerWrapper, fullscreenContainer } = getElements();
	if (!fullscreenContainer) {
		requestAnimationFrame(showFullscreenMode);
		return;
	}
	fullscreenContainer.classList.remove("hidden");
	void fullscreenContainer.offsetHeight;
	fullscreenContainer.style.opacity =
		siteConfig.wallpaper.fullscreen?.opacity?.toString() || "0.8";
	if (bannerWrapper) {
		if (
			typeof document !== "undefined" &&
			document.documentElement.classList.contains("banner-hiding")
		) {
			runIfMode(WALLPAPER_FULLSCREEN, () => {
				bannerWrapper.classList.add("hidden");
			});
		} else {
			bannerWrapper.classList.add("hidden");
		}
	}
}

// ❯ NONE MODE
// ❯ @doc Hides wallpaper elements.
function showNoneMode() {
	const { bannerWrapper, fullscreenContainer } = getElements();
	if (bannerWrapper) {
		bannerWrapper.classList.add("hidden");
	}
	if (fullscreenContainer) {
		fullscreenContainer.style.opacity = "0";
		runIfMode(WALLPAPER_NONE, () => {
			fullscreenContainer.classList.add("hidden");
		});
	}
}
// ❯ @doc Reinitializes components for mode.
function reinitializeComponents(mode: WALLPAPER_MODE) {
	if (mode === WALLPAPER_BANNER) {
		setTimeout(() => {
			initBannerElements(getElements().banner);
		}, 100);
	}
}

// ❯ MODE APPLICATION
// ❯ @doc Applies wallpaper mode to document.
export function applyWallpaperModeToDocument(
	mode: WALLPAPER_MODE,
	force = false,
) {
	if (typeof document === "undefined") return;
	const currentMode = document.documentElement.getAttribute(
		"data-wallpaper-mode",
	) as WALLPAPER_MODE;
	if (!force && currentMode === mode) {
		return;
	}
	document.documentElement.setAttribute("data-wallpaper-mode", mode);
	if (currentMode === WALLPAPER_BANNER && mode !== WALLPAPER_BANNER) {
		document.documentElement.classList.add("banner-hiding");
		adjustMainContentPosition(mode);
		updateNavbarTransparency(mode);
		setTimeout(() => {
			document.documentElement.classList.remove("banner-hiding");
			executeApply();
		}, 600);
		return;
	}
	const apply = () => {
		executeApply();
	};

	function executeApply() {
		const body = document.body;
		if (!body) {
			requestAnimationFrame(executeApply);
			return;
		}
		document.documentElement.classList.add("is-wallpaper-transitioning");
		const nextRequiresTransparency =
			mode === WALLPAPER_BANNER || mode === WALLPAPER_FULLSCREEN;
		if (!nextRequiresTransparency) {
			setTimeout(() => {
				const isStillTransitioning =
					document.documentElement.classList.contains(
						"is-wallpaper-transitioning",
					);
				const currentDataMode = document.documentElement.getAttribute(
					"data-wallpaper-mode",
				);
				const isNowTransparentMode =
					currentDataMode === WALLPAPER_BANNER ||
					currentDataMode === WALLPAPER_FULLSCREEN;
				if (!isStillTransitioning || !isNowTransparentMode) {
					body.classList.remove("wallpaper-transparent");
				}
			}, 300);
		} else {
			body.classList.add("wallpaper-transparent");
		}
		if (mode !== WALLPAPER_BANNER) {
			body.classList.remove("enable-banner");
		} else {
			body.classList.add("enable-banner");
		}
		switch (mode) {
			case WALLPAPER_BANNER:
				showBannerMode();
				break;
			case WALLPAPER_FULLSCREEN:
				showFullscreenMode();
				adjustMainContentTransparency(true);
				break;
			case WALLPAPER_NONE:
				showNoneMode();
				adjustMainContentTransparency(false);
				break;
		}
		adjustMainContentPosition(mode);
		updateNavbarTransparency(mode);
		reinitializeComponents(mode);
		setTimeout(() => {
			document.documentElement.classList.remove("is-wallpaper-transitioning");
		}, 600);
	}
	requestAnimationFrame(apply);
}
// ❯ @doc Adjusts main content transparency.
function adjustMainContentTransparency(enable: boolean) {
	const { mainContent } = getElements();
	if (!mainContent) return;
	if (enable) {
		mainContent.classList.add("wallpaper-transparent");
	} else {
		mainContent.classList.remove("wallpaper-transparent");
	}
}
// ❯ @doc Sets wallpaper mode and saves to localStorage.
export function setWallpaperMode(mode: WALLPAPER_MODE): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("wallpaperMode", mode);
	}
	applyWallpaperModeToDocument(mode);
}
// ❯ MODE RESOLUTION
// ❯ @doc Gets default wallpaper mode from config.
export function getDefaultWallpaperMode(): WALLPAPER_MODE {
	const fallback = siteConfig.wallpaper.mode;
	if (typeof document !== "undefined") {
		const configCarrier = document.getElementById("config-carrier");
		return (configCarrier?.dataset.wallpaperMode as WALLPAPER_MODE) || fallback;
	}
	return fallback;
}

// ❯ @doc Gets stored wallpaper mode from localStorage.
export function getStoredWallpaperMode(): WALLPAPER_MODE {
	if (typeof localStorage !== "undefined") {
		return (
			(localStorage.getItem("wallpaperMode") as WALLPAPER_MODE) ||
			getDefaultWallpaperMode()
		);
	}
	return getDefaultWallpaperMode();
}

// ❯ @doc Initializes wallpaper mode on page load.
export function initWallpaperMode(): void {
	const storedMode = getStoredWallpaperMode();
	applyWallpaperModeToDocument(storedMode, true);
}
