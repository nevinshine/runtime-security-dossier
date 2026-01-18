---
title: "M2.0: Recursive Process Tracking"
description: "Overcoming the ptrace blind spot with PTRACE_O_TRACEFORK."
sidebar:
  label: "M2.0: Recursive Tracking"
  order: 2
---

**Date:** 2026-01-16  
**Status:** ✅ Operational (M2.0)  
**Focus:** Recursive Tracking / Anti-Evasion

## The Research Problem
Standard `ptrace` attachment (`PTRACE_TRACEME`) is shallow. It only traces the immediate process.
* **Vulnerability:** If a monitored shell (`/bin/bash`) spawns a child process (e.g., `python3 ransomware.py`), the child executes outside the tracer's scope.
* **Impact:** This "Grandchild Blind Spot" allows malware to bypass detection simply by forking.

## The Engineering Solution
We implemented **Recursive Fork Tracking** using `PTRACE_O_TRACEFORK`. This instructs the Kernel to automatically attach the Sentinel engine to any new process spawned by the tracee *before* it can execute instructions.

### 1. Kernel Option Setting
We instructed the kernel to auto-attach Sentinel to any new process spawned by the tracee, including clones and forks:

```c
// Force auto-attachment to all future child/grandchild processes
ptrace(PTRACE_SETOPTIONS, original_child, 0, 
       PTRACE_O_TRACEFORK | PTRACE_O_TRACECLONE | PTRACE_O_TRACEEXEC | PTRACE_O_EXITKILL);

```

### 2. Asynchronous Event Loop

Refactored the main wait loop to handle signals from multiple PIDs simultaneously using the `__WALL` flag (Wait All):

```c
// waitpid(-1) catches signals from ANY child or grandchild
pid_t current_pid = waitpid(-1, &status, __WALL);

// Check if the stop was caused by a new process spawning
if ((status >> 16) == PTRACE_EVENT_FORK || (status >> 16) == PTRACE_EVENT_CLONE) {
    unsigned long new_pid_l;
    ptrace(PTRACE_GETEVENTMSG, current_pid, 0, &new_pid_l);
    
    // Register the new child in the process tree map
    log_tree_event((pid_t)new_pid_l, current_pid, depth + 1, "SPAWNED", "Fork Detected");
}

```

## Verification

* **Scenario:** `bash` (Parent) → executes `recursive_fork` (Child) → spawns `Payload` (Grandchild).
* **Result:** Sentinel successfully intercepted the `mkdir` syscall from the *Grandchild* process (PID 67841) and blocked it based on the policy.
* **Outcome:** The "Grandchild Blind Spot" is eliminated.

