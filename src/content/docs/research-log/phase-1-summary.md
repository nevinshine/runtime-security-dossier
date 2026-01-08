---
title: Phase 1 Summary
description: Recap of Days 1-15 (Foundation & Hardening)
sidebar:
  order: 1
---

## 📅 Research Period: Days 1–15

**Status:** ✅ Completed
**Focus:** Linux Kernel Hardening, Anomaly Detection Theory, and Prototype v0.7.

This phase focused on establishing the "Ground Truth" for the Sentinel environment. Before we can detect anomalies, we must mathematically define what a "normal" Linux process looks like.

---

## 🏆 Key Achievements

### 1. The Interceptor Prototype (v0.7)
We successfully engineered a raw C interceptor using `ptrace` that demonstrates **Active Defense**:
* **Mechanism:** `PTRACE_SYSCALL` loop.
* **Detection:** Identified `mkdir` syscalls (ID 83).
* **Response:** Neutralized the call by rewriting the `RAX` register to `-1` (Operation not permitted).

### 2. The "Brain" Architecture
We moved away from standard Random Forests and implemented a **Weightless Neural Network (WiSARD)** approach:
* **Why:** Traditional NN is too slow for runtime interception.
* **Method:** Boolean RAM-based learning (One-Shot Learning).
* **Metric:** Hamming Distance for anomaly scoring.

### 3. Environment Hardening
To ensure the researcher (us) is safe while handling malware, the lab was hardened:
* **Network:** UFW Firewall automation.
* **Access:** SSH Key-only auth + Fail2Ban IPS.
* **Integrity:** SHA-256 File Integrity Monitoring (FIM).

---

## 🔗 Raw Logs
For the daily experimental logs and source code, refer to the [Systems Security Foundations Repository](https://github.com/nevinshine/systems-security-foundations).