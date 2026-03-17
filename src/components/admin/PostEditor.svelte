<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/PostEditor.svelte
// ❯ @desc Admin post editor — frontmatter form + markdown body
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@iconify/svelte";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import type { PostData } from "@lib/admin/types";

// ❯ PROPS
interface Props {
	api: (path: string, opts?: RequestInit) => Promise<Response>;
	path: string;
	mode: "create" | "edit";
	onDone: () => void;
}

let { api, path, mode, onDone }: Props = $props();

// ❯ STATE
let data = $state<PostData>({
	title: "",
	published: new Date().toISOString().slice(0, 10),
	updated: undefined,
	description: "",
	cover: "",
	coverInContent: false,
	category: "",
	tags: [],
	lang: "",
	pinned: false,
	author: "",
	sourceLink: "",
	licenseName: "",
	licenseUrl: "",
	comment: true,
	draft: false,
	encrypted: false,
	password: "",
	body: "",
});
let sha = $state<string | null>(null);
let loading = $state(true);
let saving = $state(false);
let error = $state<string | null>(null);
let newPath = $state("");
let showPreview = $state(true);

// ❯ CATEGORIES (from vault.ts)
const CATEGORIES = ["APP!", "HOW!", "WHO!"];

// ❯ LOAD (edit mode)
async function load() {
	if (mode !== "edit" || !path) {
		loading = false;
		newPath = "APP!/new-post.md";
		return;
	}
	loading = true;
	try {
		const fullPath = path.startsWith("src/") ? path : `src/content/posts/${path}`;
		const r = await api(`posts?path=${encodeURIComponent(fullPath)}`);
		if (!r.ok) throw new Error("Failed to load");
		const d = await r.json();
		data = d.post;
		sha = d.sha;
		newPath = path.replace(/^src\/content\/posts\//, "");
	} catch {
		error = "Could not load post";
	} finally {
		loading = false;
	}
}

$effect(() => {
	if (path !== undefined) load();
});

// ❯ SAVE
async function save() {
	error = null;
	saving = true;
	const fullPath = newPath.startsWith("src/") ? newPath : `src/content/posts/${newPath}`;
	if (!/\.(md|mdx|markdown)$/i.test(fullPath)) {
		error = "Path must end with .md or .mdx";
		saving = false;
		return;
	}
	try {
		const payload = { path: fullPath, data, message: mode === "create" ? "feat: add post via admin" : "fix: update post via admin" };
		if (mode === "edit" && sha) {
			const r = await api("posts", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...payload, sha }),
			});
			if (!r.ok) throw new Error((await r.json()).message ?? "Update failed");
		} else {
			const r = await api("posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!r.ok) throw new Error((await r.json()).message ?? "Create failed");
		}
		onDone();
	} catch (e) {
		error = e instanceof Error ? e.message : "Save failed";
	} finally {
		saving = false;
	}
}

// ❯ PREVIEW
const md = new MarkdownIt();
const previewHtml = $derived(
	DOMPurify.sanitize(md.render(data.body || "*No content*")),
);
</script>

{#if loading}
	<p class="py-8 text-center text-neutral-500">Loading…</p>
{:else}
	<div class="flex flex-col gap-6">
		{#if error}
			<div class="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-2 text-sm text-red-400">
				{error}
			</div>
		{/if}

		<!-- ❯ PATH (create) or title -->
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1 block text-sm text-neutral-400">Path (e.g. APP!/slug.md)</label>
				<input
					type="text"
					bind:value={newPath}
					disabled={mode === "edit"}
					class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm disabled:opacity-60"
					placeholder="APP!/my-post.md"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-neutral-400">Title</label>
				<input
					type="text"
					bind:value={data.title}
					class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
					placeholder="Post title"
				/>
			</div>
		</div>

		<!-- ❯ META -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<label class="mb-1 block text-sm text-neutral-400">Published</label>
				<input
					type="date"
					bind:value={data.published}
					class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-neutral-400">Category</label>
				<select
					value={Array.isArray(data.category) ? data.category[0] ?? "" : (data.category ?? "")}
					onchange={(e) => {
						const v = (e.target as HTMLSelectElement).value;
						data.category = v || "";
					}}
					class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
				>
					<option value="">—</option>
					{#each CATEGORIES as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="mb-1 block text-sm text-neutral-400">Tags (comma)</label>
				<input
					type="text"
					value={Array.isArray(data.tags) ? data.tags.join(", ") : data.tags}
					oninput={(e) => {
						const v = (e.target as HTMLInputElement).value;
						data.tags = v.split(",").map((t) => t.trim()).filter(Boolean);
					}}
					class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
					placeholder="tag1, tag2"
				/>
			</div>
			<div class="flex items-end gap-4">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={data.draft} class="rounded" />
					<span class="text-sm">Draft</span>
				</label>
			</div>
		</div>

		<div>
			<label class="mb-1 block text-sm text-neutral-400">Description</label>
			<input
				type="text"
				bind:value={data.description}
				class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
				placeholder="Short description"
			/>
		</div>

		<!-- ❯ BODY -->
		<div>
			<div class="mb-2 flex items-center justify-between">
				<label class="text-sm text-neutral-400">Body (Markdown)</label>
				<button
					type="button"
					onclick={() => (showPreview = !showPreview)}
					class="text-sm text-neutral-500 hover:text-neutral-300"
				>
					{showPreview ? "Hide preview" : "Show preview"}
				</button>
			</div>
			<div class="grid gap-4 {showPreview ? 'lg:grid-cols-2' : ''}">
				<textarea
					bind:value={data.body}
					class="min-h-[400px] w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 font-mono text-sm"
					placeholder="# Your content here..."
					spellcheck="false"
				/>
				{#if showPreview}
					<div
						class="prose prose-invert min-h-[400px] rounded-lg border border-neutral-700 bg-neutral-900 p-4 dark:prose-invert"
						style="overflow-wrap: break-word;"
					>
						{@html previewHtml}
					</div>
				{/if}
			</div>
		</div>

		<!-- ❯ ACTIONS -->
		<div class="flex gap-3">
			<button
				type="button"
				onclick={save}
				disabled={saving}
				class="flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 hover:bg-neutral-600 disabled:opacity-50"
			>
				<Icon icon="material-symbols:save" class="size-4" />
				{saving ? "Saving…" : "Save"}
			</button>
			<button
				type="button"
				onclick={onDone}
				class="rounded-lg border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}
