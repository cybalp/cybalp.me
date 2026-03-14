// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/theme.ts
// ❯ @desc Theme management utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { DARK_MODE, LIGHT_MODE, SYSTEM_MODE } from "@constants/constants";
import { siteConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

// ❯ THEME APPLICATION
// ❯ @doc Applies theme to document with transitions.
export function applyThemeToDocument(theme: LIGHT_DARK_MODE, force = false) {
	if (typeof document === "undefined") return;
	const currentIsDark = document.documentElement.classList.contains("dark");
	const currentTheme = document.documentElement.getAttribute("data-theme");
	let targetIsDark: boolean;
	switch (theme) {
		case LIGHT_MODE:
			targetIsDark = false;
			break;
		case DARK_MODE:
			targetIsDark = true;
			break;
		case SYSTEM_MODE:
			targetIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			break;
		default:
			targetIsDark = currentIsDark;
			break;
	}
	const needsThemeChange = currentIsDark !== targetIsDark;
	const targetTheme = targetIsDark ? "github-dark" : "github-light";
	const needsCodeThemeUpdate = currentTheme !== targetTheme;
	if (!force && !needsThemeChange && !needsCodeThemeUpdate) {
		return;
	}
	if (needsThemeChange) {
		document.documentElement.classList.add("is-theme-transitioning");
	}
	requestAnimationFrame(() => {
		if (needsThemeChange) {
			if (targetIsDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
		document.documentElement.setAttribute("data-theme", targetTheme);
		if (needsThemeChange) {
			requestAnimationFrame(() => {
				document.documentElement.classList.remove("is-theme-transitioning");
			});
		}
	});
}

// ❯ @doc Sets theme and saves to localStorage.
export function setTheme(theme: LIGHT_DARK_MODE): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("theme", theme);
	}
	applyThemeToDocument(theme);
}
// ❯ THEME RESOLUTION
// ❯ @doc Gets default theme from config or DOM.
export function getDefaultTheme(): LIGHT_DARK_MODE {
	const fallback = siteConfig.defaultTheme;
	if (typeof document !== "undefined") {
		const configCarrier = document.getElementById("config-carrier");
		return (configCarrier?.dataset.theme as LIGHT_DARK_MODE) || fallback;
	}
	return fallback;
}

// ❯ @doc Gets stored theme from localStorage.
export function getStoredTheme(): LIGHT_DARK_MODE {
	if (typeof localStorage !== "undefined") {
		return (
			(localStorage.getItem("theme") as LIGHT_DARK_MODE) || getDefaultTheme()
		);
	}
	return getDefaultTheme();
}

// ❯ @doc Initializes theme on page load.
export function initTheme(): void {
	if (typeof window === "undefined") return;
	const storedTheme = getStoredTheme();
	applyThemeToDocument(storedTheme, true);
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => {
			const currentStored = getStoredTheme();
			if (currentStored === SYSTEM_MODE) {
				applyThemeToDocument(SYSTEM_MODE);
			}
		});
}
