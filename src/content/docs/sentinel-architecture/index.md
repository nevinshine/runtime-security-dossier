---
title: Sentinel Architecture (M2.0)
description: Technical specification of the Sentinel Closed-Loop Control System
---

## System Overview

Sentinel is a lightweight **Closed-Loop Runtime Control System** for Linux. Unlike traditional EDRs (Endpoint Detection and Response) that rely on signature matching or static binary analysis, Sentinel operates on the **Semantic Level**.

It intercepts the communication between a process tree and the Linux Kernel to establish a "Behavioral Fingerprint" of execution and actively neutralizes threats in real-time.

### The Control Loop (Three-Layer Design)

Sentinel operates as a feedback control loop between the Kernel, the Semantic Analysis Engine, and the Enforcement Module.

| Layer | Component | Language | Function |
| :--- | :--- | :--- | :--- |
| **0** | **Target Tree** | Binary | The untrusted process tree (e.g., shell -> python -> malware). |
| **1** | **Interceptor** | C | **The Body.** A recursive `ptrace` engine that auto-attaches to child processes (`PTRACE_O_TRACEFORK`) and extracts state. |
| **1.5** | **Bridge** | IPC | **The Nervous System.** A synchronous FIFO pipe (`/tmp/sentinel_ipc`) for high-speed telemetry. |
| **2** | **Brain** | Python | **The Mind.** A Weightless Neural Network (WiSARD) + Policy Engine that outputs `BENIGN` or `BLOCK`. |
| **3** | **Enforcer** | C | **The Shield.** Receives the verdict and injects `ENOSYS` into the CPU registers to neutralize malicious syscalls. |

---

## The Recursive Platform (M2.0)

As of **Milestone 2.0**, Sentinel implements a fully synchronous **Recursive Listen-Think-Act** loop. It monitors not just a single binary, but its entire lineage.

### How It Works (The Recursive Scenario)
1.  **Fork:** The User Shell (`bash`) executes `python3 malware.py`.
2.  **Attach:** The **Interceptor (C)** detects `PTRACE_EVENT_FORK` and automatically attaches to the new Python process.
3.  **Event:** The Python Child calls `rename("data/money.csv", "data/money.csv.enc")`.
4.  **Freeze:** Sentinel traps the child's syscall and pauses the CPU.
5.  **Introspect:** Sentinel uses `PTRACE_PEEKDATA` to read the file paths from the child's memory.
6.  **Inference:** The **Brain (Python)** analyzes the intent (Rename + Sensitive File).
7.  **Verdict:** The Brain outputs `🚨 BLOCK`.
8.  **Neutralization:** The Interceptor rewrites the child's register to `void`, preventing the ransomware encryption.

---

## Active Enforcement (M1.1+)

Sentinel is no longer a passive monitor. It implements a Kernel-Level **Active Policy Engine**.

### The Blocking Mechanism (The "Kill Switch")
When a malicious syscall is detected, Sentinel performs a surgical **Register Rewrite**:

1.  **Trap:** The process stops at Syscall Entry.
2.  **Override:** Sentinel writes `-1` into the `ORIG_RAX` register.
3.  **Resume:** The kernel sees syscall `-1` (invalid), returns `ENOSYS` (Function not implemented), and the process continues without executing the malicious action.

```c
// Code Snippet: The Neutralization Logic
if (verdict == BLOCK) {
    // 1. Invalidate the Syscall Number
    regs.orig_rax = -1;
    ptrace(PTRACE_SETREGS, child_pid, NULL, &regs);

    // 2. Resume execution (Kernel performs "No-Op")
    printf("[🛡️ SENTINEL] Threat Neutralized via ENOSYS.\n");
}

```

---

## Deep Introspection (M0.8+)

To understand *intent*, we must look beyond syscall numbers. Sentinel uses `PTRACE_PEEKDATA` to extract string arguments from the child's virtual memory space.

* **Challenge:** The child's memory is isolated from the tracer.
* **Solution:** We read memory word-by-word (8 bytes) at the address found in the `RSI/RDI` registers until we hit a `NULL` terminator.

### Current Capabilities

* [x] **Syscall Identity:** Tracking `RAX` numbers.
* [x] **Argument Extraction:** Reading file paths (`mkdir`, `openat`) and strings.
* [x] **Active Blocking:** Real-time syscall neutralization via `ENOSYS`.
* [x] **Live Inference:** Sub-millisecond AI verdicts.
* [x] **Process Tree Tracking (M2.0):** Recursive monitoring of complex execution chains.


