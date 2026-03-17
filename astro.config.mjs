// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./astro.config.mjs
// ❯ @desc Astro framework configuration — adapters, integrations, markdown pipeline, and Vite overrides
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS (external)
import { defineConfig, envField } from "astro/config";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import swup from "@swup/astro";
import sitemap from "@astrojs/sitemap";
import cloudflarePages from "@astrojs/cloudflare";
import edgeone from "@edgeone/astro";
import vercel from "@astrojs/vercel";
import decapCmsOauth from "astro-decap-cms-oauth";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";

// ❯ IMPORTS (internal)
import { siteConfig } from "./src/config.ts";
import { pluginCollapseButton } from "./src/plugins/expressive-code/collapse-button.ts";
import { pluginCopyButton } from "./src/plugins/expressive-code/copy-button.js";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { MusicCardComponent } from "./src/plugins/rehype-component-music-card.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

// ❯ ADAPTER
// ❯ @docs Adapter is resolved at build time via env flags:
//         GITHUB_ACTIONS → static (no SSR), CF_PAGES → Cloudflare, EDGEONE → EdgeOne, default → Vercel serverless
// ❯ @gogogo new adapter
const adapter = process.env.GITHUB_ACTIONS
    ? undefined
    : (process.env.CF_PAGES
        ? cloudflarePages()
        : (process.env.EDGEONE
            ? edgeone()
            : vercel({ mode: "serverless" })));

// ❯ CONFIGURATION
// ❯ @hint Ref: https://astro.build/config
export default defineConfig({
    site: siteConfig.siteURL,
    base: "/",
    trailingSlash: "always",
    adapter: adapter,
    // ❯ @hint Decap CMS env (required when adminDisabled: true — local admin page)
    env: {
        schema: {
            PUBLIC_DECAP_CMS_VERSION: envField.string({
                context: "client",
                access: "public",
                optional: true,
                default: "3.9.0",
            }),
            PUBLIC_DECAP_CMS_SRC_URL: envField.string({
                context: "client",
                access: "public",
                optional: true,
                default: "",
            }),
            ADMIN_GITHUB_REPO_OWNER: envField.string({
                context: "server",
                access: "secret",
                optional: true,
                default: "cybalp",
            }),
            ADMIN_GITHUB_REPO_NAME: envField.string({
                context: "server",
                access: "secret",
                optional: true,
                default: "cybalp.me",
            }),
            ADMIN_GITHUB_BRANCH: envField.string({
                context: "server",
                access: "secret",
                optional: true,
                default: "main",
            }),
        },
    },
    // ❯ INTEGRATIONS
    // ❯ @gogogo new integration
    integrations: [
        decapCmsOauth({
            decapCMSVersion: "3.9.0",
            oauthDisabled: false, // Enable OAuth, requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars
            adminDisabled: true, // @hint use local admin page — package injectRoute resolves path incorrectly (ENOENT)
        }),
        swup({
            theme: false,
            animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
            containers: [
                "#swup-container",
                "#left-sidebar",
                "#right-sidebar",
                "#middle-sidebar",
            ],
            cache: true,
            preload: true,
            accessibility: true,
            updateHead: true,
            updateBodyClass: false,
            globalInstance: true,
            // Scroll related configuration optimization
            smoothScrolling: false, // Disable smooth scrolling to improve performance and avoid conflicts with anchor navigation
            resolveUrl: (url) => url,
            animateHistoryBrowsing: false,
            skipPopStateHandling: (event) => {
                // Skip anchor link handling, let the browser handle it natively
                return event.state && event.state.url && event.state.url.includes("#");
            },
        }),
        icon({
            include: {
                "fa6-brands": ["*"],
                "fa6-regular": ["*"],
                "fa6-solid": ["*"],
                mdi: ["*"],
            },
        }),
        expressiveCode({
            themes: ["github-light", "github-dark"],
            themeCSSSelector: (theme) => `[data-theme="${theme}"]`,
            plugins: [
                pluginCollapsibleSections(),
                pluginLineNumbers(),
                pluginCollapseButton(),
                pluginCopyButton(),
                pluginLanguageBadge(),
            ],
            defaultProps: {
                wrap: true,
                overridesByLang: {
                    shellsession: {
                        showLineNumbers: false,
                    },
                },
            },
            styleOverrides: {
                codeBackground: "var(--codeblock-bg)",
                borderRadius: "0.75rem",
                borderColor: "none",
                codeFontSize: "0.875rem",
                codeFontFamily:
                    "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                codeLineHeight: "1.5rem",
                frames: {
                    editorBackground: "var(--codeblock-bg)",
                    terminalBackground: "var(--codeblock-bg)",
                    terminalTitlebarBackground: "var(--codeblock-bg)",
                    editorTabBarBackground: "var(--codeblock-bg)",
                    editorActiveTabBackground: "none",
                    editorActiveTabIndicatorBottomColor: "var(--primary)",
                    editorActiveTabIndicatorTopColor: "none",
                    editorTabBarBorderBottomColor: "var(--codeblock-bg)",
                    terminalTitlebarBorderBottomColor: "none",
                    copyButtonBackground: "var(--btn-regular-bg)",
                    copyButtonBackgroundHover: "var(--btn-regular-bg-hover)",
                    copyButtonBackgroundActive: "var(--btn-regular-bg-active)",
                    copyButtonForeground: "var(--btn-content)",
                },
                textMarkers: {
                    delHue: 0,
                    insHue: 180,
                    markHue: 250,
                },
            },
            frames: {
                showCopyToClipboardButton: false,
            },
        }),
        svelte({
            preprocess: vitePreprocess(),
        }),
        sitemap(),
    ],
    // ❯ MARKDOWN
    // ❯ @docs remark plugins run first (AST transform), rehype plugins run after (HTML transform)
    // ❯ @gogogo new markdown plugin
    markdown: {
        remarkPlugins: [
            remarkMath,
            remarkReadingTime,
            remarkExcerpt,
            remarkGithubAdmonitionsToDirectives,
            remarkDirective,
            remarkSectionize,
            parseDirectiveNode,
            remarkMermaid,
        ],
        rehypePlugins: [
            rehypeKatex,
            rehypeSlug,
            rehypeMermaid,
            [
                rehypeComponents,
                {
                    components: {
                        github: GithubCardComponent,
                        music: MusicCardComponent,
                        note: (x, y) => AdmonitionComponent(x, y, "note"),
                        tip: (x, y) => AdmonitionComponent(x, y, "tip"),
                        important: (x, y) => AdmonitionComponent(x, y, "important"),
                        caution: (x, y) => AdmonitionComponent(x, y, "caution"),
                        warning: (x, y) => AdmonitionComponent(x, y, "warning"),
                    },
                },
            ],
            [
                rehypeAutolinkHeadings,
                {
                    behavior: "append",
                    properties: {
                        className: ["anchor"],
                    },
                    content: {
                        type: "element",
                        tagName: "span",
                        properties: {
                            className: ["anchor-icon"],
                            "data-pagefind-ignore": true,
                        },
                        children: [
                            {
                                type: "text",
                                value: "#",
                            },
                        ],
                    },
                },
            ],
        ],
    },
    // ❯ VITE
    vite: {
        plugins: [tailwindcss()],
        build: {
            rollupOptions: {
                onwarn(warning, warn) {
                    // temporarily suppress this warning
                    if (
                        warning.message.includes("is dynamically imported by") &&
                        warning.message.includes("but also statically imported by")
                    ) {
                        return;
                    }
                    warn(warning);
                },
            },
        },
    },
    // ❯ BUILD
    build: {
        inlineStylesheets: "always",
    },
});