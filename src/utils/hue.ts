// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/hue.ts
// ❯ @desc Theme hue management utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { siteConfig } from "@/config";

// ❯ HUE MANAGEMENT
// ❯ @doc Sets hue value in storage and CSS.
export function setHue(hue: number): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("hue", String(hue));
	}
	if (typeof document !== "undefined") {
		const r = document.querySelector(":root") as HTMLElement;
		if (!r) {
			return;
		}
		r.style.setProperty("--hue", String(hue));
	}
}

// ❯ @doc Gets default hue from config.
export function getDefaultHue(): number {
	const fallback = siteConfig.themeColor.hue.toString();
	if (typeof document !== "undefined") {
		const configCarrier = document.getElementById("config-carrier");
		return Number.parseInt(configCarrier?.dataset.hue || fallback);
	}
	return Number.parseInt(fallback);
}

// ❯ @doc Gets stored or default hue value.
export function getHue(): number {
	if (typeof localStorage !== "undefined") {
		const stored = localStorage.getItem("hue");
		return stored ? Number.parseInt(stored) : getDefaultHue();
	}
	return getDefaultHue();
}

// ❯ @doc Initializes hue from storage or default.
export function initHue(): void {
	const hue = getHue();
	setHue(hue);
}
