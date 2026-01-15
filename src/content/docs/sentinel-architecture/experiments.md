---
title: Experiments & Evaluation (M2.0)
description: Experimental validation of the Sentinel Closed-Loop Control System.
---

## Overview

This document tracks the experimental validation of **Sentinel M2.0** (Day 23).

The core objective has shifted from "Single-Process Defense" to **"Recursive Process Tree Defense"**. We are validating the full control loop:
* **Can we block?** (The Kill Switch - M1.1)
* **Can we understand?** (Semantic Introspection - M1.2)
* **Can we track lineage?** (Recursive Monitoring - M2.0)

---

## Experimental Pipeline (M2.0)

The system is tested using a synchronous **Recursive Listen-Think-Act** loop:

1.  **Stimulus:** A target process (or its child) executes a syscall.
2.  **Interception:** The C Tracer traps the syscall (tracking `fork` events via `PTRACE_O_TRACEFORK`).
3.  **Transmission:** Telemetry (`SYSCALL:rename:target_file`) is streamed to the Brain.
4.  **Inference:** The **Policy Engine** (Python) analyzes the intent.
5.  **Enforcement:** The C Engine receives the `BLOCK` verdict and neutralizes the syscall via `ENOSYS`.

---

## Experiment A: The "Kill Switch" (M1.1)

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

## Experiment B: Semantic Introspection (M1.2)

**Objective:** Verify that Sentinel can distinguish threats based on *arguments* (Context), not just syscall numbers.

### Setup
* **Challenge:** Distinguish between `mkdir("safe_folder")` and `mkdir("malware_folder")`.
* **Method:** Deep Memory Inspection using `PTRACE_PEEKDATA` to read strings from the child process's address space.

### Results

| Input Command | Extracted Argument | Policy Decision | Action |
| :--- | :--- | :--- | :--- |
| `mkdir safe_logs` | `"safe_logs"` | `PASS` | Allowed |
| `mkdir malware_root` | `"malware_root"` | `BLOCK` | **Neutralized** |

**Conclusion:** Sentinel successfully bridged the "Semantic Gap." It can now enforce granular policies based on *what* the process is doing.

---

## Experiment C: Recursive Process Defense (M2.0)

**Objective:** Verify that Sentinel can track and block "Grandchild" processes (Process Tree Visibility).

### Setup
* **Challenge:** A shell script (`bash`) launches a Python script (`python3`) which attempts a Ransomware-style `rename`.
* **Vulnerability:** Standard tracers only see the parent (`bash`), missing the actual attack in the child.
* **Method:** `PTRACE_O_TRACEFORK` auto-attachment.

### Results

| Process Chain | Syscall | Argument | Verdict |
| :--- | :--- | :--- | :--- |
| `bash` (PID 1001) | `fork()` | `python3` | **Attached** |
| `python3` (PID 1002) | `read()` | `money.csv` | `ALLOW` |
| `python3` (PID 1002) | `rename()` | `money.csv.enc` | `🚨 BLOCK` |

**Conclusion:** Validated Zero-Blind-Spot monitoring. Sentinel successfully tracked execution across the process boundary and enforced policy on the child process.

---

## Performance Metrics

To be a viable Kernel EDR, the overhead must be minimal.

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Context Switch Overhead** | ~0.3ms | ✅ Optimal |
| **IPC Round-Trip (C <-> Py)** | ~0.8ms | ✅ Acceptable |
| **Recursive Attach Latency** | ~1.5ms | ✅ Low Impact |
| **Total Block Latency** | **~1.2ms** | **Real-time** |

---

## Status

**✅ Operational (M2.0)**
The system has graduated from "Semantic Monitor" to **"Recursive Behavioral EDR"**.
The next phase (M2.1) will focus on **Sequence Analysis** (detecting patterns over time windows).
