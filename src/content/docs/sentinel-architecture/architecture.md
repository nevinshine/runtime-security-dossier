---
title: System Architecture
description: Technical breakdown of the recursive interception and active enforcement pipeline.
sidebar:
  order: 2
---

### The Recursive Interception Pipeline

At the core of Sentinel is a **recursive user-space interceptor**, implemented in C using the Linux `ptrace` API.  
Unlike standard debuggers, Sentinel attaches to the entire **process tree** (Parent, Child, Grandchild) to prevent evasion via forking.

---

### 1. Recursive Process Attachment

Sentinel launches the target program and immediately instructs the kernel to **auto-attach** to any new subprocesses. This eliminates the "Grandchild Blind Spot."

```c
// Simplified C Logic (M2.0)
pid_t child = fork();

if (child == 0) {
    // Child Process (Target Program)
    ptrace(PTRACE_TRACEME, 0, NULL, NULL);
    raise(SIGSTOP);                  // Synchronize with parent
    execvp(target_program, args);
} else {
    // Parent Process (Sentinel)
    waitpid(child, &status, 0);      // Wait for child to stop
    
    // CRITICAL: Enable Recursive Tracing
    // PTRACE_O_TRACEFORK: Auto-trace any child spawned by this process
    // PTRACE_O_TRACESYSGOOD: Distinguish syscall stops from other signals
    ptrace(PTRACE_SETOPTIONS, child, 0, 
           PTRACE_O_TRACEFORK | PTRACE_O_TRACESYSGOOD);
           
    // Begin Event Loop
}

```

Key properties:

* **Zero-Touch Inheritance:** The tracer does not need to manually attach to new PIDs; the Kernel handles it.
* **Race-Condition Free:** The child is stopped *before* it can execute a single instruction.

---

### 2. The Semantic Event Loop

Sentinel resumes the traced process tree using `PTRACE_SYSCALL`. The event loop is asynchronous, handling signals from *any* PID in the tree.

```c
// Asynchronous Event Loop (M2.0)
while (1) {
    // Wait for ANY process in the group (-1)
    pid_t current_pid = waitpid(-1, &status, 0);

    // Case A: It's a Syscall
    if (WIFSTOPPED(status) && (status >> 8) == (SIGTRAP | 0x80)) {
        handle_syscall(current_pid);
    }
    
    // Case B: It's a Fork Event (New Child Born)
    else if (status >> 8 == (SIGTRAP | (PTRACE_EVENT_FORK << 8))) {
        unsigned long new_pid;
        ptrace(PTRACE_GETEVENTMSG, current_pid, 0, &new_pid);
        register_new_process(new_pid); // Add to tracking table
    }
}

```

---

### 3. Deep Introspection (The "Eye")

To understand intent, Sentinel looks inside the process memory. When a sensitive syscall (e.g., `openat`, `execve`) is detected, we perform **Argument Extraction**.

* **Mechanism:** `PTRACE_PEEKDATA`
* **Operation:** We read the child's memory word-by-word (8 bytes) to reconstruct string arguments (e.g., file paths, URLs).

```c
// Reading a string from Child Memory
long word = ptrace(PTRACE_PEEKDATA, child_pid, addr + offset, NULL);
// Reassemble bytes into "char *filepath"

```

---

### 4. Telemetry Output (IPC Bridge)

Instead of writing to a CSV log (which is too slow), Sentinel streams telemetry to a **FIFO Pipe** (`/tmp/sentinel_ipc`) for real-time consumption by the Python Brain.

**Format:** `SYSCALL:<name>:<args>`

**Example:** `SYSCALL:mkdir:my_malware_folder`

---

### 5. Active Enforcement (The "Shield")

This is the **Kill Switch**. If the Policy Engine returns a `BLOCK` verdict, Sentinel neutralizes the threat *before* the kernel executes it.

**Technique: Register Injection**

1. **Pause:** The process is stopped at syscall entry.
2. **Inject:** We overwrite the Syscall Number Register (`ORIG_RAX`) with `-1`.
3. **Resume:** The kernel sees "Syscall -1" (Invalid).
4. **Result:** The kernel returns `ENOSYS` (Function Not Implemented). The process is blocked, but not crashed.

```c
if (verdict == BLOCK) {
    struct user_regs_struct regs;
    ptrace(PTRACE_GETREGS, pid, 0, &regs);
    regs.orig_rax = -1; // INVALID_SYSCALL
    ptrace(PTRACE_SETREGS, pid, 0, &regs);
}

```

---

### Architectural Intent

This architecture prioritizes:

* **Completeness:** No process can escape via forking.
* **Context:** Decisions are made on *Data* (arguments), not just *Metadata* (syscall numbers).
* **Safety:** Non-destructive blocking (ENOSYS) allows for graceful degradation.

Sentinel Runtime is designed as a **Closed-Loop Control System** for enforcing semantic invariants on untrusted Linux executables.


