// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/new-post.js
// ❯ @desc Creates new blog post or CTF writeup template.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import fs from "fs";
import path from "path";

// ❯ DATE UTILITIES

// ❯ @doc Returns current date in YYYY-MM-DD format.
function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// ❯ @doc Returns current datetime in ISO 8601 format (YYYY-MM-DDTHH:mm:ss) for post sorting.
// ❯ @hint Ensures stable ordering when multiple posts share the same date.
function getDateTime() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// ❯ VALIDATION

const rawArgs = process.argv.slice(2);
let isCtf = false;
const args = [];
for (const a of rawArgs) {
	if (a === "--ctf" || a === "-c") {
		isCtf = true;
		continue;
	}
	args.push(a);
}

if (args.length === 0) {
	console.error(`Error: No filename argument provided
Usage:
  npm run new-post -- <filename>           → src/content/posts/
  npm run new-post -- --ctf <slug>         → src/content/ctf/ (CTF writeup)
Legacy: npm run new-post -- CTF!/slug      → same as --ctf slug`);
	process.exit(1);
}

// ❯ FILE PREPARATION

let fileName = args[0];
const fileExtensionRegex = /\.(md|mdx)$/i;
if (!fileExtensionRegex.test(fileName)) {
	fileName += ".md";
}

const legacyCtf =
	fileName.toLowerCase().includes("ctf!/") ||
	args[0].toLowerCase().startsWith("ctf!");
if (legacyCtf) {
	isCtf = true;
	fileName = fileName.replace(/^CTF!\//i, "").replace(/^ctf!\//i, "");
}

const targetDir = isCtf ? "./src/content/ctf/" : "./src/content/posts/";
const fullPath = path.join(targetDir, fileName);

if (fs.existsSync(fullPath)) {
	console.error(`Error: File ${fullPath} already exists`);
	process.exit(1);
}

// ❯ DIRECTORY CREATION

const dirPath = path.dirname(fullPath);
if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
}

// ❯ POST GENERATION
// ❯ @hint CTF writeups live in src/content/ctf — URLs are /ctf/writeups/:slug/

const defaultTags = isCtf
	? '["Web", "Crypto", "Forensics", "Pwn", "Reversing", "Misc"]'
	: "[]";

const content = isCtf
	? `---
title: "[Platform] Challenge Name"
published: ${getDateTime()}
description: "One-line challenge summary"
cover: ""
coverInContent: false
pinned: false
tags: ${defaultTags}
draft: false
comment: true
encrypted: false
password: ""
licenseName: ""
author: "Alp"
sourceLink: ""
---

:::tip[TL;DR]
Flag: \`flag{...}\` — One sentence: how you got it.
:::

# Challenge

- **Platform:** 
- **Category:** 
- **Difficulty:** 

## Goal

What does the challenge ask for?

---

# Recon

\`\`\`bash
# Commands, tools, initial enumeration
\`\`\`

---

# Solution

## Step 1: 

\`\`\`bash
# Commands
\`\`\`

## Step 2: 

\`\`\`bash
# Commands
\`\`\`

---

# Flag

\`\`\`
flag{...}
\`\`\`
`
	: `---
title: ${args[0]}
published: ${getDateTime()}
description: ''
cover: ''
tags: []
category: ''
draft: false
lang: ''
---
`;

fs.writeFileSync(path.join(targetDir, fileName), content);
console.log(`Created: ${fullPath}`);
