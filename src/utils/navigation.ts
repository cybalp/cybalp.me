// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/navigation.ts
// ❯ @desc Navigation utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { LinkPresets } from "@constants/link-presets";
// ❯ IMPORTS
import { navbarConfig } from "@/config";
import type { NavbarLink } from "@/types/config";
import { pathsEqual } from "./url";

// ❯ NAVBAR UTILITIES
// ❯ @doc Finds parent link containing current path.
export function getParentLink(currentPath: string): NavbarLink | undefined {
	for (const link of navbarConfig.links) {
		if (typeof link === "number") {
			continue;
		}

		if (link.children && link.children.length > 0) {
			for (const child of link.children) {
				let childLink: NavbarLink | undefined;
				if (typeof child === "number") {
					childLink = LinkPresets[child];
				} else {
					childLink = child;
				}
				if (childLink && pathsEqual(childLink.url, currentPath)) {
					return link;
				}
			}
		}
	}
	return undefined;
}
// ❯ NAVIGATION
// ❯ @doc Fallback navigation using window.location.
function fallbackNavigation(
	url: string,
	options?: {
		replace?: boolean;
		force?: boolean;
	},
): void {
	if (typeof window === "undefined") return;
	if (options?.replace) {
		window.location.replace(url);
	} else {
		window.location.href = url;
	}
}

// ❯ @doc Navigates to URL with Swup or fallback.
export function navigateToPage(
	url: string,
	options?: {
		replace?: boolean;
		force?: boolean;
	},
): void {
	if (!url || typeof url !== "string") {
		console.warn("navigateToPage: Invalid URL provided");
		return;
	}
	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("//")
	) {
		window.open(url, "_blank");
		return;
	}
	if (url.startsWith("#")) {
		if (typeof document !== "undefined") {
			const element = document.getElementById(url.slice(1));
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		}
		return;
	}
	if (typeof window !== "undefined" && (window as any).swup) {
		try {
			if (options?.replace) {
				(window as any).swup.navigate(url, { history: false });
			} else {
				(window as any).swup.navigate(url);
			}
		} catch (error) {
			console.error("Swup navigation failed:", error);
			fallbackNavigation(url, options);
		}
	} else {
		fallbackNavigation(url, options);
	}
}

// ❯ PATH UTILITIES
// ❯ @doc Gets current window pathname.
export function getCurrentPath(): string {
	return typeof window !== "undefined" ? window.location.pathname : "";
}

// ❯ @doc Checks if current path is mainpage.
export function isMainPage(): boolean {
	const path = getCurrentPath();
	return path === "/" || path === "";
}
