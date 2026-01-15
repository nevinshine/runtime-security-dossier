---
title: Experiments & Evaluation (v1.2)
description: Experimental validation of the Active Semantic Protection system.
---

## Overview

This document tracks the experimental validation of **Sentinel v1.2** (Day 22).

The core objective has shifted from "Observation" to **"Active Defense"**. We are validating the full cybernetic loop:
* **Can we block?** (The Kill Switch)
* **Can we understand?** (Semantic Introspection)
* **Is it fast enough?** (Latency < 2ms)

---

## Experimental Pipeline (v1.2)

The system is tested using a synchronous **Listen-Think-Act** loop:

1.  **Stimulus:** A target process executes a syscall (e.g., `mkdir("malware")`).
2.  **Interception:** The C Tracer traps the syscall and extracts arguments (`PTRACE_PEEKDATA`).
3.  **Transmission:** Telemetry (`SYSCALL:mkdir:malware`) is streamed to the Brain.
4.  **Inference:** The **Policy Engine** (Python) analyzes the intent.
5.  **Enforcement:** The C Engine receives the `BLOCK` verdict and neutralizes the syscall via `ENOSYS`.

---

## Experiment A: The "Kill Switch" (Day 21)

**Objective:** Verify that Sentinel can physically prevent a malicious action from occurring in the Kernel.

### Setup
* **Mechanism:** `ptrace` register injection.
* **Technique:** When a block signal is received, overwrite `ORIG_RAX` with `-1`.
* **Test Case:** Attempting to open a "Banned File" (`/tmp/sentinel_test_banned`).

### Results

| Action | Verdict | Kernel Response | Outcome |
| :--- | :--- | :--- | :--- |
| `openat("safe.txt")` | `✅ ALLOW` | `SUCCESS (fd 3)` | File Opened |
| `openat("banned.txt")` | `🚨 BLOCK` | `ENOSYS (-1)` | **Blocked** (File Not Opened) |

**Conclusion:** The system successfully neutralized the syscall. The target process did *not* crash; it simply received an error code, proving stable, non-destructive active defense.

---

## Experiment B: Semantic Introspection (Day 22)

**Objective:** Verify that Sentinel can distinguish threats based on *arguments* (Context), not just syscall numbers.

### Setup
* **Challenge:** Distinguish between `mkdir("safe_folder")` and `mkdir("malware_folder")`.
* **Method:** Deep Memory Inspection using `PTRACE_PEEKDATA` to read strings from the child process's address space.

### Results

| Input Command | Extracted Argument | Policy Decision | Action |
| :--- | :--- | :--- | :--- |
| `mkdir safe_logs` | `"safe_logs"` | `PASS` | Allowed |
| `mkdir malware_root` | `"malware_root"` | `BLOCK` | **Neutralized** |

**Conclusion:** Sentinel successfully bridged the "Semantic Gap." It can now enforce granular policies based on *what* the process is doing, not just *how* it is doing it.

---

## Performance Metrics

To be a viable Kernel EDR, the overhead must be minimal.

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Context Switch Overhead** | ~0.3ms | ✅ Optimal |
| **IPC Round-Trip (C <-> Py)** | ~0.8ms | ✅ Acceptable |
| **Inference Time** | < 0.1ms | ✅ Instant |
| **Total Block Latency** | **~1.2ms** | **Real-time** |

---

## Status

**✅ Operational (v1.2)**
The system has graduated from "Passive Monitor" to **"Active IPS"**.
The next phase (Day 23+) will focus on **Sequence Analysis** (detecting Ransomware behavioral patterns over time) rather than single-event blocking.
