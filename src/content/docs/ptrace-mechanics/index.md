---
title: Ptrace Mechanics (M2.0)
description: Deep dive into the Linux ptrace API, Register Interception, and Recursive Tracing.
---

## The Ptrace State Machine

`ptrace` is the primary mechanism for implementing debuggers and system call tracers on Linux.

### The Stop-Inspect-Resume Cycle

1.  **PTRACE_SYSCALL:** The tracer tells the kernel: *"Let the child run until it hits a syscall entry or exit."*
2.  **Wait:** The tracer calls `waitpid()` and sleeps.
3.  **Wake Up:** When the child makes a syscall, the kernel freezes it and wakes the tracer.
4.  **Inspect:** The tracer reads the CPU registers (`PTRACE_GETREGS`).

---

## The AMD64 Syscall ABI

On Linux x86_64, arguments are passed via specific registers. Understanding this map is critical for interception.

| Register | Usage | Example (openat) |
| :--- | :--- | :--- |
| **RAX** | Syscall Number | `257` (openat) |
| **RDI** | Argument 1 | `dirfd` (Directory File Descriptor) |
| **RSI** | Argument 2 | `*pathname` (Memory Address of string) |
| **RDX** | Argument 3 | `flags` (Read/Write mode) |
| **R10** | Argument 4 | `mode` (Permissions) |

> **Critical Note:** The return value of the syscall is placed in `RAX` *after* the syscall exits. On entry, `RAX` holds the ID.

---

## PTRACE_PEEKDATA (The Eye)

Reading memory from another process is not direct. You cannot dereference a pointer from the child.

```c
long data = ptrace(PTRACE_PEEKDATA, child_pid, addr, NULL);

```

* **Unit:** Reads 1 word (8 bytes on 64-bit).
* **Method:** To read a string, you must loop, reading 8 bytes at a time, and stitching them together until you find `\0`.

---

## PTRACE_O_TRACEFORK (The Net)

*New in M2.0*

To track an entire process tree (Parent  Child  Grandchild), we cannot rely on `PTRACE_TRACEME` alone. We must set the **Trace Fork** option.

```c
ptrace(PTRACE_SETOPTIONS, pid, 0, PTRACE_O_TRACEFORK);

```

**Behavior:**

1. When the traced process calls `fork()` or `clone()`, the kernel **automatically stops** the new child.
2. The Kernel sends a `PTRACE_EVENT_FORK` signal to the Tracer.
3. The Tracer detects this event and adds the new PID to its internal tracking table.

This ensures **Zero-Gap Coverage**: The child is captured *before* it executes its first instruction.

