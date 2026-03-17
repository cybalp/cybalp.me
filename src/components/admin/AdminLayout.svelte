<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/AdminLayout.svelte
// ❯ @desc Admin panel layout — sidebar, header, content slot
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@iconify/svelte";

// ❯ PROPS
interface Props {
	title: string;
	user?: { login?: string; avatar_url?: string } | null;
	onLogout?: () => void;
	currentView?: string;
	onNav?: (id: string) => void;
}

let { title, user, onLogout, currentView = "dashboard", onNav }: Props = $props();

// ❯ NAV ITEMS
const navItems = [
	{ id: "dashboard", label: "Dashboard", icon: "material-symbols:dashboard" },
	{ id: "posts", label: "Posts", icon: "material-symbols:article" },
	{ id: "config", label: "Config", icon: "material-symbols:settings" },
	{ id: "media", label: "Media", icon: "material-symbols:photo-library" },
];
</script>

<div class="admin-layout flex min-h-screen bg-neutral-950 text-neutral-100">
	<!-- ❯ SIDEBAR -->
	<aside class="admin-sidebar flex w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/50">
		<div class="flex h-14 items-center gap-2 border-b border-neutral-800 px-4">
			<span class="font-semibold">CybAlp Admin</span>
		</div>
		<nav class="p-2">
			{#each navItems as item}
				<button
					type="button"
					onclick={() => onNav?.(item.id)}
					class="admin-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors {currentView === item.id ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}"
				>
					<Icon icon={item.icon} class="size-5 shrink-0" />
					{item.label}
				</button>
			{/each}
		</nav>
		<div class="mt-auto border-t border-neutral-800 p-2">
			{#if user}
				<div class="flex items-center gap-2 px-2 py-1">
					{#if user.avatar_url}
						<img
							src={user.avatar_url}
							alt=""
							class="size-8 rounded-full"
							width="32"
							height="32"
						/>
					{/if}
					<span class="truncate text-sm text-neutral-400">{user.login ?? "User"}</span>
				</div>
				{#if onLogout}
					<button
						type="button"
						onclick={onLogout}
						class="mt-1 w-full rounded px-2 py-1 text-left text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
					>
						Logout
					</button>
				{/if}
			{/if}
		</div>
	</aside>

	<!-- ❯ MAIN -->
	<main class="admin-main flex-1 overflow-auto">
		<header class="admin-header sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950/90 px-6 backdrop-blur">
			<h1 class="text-lg font-semibold">{title}</h1>
			{#if onLogout}
				<button
					type="button"
					onclick={onLogout}
					class="admin-logout-btn flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
				>
					<Icon icon="material-symbols:logout" class="size-4" />
					Logout
				</button>
			{/if}
		</header>
		<div class="p-6">
			<slot />
		</div>
	</main>
</div>
