<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/common/DropdownItem.svelte
// ❯ @desc Dropdown panel item component.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { Snippet } from "svelte";

// ❯ PROPS
interface Props {
	isActive?: boolean;
	isLast?: boolean;
	class?: string;
	onclick?: (event: MouseEvent) => void;
	children?: Snippet;
}

// ❯ PROPS EXTRACTION
let {
	isActive = false,
	isLast = false,
	class: className = "",
	onclick,
	children,
	...restProps
}: Props = $props();

// ❯ COMPUTED
const baseClasses =
	"flex transition whitespace-nowrap items-center justify-start! w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95";

// ❯ @doc Computes responsive class names based on state.
const allClasses = $derived.by(() => {
	const spacingClass = isLast ? "" : "mb-0.5";
	const activeClass = isActive ? "current-theme-btn" : "";
	return `${baseClasses} ${spacingClass} ${activeClass} ${className}`.trim();
});
</script>

<!-- ❯ RENDER -->
<button 
	class={allClasses}
	{onclick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>