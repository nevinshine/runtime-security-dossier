---
title: System Architecture
description: The Modular Design of Sentinel Runtime.
sidebar:
  label: System Architecture
  order: 1
---

**Sentinel Runtime** operates as a synchronous **Closed-Loop Control System**. Unlike traditional EDRs that rely on asynchronous logging or post-execution analysis, Sentinel interjects itself into the kernel execution path to make real-time decisions.

## High-Level Design

The system is composed of three distinct layers, functioning analogously to a biological nervous system:

| Layer | Component | Language | Role |
| :--- | :--- | :--- | :--- |
| **0** | **Target** | Binary | The untrusted process tree (Shells, Scripts, Malware). |
| **1** | **Interceptor** | C | **The Body.** Captures syscalls via `ptrace` (supports `fork`, `vfork`, `clone`). |
| **1.5** | **Bridge** | IPC | **The Nervous System.** High-speed FIFO pipes for signal transmission. |
| **2** | **Brain** | Python | **The Mind.** A Policy Engine that analyzes intent and issues verdicts. |
| **3** | **Enforcer** | C | **The Hand.** Injects `EPERM` or `ENOSYS` to neutralize threats. |

## 1. The Interceptor (Kernel Space Interface)
The C Engine (`main.c`) is the only component that directly touches the Linux Kernel. It is designed for minimal overhead and maximum visibility.

### Recursive Process Tracking
To prevent evasion via child processes, the engine utilizes a recursive attachment strategy. By setting `PTRACE_O_TRACEFORK`, `PTRACE_O_TRACECLONE`, and `PTRACE_O_TRACEVFORK`, the kernel automatically halts any new child process and attaches the Sentinel tracer before a single instruction is executed.

### Universal Syscall Map
Linux syscall ABIs vary by architecture and version (e.g., `unlink` vs `unlinkat`). The **Universal Map** (`syscall_map.h`) abstracts these differences, normalizing them into semantic event IDs before sending them to the analysis layer.

## 2. The Analysis Bridge (IPC)
To maintain microsecond-latency, Sentinel utilizes raw **Named Pipes (FIFOs)** (`/tmp/sentinel_req`, `/tmp/sentinel_resp`) instead of sockets or HTTP. This ensures a blocking, synchronous communication channel that guarantees the target process remains paused until a verdict is reached.

* **Request Protocol:** `SYSCALL:<verb>:<argument>`
* **Response Protocol:** `1` (ALLOW) or `0` (BLOCK)

## 3. The Policy Brain (User Space)
The Python Engine (`brain.py`) contains the security logic. Decoupling the logic from the C engine allows for hot-swappable policy updates without recompiling the agent.

* **Context Awareness:** Tracks the state of operations (e.g., file access patterns).
* **Heuristics:** Evaluates arguments against "Protected Zones" or known attack vectors (e.g., Ransomware extensions).
