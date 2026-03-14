// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/compile-inline-stylus.cjs
// ❯ @desc Validates inline Stylus syntax.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ❯ FILE DISCOVERY

// ❯ @doc Recursively walks directory and returns file paths.
function walk(dir) {
    const res = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) res.push(...walk(full));
        else res.push(full);
    }
    return res;
}

// ❯ CONFIGURATION

const srcDir = path.resolve('src');
if (!fs.existsSync(srcDir)) {
    console.error('No src directory found.');
    process.exit(1);
}

const files = walk(srcDir);
const styleBlockRe = /<style[^>]*lang=["']stylus["'][^>]*>([\s\S]*?)<\/style>/ig;
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'; // "npx.cmd" | "npx"
const outNull = process.platform === 'win32' ? 'nul' : '/dev/null'; // "nul" | "/dev/null"

// ❯ STYLUS COMPILATION

// ❯ @doc Compiles Stylus content and returns validation result.
function compileStylusContent(content, tmpPath) {
    fs.writeFileSync(tmpPath, content, 'utf8');
    try {
        execSync(`${npxCmd} stylus "${tmpPath}" -o ${outNull}`, { stdio: 'pipe' });
        fs.unlinkSync(tmpPath);
        return { ok: true };
    } catch (err) {
        const msg = err.stderr ? err.stderr.toString() : err.message;
        return { ok: false, error: msg };
    }
}

// ❯ VALIDATION

let failed = false;

// ❯ Standalone Files
const stylFiles = files.filter(f => f.endsWith('.styl'));
for (const f of stylFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const tmp = f + '.tmp.styl';
    const r = compileStylusContent(content, tmp);
    if (r.ok) console.log(`${f}: OK`);
    else {
        failed = true;
        console.error(`${f}: ERROR\n${r.error}`);
    }
}

// ❯ Inline Blocks
const candidateExt = ['.astro', '.svelte', '.vue', '.html'];
for (const f of files) {
    if (!candidateExt.includes(path.extname(f))) continue;
    const text = fs.readFileSync(f, 'utf8');
    let m;
    styleBlockRe.lastIndex = 0;
    let idx = 0;
    while ((m = styleBlockRe.exec(text)) !== null) {
        idx += 1;
        const content = m[1].trim();
        const tmp = `${f}.style.${idx}.tmp.styl`;
        const r = compileStylusContent(content, tmp);
        if (r.ok) console.log(`${f} [style #${idx}]: OK`);
        else {
            failed = true;
            console.error(`${f} [style #${idx}]: ERROR\n${r.error}`);
        }
    }
}

// ❯ EXIT

if (failed) {
    console.error('\nStylus check failed. Fix above errors.');
    process.exit(1);
} else {
    console.log('\nAll Stylus checks passed.');
    process.exit(0);
}
