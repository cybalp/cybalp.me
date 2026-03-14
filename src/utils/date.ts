// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/date.ts
// ❯ @desc Date formatting utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { langToLocaleMap } from "@i18n/language";
import { getDefaultLanguage } from "./language";

// ❯ DATE FORMATTING
// ❯ @doc Formats date to YYYY-MM-DD string.
export function formatDateToYYYYMMDD(date: Date): string {
	return date.toISOString().substring(0, 10);
}

// ❯ @doc Formats date string with i18n locale.
export function formatDateI18n(dateString: string): string {
	const date = new Date(dateString);
	const lang = getDefaultLanguage();
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	const locale = langToLocaleMap[lang] || "en-US";
	return date.toLocaleDateString(locale, options);
}

// ❯ @doc Calculates relative time string (e.g., "2 days ago", "1 week ago").
export function getRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) return `${years} ${years === 1 ? "year" : "years"} ago`;
	if (months > 0) return `${months} ${months === 1 ? "month" : "months"} ago`;
	if (weeks > 0) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
	if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
	if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	if (minutes > 0)
		return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
	return "just now";
}
