---
title: "M1.0: The Closed-Loop Control System"
description: "Establishing the synchronous IPC bridge between C and Python."
sidebar:
  label: "M1.0: Closed Loop"
  order: 1
---

**Date:** 2026-01-14  
**Status:** ✅ Operational (M1.0)  
**Focus:** IPC / System Integration

## The Architecture Problem
Sentinel requires two contradictory properties:
1.  **Low-Level Speed:** The interception engine must be in C to interface with the Kernel via `ptrace` with minimal overhead.
2.  **High-Level Intelligence:** The policy engine must be in Python to leverage libraries like WiSARD and Scikit-learn.

**The Challenge:** How do we make C and Python talk in real-time without slowing down the target process?

## The Engineering Solution: Named Pipes (FIFOs)
We rejected HTTP/Sockets (too much TCP overhead) in favor of **Named Pipes (FIFOs)**. This creates a direct, file-system-based channel between the two distinct processes.

### 1. The Nervous System
We established two unidirectional channels in `/tmp/`:

```bash
mkfifo /tmp/sentinel_req   # C -> Python (Sensory Input)
mkfifo /tmp/sentinel_resp  # Python -> C (Motor Command)

```

### 2. The Blocking Protocol

The critical feature of this design is **Synchronous Blocking**.

1. **Freeze:** The C Engine pauses the Target Process at a syscall entry.
2. **Send:** It writes `SYSCALL:unlink:protected.txt` to the Request Pipe.
3. **Wait:** It performs a blocking `read()` on the Response Pipe. The kernel puts the C Engine to sleep.
4. **Decide:** Python wakes up, reads the request, thinks, and writes `0` (BLOCK).
5. **Act:** The C Engine wakes up, sees the `0`, and injects `EPERM` into the Target.

## The Protocol Definition

We defined a lightweight text-based protocol for "The Bridge":

| Direction | Format | Example |
| --- | --- | --- |
| **Request** | `TYPE:PID:VERB:ARG` | `SYSCALL:1045:unlink:passwords.txt` |
| **Response** | `VERDICT` | `1` (Allow) or `0` (Block) |

## Verification

We validated the loop by running a "Ping Pong" test where Python randomly allowed/blocked `mkdir` commands.

* **Latency:** Average round-trip time (RTT) was measured at **~40 microseconds**, well within the budget for runtime enforcement.
