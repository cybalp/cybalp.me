// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./svelte.config.js
// ❯ @desc Svelte preprocessor configuration
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import { vitePreprocess } from "@astrojs/svelte";

// ❯ CONFIGURATION
// ❯ @doc Configures Svelte preprocessor with TypeScript support
export default {
	preprocess: [vitePreprocess({ script: true })],
};
