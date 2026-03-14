// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/pages/og/[...slug].png.ts
// ❯ @desc Open Graph image generation endpoint.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import type { CollectionEntry } from "astro:content";
// ❯ IMPORTS
import { getCollection } from "astro:content";
import * as fs from "node:fs";
import { defaultFavicons } from "@constants/icon";
import type { APIContext, GetStaticPaths } from "astro";
import satori from "satori";
import sharp from "sharp";
import { profileConfig, siteConfig } from "@/config";

// ❯ TYPES
type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontStyle = "normal" | "italic";
interface FontOptions {
	data: Buffer | ArrayBuffer;
	name: string;
	weight?: Weight;
	style?: FontStyle;
	lang?: string;
}

// ❯ CONFIGURATION
export const prerender = true;

// ❯ STATIC PATH GENERATION
// ❯ @doc Generates static paths for published posts when OG images are enabled.
export const getStaticPaths: GetStaticPaths = async () => {
	if (!siteConfig.generateOgImages) {
		return [];
	}

	const allPosts = await getCollection("posts");
	const publishedPosts = allPosts.filter((post) => !post.data.draft);

	return publishedPosts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
};

// ❯ FONT CACHE
let fontCache: { regular: Buffer | null; bold: Buffer | null } | null = null;

// ❯ FONT LOADING
// ❯ @doc Fetches and caches Noto Sans SC fonts from Google Fonts.
async function fetchNotoSansSCFonts() {
	if (fontCache) {
		return fontCache;
	}

	try {
		// ❯ Fetch Font CSS
		const cssResp = await fetch(
			"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap",
		);
		if (!cssResp.ok) throw new Error("Failed to fetch Google Fonts CSS");
		const cssText = await cssResp.text();

		// ❯ Extract Font URLs
		// ❯ @doc Extracts font file URL for specified weight from CSS.
		const getUrlForWeight = (weight: number) => {
			const blockRe = new RegExp(
				`@font-face\\s*{[^}]*font-weight:\\s*${weight}[^}]*}`,
				"g",
			);
			const match = cssText.match(blockRe);
			if (!match || match.length === 0) return null;
			const urlMatch = match[0].match(/url\((https:[^)]+)\)/);
			return urlMatch ? urlMatch[1] : null;
		};

		const regularUrl = getUrlForWeight(400);
		const boldUrl = getUrlForWeight(700);

		if (!regularUrl || !boldUrl) {
			console.warn(
				"Could not find font urls in Google Fonts CSS; falling back to no fonts.",
			);
			fontCache = { regular: null, bold: null };
			return fontCache;
		}

		// ❯ Download Font Files
		const [rResp, bResp] = await Promise.all([
			fetch(regularUrl),
			fetch(boldUrl),
		]);
		if (!rResp.ok || !bResp.ok) {
			console.warn(
				"Failed to download font files from Google; falling back to no fonts.",
			);
			fontCache = { regular: null, bold: null };
			return fontCache;
		}

		const rBuf = Buffer.from(await rResp.arrayBuffer());
		const bBuf = Buffer.from(await bResp.arrayBuffer());

		fontCache = { regular: rBuf, bold: bBuf };
		return fontCache;
	} catch (err) {
		console.warn("Error fetching fonts:", err);
		fontCache = { regular: null, bold: null };
		return fontCache;
	}
}

// ❯ API HANDLER
// ❯ @doc Generates Open Graph PNG image for blog posts.
export async function GET({
	props,
}: APIContext<{ post: CollectionEntry<"posts"> }>) {
	const { post } = props;

	// ❯ FONT LOADING
	const { regular: fontRegular, bold: fontBold } = await fetchNotoSansSCFonts();

	// ❯ ASSET LOADING
	// ❯ Avatar
	const avatarPath = `./public${profileConfig.avatar}`;
	const avatarBuffer = fs.readFileSync(avatarPath);
	const avatarBase64 = `data:image/png;base64,${avatarBuffer.toString("base64")}`;

	// ❯ Icon
	let iconPath = `./public${defaultFavicons[0].src}`;
	if (siteConfig.favicon.length > 0) {
		iconPath = `./public${siteConfig.favicon[0].src}`;
	}
	const iconBuffer = fs.readFileSync(iconPath);
	const iconBase64 = `data:image/png;base64,${iconBuffer.toString("base64")}`;

	// ❯ COLOR CONFIGURATION
	const hue = siteConfig.themeColor.hue;
	const primaryColor = `hsl(${hue}, 90%, 65%)`;
	const textColor = "hsl(0, 0%, 95%)";
	const subtleTextColor = `hsl(${hue}, 10%, 75%)`;
	const backgroundColor = `hsl(${hue}, 15%, 12%)`;

	// ❯ POST DATA
	const pubDate = post.data.published.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
	const description = post.data.description;

	// ❯ TEMPLATE GENERATION
	const template = {
		type: "div",
		props: {
			style: {
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: backgroundColor,
				fontFamily:
					'"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
				padding: "60px",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							width: "100%",
							display: "flex",
							alignItems: "center",
							gap: "20px",
						},
						children: [
							{
								type: "img",
								props: {
									src: iconBase64,
									width: 48,
									height: 48,
									style: { borderRadius: "10px" },
								},
							},
							{
								type: "div",
								props: {
									style: {
										fontSize: "36px",
										fontWeight: 600,
										color: subtleTextColor,
									},
									children: siteConfig.title,
								},
							},
						],
					},
				},

				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							flexGrow: 1,
							gap: "20px",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										display: "flex",
										alignItems: "flex-start",
									},
									children: [
										{
											type: "div",
											props: {
												style: {
													width: "10px",
													height: "68px",
													backgroundColor: primaryColor,
													borderRadius: "6px",
													marginTop: "14px",
												},
											},
										},
										{
											type: "div",
											props: {
												style: {
													fontSize: "72px",
													fontWeight: 700,
													lineHeight: 1.2,
													color: textColor,
													marginLeft: "25px",
													display: "-webkit-box",
													overflow: "hidden",
													textOverflow: "ellipsis",
													lineClamp: 3,
													WebkitLineClamp: 3,
													WebkitBoxOrient: "vertical",
												},
												children: post.data.title,
											},
										},
									],
								},
							},
							description && {
								type: "div",
								props: {
									style: {
										fontSize: "32px",
										lineHeight: 1.5,
										color: subtleTextColor,
										paddingLeft: "35px",
										display: "-webkit-box",
										overflow: "hidden",
										textOverflow: "ellipsis",
										lineClamp: 2,
										WebkitLineClamp: 2,
										WebkitBoxOrient: "vertical",
									},
									children: description,
								},
							},
						],
					},
				},
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "20px",
									},
									children: [
										{
											type: "img",
											props: {
												src: avatarBase64,
												width: 60,
												height: 60,
												style: { borderRadius: "50%" },
											},
										},
										{
											type: "div",
											props: {
												style: {
													fontSize: "28px",
													fontWeight: 600,
													color: textColor,
												},
												children: profileConfig.name,
											},
										},
									],
								},
							},
							{
								type: "div",
								props: {
									style: { fontSize: "28px", color: subtleTextColor },
									children: pubDate,
								},
							},
						],
					},
				},
			],
		},
	};

	// ❯ FONT CONFIGURATION
	const fonts: FontOptions[] = [];
	if (fontRegular) {
		fonts.push({
			name: "Noto Sans SC",
			data: fontRegular,
			weight: 400,
			style: "normal",
		});
	}
	if (fontBold) {
		fonts.push({
			name: "Noto Sans SC",
			data: fontBold,
			weight: 700,
			style: "normal",
		});
	}

	// ❯ IMAGE GENERATION
	// ❯ @doc Converts template to SVG using Satori.
	const svg = await satori(template, {
		width: 1200,
		height: 630,
		fonts,
	});

	// ❯ @doc Converts SVG to PNG using Sharp with error handling.
	try {
		const png = await sharp(Buffer.from(svg), {
			limitInputPixels: false,
		})
			.png()
			.toBuffer();

		// ❯ RESPONSE
		return new Response(new Uint8Array(png), {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		console.error(`Failed to generate OG image for ${post.id}:`, error);
		// ❯ @doc Returns a fallback 1x1 transparent PNG on error.
		const fallbackPng = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			"base64",
		);
		return new Response(new Uint8Array(fallbackPng), {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=3600",
			},
		});
	}
}
