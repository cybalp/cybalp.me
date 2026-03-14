// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/atom.xml.ts
// ❯ @desc Atom XML feed generator endpoint.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { getImage } from "astro:assets";
import { getCategoryPathParts } from "@utils/category";
import { getSortedPosts } from "@utils/content";
import { parseTags } from "@utils/tag";
import { getFileDirFromPath, getPostUrl } from "@utils/url";
import type { APIContext, ImageMetadata } from "astro";
import MarkdownIt from "markdown-it";
import { parse as htmlParser } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { profileConfig, siteConfig } from "@/config";

// ❯ INITIALIZATION
const markdownParser = new MarkdownIt();
const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
	"/src/content/**/*.{jpeg,jpg,png,gif,webp}",
);

// ❯ API HANDLER
// ❯ @doc Generates Atom XML feed from sorted posts.
export async function GET(context: APIContext) {
	if (!context.site) {
		throw Error("site not set");
	}
	// ❯ DATA FETCHING
	const posts = (await getSortedPosts()).filter(
		(post) => !post.data.encrypted && post.data.draft !== true,
	);

	// ❯ FEED GENERATION
	let atomFeed = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
        <title>${siteConfig.title}</title>
        <subtitle>${siteConfig.subtitle || "No description"}</subtitle>
        <link href="${context.site}" rel="alternate" type="text/html"/>
        <link href="${new URL("atom.xml", context.site)}" rel="self" type="application/atom+xml"/>
        <id>${context.site}</id>
        <updated>${new Date().toISOString()}</updated>
        <language>${siteConfig.lang}</language>`;

	// ❯ POST PROCESSING
	for (const post of posts) {
		const body = markdownParser.render(String(post.body ?? ""));
		const html = htmlParser.parse(body);
		const images = html.querySelectorAll("img");

		// ❯ Image Processing
		for (const img of images) {
			const src = img.getAttribute("src");
			if (!src) continue;
			if (
				src.startsWith("./") ||
				src.startsWith("../") ||
				(!src.startsWith("http") && !src.startsWith("/"))
			) {
				let importPath: string | null = null;
				const contentDirRaw = post.filePath
					? getFileDirFromPath(post.filePath)
					: "src/content/posts";
				const contentDir = contentDirRaw.startsWith("src/")
					? contentDirRaw
					: `src/${contentDirRaw}`;
				if (src.startsWith("./")) {
					const prefixRemoved = src.slice(2);
					importPath = `/${contentDir}/${prefixRemoved}`;
				} else if (src.startsWith("../")) {
					const cleaned = src.replace(/^\.\.\//, "");
					importPath = `/src/content/${cleaned}`;
				} else {
					importPath = `/${contentDir}/${src}`;
				}
				const imageMod = await imagesGlob[importPath]?.()?.then(
					(res) => res.default,
				);
				if (imageMod) {
					const optimizedImg = await getImage({ src: imageMod });
					img.setAttribute("src", new URL(optimizedImg.src, context.site).href);
				} else {
					console.log(
						`Failed to load image: ${importPath} for post: ${post.id}`,
					);
				}
			} else if (src.startsWith("/")) {
				img.setAttribute("src", new URL(src, context.site).href);
			}
		}
		const postUrl = new URL(getPostUrl(post), context.site).href;
		const content = sanitizeHtml(html.toString(), {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
		});

		// ❯ Entry Generation
		atomFeed += `
        <entry>
            <title>${post.data.title}</title>
            <link href="${postUrl}" rel="alternate" type="text/html"/>
            <id>${postUrl}</id>
            <published>${post.data.published.toISOString()}</published>
            <updated>${post.data.updated?.toISOString() || post.data.published.toISOString()}</updated>
            <summary>${post.data.description || ""}</summary>
            <content type="html"><![CDATA[${content}]]></content>
            <author>
                <name>${profileConfig.name}</name>
            </author>`;
		// ❯ Categories
		const categoryParts = getCategoryPathParts(post.data.category);
		if (categoryParts && categoryParts.length > 0) {
			for (let i = 0; i < categoryParts.length; i++) {
				const term = categoryParts.slice(0, i + 1).join(" / ");
				atomFeed += `
            <category term="${term}"></category>`;
			}
		}
		// ❯ Tags
		const postTags = parseTags(post.data.tags);
		if (postTags && postTags.length > 0) {
			for (const tag of postTags) {
				atomFeed += `
            <category term="${tag}" label="${tag}"></category>`;
			}
		}
		atomFeed += `
            </entry>`;
	}
	atomFeed += `
        </feed>`;

	// ❯ RESPONSE
	return new Response(atomFeed, {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
		},
	});
}
