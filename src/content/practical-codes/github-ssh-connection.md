---
title: Github SSH Connection
description: Generate SSH key and connect to GitHub
language: bash
tags:
  - github
  - ssh
  - git
date: 2026-03-08
---

```bash
ssh-keygen -t ed25519 -C "<YOUR_MAIL>"
cat ~/.ssh/id_ed25519.pub

# check
ssh -T git@github.com
```