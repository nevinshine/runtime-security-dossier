---
title: Threat Models (M2.0)
description: Attack Vectors and Behavioral Signatures detected by Sentinel.
---

## Behavioral Signatures

Sentinel does not look for "Bad Files" (Signatures). It looks for "Bad Intent" (Behavior).

### 1. Ransomware (The Encryptor)
Ransomware has a very loud syscall profile.
* **Normal Program:** Reads a file, waits, writes to a log.
* **Ransomware:** `open` -> `read` -> `encrypt` -> `write` (Repeated 1000x/sec).
* **Detection:** A sudden spike in `read/write` syscall density targeting user documents.

### 2. The Dropper (The Loader)
Malware often starts as a small script that downloads the real weapon.
* **Signature:**
    1.  `socket` / `connect` (Network activity).
    2.  `write` (Saving payload to disk).
    3.  `mprotect` (Making memory executable).
    4.  `execve` (Running the payload).
* **Sentinel Policy:** Block `connect` followed immediately by `execve` in non-browser applications.

### 3. Evasion (Anti-Debugging)
Malware checks if it is being watched.
* **Technique:** Calling `ptrace(PTRACE_TRACEME)` on itself.
* **Result:** If it fails, the malware knows a debugger (Sentinel) is already attached, so it shuts down to hide its behavior.

### 4. The Grandchild (Process Tree Evasion)
*Addressed in M2.0*

Sophisticated malware attempts to "detach" from the monitor by spawning a child process to perform the attack, assuming the EDR is only watching the parent.

* **Technique:**
    1.  `Parent` (Bash Script) starts.
    2.  `Parent` calls `fork()` + `execve()` to launch `Child` (Python Ransomware).
    3.  `Parent` exits immediately.
    4.  `Child` is now an orphan, running unwatched by naive tracers.
* **Sentinel M2.0 Defense:**
    * **Recursive Tracking:** Using `PTRACE_O_TRACEFORK`, Sentinel automatically attaches to the `Child` the moment it is born.
    * **Inheritance:** The security policy applied to the Parent is automatically inherited by the Grandchild.
