import type {
	DARK_MODE,
	LIGHT_MODE,
	SYSTEM_MODE,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
} from "@constants/constants";

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export type LoadingOverlayConfig = {
	enable: boolean;
	title: {
		enable: boolean;
		content: string;
		interval: number;
	};
	spinner: {
		enable: boolean;
		interval: number;
	};
};

export type SiteConfig = {
	siteURL: string;
	title: string;
	subtitle: string;
	keywords?: string[];
	lang:
		| "zh"
		| "en"
		| "ko"
		| "ja"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id"
		| "fr"
		| "de"
		| "ru"
		| "ar";
	translate?: {
		enable: boolean;
		service?: string;
		showSelectTag?: boolean;
		autoDiscriminate?: boolean;
		ignoreClasses?: string[];

		ignoreTags?: string[];
	};

	timeZone:
		| -12
		| -11
		| -10
		| -9
		| -8
		| -7
		| -6
		| -5
		| -4
		| -3
		| -2
		| -1
		| 0
		| 1
		| 2
		| 3
		| 4
		| 5
		| 6
		| 7
		| 8
		| 9
		| 10
		| 11
		| 12;

	font: {
		[key: string]: {
			src: string;
			family: string;
		};
	};
	themeColor: {
		hue: number;
	};
	defaultTheme: "system" | "light" | "dark";
	wallpaper: {
		mode: "fullscreen" | "banner" | "none";
		src:
			| string
			| string[]
			| {
					desktop?: string | string[];
					mobile?: string | string[];
			  };
		position?: "top" | "center" | "bottom";
		carousel?: {
			enable: boolean;
			interval: number;
			kenBurns?: boolean;
		};
		banner?: {
			mainText?: {
				enable: boolean;
				title?: string;
				subtitle?: string | string[];
				typewriter?: {
					enable: boolean;
					speed: number;
					deleteSpeed: number;
					pauseTime: number;
				};
			};
			credit?: {
				enable: boolean;
				text: string;
				url?: string;
			};
			navbar?: {
				transparentMode?: "semi" | "full" | "semifull";
			};
			waves?: {
				enable: boolean;
				performanceMode?: boolean;
			};
		};

		fullscreen?: {
			zIndex?: number;
			opacity?: number;
			blur?: number;
			navbar?: {
				transparentMode?: "semi" | "full" | "semifull";
			};
		};
	};
	loadingOverlay?: LoadingOverlayConfig;
	favicon: Favicon[];
	bangumi?: {
		userId?: string;
	};
	generateOgImages: boolean;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof SYSTEM_MODE;

export type WALLPAPER_MODE =
	| typeof WALLPAPER_FULLSCREEN
	| typeof WALLPAPER_BANNER
	| typeof WALLPAPER_NONE;

export enum LinkPreset {
	Main = 0,
	Vault = 1,
	Arge = 2,
	Toolchains = 3,
	PersonalLog = 5,
	Media = 6,
	Identity = 8,
	PracticalCodes = 9,
	Netstat = 10,
}

export type NavbarLink = {
	name: string;
	url: string;
	external?: boolean;
	icon?: string;
	description?: string;
	children?: (NavbarLink | LinkPreset)[];
};

export type NavbarConfig = {
	links: (NavbarLink | LinkPreset)[];
};

export type WidgetComponentType =
	| "profile"
	| "wall"
	| "categories"
	| "tags"
	| "statistics"
	| "toc"
	| "custom";

export type WidgetComponentConfig = {
	type: WidgetComponentType;
	enable: boolean;
	position: "top" | "sticky";
	style?: string;
	visibility?: {
		mode: "include" | "exclude";
		paths: string[];
	};
	responsive?: {
		hidden?: ("mobile" | "tablet" | "desktop")[];
		collapseThreshold?: number;
		// @docs Controls where this widget renders on mobile: above content, below content, or not at all
		mobilePosition?: "top" | "bottom" | "hidden";
	};
	depth?: number;
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type WallConfig = {
	title?: string;
	content: string;
	type?: "info" | "warning" | "success" | "error";
	icon?: string;
	closable?: boolean;
	link?: {
		enable: boolean;
		text: string;
		url: string;
		external?: boolean;
	};
};

export type SidebarConfig = {
	components: {
		left: WidgetComponentConfig[];
		right: WidgetComponentConfig[];
	};
};

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	pinned?: boolean;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type PostConfig = {
	showLastModified: boolean;
	expressiveCode: {
		theme: string;
	};
	license: {
		enable: boolean;
		name: string;
		url: string;
	};
	comment: {
		enable: boolean;
		twikoo?: {
			envId: string;
			region?: string;
			lang?: string;
		};
	};
};

export type FooterConfig = {
	enable: boolean;
	customHtml?: string;
};

export type ParticleConfig = {
	enable: boolean;
	particleNum: number;
	limitTimes: number;
	size: {
		min: number;
		max: number;
	};
	opacity: {
		min: number;
		max: number;
	};
	speed: {
		horizontal: {
			min: number;
			max: number;
		};
		vertical: {
			min: number;
			max: number;
		};
		rotation: number;
		fadeSpeed: number;
	};
	zIndex: number;
};

export type MusicPlayerTrack = {
	id: number | string;
	title: string;
	artist: string;
	cover: string;
	url: string;
	lrc?: string;
	duration: number;
};

// ❯ @gogogo announcement — 1/4 type: add new fields here when banner needs new capabilities
export type AnnouncementConfig = {
    enable: boolean;
    // @docs dismiss state is derived from message content — changing the message
    // automatically resets dismissed state for all visitors (no manual key needed).
    message: string;
    href: string;
    ctaText?: string;
    icon?: string;
};

// ❯ @gogogo new search source — add new SearchSource entries via cybalp.config.yaml → search.sources
export type SearchSource = {
	id: string;
	enabled: boolean;
	label: string;
	url: string;
	aliases: string[];
};

export type SearchCommand = {
	id: string;
	triggers: string[];
	label: string;
	icon?: string;
	action: string;
};

export type SearchConfig = {
	enable: boolean;
	sources: SearchSource[];
	commands: SearchCommand[];
};

export type MusicPlayerConfig = {
	enable: boolean;
	mode: "meting" | "local";
	meting: {
		meting_api: string;
		server: "netease" | "tencent" | "kugou" | "baidu" | "kuwo";
		type: "playlist" | "album" | "artist" | "song" | "search";
		id: string;
	};
	local: {
		playlist: MusicPlayerTrack[];
	};
	autoplay?: boolean;
};
