---
title: "M2.0: Recursive Process Tracking"
description: Overcoming the ptrace blind spot with PTRACE_O_TRACEFORK.
---

**Date:** 2026-01-15
**Status:** Experimental (M2.0)

## The Research Problem
Standard `ptrace` attachment (`PTRACE_TRACEME`) is shallow. It only traces the immediate process.
* **Vulnerability:** If a monitored shell (`/bin/bash`) spawns a child process (e.g., `python3 ransomware.py`), the child executes outside the tracer's scope.
* **Impact:** This "Grandchild Blind Spot" allows malware to bypass detection simply by forking.

## The Engineering Solution
We implemented **Recursive Fork Tracking** using `PTRACE_O_TRACEFORK`.

### 1. Kernel Option Setting
We instructed the kernel to auto-attach Sentinel to any new process spawned by the tracee:
```c
// Force auto-attachment to all future child processes
ptrace(PTRACE_SETOPTIONS, pid, 0, PTRACE_O_TRACEFORK);

```

### 2. Asynchronous Event Loop

Refactored the main wait loop to handle signals from multiple PIDs simultaneously:

```c
// waitpid(-1) catches signals from ANY child or grandchild
pid_t trigger_pid = waitpid(-1, &status, 0);

if (status >> 8 == (SIGTRAP | (PTRACE_EVENT_FORK << 8))) {
    // Handle new process creation dynamically
    handle_fork_event(trigger_pid);
}

```

## Verification

* **Scenario:** `bash` (Parent)  executes  `python3` (Child)  executes  `rename()` syscall.
* **Result:** Sentinel successfully intercepted the syscall from the *Child* process and blocked it based on the policy.

