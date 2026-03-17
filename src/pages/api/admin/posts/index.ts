// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/api/admin/posts/index.ts
// ❯ @desc Admin API — list posts, create post (GitHub API)
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { APIRoute } from "astro";
import {
	ADMIN_GITHUB_REPO_OWNER,
	ADMIN_GITHUB_REPO_NAME,
	ADMIN_GITHUB_BRANCH,
} from "astro:env/server";
import { requireAuth } from "@lib/admin/auth";
import {
	listPostsRecursive,
	getFile,
	putFile,
	deleteFile,
	type RepoConfig,
} from "@lib/admin/github";
import { parsePost, serializePost } from "@lib/admin/frontmatter";
import type { PostData } from "@lib/admin/types";

export const prerender = false;

const POSTS_BASE = "src/content/posts";

function getRepoConfig(): RepoConfig {
	return {
		owner: ADMIN_GITHUB_REPO_OWNER ?? "cybalp",
		repo: ADMIN_GITHUB_REPO_NAME ?? "cybalp.me",
		branch: ADMIN_GITHUB_BRANCH ?? "main",
	};
}

// ❯ GET — list all posts or fetch single by ?path=
export const GET: APIRoute = async ({ request }) => {
	const auth = await requireAuth(request);
	if (auth instanceof Response) return auth;
	const token = auth;
	const rc = getRepoConfig();
	const url = new URL(request.url);
	const pathParam = url.searchParams.get("path");

	if (pathParam) {
		const fullPath = pathParam.startsWith(POSTS_BASE)
			? pathParam
			: `${POSTS_BASE}/${pathParam}`;
		try {
			const file = await getFile(token, fullPath, rc);
			const post = parsePost(file.content);
			return new Response(JSON.stringify({ post, sha: file.sha }), {
				headers: { "Content-Type": "application/json" },
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			return new Response(
				JSON.stringify({ error: "Not found", message: msg }),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}
	}

	const items = await listPostsRecursive(token, POSTS_BASE, rc);
	const list = items.map((i) => ({
		path: i.path,
		id: i.path.replace(/\.(md|mdx|markdown)$/i, "").replace(`${POSTS_BASE}/`, ""),
		name: i.name,
		sha: i.sha,
	}));
	return new Response(JSON.stringify({ posts: list }), {
		headers: { "Content-Type": "application/json" },
	});
};

// ❯ POST — create new post
export const POST: APIRoute = async ({ request }) => {
	const auth = await requireAuth(request);
	if (auth instanceof Response) return auth;
	const token = auth;
	const rc = getRepoConfig();

	let body: { path: string; data: PostData; message?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(
			JSON.stringify({ error: "Invalid JSON body" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { path: pathArg, data, message = "feat: add post via admin" } = body;
	if (!pathArg || !data) {
		return new Response(
			JSON.stringify({ error: "path and data required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const fullPath = pathArg.startsWith(POSTS_BASE)
		? pathArg
		: `${POSTS_BASE}/${pathArg}`;
	if (!/\.(md|mdx|markdown)$/i.test(fullPath)) {
		return new Response(
			JSON.stringify({ error: "path must end with .md or .mdx" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const content = serializePost(data as PostData);
	try {
		await putFile(token, fullPath, content, message, rc);
		return new Response(
			JSON.stringify({ ok: true, path: fullPath }),
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: "GitHub API failed", message: msg }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};

// ❯ PUT — update existing post
export const PUT: APIRoute = async ({ request }) => {
	const auth = await requireAuth(request);
	if (auth instanceof Response) return auth;
	const token = auth;
	const rc = getRepoConfig();

	let body: { path: string; data: PostData; sha: string; message?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(
			JSON.stringify({ error: "Invalid JSON body" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { path: pathArg, data, sha, message = "fix: update post via admin" } =
		body;
	if (!pathArg || !data || !sha) {
		return new Response(
			JSON.stringify({ error: "path, data and sha required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const fullPath = pathArg.startsWith(POSTS_BASE)
		? pathArg
		: `${POSTS_BASE}/${pathArg}`;
	const content = serializePost(data as PostData);
	try {
		await putFile(token, fullPath, content, message, rc, sha);
		return new Response(
			JSON.stringify({ ok: true, path: fullPath }),
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: "GitHub API failed", message: msg }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};

// ❯ DELETE — remove post
export const DELETE: APIRoute = async ({ request }) => {
	const auth = await requireAuth(request);
	if (auth instanceof Response) return auth;
	const token = auth;
	const rc = getRepoConfig();

	let body: { path: string; sha: string; message?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(
			JSON.stringify({ error: "Invalid JSON body" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { path: pathArg, sha, message = "chore: remove post via admin" } = body;
	if (!pathArg || !sha) {
		return new Response(
			JSON.stringify({ error: "path and sha required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const fullPath = pathArg.startsWith(POSTS_BASE)
		? pathArg
		: `${POSTS_BASE}/${pathArg}`;
	try {
		await deleteFile(token, fullPath, message, sha, rc);
		return new Response(
			JSON.stringify({ ok: true }),
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: "GitHub API failed", message: msg }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
