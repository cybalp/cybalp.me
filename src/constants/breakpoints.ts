// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/constants/breakpoints.ts
// ❯ @desc Responsive breakpoint constants.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ UTILITIES
// ❯ @doc Reads breakpoint value from CSS variables with fallback.
// ❯ @hint read from src/styles/main.css @theme
const getBreakpoint = (name: string, fallback: number): number => {
	if (typeof window === "undefined") return fallback;

	// ❯ Tailwind v4 exports @theme variables as standard CSS variables
	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(`--breakpoint-${name}`)
		.trim();

	// ❯ Remove 'px' unit and convert to number
	const parsed = Number.parseInt(value, 10);
	return isNaN(parsed) ? fallback : parsed;
};

// ❯ EXPORTS
export const BREAKPOINT_SM = getBreakpoint("sm", 512); // Tailwind sm
export const BREAKPOINT_MD = getBreakpoint("md", 768); // Tailwind md
export const BREAKPOINT_LG = getBreakpoint("lg", 1280); // Tailwind lg
export const BREAKPOINT_XL = getBreakpoint("xl", 1920); // Tailwind xl
