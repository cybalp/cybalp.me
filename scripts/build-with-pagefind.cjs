// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/build-with-pagefind.cjs
// ❯ @desc Build site with Pagefind search index.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

// ❯ PLATFORM DETECTION

// ❯ @doc Detects deployment platform from environment.
function detectPlatform() {
    // ❯ Environment Variables
    if (process.env.GITHUB_ACTIONS) return 'github';
    if (process.env.CF_PAGES) return 'cloudflare';
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.EDGEONE) return 'edgeone';
    if (process.env.VERCEL) return 'vercel';

    // ❯ Directory Check
    if (existsSync('.vercel')) return 'vercel';

    return 'default';
}

// ❯ OUTPUT CONFIGURATION

// ❯ @doc Returns Pagefind output directory for platform.
function getPagefindOutputDir(platform) {
    const outputDirs = {
        default: 'dist',
        github: 'dist',
        cloudflare: 'dist',
        netlify: 'dist',
        edgeone: 'dist',
        vercel: '.vercel/output/static',
    };

    return outputDirs[platform] || 'dist';
}

// ❯ BUILD EXECUTION

// ❯ @doc Builds site and generates Pagefind search index.
function main() {
    const platform = detectPlatform();
    const outputDir = getPagefindOutputDir(platform);

    console.log(`🚀 Detected deployment platform: ${platform}`);
    console.log(`📁 Pagefind output directory: ${outputDir}`);

    try {
        console.log('🔨 Running Astro build...');
        execSync('npx astro build', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        if (!existsSync(outputDir)) {
            console.error(`❌ Output directory does not exist: ${outputDir}`);
            process.exit(1);
        }

        console.log('🔍 Running Pagefind search index generation...');
        execSync(`npx pagefind --site ${outputDir}`, {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('✅ Build completed!');
        console.log(`📊 Search index generated at: ${outputDir}/pagefind/`);

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

main();
