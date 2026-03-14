// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/auto-webp.mjs
// ❯ @desc Automatically converts PNG/JPG images to WebP and updates all
// ❯       source references. Runs before dev and build — zero manual effort.
// ❯       Skips files already up-to-date (WebP newer than source).
// ❯       Intentionally skips public/favicon/ (browsers require PNG there).
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import fs from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
import sharp from "sharp";

// ❯ CONFIGURATION
const ROOT = process.cwd();

// ❯ @doc Directories to scan for convertible images.
const SCAN_DIRS = ["src", "public"];

// ❯ @doc Directories/prefixes that must never be converted.
// ❯ @hint favicon PNGs must stay PNG — all browsers and OS icon systems require it.
const SKIP_PREFIXES = [
    "public/favicon",
    "node_modules",
    "dist",
    ".astro",
    ".git",
];

// ❯ @doc Text file types where image references will be auto-updated.
const TEXT_EXT = /\.(md|mdx|json|yaml|yml|astro|ts|tsx|svelte|js|mjs|cjs)$/i;

const IMAGE_EXT = /\.(png|jpg|jpeg)$/i;

// ❯ @doc Single quality value applied to all WebP output.
// ❯ @hint 85 is the sweet spot for photos; use 90+ for logos/icons if needed.
const WEBP_QUALITY = 85;

// ❯ @doc Cap images at 1920px wide — beyond that is wasted bytes for web.
const MAX_WIDTH = 1920;

// ❯ STATE
// ❯ @doc Map of { "old-basename.ext" → "new-basename.webp" } for reference patching.
const converted = new Map();

// ❯ UTILITIES

// ❯ @doc Returns true if the given absolute path should be skipped.
function shouldSkip(absPath) {
    const rel = path.relative(ROOT, absPath).replace(/\\/g, "/");
    return SKIP_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

// ❯ @doc Escapes special regex characters in a string literal.
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ❯ @doc Replaces oldName with newName in file content, skipping MIME-type contexts.
// ❯ @hint Prevents replacing "image/png" strings in HTML attributes or CSS.
function patchContent(content, oldName, newName) {
    return content.replace(
        new RegExp(escapeRegex(oldName), "g"),
        (match, offset) => {
            // ❯ Skip if preceded by a MIME type prefix like "image/"
            const preceding = content.slice(Math.max(0, offset - 8), offset);
            if (/(?:image|video|audio|font|text)\/$/.test(preceding)) {
                return match;
            }
            return newName;
        },
    );
}

// ❯ CONVERSION

// ❯ @doc Converts a single PNG/JPG file to WebP. Skips if WebP is already newer.
async function convertImage(srcPath) {
    if (shouldSkip(srcPath)) return;

    const ext = path.extname(srcPath).toLowerCase();
    const base = path.basename(srcPath, ext);
    const dir = path.dirname(srcPath);
    const webpPath = path.join(dir, `${base}.webp`);

    // ❯ Incremental: skip if WebP exists and is more recent than the source
    if (existsSync(webpPath)) {
        const srcMtime = statSync(srcPath).mtimeMs;
        const webpMtime = statSync(webpPath).mtimeMs;
        if (webpMtime >= srcMtime) return;
    }

    try {
        await sharp(srcPath)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(webpPath);

        const rel = path.relative(ROOT, srcPath).replace(/\\/g, "/");
        console.log(`  [convert] ${rel} → ${base}.webp`);
        converted.set(path.basename(srcPath), `${base}.webp`);
    } catch (err) {
        const rel = path.relative(ROOT, srcPath).replace(/\\/g, "/");
        console.warn(`  [skip]    ${rel}: ${err.message}`);
    }
}

// ❯ @doc Recursively scans a directory and converts all eligible images.
async function scanAndConvert(dirPath) {
    if (!existsSync(dirPath) || shouldSkip(dirPath)) return;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    await Promise.all(
        entries.map((entry) => {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) return scanAndConvert(fullPath);
            if (IMAGE_EXT.test(entry.name)) return convertImage(fullPath);
            return Promise.resolve();
        }),
    );
}

// ❯ REFERENCE PATCHING

// ❯ @doc Patches image references in a single text file.
async function patchFile(filePath) {
    let content = await fs.readFile(filePath, "utf-8");
    let changed = false;

    for (const [oldName, newName] of converted) {
        const patched = patchContent(content, oldName, newName);
        if (patched !== content) {
            content = patched;
            changed = true;
        }
    }

    if (changed) {
        await fs.writeFile(filePath, content, "utf-8");
        const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
        console.log(`  [refs]    ${rel}`);
    }
}

// ❯ @doc Recursively patches all text files in a directory.
async function patchDir(dirPath) {
    if (!existsSync(dirPath) || shouldSkip(dirPath)) return;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    await Promise.all(
        entries.map((entry) => {
            const fullPath = path.join(dirPath, entry.name);
            if (shouldSkip(fullPath)) return Promise.resolve();
            if (entry.isDirectory()) return patchDir(fullPath);
            if (TEXT_EXT.test(entry.name)) return patchFile(fullPath);
            return Promise.resolve();
        }),
    );
}

// ❯ @doc Patches root-level config files (e.g. cybalp.config.yaml).
async function patchRootConfigs() {
    const entries = await fs.readdir(ROOT, { withFileTypes: true });

    await Promise.all(
        entries
            .filter((e) => e.isFile() && TEXT_EXT.test(e.name))
            .map((e) => patchFile(path.join(ROOT, e.name))),
    );
}

// ❯ ENTRY POINT
async function main() {
    console.log("\n[auto-webp] Scanning for unconverted PNG/JPG images...");

    await Promise.all(
        SCAN_DIRS.map((d) => scanAndConvert(path.join(ROOT, d))),
    );

    if (converted.size === 0) {
        console.log("[auto-webp] All images already up to date.\n");
        return;
    }

    console.log(
        `\n[auto-webp] Converted ${converted.size} image(s). Updating source references...`,
    );

    await Promise.all([
        patchDir(path.join(ROOT, "src")),
        patchRootConfigs(),
    ]);

    console.log(`[auto-webp] Done — ${converted.size} image(s) processed.\n`);
}

main().catch((err) => {
    console.error("[auto-webp] Fatal error:", err.message);
    process.exit(1);
});
