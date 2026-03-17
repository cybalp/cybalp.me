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

<div class="login-page">
	<div class="login-page__bg" aria-hidden="true"></div>
	<div class="login-page__grid" aria-hidden="true"></div>
	<div class="login-page__card">
		<div class="login-page__icon">
			<Icon icon="material-symbols:shield-lock-outline" class="size-12" />
		</div>
		<h1 class="login-page__title">Admin Panel</h1>
		<p class="login-page__subtitle">
			Sign in with GitHub to manage your content.
		</p>
		{#if error}
			<div class="login-page__error" role="alert">
				<Icon icon="material-symbols:error-outline" class="size-4 shrink-0" />
				<span>{error}</span>
			</div>
		{/if}
		<button
			type="button"
			onclick={handleLogin}
			disabled={loading}
			class="login-page__btn"
		>
			<Icon icon="fa6-brands:github" class="size-5 shrink-0" />
			<span>{loading ? "Connecting…" : "Sign in with GitHub"}</span>
		</button>
		<p class="login-page__hint">
			A popup window will open for authentication.
		</p>
	</div>
</div>

<style>
	/* ❯ @gogogo admin panel */
	.login-page {
		position: relative;
		display: flex;
		min-height: 100vh;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #0a0a0b;
	}

	.login-page__bg {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
			radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139, 92, 246, 0.08), transparent),
			radial-gradient(ellipse 50% 30% at 0% 80%, rgba(59, 130, 246, 0.06), transparent);
		pointer-events: none;
	}

	.login-page__grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 48px 48px;
		pointer-events: none;
	}

	.login-page__card {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 400px;
		padding: 2.5rem;
		margin: 1rem;
		border-radius: 1.25rem;
		background: rgba(23, 23, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.03),
			0 25px 50px -12px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(12px);
	}

	.login-page__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1.5rem;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
		border: 1px solid rgba(99, 102, 241, 0.2);
		color: #818cf8;
	}

	.login-page__title {
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		text-align: center;
		color: #fafafa;
		letter-spacing: -0.02em;
	}

	.login-page__subtitle {
		margin-bottom: 1.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
		text-align: center;
		color: #a1a1aa;
	}

	.login-page__error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		border-radius: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		font-size: 0.875rem;
		color: #f87171;
	}

	.login-page__btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		border: none;
		border-radius: 0.75rem;
		background: #18181b;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #fafafa;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.login-page__btn:hover:not(:disabled) {
		background: #27272a;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
	}

	.login-page__btn:active:not(:disabled) {
		transform: scale(0.99);
	}

	.login-page__btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.login-page__hint {
		margin-top: 1rem;
		font-size: 0.75rem;
		text-align: center;
		color: #71717a;
	}
</style>
