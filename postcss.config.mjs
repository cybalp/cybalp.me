// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./postcss.config.mjs
// ❯ @desc PostCSS plugin configuration — enables @import resolution across CSS files
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import postcssImport from 'postcss-import';

// ❯ CONFIGURATION
// ❯ @docs postcss-import resolves @import statements at build time, allowing CSS to be split
//         across multiple files without runtime overhead (Tailwind v4 relies on this)
// ❯ @gogogo new postcss plugin
export default {
    plugins: {
        'postcss-import': postcssImport,
    }
};