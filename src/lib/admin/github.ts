// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/lib/admin/github.ts
// ❯ @desc GitHub REST API client for content CRUD — repo files
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { GitHubContentItem, GitHubFileContent } from "./types";

// ❯ CONSTANTS
const GITHUB_API = "https://api.github.com";

// ❯ @hint Pass owner/repo/branch from API route (astro:env/server)
export type RepoConfig = { owner: string; repo: string; branch: string };

// ❯ HELPERS
function headers(token: string): HeadersInit {
	return {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${token}`,
		"X-GitHub-Api-Version": "2022-11-28",
	};
}

// ❯ @docs Lists directory contents via GitHub API
export async function listDir(
	token: string,
	path: string,
	rc: RepoConfig,
): Promise<GitHubContentItem[]> {
	const { owner, repo: r, branch } = rc;
	const url = `${GITHUB_API}/repos/${owner}/${r}/contents/${path}?ref=${branch}`;
	const res = await fetch(url, { headers: headers(token) });
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			`GitHub listDir failed: ${res.status} ${(err as { message?: string }).message ?? res.statusText}`,
		);
	}
	const data = (await res.json()) as GitHubContentItem[] | { message?: string };
	if (Array.isArray(data)) return data;
	throw new Error(`GitHub listDir: unexpected response`);
}

// ❯ @docs Recursively lists all .md/.mdx files under path
export async function listPostsRecursive(
	token: string,
	basePath: string,
	rc: RepoConfig,
): Promise<GitHubContentItem[]> {
	const items = await listDir(token, basePath, rc);
	const files: GitHubContentItem[] = [];

	for (const item of items) {
		if (item.type === "file") {
			if (/\.(md|mdx|markdown)$/i.test(item.name)) {
				files.push(item);
			}
		} else if (item.type === "dir") {
			const sub = await listPostsRecursive(token, item.path, rc);
			files.push(...sub);
		}
	}
	return files;
}

// ❯ @docs Fetches file content (base64 decoded)
export async function getFile(
	token: string,
	path: string,
	rc: RepoConfig,
): Promise<GitHubFileContent> {
	const { owner, repo: r, branch } = rc;
	const url = `${GITHUB_API}/repos/${owner}/${r}/contents/${path}?ref=${branch}`;
	const res = await fetch(url, { headers: headers(token) });
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			`GitHub getFile failed: ${res.status} ${(err as { message?: string }).message ?? res.statusText}`,
		);
	}
	const data = (await res.json()) as {
		content?: string;
		sha?: string;
		path?: string;
		message?: string;
	};
	if (!data.content || !data.sha) {
		throw new Error(`GitHub getFile: missing content/sha`);
	}
	const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
	return { content, sha: data.sha, path: data.path ?? path };
}

// ❯ @docs Creates or updates file via GitHub API
export async function putFile(
	token: string,
	path: string,
	content: string,
	message: string,
	rc: RepoConfig,
	sha?: string,
): Promise<{ sha: string }> {
	const { owner, repo: r, branch } = rc;
	const url = `${GITHUB_API}/repos/${owner}/${r}/contents/${path}`;
	const body: Record<string, unknown> = {
		message,
		content: Buffer.from(content, "utf-8").toString("base64"),
		branch,
	};
	if (sha) body.sha = sha;

	const res = await fetch(url, {
		method: "PUT",
		headers: { ...headers(token), "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			`GitHub putFile failed: ${res.status} ${(err as { message?: string }).message ?? res.statusText}`,
		);
	}
	const data = (await res.json()) as { content?: { sha?: string } };
	return { sha: data.content?.sha ?? "" };
}

// ❯ @docs Deletes file via GitHub API
export async function deleteFile(
	token: string,
	path: string,
	message: string,
	sha: string,
	rc: RepoConfig,
): Promise<void> {
	const { owner, repo: r, branch } = rc;
	const url = `${GITHUB_API}/repos/${owner}/${r}/contents/${path}`;
	const res = await fetch(url, {
		method: "DELETE",
		headers: { ...headers(token), "Content-Type": "application/json" },
		body: JSON.stringify({ message, sha, branch }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			`GitHub deleteFile failed: ${res.status} ${(err as { message?: string }).message ?? res.statusText}`,
		);
	}
}
