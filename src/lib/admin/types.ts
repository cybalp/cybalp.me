// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/lib/admin/types.ts
// ❯ @desc Admin panel shared types — post, config, API responses
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ POST FRONTMATTER (matches content.config.ts schema)
export interface PostFrontmatter {
	title: string;
	published: string;
	updated?: string;
	description: string;
	cover: string;
	coverInContent: boolean;
	category: string | string[];
	tags: string[];
	lang: string;
	pinned: boolean;
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean;
	draft: boolean;
	encrypted: boolean;
	password: string;
	routeName?: string;
}

// ❯ POST WITH BODY (for editor)
export interface PostData extends PostFrontmatter {
	body: string;
}

// ❯ GITHUB API — content response
export interface GitHubContentItem {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string | null;
	type: "file" | "dir";
}

// ❯ GITHUB API — file content (decoded)
export interface GitHubFileContent {
	content: string;
	sha: string;
	path: string;
}
