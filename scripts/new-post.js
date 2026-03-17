// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./scripts/new-post.js
// ❯ @desc Creates new blog post template.
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

// ❯ VALIDATION

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error(`Error: No filename argument provided
Usage: npm run new-post -- <filename>`);
    process.exit(1);
}

// ❯ FILE PREPARATION

let fileName = args[0];
const fileExtensionRegex = /\.(md|mdx)$/i;
if (!fileExtensionRegex.test(fileName)) {
    fileName += ".md";
}

const targetDir = "./src/content/posts/";
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
// ❯ @hint Use: npm run new-post -- CTF!/challenge-name  → creates CTF writeup

const isCtf = fileName.toLowerCase().includes("ctf!/") || args[0].toLowerCase().startsWith("ctf!");
const defaultCategory = isCtf ? "CTF!" : "";
const defaultTags = isCtf ? '["Web", "Crypto", "Forensics", "Pwn", "Reversing", "Misc"]' : "[]";

const content = isCtf
	? `---
title: "[Platform] Challenge Name"
published: ${getDate()}
description: "One-line challenge summary"
cover: ""
coverInContent: false
pinned: false
tags: ${defaultTags}
category: "CTF!"
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
published: ${getDate()}
description: ''
cover: ''
tags: []
category: '${defaultCategory}'
draft: false
lang: ''
---
`;

fs.writeFileSync(path.join(targetDir, fileName), content);
console.log(`Post ${fullPath} created`);
