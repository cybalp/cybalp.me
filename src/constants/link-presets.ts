// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/constants/link-presets.ts
// ❯ @desc Navigation link preset configurations.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { LinkPreset, type NavbarLink } from "@/types/config";

// ❯ EXPORTS

// ❯ @doc Navigation link presets mapped to LinkPreset enum keys.
export const LinkPresets: { [key in LinkPreset]: NavbarLink } = {
	[LinkPreset.Main]: {
		name: i18n(I18nKey.main),
		url: "/",
		icon: "material-symbols:terminal",
		description: i18n(I18nKey.mainSubtitle),
	},
	[LinkPreset.Vault]: {
		name: i18n(I18nKey.vault),
		url: "/vault/",
		icon: "material-symbols:hub",
		description: i18n(I18nKey.vaultSubtitle),
	},
	[LinkPreset.Arge]: {
		name: i18n(I18nKey.arge),
		url: "/arge/",
		icon: "material-symbols:work",
		description: i18n(I18nKey.argeSubtitle),
	},
	[LinkPreset.Toolchains]: {
		name: i18n(I18nKey.toolchains),
		url: "/toolchains/",
		icon: "material-symbols:psychology",
		description: "Dependencies",
	},
	[LinkPreset.PersonalLog]: {
		name: i18n(I18nKey.personalLog),
		url: "/Personal/",
		icon: "material-symbols:book",
		description: i18n(I18nKey.personalLogSubtitle),
	},
	[LinkPreset.Media]: {
		name: i18n(I18nKey.media),
		url: "/media/",
		icon: "material-symbols:photo-library",
		description: i18n(I18nKey.mediaSubtitle),
	},
	[LinkPreset.Identity]: {
		name: i18n(I18nKey.identity),
		url: "/identity/",
		icon: "material-symbols:fingerprint",
		description: i18n(I18nKey.identitySubtitle),
	},
	[LinkPreset.PracticalCodes]: {
		name: "Practical Codes",
		url: "/practical-codes/",
		icon: "material-symbols:code",
		description: "Quick access package commands and codes",
	},
	[LinkPreset.Netstat]: {
		name: i18n(I18nKey.statistics),
		url: "/netstat/",
		icon: "material-symbols:bar-chart",
		description: "Comprehensive statistics and analytics",
	},
	[LinkPreset.Ctf]: {
		name: "CTF!",
		url: "/ctf/",
		icon: "material-symbols:flag",
		description: "Capture-the-flag writeups and challenge notes",
	},
};
