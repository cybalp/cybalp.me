// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/inject-machine-info-cover.ts
// ❯ @desc Injects cover image next to Machine Information block in post HTML.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @docs Finds first blockquote.admonition.bdm-caution with "Machine Information" title,
 *       wraps it in flex container and appends cover img.
 */
export function injectMachineInfoCover(html: string, coverImgHtml: string): string {
	if (!coverImgHtml) return html;
	// Match blockquote with bdm-caution (class may use " or ')
	const pattern =
		/(<blockquote[^>]*class=["'][^"']*bdm-caution[^"']*["'][^>]*>)([\s\S]*?)(<\/blockquote>)/;
	const match = html.match(pattern);
	if (!match) return html;
	const [, openTag, inner, closeTag] = match;
	// Must contain "Machine Information" in title
	if (!inner.includes("Machine Information")) return html;
	// @docs flex-row flex-nowrap: cover always next to Machine Info (mobile + desktop).
	// @docs flex-1 min-w-0 on blockquote wrapper lets it shrink on narrow viewports.
	// @docs min-w-0 prevents flex overflow on narrow viewports.
	const wrapper = `<div class="flex flex-row flex-nowrap gap-4 items-start mb-6 min-w-0"><div class="flex-1 min-w-0">${openTag}${inner}${closeTag}</div>${coverImgHtml}</div>`;
	return html.replace(pattern, wrapper);
}
