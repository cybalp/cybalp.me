<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/common/icon.svelte
// ❯ @desc Icon component with build-time SVG inline.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { getIconSvg, hasIcon } from "@utils/icons";

// ❯ PROPS
interface Props {
	icon: string;
	class?: string;
	style?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
	color?: string;
}

// ❯ PROPS EXTRACTION
let {
	icon,
	class: className = "",
	style = "",
	size = "md",
	color,
}: Props = $props();

// ❯ CONFIGURATION
// ❯ @doc Size mapping for icon classes.
const sizeClasses: Record<string, string> = {
	xs: "text-xs",
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
};

// ❯ COMPUTED
const sizeClass = $derived(sizeClasses[size] || sizeClasses.md);
const colorStyle = $derived(color ? `color: ${color};` : "");
const combinedStyle = $derived(`${colorStyle}${style}`);
const combinedClass = $derived(`${sizeClass} ${className}`.trim());

// ❯ @doc Gets inline SVG content and checks existence.
const svgContent = $derived(getIconSvg(icon));
const iconExists = $derived(hasIcon(icon));
</script>

<!-- ❯ RENDER -->
{#if iconExists && svgContent}
    <span
        class="inline-icon inline-flex items-center justify-center {combinedClass}"
        style={combinedStyle}
        aria-hidden="true"
    >
        {@html svgContent}
    </span>
{:else}
    <span
        class="inline-icon inline-flex items-center justify-center {combinedClass}"
        style={combinedStyle}
        aria-hidden="true"
        title="Icon not found: {icon}"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
        </svg>
    </span>
{/if}

<style>
    .inline-icon :global(svg) {
        width: 1em;
        height: 1em;
        display: inline-block;
        vertical-align: middle;
        fill: currentColor;
    }
</style>