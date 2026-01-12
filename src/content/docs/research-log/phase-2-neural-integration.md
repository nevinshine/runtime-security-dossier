---
title: "Phase 2: Neural Integration"
description: "Connecting the kernel to the neural network (Days 16-30)."
sidebar:
  order: 2
---

# Phase 2: Neural Integration (Days 16–Current)

**Status:** Active / In Progress
**Focus:** IPC, Deep Introspection, and Real-Time Inference.

While Phase 1 focused on the **Foundations** (Trace, Block, Train), Phase 2 is about **Connection**. We are bridging the gap between the C-based Kernel Monitor and the Python-based AI.

---

## Progress Log

### Day 19: The Neural Bridge (IPC)
**Goal:** Establish high-speed communication between C and Python.

We implemented a **Named Pipe (FIFO)** architecture at \`/tmp/sentinel_ipc\`.
* **The Transmitter (C):** Streams syscall telemetry in real-time.
* **The Receiver (Python):** Listens for events to feed the Neural Network.
* **Result:** Validated < 1ms latency for local IPC.

### Day 18: Deep Introspection (v0.8)
**Goal:** Give Sentinel "Eyes" to read memory.

We upgraded the C engine to use \`PTRACE_PEEKDATA\`.
* **Capability:** Sentinel can now dereference memory pointers in registers (e.g., \`RDI\`) to read actual filename strings.
* **Significance:** This enables semantic policies (e.g., "Block paths containing *malware*") rather than just blocking specific syscall numbers.

### Day 16: Research Dossier Launch
**Goal:** Formal Documentation.

We released the **Runtime Security Dossier** (v1.0) to document the Phase 1 findings. This site serves as the living lab notebook for the project.

---

## Upcoming Objectives

* **Live Inference:** Triggering the DWN model from live syscall data.
* **Latency Optimization:** Ensuring the full loop (Trace -> Python -> Predict -> Block) happens fast enough to prevent timeouts.

