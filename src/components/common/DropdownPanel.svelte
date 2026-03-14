<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/common/DropdownPanel.svelte
// ❯ @desc Dropdown panel container component.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { Snippet } from "svelte";

// ❯ PROPS
interface Props {
	id?: string;
	class?: string;
	children?: Snippet;
	element?: HTMLElement;
}

// ❯ PROPS EXTRACTION
let {
	id,
	class: className = "",
	children,
	element = $bindable(),
	...restProps
}: Props = $props();
</script>

<!-- ❯ RENDER -->
<div {id} bind:this={element} class={`card-base float-panel p-2 ${className}`.trim()} {...restProps}>
    {#if children}
        {@render children()}
    {/if}
</div>