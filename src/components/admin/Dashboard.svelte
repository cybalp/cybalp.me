<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/Dashboard.svelte
// ❯ @desc Admin dashboard — stats, quick actions
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@iconify/svelte";

// ❯ PROPS
interface Props {
	api: (path: string, opts?: RequestInit) => Promise<Response>;
	onNavigate: (view: string, path?: string) => void;
}

let { api, onNavigate }: Props = $props();

// ❯ STATE
let stats = $state<{ total: number; drafts: number } | null>(null);
let loading = $state(true);

// ❯ FETCH
$effect(() => {
	api("posts")
		.then((r) => r.json())
		.then((d: { posts?: { path: string }[] }) => {
			const posts = d.posts ?? [];
			stats = { total: posts.length, drafts: 0 };
		})
		.catch(() => { stats = { total: 0, drafts: 0 }; })
		.finally(() => { loading = false; });
});
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-neutral-800 p-2">
				<Icon icon="material-symbols:article" class="size-6 text-neutral-400" />
			</div>
			<div>
				<p class="text-sm text-neutral-400">Total Posts</p>
				<p class="text-2xl font-semibold">{loading ? "…" : stats?.total ?? 0}</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-neutral-800 p-2">
				<Icon icon="material-symbols:edit-note" class="size-6 text-neutral-400" />
			</div>
			<div>
				<p class="text-sm text-neutral-400">Drafts</p>
				<p class="text-2xl font-semibold">{loading ? "…" : stats?.drafts ?? 0}</p>
			</div>
		</div>
	</div>
</div>

<div class="mt-8">
	<h2 class="mb-4 text-sm font-medium text-neutral-400">Quick Actions</h2>
	<div class="flex flex-wrap gap-3">
		<button
			type="button"
			onclick={() => onNavigate("post-create")}
			class="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm transition-colors hover:bg-neutral-700"
		>
			<Icon icon="material-symbols:add" class="size-4" />
			New Post
		</button>
		<button
			type="button"
			onclick={() => onNavigate("posts")}
			class="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm transition-colors hover:bg-neutral-700"
		>
			<Icon icon="material-symbols:list" class="size-4" />
			Manage Posts
		</button>
	</div>
</div>
