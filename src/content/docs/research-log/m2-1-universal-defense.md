---
title: "M2.1: Universal Active Defense"
description: "Implementing VFORK tracking and Universal Syscall Maps."
sidebar:
  label: "M2.1: Universal Defense"
  order: 3
---
**Date:** 2026-01-18  
**Status:** ✅ Operational (M2.1)  
**Focus:** Kernel Interception / Anti-Evasion

## The "Stealth Shell" Problem
After achieving basic recursive tracking, Red Team stress testing revealed a critical blind spot. While the engine tracked `bash` perfectly, modern optimized shells like `/bin/sh` (dash) use `vfork` (Virtual Fork) for performance.

This allowed child processes to spawn invisibly, effectively bypassing the Sentinel interception layer.

## The Engineering Solution

### 1. VFORK Interception
We upgraded the `ptrace` options to include `PTRACE_O_TRACEVFORK`. This forces the Kernel to pause the parent process until the child releases the virtual memory, ensuring Sentinel captures the PID *before* execution.

```c
// src/engine/main.c
ptrace(PTRACE_SETOPTIONS, pid, 0, 
       PTRACE_O_TRACEFORK | PTRACE_O_TRACECLONE | PTRACE_O_TRACEVFORK);

```

### 2. The Universal Syscall Map

We moved from hardcoded checks to a semantic map. This allows us to block *intent*, not just specific numbers.

| Intent | Syscalls Mapped | Registers |
| --- | --- | --- |
| **File Destruction** | `unlink`, `rmdir`, `unlinkat` | `RDI` (Legacy), `RSI` (Modern) |
| **Execution** | `execve` | `RDI` |

## Live Verification

The system was tested against a live `rm` command targeting a protected asset.

**Scenario:** `rm protected.txt`
**Result:**

1. **Interceptor:** Traps `SYS_unlinkat`.
2. **Brain:** Identifies "PROTECTED_FILE".
3. **Enforcer:** Injects `EPERM` (Operation Not Permitted).

