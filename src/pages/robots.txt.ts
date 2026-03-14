// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/robots.txt.ts
// ❯ @desc Robots.txt API route handler.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { APIRoute } from "astro";

// ❯ CORE LOGIC
const robotsTxt = `
User-agent: *
Disallow: /_astro/

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

// ❯ API Route Handler
export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
