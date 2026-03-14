// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/constants/icon.ts
// ❯ @desc Default favicon configuration constants.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import type { Favicon } from "@/types/config.ts";

// ❯ EXPORTS

// ❯ @doc Default favicon configurations for light and dark themes.
export const defaultFavicons: Favicon[] = [
	{
		src: "/favicon/favicon.ico",
		theme: "light", // "light" | "dark"
		sizes: "96x96",
	},
	{
		src: "/favicon/favicon.ico",
		theme: "dark", // "light" | "dark"
		sizes: "96x96",
	},
];
