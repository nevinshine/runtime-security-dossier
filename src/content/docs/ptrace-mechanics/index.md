---
title: Ptrace Mechanics & Interception
description: Deep dive into the Linux ptrace API, Register Interception, and Recursive Tracing.
sidebar:
  label: Ptrace Reference
  order: 10
---

The `ptrace` (Process Trace) system call is the primary mechanism Sentinel uses to observe and control the execution of target processes. It allows the tracer (Sentinel) to inspect and manipulate the internal state of the tracee (Target).

## The Stop-Inspect-Resume Cycle

Sentinel operates on a rigid state machine driven by kernel signals:

1.  **PTRACE_SYSCALL:** The tracer tells the kernel: *"Let the child run until it hits a syscall entry or exit."*
2.  **Wait:** The tracer calls `waitpid()` and sleeps, consuming zero CPU.
3.  **Wake Up:** When the child makes a syscall, the kernel freezes it and wakes the tracer.
4.  **Inspect:** The tracer reads the CPU registers (`PTRACE_GETREGS`) to understand the intent.

## The AMD64 Syscall ABI

On Linux x86_64, arguments are passed via specific CPU registers. Understanding this map is critical for interception.

| Register | Usage | Example (openat) |
| :--- | :--- | :--- |
| **RAX** | Syscall Number | `257` (openat) |
| **RDI** | Argument 1 | `dirfd` (Directory File Descriptor) |
| **RSI** | Argument 2 | `*pathname` (Memory Address of string) |
| **RDX** | Argument 3 | `flags` (Read/Write mode) |
| **R10** | Argument 4 | `mode` (Permissions) |

> **Critical Note:** The return value of the syscall is placed in `RAX` *after* the syscall exits. On entry, `RAX` holds the System Call ID.

## Memory Extraction (The Eye)

Reading memory from another process is not direct. You cannot simply dereference a pointer from the child process because it exists in a different virtual memory space.

Sentinel uses `PTRACE_PEEKDATA` to extract strings (like filenames) word-by-word.

```c
long data = ptrace(PTRACE_PEEKDATA, child_pid, addr, NULL);

```

* **Unit:** Reads 1 word (8 bytes on 64-bit systems).
* **Reconstruction:** To read a string like `"/etc/passwd"`, Sentinel loops through memory, reading 8 bytes at a time, and stitching them together until it encounters a null terminator (`\0`).

## Recursive Tracking (The Net)

To track an entire process tree (Parent → Child → Grandchild), Sentinel cannot rely on the initial attachment alone. It must instruct the kernel to intercept creation events.

```c
ptrace(PTRACE_SETOPTIONS, pid, 0, 
       PTRACE_O_TRACEFORK | PTRACE_O_TRACEVFORK | PTRACE_O_TRACECLONE);

```

**Behavior:**

1. When the tracee calls `fork()`, `vfork()`, or `clone()`, the kernel **automatically stops** the new child.
2. The Kernel sends a `PTRACE_EVENT` signal to Sentinel.
3. Sentinel registers the new PID to its internal tracking table before the child executes its first instruction.

This ensures **Zero-Gap Coverage**: No process can spawn and act without Sentinel's permission.


