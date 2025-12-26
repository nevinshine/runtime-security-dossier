---
title: Sentinel Sandbox
description: A kernel-level behavioral analysis system using ptrace-based syscall interception and Weightless Neural Networks.
sidebar:
  order: 1
---

### // Project Overview
**Sentinel Sandbox** is a research-oriented runtime analysis system designed to study **program behavior at the Linux kernel level** using system call (syscall) monitoring and lightweight machine learning.

Unlike traditional antivirus software that relies on static file signatures (hashes), Sentinel observes **how a program behaves at runtime** by intercepting its interactions with the Linux kernel.

The system focuses on **behavioral anomaly detection**, rather than signature matching or static analysis.

---

### // Core Hypothesis
> *"Malicious behavior is better characterized by how a program interacts with the kernel than by how its code appears on disk."*

All programs—benign or malicious—must request services from the kernel using system calls (e.g., `open`, `read`, `write`, `execve`).  
By modeling **patterns of syscall usage**, it is possible to distinguish normal behavior from anomalous or suspicious execution.

---

### // Why System Calls?
- Syscalls represent **ground-truth behavior**
- They cannot be obfuscated away
- Even packed or encrypted malware must interact with the kernel
- Behavioral patterns remain observable even when code changes

Sentinel treats syscall activity as a **behavioral signal**, not a signature.

---

### // Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Interceptor** | **C / ptrace** | Attaches to processes and intercepts system calls at syscall entry points |
| **Behavior Bridge** | **Python 3** | Converts syscall streams into structured, binary representations |
| **Detection Engine** | **Weightless Neural Network (DWN/WiSARD)** | Learns statistical patterns of normal behavior using lookup-table-based learning |
| **Execution Model** | **Bare Metal (User Space)** | No kernel modules, no virtualization, minimal system interference |

> *Note:* The current implementation operates on the host system using `ptrace`. Containerization and isolation are considered future extensions.

---

### // Research Goals
1. **Behavioral Detection:**  
   Detect anomalous program execution based on syscall behavior rather than file signatures.

2. **Lightweight ML:**  
   Explore **Weightless Neural Networks** as an alternative to deep learning for runtime security tasks.

3. **CPU-Only Operation:**  
   Design a system that functions without GPUs or hardware acceleration.

4. **Kernel-Level Fidelity:**  
   Preserve accurate syscall semantics while minimizing analysis overhead.

---

### // Research Status
- ✔ Syscall interception validated on real Linux programs
- ✔ End-to-end pipeline from kernel tracing to ML training completed
- ✔ Differentiable Weightless Neural Network (DWN) integrated
- 🔜 Anomaly scoring and evaluation experiments in progress

---

### // Scope & Intent
Sentinel Sandbox is a **research and learning platform**, not a production malware sandbox.

Its primary purpose is to:
- understand low-level program behavior
- study lightweight ML techniques
- explore the intersection of systems security and machine learning

---

### // Experimental Finding: Temporal Structure Matters
Initial experiments using syscall frequency histograms showed limited separation between benign and abnormal executions. While syscall counts capture *what* operations occur, they fail to capture *when* they occur.

To address this, Sentinel introduced **temporal bucketing**, where each syscall window is divided into ordered segments and processed independently.

This change significantly improved anomaly score separation without modifying the underlying Weightless Neural Network.

**Implication:**  
Effective syscall-based detection depends more on **behavioral representation** than on model complexity.

---

### // Runtime Anomaly Classification (Threshold-Calibrated)

After training the Weightless Neural Network (DWN) on **normal syscall behavior only**, Sentinel introduces a **statistical decision layer** to convert raw model scores into actionable security signals.

Rather than relying on labeled attack data, Sentinel uses **distribution-based calibration**:

1. Collect anomaly scores from normal execution traces
2. Estimate the score distribution (mean, standard deviation)
3. Define decision thresholds using statistical deviation

#### Threshold Levels
| Severity | Definition |
|--------|------------|
| **NORMAL** | Score ≥ μ − 1σ |
| **SUSPICIOUS** | μ − 2σ ≤ Score < μ − 1σ |
| **ANOMALOUS** | μ − 3σ ≤ Score < μ − 2σ |
| **CRITICAL** | Score < μ − 3σ |

This approach mirrors how real intrusion detection systems operate:  
**model behavior first, enforce policy later**.

#### Runtime Classification
Each syscall window is evaluated independently and assigned a severity class in real time:

- NORMAL → expected execution
- SUSPICIOUS → behavioral deviation
- ANOMALOUS → likely misuse or exploit behavior
- CRITICAL → severe deviation requiring intervention

This completes Sentinel’s detection loop:
> kernel trace → feature encoding → ML inference → calibrated decision

#### Experimental Outcome
On live syscall traces:
- Most windows classified as **NORMAL**
- Natural variance appears as **SUSPICIOUS**
- Rare **ANOMALOUS** windows detected
- No false **CRITICAL** escalation during benign runs

**Key Insight:**  
Accurate behavioral detection depends more on **representation and calibration** than on model complexity.

---
