// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/generate-icons.js
// ❯ @desc Generates icon SVG data file.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ❯ CONFIGURATION

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const SRC_DIR = join(ROOT_DIR, "src");
const OUTPUT_FILE = join(SRC_DIR, "utils", "icons.ts");

const ICON_SETS = {
    "material-symbols": "@iconify-json/material-symbols",
    "fa6-solid": "@iconify-json/fa6-solid",
    "fa6-brands": "@iconify-json/fa6-brands",
    "fa6-regular": "@iconify-json/fa6-regular",
    "mdi": "@iconify-json/mdi",
    "eos-icons": "@iconify-json/eos-icons",
    "logos": "@iconify-json/logos",
    "simple-icons": "@iconify-json/simple-icons",
};

const iconSetCache = new Map();

// ❯ FILE DISCOVERY

// ❯ @doc Recursively finds files with specified extensions.
function getAllFiles(dir, extensions = [".svelte", ".astro", ".json"]) {
    const files = [];

    function walk(currentDir) {
        if (!existsSync(currentDir)) return;
        const items = readdirSync(currentDir);
        for (const item of items) {
            const fullPath = join(currentDir, item);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                if (!item.startsWith(".") && item !== "node_modules" && item !== "dist") {
                    walk(fullPath);
                }
            } else if (extensions.some((ext) => item.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    }

    walk(dir);
    return files;
}

// ❯ ICON EXTRACTION

// ❯ @doc Extracts icon names from file content using regex patterns.
function extractIconNames(content) {
    const icons = new Set();

    const patterns = [
        /icon=["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
        /icon=\{[`"']([a-z0-9-]+:[a-z0-9-]+)[`"']\}/gi,
        /"icon":\s*["']([a-z0-9-]+:[a-z0-9-]+)["']/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            icons.add(match[1]);
        }
    }

    return icons;
}

// ❯ ICON LOADING

// ❯ @doc Loads icon set data from node_modules with caching.
function loadIconSet(prefix) {
    if (iconSetCache.has(prefix)) {
        return iconSetCache.get(prefix);
    }

    const packageName = ICON_SETS[prefix];
    if (!packageName) {
        console.warn(`Unknown Icon Set: ${prefix}`);
        return null;
    }

    try {
        // ❯ @docs use require.resolve for pnpm compatibility (symlinked .pnpm store)
        let iconSetPath = join(ROOT_DIR, "node_modules", packageName, "icons.json");
        if (!existsSync(iconSetPath)) {
            try {
                iconSetPath = require.resolve(`${packageName}/icons.json`);
            } catch {
                console.warn(`Icon set file not found: ${iconSetPath}`);
                return null;
            }
        }
        const data = JSON.parse(readFileSync(iconSetPath, "utf-8"));
        iconSetCache.set(prefix, data);
        return data;
    } catch (error) {
        console.warn(`Unable to load icon set ${packageName}: ${error.message}`);
        return null;
    }
}

// ❯ SVG GENERATION

// ❯ @doc Builds SVG string from icon data and icon set metadata.
function buildSvg(iconData, iconSet) {
    const width = iconData.width || iconSet.width || 24;
    const height = iconData.height || iconSet.height || 24;
    const body = iconData.body;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}" fill="currentColor">${body}</svg>`;
}

// ❯ @doc Retrieves SVG for icon name, handling aliases.
function getIconSvg(iconName) {
    const [prefix, name] = iconName.split(":");
    if (!prefix || !name) return null;

    const iconSet = loadIconSet(prefix);
    if (!iconSet) return null;

    const iconData = iconSet.icons[name];
    if (!iconData) {
        if (iconSet.aliases && iconSet.aliases[name]) {
            const alias = iconSet.aliases[name];
            const realName = alias.parent;
            const realData = iconSet.icons[realName];
            if (realData) {
                return buildSvg(realData, iconSet);
            }
        }
        console.warn(`Icon not found: ${iconName}`);
        return null;
    }

    return buildSvg(iconData, iconSet);
}

// ❯ FILE GENERATION

// ❯ @doc Generates TypeScript file content with icon SVG data.
function generateIconsFile(iconsMap) {
    const iconEntries = Array.from(iconsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, svg]) => `\t"${name}":\n\t\t'${svg.replace(/'/g, "\\'")}'`)
        .join(",\n");

    return `/**
 * Auto-generated icon data file
 * Generated by scripts/generate-icons.js during build
 * Do not edit this file manually
 */

const iconSvgData: Record<string, string> = {
${iconEntries}
};

export function getIconSvg(iconName: string): string {
    return iconSvgData[iconName] || "";
}

export function hasIcon(iconName: string): boolean {
    return iconName in iconSvgData;
}

export default iconSvgData;
`;
}

// ❯ MAIN EXECUTION

async function main() {
    console.log("🚀 Icon scan starting...");
    const files = getAllFiles(SRC_DIR);
    const allIcons = new Set();

    for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const icons = extractIconNames(content);
        for (const icon of icons) {
            allIcons.add(icon);
        }
    }

    console.log(`Detected ${allIcons.size} unique icons..`);

    const iconsMap = new Map();
    for (const icon of allIcons) {
        const svg = getIconSvg(icon);
        if (svg) {
            iconsMap.set(icon, svg);
        }
    }

    const outputDir = dirname(OUTPUT_FILE);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(OUTPUT_FILE, generateIconsFile(iconsMap));
    console.log(`✅ Generated ${OUTPUT_FILE}`);
}

main().catch(console.error);
