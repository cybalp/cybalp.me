// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/config.ts
// ❯ @desc Configuration loader and normalizer.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import yaml from "js-yaml";
import rawConfig from "../cybalp.config.yaml?raw";
import type {
	AnnouncementConfig,
	FooterConfig,
	MusicPlayerConfig,
	NavbarConfig,
	NavbarLink,
	ParticleConfig,
	PostConfig,
	ProfileConfig,
	SidebarConfig,
	SiteConfig,
	WallConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// ❯ TYPE DEFINITIONS
type ConfigFile = {
	site: SiteConfig;
	umami: {
		enabled: boolean;
		apiKey?: string;
		baseUrl: string;
		scripts?: string;
	};
	navbar: {
		links: Array<NavbarLink | LinkPreset | string>;
	};
	sidebar: SidebarConfig;
	profile: ProfileConfig;
	wall: WallConfig;
	post: PostConfig;
	footer: FooterConfig;
	particle: ParticleConfig;
	musicPlayer: MusicPlayerConfig;
	// ❯ @gogogo announcement — 2/4 config: wire new fields from YAML to the type here
	announcement: AnnouncementConfig;
};

// ❯ CONFIGURATION LOADING
// ❯ @hint load from cybalp.config.yaml
const config = yaml.load(rawConfig) as ConfigFile;

// ❯ UTILITIES
// ❯ @doc Maps string names to LinkPreset enum values.
const linkPresetNameMap: Record<string, LinkPreset> = {
	Main: LinkPreset.Main,
	Vault: LinkPreset.Vault,
	Projects: LinkPreset.Arge,
	Arge: LinkPreset.Arge,
	Skills: LinkPreset.Toolchains,
	Toolchains: LinkPreset.Toolchains,
	PersonalLog: LinkPreset.PersonalLog,
	Albums: LinkPreset.Media,
	Img: LinkPreset.Media,
	Media: LinkPreset.Media,
	Identity: LinkPreset.Identity,
	PracticalCodes: LinkPreset.PracticalCodes,
	Netstat: LinkPreset.Netstat,
};

// ❯ @doc Normalizes navbar link from string, enum, or object to standard format.
const normalizeNavbarLink = (
	link: NavbarLink | LinkPreset | string,
): NavbarLink | LinkPreset => {
	if (typeof link === "string") {
		const preset = linkPresetNameMap[link];
		if (preset === undefined) {
			throw new Error(`Unknown LinkPreset: ${link}`);
		}
		return preset;
	}
	if (typeof link === "number") {
		return link;
	}
	const children = link.children?.map(normalizeNavbarLink);
	return children ? { ...link, children } : link;
};

// ❯ @doc Normalizes array of navbar links recursively.
const normalizeNavbarLinks = (links: Array<NavbarLink | LinkPreset | string>) =>
	links.map(normalizeNavbarLink);

// ❯ POST CONFIGURATION
// ❯ @doc Resolves post config with default language fallback.
const resolvedPostConfig: PostConfig = {
	...config.post,
	comment: config.post.comment.twikoo
		? {
				...config.post.comment,
				twikoo: {
					...config.post.comment.twikoo,
					lang: config.post.comment.twikoo.lang ?? config.site.lang,
				},
			}
		: config.post.comment,
};

// ❯ EXPORTS
export const siteConfig: SiteConfig = config.site;
export const umamiConfig = {
	enabled: config.umami.enabled,
	apiKey: import.meta.env.UMAMI_API_KEY ?? config.umami.apiKey,
	baseUrl: config.umami.baseUrl,
	scripts: import.meta.env.UMAMI_TRACKING_CODE ?? config.umami.scripts,
} as const;
export const navbarConfig: NavbarConfig = {
	links: normalizeNavbarLinks(config.navbar.links),
};
export const sidebarConfig: SidebarConfig = config.sidebar;
export const profileConfig: ProfileConfig = config.profile;
export const wallConfig: WallConfig = config.wall;
export const postConfig: PostConfig = resolvedPostConfig;
export const footerConfig: FooterConfig = config.footer;
export const particleConfig: ParticleConfig = config.particle;
export const musicPlayerConfig: MusicPlayerConfig = config.musicPlayer;
export const announcementConfig: AnnouncementConfig = config.announcement;
