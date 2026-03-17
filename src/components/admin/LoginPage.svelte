<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/admin/LoginPage.svelte
// ❯ @desc Admin login — GitHub OAuth popup flow
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import Icon from "@iconify/svelte";

// ❯ PROPS
interface Props {
	onLogin: (token: string) => void;
}

let { onLogin }: Props = $props();

let loading = $state(false);
let error = $state<string | null>(null);

// ❯ @docs Opens OAuth popup, listens for postMessage with token
function handleLogin() {
	error = null;
	loading = true;
	const width = 500;
	const height = 600;
	const left = (window.screen.width - width) / 2;
	const top = (window.screen.height - height) / 2;
	const popup = window.open(
		"/oauth/",
		"oauth",
		`width=${width},height=${height},left=${left},top=${top}`,
	);

	const handler = (e: MessageEvent) => {
		const msg = e.data;
		if (typeof msg !== "string") return;
		if (msg.startsWith("authorization:github:success:")) {
			try {
				const json = msg.replace("authorization:github:success:", "");
				const { token } = JSON.parse(json) as { token?: string };
				if (token) {
					onLogin(token);
					window.removeEventListener("message", handler);
					popup?.close();
				}
			} catch {
				error = "Invalid response from OAuth";
			}
			loading = false;
		} else if (msg.startsWith("authorization:github:error")) {
			error = "OAuth failed";
			loading = false;
			window.removeEventListener("message", handler);
		}
	};
	window.addEventListener("message", handler);
	// Timeout fallback
	setTimeout(() => {
		if (loading) {
			loading = false;
			window.removeEventListener("message", handler);
			popup?.close();
			error = "Login timed out. Please allow popups.";
		}
	}, 120000);
}
</script>

<div class="flex min-h-screen items-center justify-center bg-neutral-950">
	<div class="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-xl">
		<h1 class="mb-2 text-xl font-semibold text-neutral-100">Admin Panel</h1>
		<p class="mb-6 text-sm text-neutral-400">
			Sign in with GitHub to manage content.
		</p>
		{#if error}
			<p class="mb-4 text-sm text-red-400">{error}</p>
		{/if}
		<button
			type="button"
			onclick={handleLogin}
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-3 text-neutral-100 transition-colors hover:bg-neutral-700 disabled:opacity-50"
		>
			<Icon icon="fa6-brands:github" class="size-5" />
			{loading ? "Connecting…" : "Sign in with GitHub"}
		</button>
	</div>
</div>
