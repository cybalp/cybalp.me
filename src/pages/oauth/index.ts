// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/oauth/index.ts
// ❯ @desc OAuth login — redirects to GitHub with redirect_uri from request origin
// ❯ @hint Overrides astro-decap-cms-oauth to support local dev (localhost callback)
// ❯ @hint GitHub OAuth App: add http://127.0.0.1/oauth/callback to callback URLs for local dev
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import type { APIRoute } from "astro";
import { OAUTH_GITHUB_CLIENT_ID } from "astro:env/server";

export const prerender = false;

export const GET: APIRoute = ({ url, redirect }) => {
	const origin = url.origin;
	const redirectUri = `${origin}/oauth/callback/`;

	const params = new URLSearchParams({
		client_id: OAUTH_GITHUB_CLIENT_ID,
		scope: "repo,user",
		redirect_uri: redirectUri,
	});

	return redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};
