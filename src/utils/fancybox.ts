// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/fancybox.ts
// ❯ @desc Fancybox image gallery initialization utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ STATE
let fancyboxSelectors: string[] = [];
let Fancybox: any;

// ❯ INITIALIZATION
// ❯ @doc Initializes Fancybox with image selectors.
export async function initFancybox() {
	if (typeof document === "undefined") return;
	const albumImagesSelector =
		".custom-md img:not(a *), #post-cover img:not(a *), .moment-images img:not(a *), .photo-gallery img:not(a *)";
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
		await import("@fancyapps/ui/dist/fancybox/fancybox.css");
	}
	if (fancyboxSelectors.length > 0) {
		return;
	}
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
