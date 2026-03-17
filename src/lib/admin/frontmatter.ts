// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/lib/admin/frontmatter.ts
// ❯ @desc Parse and serialize YAML frontmatter for posts
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import yaml from "js-yaml";
import type { PostData, PostFrontmatter } from "./types";

const FM_DELIM = "---";

// ❯ @docs Parses markdown with frontmatter into { data, body }
export function parsePost(content: string): PostData {
	const lines = content.split("\n");
	if (lines[0]?.trim() !== FM_DELIM) {
		return { body: content, ...defaultFrontmatter() } as PostData;
	}
	let end = 1;
	for (; end < lines.length; end++) {
		if (lines[end]?.trim() === FM_DELIM) break;
	}
	const fmLines = lines.slice(1, end);
	const body = lines.slice(end + 1).join("\n").trimStart();
	const fm = yaml.load(fmLines.join("\n")) as Record<string, unknown> | null;
	const data = { ...defaultFrontmatter(), ...fm } as PostFrontmatter;
	// Normalize dates to YYYY-MM-DD
	const pub = data.published as Date | string | undefined;
	if (pub instanceof Date) {
		data.published = pub.toISOString().slice(0, 10);
	} else if (typeof pub === "string") {
		data.published = pub.slice(0, 10);
	}
	const upd = data.updated as Date | string | undefined;
	if (upd instanceof Date) {
		data.updated = upd.toISOString().slice(0, 10);
	} else if (upd && typeof upd === "string") {
		data.updated = upd.slice(0, 10);
	}
	return { ...data, body } as PostData;
}

// ❯ @docs Serializes PostData to markdown string
export function serializePost(data: PostData): string {
	const fm: Record<string, unknown> = {
		title: data.title,
		published: data.published,
		description: data.description,
		cover: data.cover,
		coverInContent: data.coverInContent,
		pinned: data.pinned,
		tags: data.tags,
		category: data.category,
		draft: data.draft,
		comment: data.comment,
		encrypted: data.encrypted,
		password: data.password,
		licenseName: data.licenseName,
		licenseUrl: data.licenseUrl,
		author: data.author,
		sourceLink: data.sourceLink,
		lang: data.lang,
	};
	if (data.updated) fm.updated = data.updated;
	if (data.routeName) fm.routeName = data.routeName;
	const fmStr = yaml.dump(fm, { lineWidth: -1 }).trim();
	return `${FM_DELIM}\n${fmStr}\n${FM_DELIM}\n\n${data.body}`;
}

function defaultFrontmatter(): PostFrontmatter {
	const today = new Date().toISOString().slice(0, 10);
	return {
		title: "",
		published: today,
		description: "",
		cover: "",
		coverInContent: false,
		category: "",
		tags: [],
		lang: "",
		pinned: false,
		author: "",
		sourceLink: "",
		licenseName: "",
		licenseUrl: "",
		comment: true,
		draft: false,
		encrypted: false,
		password: "",
	};
}
