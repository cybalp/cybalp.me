// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/i18n/language.ts
// ❯ @desc Language configuration and mappings.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ TYPES
export interface LanguageConfig {
	translateCode: string;
	displayName: string;
	locale: string;
	icon: string;
}

// ❯ CONFIGURATION
// ❯ @doc Single source of truth for language configurations.
export const LANGUAGE_CONFIG = {
	zh: {
		translateCode: "chinese_simplified",
		displayName: "中文",
		locale: "zh-CN",
		icon: "🇨🇳",
	},
	en: {
		translateCode: "english",
		displayName: "English",
		locale: "en-US",
		icon: "🇺🇸",
	},
	ja: {
		translateCode: "japanese",
		displayName: "日本語",
		locale: "ja-JP",
		icon: "🇯🇵",
	},
	ko: {
		translateCode: "korean",
		displayName: "한국어",
		locale: "ko-KR",
		icon: "🇰🇷",
	},
	es: {
		translateCode: "spanish",
		displayName: "Español",
		locale: "es-ES",
		icon: "🇪🇸",
	},
	th: {
		translateCode: "thai",
		displayName: "ไทย",
		locale: "th-TH",
		icon: "🇹🇭",
	},
	vi: {
		translateCode: "vietnamese",
		displayName: "Tiếng Việt",
		locale: "vi-VN",
		icon: "🇻🇳",
	},
	tr: {
		translateCode: "turkish",
		displayName: "Türkçe",
		locale: "tr-TR",
		icon: "🇹🇷",
	},
	id: {
		translateCode: "indonesian",
		displayName: "Bahasa Indonesia",
		locale: "id-ID",
		icon: "🇮🇩",
	},
	fr: {
		translateCode: "french",
		displayName: "Français",
		locale: "fr-FR",
		icon: "🇫🇷",
	},
	de: {
		translateCode: "german",
		displayName: "Deutsch",
		locale: "de-DE",
		icon: "🇩🇪",
	},
	ru: {
		translateCode: "russian",
		displayName: "Русский",
		locale: "ru-RU",
		icon: "🇷🇺",
	},
	ar: {
		translateCode: "arabic",
		displayName: "العربية",
		locale: "ar-SA",
		icon: "🇸🇦",
	},
} as const satisfies Record<string, LanguageConfig>;

// ❯ EXPORTS
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Array<
	keyof typeof LANGUAGE_CONFIG
>;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG;

// ❯ MAPPINGS
// ❯ @doc Maps config language codes to translate service codes.
export const langToTranslateMap: Record<string, string> = Object.fromEntries(
	Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => [
		lang,
		config.translateCode,
	]),
);

// ❯ @doc Maps translate service codes to config language codes.
export const translateToLangMap: Record<string, string> = Object.fromEntries(
	Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => [
		config.translateCode,
		lang,
	]),
);

// ❯ @doc Maps language codes to Intl.DateTimeFormat locales.
export const langToLocaleMap: Record<string, string> = Object.fromEntries(
	Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => [
		lang,
		config.locale,
	]),
);

// ❯ UTILITIES
// ❯ @doc Returns all supported translate languages for Translator service.
export function getSupportedTranslateLanguages() {
	return Object.entries(LANGUAGE_CONFIG).map(([code, config]) => ({
		code: config.translateCode,
		name: config.displayName,
		icon: config.icon,
		langCode: code,
	}));
}
