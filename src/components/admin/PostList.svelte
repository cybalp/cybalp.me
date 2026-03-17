<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/PostList.svelte
// ❯ @desc Admin post list — table, edit/delete actions
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@iconify/svelte";

// ❯ PROPS
interface Props {
	api: (path: string, opts?: RequestInit) => Promise<Response>;
	onEdit: (path: string) => void;
	onCreate: () => void;
}

let { api, onEdit, onCreate }: Props = $props();

// ❯ STATE
let posts = $state<{ path: string; id: string; name: string; sha: string }[]>([]);
let loading = $state(true);
let deleting = $state<string | null>(null);

// ❯ FETCH
async function load() {
	loading = true;
	try {
		const r = await api("posts");
		const d = await r.json();
		posts = d.posts ?? [];
	} finally {
		loading = false;
	}
}

$effect(() => {
	load();
});

// ❯ DELETE
async function handleDelete(path: string, sha: string) {
	if (!confirm(`Delete "${path}"?`)) return;
	deleting = path;
	try {
		const r = await api("posts", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path, sha, message: "chore: remove post via admin" }),
		});
		if (r.ok) load();
		else alert("Delete failed");
	} finally {
		deleting = null;
	}
}

// ❯ PATH DISPLAY (short)
function shortPath(p: string) {
	return p.replace(/^src\/content\/posts\//, "");
}
</script>

<div class="flex flex-col gap-4">
	<div class="flex justify-between">
		<p class="text-sm text-neutral-400">{posts.length} posts</p>
		<button
			type="button"
			onclick={onCreate}
			class="flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-2 text-sm hover:bg-neutral-600"
		>
			<Icon icon="material-symbols:add" class="size-4" />
			New Post
		</button>
	</div>

	{#if loading}
		<p class="py-8 text-center text-neutral-500">Loading…</p>
	{:else if posts.length === 0}
		<p class="py-8 text-center text-neutral-500">No posts yet.</p>
	{:else}
		<div class="overflow-hidden rounded-lg border border-neutral-800">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-neutral-800 bg-neutral-900/50">
					<tr>
						<th class="px-4 py-3 font-medium">Path</th>
						<th class="px-4 py-3 font-medium">File</th>
						<th class="px-4 py-3 font-medium w-24">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each posts as post}
						<tr class="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-900/30">
							<td class="px-4 py-3 font-mono text-xs text-neutral-400">
								{shortPath(post.path)}
							</td>
							<td class="px-4 py-3">{post.name}</td>
							<td class="px-4 py-3">
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => onEdit(post.path)}
										class="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100"
										title="Edit"
									>
										<Icon icon="material-symbols:edit" class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => handleDelete(post.path, post.sha)}
										disabled={deleting === post.path}
										class="rounded p-1 text-neutral-400 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
										title="Delete"
									>
										<Icon icon="material-symbols:delete" class="size-4" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
