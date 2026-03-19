---
title: "Getting Started and Meow"
published: 2026-03-17T09:00:00
description: "Meow — Telnet"
cover: "img/htb-meow.webp"
coverInContent: false
pinned: false
tags: ["HTB", "Telnet"]
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
- **IP:** `10.129.24.239`
:::

---

# Step 0: Getting Started

1. **Start** → Start Machine

![HTB-Start](img/htb-start.webp)

2. **VPN** → `.ovpn` download,

![HTB-VPN](img/htb-vpn.webp)

![HTB-VPN-Download](img/htb-vpn-download.webp)

2. **VPN Connect** → `sudo openvpn {{filename}}.ovpn`

![HTB-VPN-Connect](img/htb-connect.webp)

Don’t close this terminal; open another one and we’ll start the machine.

3. **Target & Test** → Set the $IP variable in the new terminal, and test..

![HTB-Start-Test](img/htb-start-test.webp)

I’m not going to write the answer to every question here. The questions are simple anyway. if you don't know, just Google it!

# Step 1: Recon

By the time you reach question 6, you’ll need to perform a scan. Use the system to scan for open ports.

```bash
nmap -sC -sV -p- $IP
```

![HTB-Meow-Telnet](img/htb-meow-telnet.webp)

---

# Step 2: Solution

##  Telnet Connected

```bash
telnet $IP
```

![HTB-Meow-root](img/htb-meow-root.webp)


## and Flag

```bash
ls
cat flag.txt
```
![HTB-Meow-Flag](img/htb-meow-flag.webp)

```
b40abdfe23665f766f9c61ecba8a4c19
```
# OK!

Very ver easy. Play smart and keep it simple. Time is of the essence.