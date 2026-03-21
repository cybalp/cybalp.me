// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/middleware.ts
// ❯ @desc Legacy URL redirects — CTF writeups moved from /posts/CTF!/ to /ctf/writeups/.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { defineMiddleware } from "astro:middleware";

// ❯ REDIRECTS
export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;
	const m = pathname.match(/^\/posts\/CTF!\/([^/]+)\/?$/);
	if (m) {
		const slug = m[1];
		return context.redirect(
			new URL(`/ctf/writeups/${slug}/`, context.url),
			301,
		);
	}
	return next();
});
