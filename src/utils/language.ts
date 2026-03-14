// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/language.ts
// ❯ @desc Language and translation utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import {
	LANGUAGE_CONFIG,
	langToTranslateMap,
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
	translateToLangMap,
} from "@i18n/language";
import { siteConfig } from "@/config";

// ❯ EXPORTS
export {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
	langToTranslateMap,
	translateToLangMap,
};

// ❯ CONSTANTS
const LANG_STORAGE_KEY = "selected-language";

// ❯ STORAGE
// ❯ @doc Saves language preference to localStorage.
export function setStoredLanguage(lang: string): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(LANG_STORAGE_KEY, lang);
	}
}

// ❯ @doc Retrieves stored language preference.
export function getStoredLanguage(): string | null {
	if (typeof localStorage !== "undefined") {
		return localStorage.getItem(LANG_STORAGE_KEY);
	}
	return null;
}

// ❯ LANGUAGE RESOLUTION
// ❯ @doc Gets default language from config or DOM.
export function getDefaultLanguage(): string {
	const fallback = siteConfig.lang;
	if (typeof document !== "undefined") {
		const configCarrier = document.getElementById("config-carrier");
		return configCarrier?.dataset.lang || fallback;
	}
	return fallback;
}

// ❯ @doc Maps config language to translate service format.
export function getTranslateLanguageFromConfig(configLang: string): string {
	return langToTranslateMap[configLang] || "chinese_simplified";
}

// ❯ @doc Resolves site language with fallback detection.
export function getResolvedSiteLang(): SupportedLanguage {
	const configLang = getDefaultLanguage() as any;
	if (SUPPORTED_LANGUAGES.includes(configLang)) {
		return configLang as SupportedLanguage;
	}
	return detectBrowserLanguage();
}

// ❯ @doc Maps translate language to config format.
export function getConfigLanguageFromTranslate(translateLang: string): string {
	return translateToLangMap[translateLang] || "zh";
}

// ❯ @doc Gets human-readable language display name.
export function getLanguageDisplayName(langCode: string): string {
	if (langCode in LANGUAGE_CONFIG) {
		return LANGUAGE_CONFIG[langCode as SupportedLanguage].displayName;
	}
	const configLang = translateToLangMap[langCode];
	if (configLang && configLang in LANGUAGE_CONFIG) {
		return LANGUAGE_CONFIG[configLang as SupportedLanguage].displayName;
	}
	return langCode;
}
// ❯ @doc Detects browser language from navigator.
export function detectBrowserLanguage(
	fallbackLang: SupportedLanguage = "en",
): SupportedLanguage {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return fallbackLang;
	}
	const browserLangs = navigator.languages || [navigator.language];
	for (const browserLang of browserLangs) {
		const langCode = browserLang.toLowerCase().split("-")[0];
		if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
			return langCode as SupportedLanguage;
		}
	}
	return fallbackLang;
}

// ❯ @doc Gets site language with priority: stored > config > browser.
export function getSiteLanguage(configLang?: string): string {
	const storedLang = getStoredLanguage();
	if (storedLang) return storedLang;
	const defaultLang = configLang || getDefaultLanguage();
	if (SUPPORTED_LANGUAGES.includes(defaultLang as SupportedLanguage)) {
		return langToTranslateMap[defaultLang];
	}
	const browserLang = detectBrowserLanguage();
	return langToTranslateMap[browserLang];
}

// ❯ TRANSLATE SERVICE
// ❯ @doc Initializes translate.js service with config.
export function initTranslateService(): void {
	if (typeof window === "undefined" || !siteConfig.translate?.enable) return;
	const translate = (window as any).translate;
	if (!translate || (window as any).translateInitialized) return;
	if (siteConfig.translate.service) {
		translate.service.use(siteConfig.translate.service);
	}
	const resolvedLang = getResolvedSiteLang();
	const sourceLang = getTranslateLanguageFromConfig(resolvedLang);
	translate.language.setLocal(sourceLang);
	const targetLang = getSiteLanguage(resolvedLang);
	if (targetLang && targetLang !== sourceLang) {
		translate.to = targetLang;
	}
	if (siteConfig.translate.autoDiscriminate) {
		translate.setAutoDiscriminateLocalLanguage();
	}
	if (siteConfig.translate.ignoreClasses) {
		siteConfig.translate.ignoreClasses.forEach((className: string) => {
			translate.ignore.class.push(className);
		});
	}
	if (siteConfig.translate.ignoreTags) {
		siteConfig.translate.ignoreTags.forEach((tagName: string) => {
			translate.ignore.tag.push(tagName);
		});
	}
	if (siteConfig.translate.showSelectTag === false) {
		translate.selectLanguageTag.show = false;
	}
	translate.storage.set = (key: string, value: string) => {
		if (key === "to") {
			setStoredLanguage(value);
		} else {
			localStorage.setItem(key, value);
		}
	};
	translate.storage.get = (key: string) => {
		if (key === "to") {
			return getStoredLanguage();
		}
		return localStorage.getItem(key);
	};
	translate.listener.start();
	(window as any).translateInitialized = true;
	if (translate.to && translate.to !== translate.language.getLocal()) {
		setTimeout(() => {
			translate.execute();
		}, 10);
	} else if (translate.to === translate.language.getLocal()) {
		translate.reset();
	}
}

// ❯ @doc Loads translate script and initializes service.
export async function loadAndInitTranslate(): Promise<void> {
	if (typeof window === "undefined" || !siteConfig.translate?.enable) return;
	try {
		if (!(window as any).translate) {
			await import("@/plugins/translate");
			(window as any).translateScriptLoaded = true;
		}
		initTranslateService();
	} catch (error) {
		console.error("Failed to load or init translate.js:", error);
	}
}

// ❯ @doc Switches translation language.
export function toggleLanguage(langCode: string): void {
	const translate = (window as any).translate;
	if (!translate) return;

	translate.changeLanguage(langCode);
	setStoredLanguage(langCode);
}
