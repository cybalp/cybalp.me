// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/add-published-time.mjs
// ❯ @desc Adds time to date-only published fields in post frontmatter for correct sorting.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "../src/content/posts");

// ❯ @doc Checks if published value is date-only (no time component).
function isDateOnly(val) {
	if (!val || typeof val !== "string") return false;
	return /^\d{4}-\d{2}-\d{2}$/.test(val.trim());
}

// ❯ @doc Extracts frontmatter from markdown content.
function extractFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;
	return match[1];
}

// ❯ @doc Replaces published value in frontmatter string.
function replacePublished(frontmatter, newValue) {
	return frontmatter.replace(
		/^published:\s*.*$/m,
		`published: ${newValue}`,
	);
}

// ❯ @doc Recursively finds all .md/.mdx files in directory.
function findMarkdownFiles(dir, files = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory() && !e.name.startsWith("_")) {
			findMarkdownFiles(full, files);
		} else if (e.isFile() && /\.(md|mdx)$/i.test(e.name)) {
			files.push(full);
		}
	}
	return files;
}

// ❯ MAIN
const files = findMarkdownFiles(POSTS_DIR);
const dateOnlyPosts = [];

for (const filePath of files) {
	const content = fs.readFileSync(filePath, "utf-8");
	const frontmatter = extractFrontmatter(content);
	if (!frontmatter) continue;

	const publishedMatch = frontmatter.match(/^published:\s*(.+)$/m);
	if (!publishedMatch) continue;

	const publishedVal = publishedMatch[1].trim();
	if (!isDateOnly(publishedVal)) continue;

	dateOnlyPosts.push({ filePath, content, frontmatter, publishedVal });
}

if (dateOnlyPosts.length === 0) {
	console.log("No posts with date-only published found. All good.");
	process.exit(0);
}

// ❯ @doc For same-day posts: assign times 09:00, 10:00, 11:00... to preserve order.
const byDate = new Map();
for (const p of dateOnlyPosts) {
	const list = byDate.get(p.publishedVal) || [];
	list.push(p);
	byDate.set(p.publishedVal, list);
}

let updated = 0;
for (const [, posts] of byDate) {
	posts.sort((a, b) => a.filePath.localeCompare(b.filePath));
	posts.forEach((p, i) => {
		const totalMinutes = 9 * 60 + i * 30;
		const h = Math.floor(totalMinutes / 60) % 24;
		const m = totalMinutes % 60;
		const newPublished = `${p.publishedVal}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
		const newFrontmatter = replacePublished(p.frontmatter, newPublished);
		const newContent = p.content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${newFrontmatter}\n---`);
		fs.writeFileSync(p.filePath, newContent);
		updated++;
		console.log(`  ${path.relative(POSTS_DIR, p.filePath)} → ${newPublished}`);
	});
}

console.log(`\nUpdated ${updated} post(s) with time.`);
