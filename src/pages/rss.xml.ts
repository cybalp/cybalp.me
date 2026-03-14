// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/rss.xml.ts
// ❯ @desc RSS feed generation endpoint.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ EXTERNAL IMPORTS
import { getImage } from "astro:assets";
import type { RSSFeedItem } from "@astrojs/rss";
import rss from "@astrojs/rss";
import { getCategoryPathLabel } from "@utils/category";
import { getSortedPosts } from "@utils/content";
import { parseTags } from "@utils/tag";
import { getFileDirFromPath, getPostUrl } from "@utils/url";
import type { APIContext, ImageMetadata } from "astro";
import MarkdownIt from "markdown-it";
import { parse as htmlParser } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
// ❯ INTERNAL IMPORTS
import { siteConfig } from "@/config";

// ❯ INITIALIZATION
const markdownParser = new MarkdownIt();
const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
	"/src/content/**/*.{jpeg,jpg,png,gif,webp}",
);

// ❯ CORE LOGIC
// ❯ @doc Generates RSS feed from blog posts with image optimization.
export async function GET(context: APIContext) {
	if (!context.site) {
		throw Error("site not set");
	}

	// ❯ fetch from getSortedPosts
	const posts = (await getSortedPosts()).filter((post) => !post.data.encrypted);
	const feed: RSSFeedItem[] = [];

	for (const post of posts) {
		// ❯ Post Processing
		// ❯ markdown to HTML
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
				// ❯ Relative Path Resolution
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

				// ❯ Image Optimization
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

		// ❯ Category Aggregation
		const categories: string[] = [];
		const categoryLabel = getCategoryPathLabel(post.data.category);
		if (categoryLabel) categories.push(categoryLabel);

		const tags = parseTags(post.data.tags);
		if (tags && tags.length > 0) categories.push(...tags);

		// ❯ Feed Item Assembly
		feed.push({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.published,
			link: getPostUrl(post),
			categories: categories,
			// ❯ sanitize HTML
			content: sanitizeHtml(html.toString(), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
			}),
		});
	}

	// ❯ RSS Generation
	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site: context.site,
		items: feed,
		customData: `<language>${siteConfig.lang}</language>`,
	});
}
