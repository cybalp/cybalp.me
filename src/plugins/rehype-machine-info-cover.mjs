// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/plugins/rehype-machine-info-cover.mjs
// ❯ @desc Rehype plugin: wraps Machine Information caution in flex container and injects cover image.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { visit } from "unist-util-visit";
import { h } from "hastscript";
import path from "node:path";

// ❯ @doc Glob for content images — Vite as:url gives URL (astro:assets not available in config context).
const imagesGlob = import.meta.glob("/src/content/**/*.{jpeg,jpg,png,gif,webp}", {
	as: "url",
	eager: true,
});

/**
 * @docs Resolves cover image path to URL.
 * @hint Match by path suffix — glob keys may vary (leading slash, backslash, etc.).
 */
function resolveCoverUrl(filePath, cover) {
	if (!cover || !filePath) return null;
	const dirPath = path.dirname(filePath);
	const relDir = path.relative(process.cwd(), dirPath).replace(/\\/g, "/");
	for (const [key, value] of Object.entries(imagesGlob)) {
		const normKey = key.replace(/\\/g, "/");
		if (normKey.endsWith(cover) && normKey.includes(relDir)) {
			return typeof value === "string" ? value : value?.default ?? value?.src ?? null;
		}
	}
	return null;
}

/** @docs Extracts text content from HAST node recursively. */
function getText(node) {
	if (!node) return "";
	if (node.type === "text") return node.value || "";
	if (node.children) return node.children.map(getText).join("");
	return "";
}

/**
 * @docs Checks if node is Machine Information caution block.
 */
function isMachineInfoCaution(node) {
	if (node.type !== "element" || node.tagName !== "blockquote") return false;
	const cls = node.properties?.className ?? node.properties?.class;
	const clsStr = Array.isArray(cls) ? cls.join(" ") : String(cls || "");
	if (!clsStr.includes("bdm-caution")) return false;
	const titleSpan = node.children?.find(
		(c) =>
			c.type === "element" &&
			c.tagName === "span" &&
			(c.properties?.className?.includes?.("bdm-title") ||
				c.properties?.class?.includes?.("bdm-title")),
	);
	if (!titleSpan) return false;
	return getText(titleSpan).trim() === "Machine Information";
}

/**
 * @docs Rehype plugin: injects cover image next to Machine Information caution.
 */
export function rehypeMachineInfoCover() {
	return (tree, file) => {
		const cover = file?.data?.astro?.frontmatter?.cover;
		const filePath = file?.path || file?.history?.[0];
		if (!cover || !filePath) return;

		let resolvedSrc = null;
		try {
			resolvedSrc = resolveCoverUrl(filePath, cover);
		} catch (_) {
			return;
		}
		if (!resolvedSrc) return;

		let replaced = false;
		visit(tree, (node, index, parent) => {
			if (replaced) return visit.SKIP;
			if (!isMachineInfoCaution(node)) return;

			const wrapper = h(
				"div",
				{
					class: "flex flex-wrap gap-4 items-start mb-6 min-w-0",
				},
				[
					node,
					h("img", {
						src: resolvedSrc,
						alt: "Cover",
						class: "rounded-xl max-w-full sm:max-w-xs shrink-0",
						loading: "lazy",
						decoding: "async",
					}),
				],
			);

			parent.children[index] = wrapper;
			replaced = true;
			return visit.SKIP;
		});
	};
}
