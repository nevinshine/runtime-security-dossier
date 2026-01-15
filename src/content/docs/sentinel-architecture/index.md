---
title: Sentinel Architecture (v1.2)
description: Technical specification of the Sentinel Active Semantic Protection System
---

## System Overview

Sentinel is a lightweight **Active Runtime Protection System** for Linux. Unlike traditional EDRs (Endpoint Detection and Response) that rely on signature matching or static binary analysis, Sentinel operates on the **Semantic Level**.

It intercepts the communication between a process and the Linux Kernel to establish a "Behavioral Fingerprint" of execution and actively neutralizes threats in real-time.

### The Cybernetic Loop (Three-Layer Design)

Sentinel operates as a closed feedback loop between the Kernel, the Semantic Analysis Engine, and the Enforcement Module.

| Layer | Component | Language | Function |
| :--- | :--- | :--- | :--- |
| **0** | **Target** | Binary | The untrusted process (e.g., malware, web server). |
| **1** | **Interceptor** | C | **The Body.** Attaches via `ptrace`, pauses execution, and performs Deep Introspection (Argument Extraction). |
| **1.5** | **Bridge** | IPC | **The Nervous System.** A synchronous FIFO pipe (`/tmp/sentinel_ipc`) for high-speed telemetry. |
| **2** | **Brain** | Python | **The Mind.** A Weightless Neural Network (WiSARD) + Policy Engine that outputs `BENIGN` or `BLOCK`. |
| **3** | **Enforcer** | C | **The Shield.** Receives the verdict and injects `ENOSYS` into the CPU registers to neutralize malicious syscalls. |

---

## The Semantic Platform (v1.2)

As of **Day 22 (v1.2)**, Sentinel implements a fully synchronous **Listen-Think-Act** loop.

### How It Works
1.  **Event:** The Target Process calls `mkdir("my_malware_folder")`.
2.  **Freeze:** The **Interceptor (C)** traps the syscall and pauses the CPU.
3.  **Introspect:** Sentinel uses `PTRACE_PEEKDATA` to read the directory name from the child's memory.
4.  **Transmit:** The Interceptor writes `SYSCALL:mkdir:my_malware_folder` to the IPC Bridge.
5.  **Inference:** The **Brain (Python)** analyzes the semantic intent (Folder Name + Context).
6.  **Verdict:** The Brain outputs `🚨 BLOCK`.
7.  **Neutralization:** The Interceptor rewrites the syscall register to `void`, preventing execution.

---

## Active Defense (v1.2)

Sentinel is no longer a passive monitor. It implements a Kernel-Level **Active Policy Engine**.

### The Blocking Mechanism (The "Kill Switch")
When a malicious syscall is detected, Sentinel does not crash the process. Instead, it performs a surgical **Register Rewrite**:

1.  **Trap:** The process stops at Syscall Entry.
2.  **Override:** Sentinel writes `-1` into the `ORIG_RAX` register.
3.  **Resume:** The kernel sees syscall `-1` (invalid), returns `ENOSYS` (Function not implemented), and the process continues without executing the malicious action.

```c
// Code Snippet: The Neutralization Logic (Day 21)
if (verdict == BLOCK) {
    // 1. Invalidate the Syscall Number
    regs.orig_rax = -1; 
    ptrace(PTRACE_SETREGS, child_pid, NULL, &regs);
    
    // 2. Resume execution (Kernel performs "No-Op")
    printf("[🛡️ SENTINEL] Threat Neutralized via ENOSYS.\n");
}

```

---

## Deep Introspection (v1.2)

To understand *intent*, we must look beyond syscall numbers. Sentinel uses `PTRACE_PEEKDATA` to extract string arguments from the child's virtual memory space.

* **Challenge:** The child's memory is isolated from the tracer.
* **Solution:** We read memory word-by-word (8 bytes) at the address found in the `RSI/RDI` registers until we hit a `NULL` terminator.

### Current Capabilities

* [x] **Syscall Identity:** Tracking `RAX` numbers.
* [x] **Argument Extraction:** Reading file paths (`mkdir`, `openat`) and strings.
* [x] **Active Blocking:** Real-time syscall neutralization via `ENOSYS`.
* [x] **Live Inference:** Sub-millisecond AI verdicts.

