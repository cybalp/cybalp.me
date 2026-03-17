<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/AdminApp.svelte
// ❯ @desc Admin panel root — auth state, routing, view orchestration
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import AdminLayout from "./AdminLayout.svelte";
import LoginPage from "./LoginPage.svelte";
import Dashboard from "./Dashboard.svelte";
import PostList from "./PostList.svelte";
import PostEditor from "./PostEditor.svelte";

// ❯ STATE
type View = "dashboard" | "posts" | "post-edit" | "post-create" | "config" | "media";
let token = $state<string | null>(null);
let user = $state<{ login?: string; avatar_url?: string } | null>(null);
let view = $state<View>("dashboard");
let editPath = $state<string | null>(null);

// ❯ SYNC HASH (optional — for direct links)
function syncFromHash() {
	const hash = window.location.hash.slice(1) || "dashboard";
	if (hash === "posts") view = "posts";
	else if (hash === "config") view = "config";
	else if (hash === "media") view = "media";
	else view = "dashboard";
}
if (typeof window !== "undefined") {
	window.addEventListener("hashchange", syncFromHash);
	syncFromHash();
}

// ❯ AUTH
async function fetchUser(t: string) {
	const res = await fetch("https://api.github.com/user", {
		headers: { Authorization: `Bearer ${t}` },
	});
	if (res.ok) user = await res.json();
	else user = null;
}

function handleLogin(t: string) {
	token = t;
	localStorage.setItem("admin_token", t);
	fetchUser(t);
	view = "dashboard";
}

// ❯ @docs Explicit logout flag prevents $effect from rehydrating token after logout
const LOGOUT_FLAG = "admin_logout";

function handleLogout() {
	sessionStorage.setItem(LOGOUT_FLAG, "1");
	token = null;
	user = null;
	localStorage.removeItem("admin_token");
}

// ❯ RESTORE TOKEN
// ❯ @docs Restores token from localStorage on mount; skips when user explicitly logged out
$effect(() => {
	if (typeof window === "undefined") return;
	if (sessionStorage.getItem(LOGOUT_FLAG)) {
		sessionStorage.removeItem(LOGOUT_FLAG);
		return;
	}
	const stored = localStorage.getItem("admin_token");
	if (stored && !token) {
		token = stored;
		fetchUser(stored);
	}
});

// ❯ API HELPER
function api(path: string, opts: RequestInit = {}) {
	const h = opts.headers as Record<string, string> ?? {};
	h.Authorization = `Bearer ${token}`;
	return fetch(`/api/admin/${path}`, { ...opts, headers: h });
}

// ❯ NAV
function setView(v: View, path?: string) {
	view = v;
	editPath = path ?? null;
	const h = v === "posts" ? "posts" : v === "config" ? "config" : v === "media" ? "media" : "dashboard";
	window.location.hash = h;
}
</script>

{#if !token}
	<LoginPage onLogin={handleLogin} />
{:else}
	<AdminLayout
		currentView={view === "post-edit" || view === "post-create" ? "posts" : view}
		onNav={(id) => setView(id as View)}
		title={
			view === "post-edit" || view === "post-create"
				? (view === "post-create" ? "New Post" : "Edit Post")
				: view === "posts"
					? "Posts"
					: view === "config"
						? "Config"
						: view === "media"
							? "Media"
							: "Dashboard"
		}
		{user}
		onLogout={handleLogout}
	>
		{#if view === "dashboard"}
			<Dashboard {api} onNavigate={setView} />
		{:else if view === "posts"}
			<PostList
				{api}
				onEdit={(path) => setView("post-edit", path)}
				onCreate={() => setView("post-create")}
			/>
		{:else if view === "post-edit" && editPath}
			<PostEditor
				{api}
				path={editPath}
				mode="edit"
				onDone={() => setView("posts")}
			/>
		{:else if view === "post-create"}
			<PostEditor {api} path="" mode="create" onDone={() => setView("posts")} />
		{:else if view === "config"}
			<p class="text-neutral-400">Config editor — coming soon</p>
		{:else if view === "media"}
			<p class="text-neutral-400">Media manager — coming soon</p>
		{:else}
			<Dashboard {api} onNavigate={setView} />
		{/if}
	</AdminLayout>
{/if}
