// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/oauth/callback.ts
// ❯ @desc OAuth callback — exchanges code for token, postMessage to opener
// ❯ @hint Overrides astro-decap-cms-oauth; redirect_uri must match auth request
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import type { APIRoute } from "astro";
import {
	OAUTH_GITHUB_CLIENT_ID,
	OAUTH_GITHUB_CLIENT_SECRET,
	OAUTH_GITHUB_REPO_ID,
} from "astro:env/server";

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
	const redirectUri = `${url.origin}/oauth/callback/`;

	const data = {
		code: url.searchParams.get("code"),
		client_id: OAUTH_GITHUB_CLIENT_ID,
		client_secret: OAUTH_GITHUB_CLIENT_SECRET,
		redirect_uri: redirectUri,
		...(OAUTH_GITHUB_REPO_ID ? { repository_id: OAUTH_GITHUB_REPO_ID } : {}),
	};

	try {
		const response = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const body = await response.json();

		const content = {
			token: body.access_token,
			provider: "github",
		};

		const script = `
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage(
            'authorization:${content.provider}:success:${JSON.stringify(content)}',
            message.origin
          );
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:${content.provider}", "*");
      </script>
    `;

		return new Response(script, {
			headers: { "Content-Type": "text/html" },
		});
	} catch (err) {
		console.error(err);
		return redirect("/?error=😡");
	}
};
