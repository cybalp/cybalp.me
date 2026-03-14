// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/practical-codes.ts
// ❯ @desc Practical code snippets data.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import yaml from "js-yaml";

// ❯ DATA LOADING
// ❯ @hint load from content/practical-codes
const practicalCodesModules = import.meta.glob(
	"../content/practical-codes/**/*.md",
	{ eager: true, as: "raw" },
);

// ❯ TYPES
export interface PracticalCode {
	id: string;
	title: string;
	description?: string;
	language: string;
	code: string;
	tags?: string[];
	date: string;
	basePath?: string;
}

// ❯ PARSING
// ❯ @doc Parses markdown file into frontmatter and code.
function parseMarkdownFile(content: string): {
	frontmatter: any;
	code: string;
} {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		throw new Error("Invalid markdown format: missing frontmatter");
	}

	const frontmatterStr = match[1];
	const codeContent = match[2].trim();

	const frontmatter = yaml.load(frontmatterStr) as any;

	// Extract code from markdown code block if present
	const codeBlockRegex = /^```(\w+)?\n([\s\S]*?)```$/;
	const codeMatch = codeContent.match(codeBlockRegex);
	const code = codeMatch ? codeMatch[2].trim() : codeContent;

	return { frontmatter, code };
}

// ❯ DATA EXPORT
export const practicalCodesData: PracticalCode[] = Object.entries(
	practicalCodesModules,
).map(([path, content]: [string, string]) => {
	const id = path
		.replace(/^.*\/content\/practical-codes\//, "")
		.replace(/\.md$/, "")
		.replace(/\//g, "-");

	const basePath = path.replace(/\/[^/]+\.md$/, "");

	const { frontmatter, code } = parseMarkdownFile(content);

	return {
		id,
		basePath,
		...frontmatter,
		code,
	} as PracticalCode;
});

// ❯ QUERY FUNCTIONS
// ❯ @doc Groups codes by programming language.
export function getPracticalCodesByLanguage(): Record<string, PracticalCode[]> {
	return practicalCodesData.reduce(
		(acc, code) => {
			const lang = code.language || "other";
			if (!acc[lang]) {
				acc[lang] = [];
			}
			acc[lang].push(code);
			return acc;
		},
		{} as Record<string, PracticalCode[]>,
	);
}

// ❯ @doc Groups codes by tag.
export function getPracticalCodesByTag(): Record<string, PracticalCode[]> {
	return practicalCodesData.reduce(
		(acc, code) => {
			if (code.tags && code.tags.length > 0) {
				code.tags.forEach((tag) => {
					if (!acc[tag]) {
						acc[tag] = [];
					}
					acc[tag].push(code);
				});
			}
			return acc;
		},
		{} as Record<string, PracticalCode[]>,
	);
}

// ❯ @doc Returns unique language list.
export function getAllLanguages(): string[] {
	return [
		...new Set(practicalCodesData.map((code) => code.language || "other")),
	].sort();
}

// ❯ @doc Returns unique tag list.
export function getAllTags(): string[] {
	const allTags = practicalCodesData.flatMap((code) => code.tags || []);
	return [...new Set(allTags)].sort();
}

// ❯ @doc Returns codes sorted by date descending.
export function getSortedPracticalCodes(): PracticalCode[] {
	return [...practicalCodesData].sort((a, b) => {
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});
}
