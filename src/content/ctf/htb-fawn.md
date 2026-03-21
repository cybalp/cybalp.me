---
title: "Fawn"
published: 2026-03-17T10:30:00
description: "Fawn — FTP anonymous"
cover: "img/htb-fawn.webp"
coverInContent: false
pinned: false
tags: ["HTB", "FTP"]
draft: false
comment: true
encrypted: false
password: ""
licenseName: ""
author: "Alp"
sourceLink: "https://www.hackthebox.com/"
---

:::caution[Machine Information]
- **Platform:** HTB
- **Lab:** Starting Point
- **OS:** Linux
- **Difficulty:** Very Easy
- **IP:** `10.129.1.14`
:::

---

# Step 0: Getting Started

If you're not sure how to get started, [this will help.](https://www.cybalp.me/ctf/writeups/htb-meow/#step-0-getting-started)

![HTB-Fawn 1](img/htb-fawn1.webp)

OK!

---

# Step 1: Recon

```bash
nmap -sC -sV $IP
```

![HTB-Fawn 2](img/htb-fawn2.webp)

Only **21/tcp (FTP)** is open. vsftpd 3.0.3 — anonymous access should be tested.

---

# Step 2: Solution

## FTP Connected

```bash
ftp $IP
```

![HTB-Fawn 3](img/htb-fawn3.webp)

## Anonymous Login

| User      | Password |
| :-------- | :------- |
| anonymous | (Enter) |

Press Enter when prompted for a password. -> `230` = successful.

## Flag

```bash
ls
get flag.txt
bye
```

![HTB-Fawn 4](img/htb-fawn4.webp)

# Flag

```bash
cat flag.txt
```
![HTB-Fawn 5](img/htb-fawn5.webp)

```
035db21c881520061c53e0536e44f815
```

Yep. OK!
