<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/AnnouncementBanner.svelte
// ❯ @desc Homepage-only fixed announcement banner. Dismiss state is keyed to the
// ❯       message text — changing the message in cybalp.config.yaml automatically
// ❯       resets dismissed state for all visitors.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { fly } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { onMount, onDestroy } from 'svelte';

// ❯ TYPES
// ❯ @gogogo announcement — 4/4 component: add new prop to Props + use in template below
interface Props {
    message: string;
    href: string;
    ctaText?: string;
    icon?: string;
}

// ❯ PROPS
let {
    message,
    href,
    ctaText = '→',
    icon = '✨',
}: Props = $props();

// ❯ CONSTANTS
const BANNER_HEIGHT_PX = 44;

// ❯ STATE MANAGEMENT
let visible = $state(false);
// @docs Cached on mount — avoids repeated getElementById calls on every mutation.
let navbarEl: HTMLElement | null = null;

// ❯ HELPERS
// @docs Plain function (not $derived) so the key is always reliably computed
// as a plain string in any JavaScript context including onMount.
// Changing message in cybalp.config.yaml automatically invalidates old dismiss state.
// Prefix 'cybalp-banner:' prevents collision with other localStorage keys.
function getStorageKey(): string {
    return `cybalp-banner:${message}`;
}

// @docs Returns true only when on the main page AND this specific message has
// not been dismissed yet.
function shouldBeVisible(): boolean {
    return (
        localStorage.getItem(getStorageKey()) !== 'true' &&
        document.body.classList.contains('is-main')
    );
}

// @docs Single setter that keeps visible state and navbar offset in sync.
// Centralising the two operations here enforces they always change together.
function setVisible(next: boolean) {
    visible = next;
    if (navbarEl) {
        navbarEl.style.top = next ? `${BANNER_HEIGHT_PX}px` : '';
    }
}

// ❯ HANDLERS
function dismiss() {
    localStorage.setItem(getStorageKey(), 'true');
    setVisible(false);
}

// ❯ LIFECYCLE
let cleanupObserver: (() => void) | undefined;

onMount(() => {
    navbarEl = document.getElementById('navbar-wrapper');
    setVisible(shouldBeVisible());

    // @docs Watches body class mutations to react to Swup SPA page navigation.
    // base.astro adds/removes 'is-main' on every visit:start hook.
    const observer = new MutationObserver(() => {
        setVisible(shouldBeVisible());
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    cleanupObserver = () => {
        observer.disconnect();
        if (navbarEl) navbarEl.style.top = '';
    };
});

onDestroy(() => {
    cleanupObserver?.();
});
</script>

{#if visible}
<div
    id="announcement-banner"
    role="region"
    aria-label="Site Announcement"
    transition:fly={{ y: -BANNER_HEIGHT_PX, duration: 280, easing: cubicOut }}
>
    <a {href} class="banner-link" aria-label={message}>
        <span class="banner-icon" aria-hidden="true">{icon}</span>
        <span class="banner-message">{message}</span>
        <span class="banner-cta">{ctaText}</span>
    </a>

    <button
        onclick={dismiss}
        class="dismiss-btn"
        type="button"
        aria-label="Close Announcement"
    >
        <!-- ❯ @gogogo announcement — 4/4 template: swap dismiss icon (e.g., Iconify) here -->
        <span aria-hidden="true">✕</span>
    </button>
</div>
{/if}

<style>
/* ❯ LAYOUT */
#announcement-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3rem;
    gap: 0.625rem;

    /* ❯ Light mode: vivid primary tint */
    background-color: oklch(0.68 0.16 var(--hue));
    color: #fff;
    font-size: 0.875rem;
    font-weight: 500;
}

/* ❯ Dark mode: deeper, muted surface matching the site's dark palette */
:global(.dark) #announcement-banner {
    background-color: oklch(0.26 0.055 var(--hue));
    color: oklch(0.94 0.04 var(--hue));
    border-bottom: 1px solid oklch(0.38 0.09 var(--hue));
}

/* ❯ LINK */
.banner-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
    text-decoration: none;
}

.banner-link:hover .banner-cta {
    opacity: 1;
}

/* ❯ CONTENT */
.banner-icon {
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
}

.banner-message {
    font-weight: 600;
    letter-spacing: 0.01em;
}

.banner-cta {
    opacity: 0.75;
    font-size: 0.8125rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.45);
    transition: opacity 150ms ease;
}

:global(.dark) .banner-cta {
    border-color: oklch(0.55 0.09 var(--hue));
}

/* ❯ DISMISS BUTTON */
.dismiss-btn {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.65;
    font-size: 0.875rem;
    padding: 0.3rem 0.45rem;
    line-height: 1;
    border-radius: 0.3rem;
    transition: opacity 150ms ease, background-color 150ms ease;
}

.dismiss-btn:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.18);
}

:global(.dark) .dismiss-btn:hover {
    background-color: oklch(0.38 0.06 var(--hue) / 0.5);
}

/* ❯ MOBILE: hide the CTA label on small screens to avoid overflow */
@media (max-width: 512px) {
    .banner-cta {
        display: none;
    }
}
</style>
