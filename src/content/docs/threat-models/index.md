---
title: Threat Models & Defense Theory
description: Attack Vectors and Behavioral Signatures detected by Sentinel.
sidebar:
  label: Threat Models
  order: 12
---
Sentinel is engineered to defeat **Behavioral Threats**—malware that evades static signature detection by looking "clean" on disk but acting maliciously in memory.

## Behavioral Signatures

Sentinel does not scan for "Bad Files" (Signatures). It scans for "Bad Intent" (Behavior).

### 1. Ransomware (The Encryptor)
Ransomware has a distinct, high-volume syscall profile that differentiates it from normal editing tools.

* **Normal Program:** Reads a file, waits for user input, writes to a temp file.
* **Ransomware:** `open` &rarr; `read` &rarr; `encrypt` &rarr; `write` (Repeated 1000x/second).
* **Detection Logic:** A sudden, high-density spike in `read`/`write` syscalls targeting user-owned documents (e.g., PDF, DOCX) triggers the heuristic engine.

### 2. The Dropper (The Loader)
Modern malware often starts as a benign script ("The Dropper") that downloads the actual weaponized payload.

* **The Kill Chain:**
    1.  `socket` / `connect` (Network activity).
    2.  `write` (Saving payload to disk).
    3.  `mprotect` (Making the memory page executable).
    4.  `execve` (Running the payload).
* **Sentinel Policy:** The engine flags sequences where a process establishes an external connection and immediately executes a newly written binary.

### 3. Anti-Debugging Evasion
Malware often checks if it is being watched by an Analyst or EDR.

* **Technique:** The malware calls `ptrace(PTRACE_TRACEME)` on itself.
* **The Trap:** Since a process can only be traced by one parent at a time, this call will **fail** if Sentinel is already attached.
* **Result:** The malware realizes it is being watched and terminates immediately, effectively neutralizing itself.

### 4. Process Tree Evasion (The Grandchild)
Sophisticated malware attempts to "detach" from the monitor by spawning a child process to perform the attack, assuming the EDR is only watching the parent.

* **The Attack:**
    1.  `Parent` (Bash Script) starts.
    2.  `Parent` calls `fork()` to launch `Child` (Python Ransomware).
    3.  `Parent` exits immediately.
    4.  `Child` is now an orphan, often running unwatched by naive tracers.
* **The Defense (Recursive Tracking):**
    Sentinel uses `PTRACE_O_TRACEFORK` to maintain a persistent grip on the lineage. The moment a Child is born, the Kernel pauses it and hands control to Sentinel. The security policy of the Parent is automatically inherited by the Grandchild, ensuring no "Gap of Authority" exists.
