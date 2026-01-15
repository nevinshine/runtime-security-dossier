---
title: Kernel Internals (M2.0)
description: Notes on Linux Process Management, Memory, and Lineage.
---

## The `task_struct`

In Linux, every process is represented by a massive structure called `task_struct`. This is the "soul" of the process.

* **Location:** Kernel Memory (User space cannot read this directly).
* **Key Fields:**
    * `pid`: The Process ID.
    * `mm`: Pointer to the Memory Descriptor (Virtual Memory).
    * `files`: List of open file descriptors.
    * `ptrace`: A flag indicating if the process is being watched.

> **Research Note:** When we attach `ptrace`, we are essentially flipping a bit in the child's `task_struct` that tells the Scheduler: *"Before you execute a syscall, ask the Parent first."*

---

## Process Lineage (The Family Tree)

The `task_struct` also defines the relationships that Sentinel M2.0 tracks:

* **`real_parent`**: Pointer to the process that created this one (The Shell).
* **`children`**: A linked list of processes created by this task (The "Grandchildren").

**The Blind Spot:**
By default, `ptrace` only attaches to the target `task_struct`. It does **not** follow the `children` list.
**The Fix (M2.0):**
Using `PTRACE_O_TRACEFORK` instructs the Kernel to automatically attach the tracer to any new `task_struct` that gets added to this list.

---

## User Space vs. Kernel Space

The x86_64 architecture enforces a hard boundary (Ring 0 vs Ring 3).

| Zone | Privilege | Access | Example |
| :--- | :--- | :--- | :--- |
| **Kernel (Ring 0)** | Infinite | Can touch any memory, hardware, or process. | `sys_openat`, `schedule()` |
| **User (Ring 3)** | Restricted | Can only touch its own stack/heap. | `printf`, `malloc`, `main()` |

### The Crossing (Syscall)
A syscall is a **Controlled Transition**. The CPU switches from Ring 3 to Ring 0, executes the specific function requested by `RAX`, and switches back. Sentinel lives on the **User** side but controls the **Transition** gate.
