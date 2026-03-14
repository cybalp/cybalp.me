// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/fancybox.ts
// ❯ @desc Fancybox image gallery initialization utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ STATE
let fancyboxSelectors: string[] = [];
let Fancybox: any;

// ❯ DOWNLOAD HELPERS
// ❯ @docs Checks if the slide's trigger element (or its closest ancestor) has data-downloadable="true".
//         The attribute is set on the <figure> wrapper in the album page.
function isSlideDownloadable(triggerEl: Element | null | undefined): boolean {
	if (!triggerEl) return false;
	return triggerEl.closest("[data-downloadable]")?.getAttribute("data-downloadable") === "true";
}

// ❯ @docs Syncs download button state based on current slide's downloadable flag.
//         Uses aria-disabled so Fancybox's own CSS handles the dimmed SVG opacity and cursor:default.
//         Note: pointer-events are NOT set to none here — the button stays clickable so the
//         "Oh no!" toast can fire on disabled-state clicks.
function syncDownloadBtn(fancybox: any): void {
	const container = fancybox?.getContainer?.() as HTMLElement | null;
	if (!container) return;
	const btn = container.querySelector("[data-fb-download]") as HTMLElement | null;
	if (!btn) return;
	const slide = fancybox.getSlide?.();
	const downloadable = isSlideDownloadable(slide?.triggerEl);
	if (downloadable) {
		btn.removeAttribute("aria-disabled");
		btn.title = "Download";
	} else {
		btn.setAttribute("aria-disabled", "true");
		btn.title = "Download not available";
	}
}

// ❯ @docs Shows a brief "Oh no!" toast inside the Fancybox container when a non-downloadable
//         image's download button is clicked. Injects CSS once, removes element on animationend.
function showOhNoToast(container: HTMLElement): void {
	container.querySelector(".fb-ohno-toast")?.remove();
	const toast = document.createElement("div");
	toast.className = "fb-ohno-toast";
	toast.textContent = "Oh no!";
	container.appendChild(toast);
	toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ❯ @docs Injects a <style> tag for the "Oh no!" toast animation once per page lifecycle.
//         Scoped to .fancybox__container so it has zero global footprint.
function injectOhNoStyles(): void {
	const STYLE_ID = "fb-ohno-style";
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = `
		@keyframes fb-ohno {
			0%   { opacity: 0; transform: translateY(-10px) scale(.85); }
			18%  { opacity: 1; transform: translateY(3px) scale(1.06); }
			30%  { transform: translateY(0) scale(1); }
			70%  { opacity: 1; }
			100% { opacity: 0; transform: translateY(-5px); }
		}
		.fb-ohno-toast {
			position: absolute;
			top: calc(var(--f-button-height, 46px) + 10px);
			right: 16px;
			z-index: 1000;
			padding: 5px 13px;
			border-radius: 6px;
			font-size: 13px;
			font-weight: 600;
			letter-spacing: .02em;
			color: #fca5a5;
			background: rgba(127, 29, 29, 0.55);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(239, 68, 68, 0.25);
			pointer-events: none;
			white-space: nowrap;
			animation: fb-ohno 1.9s cubic-bezier(.16, 1, .3, 1) forwards;
		}
	`;
	document.head.appendChild(style);
}

// ❯ @docs Injects a download button into Fancybox's right toolbar column via DOM manipulation.
//         We intentionally avoid Toolbar.items API because it lives under Carousel.Toolbar,
//         not at the top-level config where the rest of the toolbar options are set.
//         DOM injection is the minimal-risk approach that doesn't touch existing toolbar config.
function injectDownloadBtn(fancybox: any): void {
	const container = fancybox?.getContainer?.() as HTMLElement | null;
	if (!container) return;
	if (container.querySelector("[data-fb-download]")) return;
	const rightCol = container.querySelector(".f-carousel__toolbar__column.is-right") as HTMLElement | null;
	if (!rightCol) return;
	const btn = document.createElement("button");
	btn.className = "f-button";
	btn.setAttribute("data-fb-download", "");
	btn.title = "Download";
	// @docs SVG intentionally has NO presentational attributes (no fill, stroke, stroke-width).
	//         Fancybox's .f-button svg CSS rule handles all of those via CSS variables,
	//         matching the exact rendering of built-in toolbar buttons.
	btn.innerHTML = `<svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
	btn.addEventListener("click", () => {
		const slide = fancybox.getSlide?.();
		const triggerEl = slide?.triggerEl as HTMLImageElement | null;
		if (!triggerEl || !isSlideDownloadable(triggerEl)) {
			showOhNoToast(container);
			return;
		}
		const src = triggerEl.src || triggerEl.getAttribute("src");
		if (!src) return;
		const filename =
			triggerEl.alt?.trim().replace(/\s+/g, "-").toLowerCase() ||
			src.split("/").pop()?.split("?")[0] ||
			"wallpaper";
		const a = document.createElement("a");
		a.href = src;
		a.download = filename.endsWith(".webp") ? filename : `${filename}.webp`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	});
	// @hint Insert before first child so download appears first in the right column
	rightCol.insertBefore(btn, rightCol.firstChild);
}

// ❯ INITIALIZATION
// ❯ @docs Initializes Fancybox with image selectors.
export async function initFancybox() {
	if (typeof document === "undefined") return;
	// @docs .photo-gallery scopes to figure:not(.photo-initially-hidden) so paginated albums
	//         only include currently visible photos in the gallery group.
	//         Fancybox re-evaluates this selector on each click, so "Show more" reveals
	//         are automatically picked up without needing to rebind.
	const albumImagesSelector =
		".custom-md img:not(a *), #post-cover img:not(a *), .moment-images img:not(a *), .photo-gallery figure:not(.photo-initially-hidden) img";
	const albumLinksSelector =
		".moment-images a[data-fancybox], .photo-gallery a[data-fancybox]";
	const singleFancyboxSelector =
		"[data-fancybox]:not(.moment-images a):not(.photo-gallery a)";
	const hasImages =
		document.querySelector(albumImagesSelector) ||
		document.querySelector(albumLinksSelector) ||
		document.querySelector(singleFancyboxSelector);
	if (!hasImages) return;
	if (!Fancybox) {
		const mod = await import("@fancyapps/ui");
		Fancybox = mod.Fancybox;
		// @docs Dynamic CSS import fails in production when inlineStylesheets: "always" is set in
		try {
			await import("@fancyapps/ui/dist/fancybox/fancybox.css");
		} catch {
			// Non-fatal: vendor CSS is already inlined via base.astro static import.
		}
	}
	if (fancyboxSelectors.length > 0) {
		return;
	}
	injectOhNoStyles();

	// ❯ DOWNLOAD EVENTS
	// ❯ @docs "ready" fires after Fancybox + Carousel fully init (toolbar DOM exists by this point).
	//         "Carousel.change" fires on every slide transition to re-sync button state.
	//         Both receive (fancyboxInstance) as first arg per FancyboxEventArgs contract.
	const downloadEvents = {
		ready: (fancybox: any) => {
			injectDownloadBtn(fancybox);
			syncDownloadBtn(fancybox);
		},
		"Carousel.change": (fancybox: any) => {
			syncDownloadBtn(fancybox);
		},
	};

	const commonConfig = {
		Thumbs: {
			autoStart: true,
			showOnStart: "yes",
		},
		Toolbar: {
			display: {
				left: ["infobar"],
				middle: [
					"zoomIn",
					"zoomOut",
					"toggle1to1",
					"rotateCCW",
					"rotateCW",
					"flipX",
					"flipY",
				],
				right: ["slideshow", "thumbs", "close"],
			},
		},
		on: downloadEvents,
		animated: true,
		dragToClose: true,
		keyboard: {
			Escape: "close",
			Delete: "close",
			Backspace: "close",
			PageUp: "next",
			PageDown: "prev",
			ArrowUp: "next",
			ArrowDown: "prev",
			ArrowRight: "next",
			ArrowLeft: "prev",
		},
		fitToView: true,
		preload: 3,
		infinite: true,
		Panzoom: {
			maxScale: 3,
			minScale: 1,
		},
		caption: false,
	};
	Fancybox.bind(albumImagesSelector, {
		...commonConfig,
		groupAll: true,
		Carousel: {
			transition: "slide",
			preload: 2,
		},
	});
	fancyboxSelectors.push(albumImagesSelector);
	Fancybox.bind(albumLinksSelector, {
		...commonConfig,
		source: (el: any) => {
			return el.getAttribute("data-src") || el.getAttribute("href");
		},
	});
	fancyboxSelectors.push(albumLinksSelector);
	Fancybox.bind(singleFancyboxSelector, commonConfig);
	fancyboxSelectors.push(singleFancyboxSelector);
}

// ❯ CLEANUP
// ❯ @doc Unbinds all Fancybox selectors.
export function cleanupFancybox() {
	if (!Fancybox) return;
	fancyboxSelectors.forEach((selector) => {
		Fancybox.unbind(selector);
	});
	fancyboxSelectors = [];
}
