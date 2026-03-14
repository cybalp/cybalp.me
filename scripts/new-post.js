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

const content = `---
title: ${args[0]}
published: ${getDate()}
description: ''
cover: ''
tags: []
category: ''
draft: false
lang: ''
---
`;

fs.writeFileSync(path.join(targetDir, fileName), content);
console.log(`Post ${fullPath} created`);
