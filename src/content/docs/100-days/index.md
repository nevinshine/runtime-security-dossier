---
title: "100 Days of DevSecOps"
description: "Building a hardened Linux environment, security tools, and automation scripts from scratch."
sidebar:
  order: 1
---

> **Goal:** Building a hardened Linux environment, security tools, and automation scripts from scratch.  
> **Tech Stack:** Linux (Ubuntu), Bash, UFW, OpenSSH, Python.  
> **Current Status:** <span style="color:#39FF14; font-weight:bold;">🟢 Active (Day 13/100)</span>

## 📂 Progress Log

| Day | Topic | Description | Status |
| :--- | :--- | :--- | :--- |
| **Day 14** | Research Environment Stabilization | Native Ubuntu + Sentinel Pipeline Validation | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 13** | Review & Recovery | Review of previous chnages | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 12** | Runtime Anomaly Classification | Threshold-calibrated syscall behavior decision logic | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 11** | Anomaly Score Validation | Kernel-Level Score Interpretation & Stability Analysis | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 10** | Temporal Feature Engineering | Improving Syscall Anomaly Detection via Temporal Bucketing | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 09** | Research Consolidation | Sentinel Sandbox Architecture & Understanding | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 08** | AI Anomaly Detection | CPU-Optimized Weightless Neural Network | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 07** | Fail2Ban | Automated Intrusion Prevention System | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 06** | SSH Hardening | Disabling Passwords, Enforcing Key Auth |<span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 05** | File Integrity Monitor | SHA-256 Hashing & Baseline Comparison |  <span style="color:#39FF14; font-weight:bold;">Completed</span>|
| **Day 04** | Firewall Automation | UFW Configuration Script | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 03** | Net Sentry | Port Scanning & Intrusion Detection | <span style="color:#39FF14; font-weight:bold;">Completed</span>|
| **Day 02** | Process Management | Linux Lifecycle & Signal Handling | <span style="color:#39FF14; font-weight:bold;">Completed</span> |
| **Day 01** | Identity Audit | User & Root Account Auditing | <span style="color:#39FF14; font-weight:bold;">Completed</span> |

---

## Detailed Operations Log

### Day 14: Research Environment Stabilization
- **Problem:** VM-based development introduced performance overhead and instability during syscall tracing and ML experiments.
- **Solution:** Migrated to native Ubuntu 22.04 and rebuilt the entire Sentinel Sandbox environment.
- **Actions Taken:**
  - CPU-only PyTorch environment
  - Fixed feature dimension mismatches
  - Verified end-to-end experiment pipeline
- **Result:** Stable, reproducible research setup ready for extended experimentation.

### Day 13: Review & Recovery
**Focus:**  
- Reviewed Sentinel Sandbox architecture and recent experiments
- Validated previous results and logs
- Identified no new implementation work for the day
**Reason:**  
Heavy research and debugging in prior days required a recovery window to avoid rushed or low-quality work.
**Status:** Completed (No new code changes)

### Day 12: Runtime Anomaly Classification (Research)

- Calibrated anomaly score baselines using **normal syscall traces only**
- Computed statistical properties of anomaly scores (mean μ, standard deviation σ)
- Defined severity thresholds based on deviation from normal behavior:
  - NORMAL (≥ μ − 1σ)
  - SUSPICIOUS (μ − 2σ to μ − 1σ)
  - ANOMALOUS (μ − 3σ to μ − 2σ)
  - CRITICAL (< μ − 3σ)
- Persisted calibrated thresholds for reuse during runtime detection
- Implemented runtime classification logic to map syscall windows to severity levels
- Validated classification on live syscall traces including abnormal workloads
- Observed stable behavior with conservative anomaly escalation and no critical false positives

**Key Insight:**  
Feature representation and statistical calibration are more impactful for syscall-based anomaly detection than increasing model complexity.

**Status:** <span style="color:#39FF14; font-weight:bold;">Completed</span>


### Day 11: Kernel Anomaly Score Validation & Interpretation
**Context**  
By Day 10, Sentinel Sandbox successfully generated anomaly scores from live kernel syscall traces using a temporally bucketed representation and a CPU-only Weightless Neural Network (DWN).  
Day 11 focused on validating the *meaning* and *stability* of these scores rather than extending the architecture.
**Objective**  
To confirm that the anomaly scores:
- Are structurally stable across runs
- Reflect differences in kernel behavior
- Can be interpreted statistically (not as hard classifications)
**Work Performed**
- Re-ran training and scoring pipelines end-to-end
- Verified preprocessing invariants:
  - Fixed input dimensionality (**43,008 bits**)
  - No histogram expansion from unknown syscalls
  - Deterministic temporal bucketing
- Scored syscall traces from:
  - Normal interactive shell usage
  - Abnormal syscall-heavy executions
**Observations**

- **Normal Discriminator**
  - Consistently positive mean response
  - Indicates strong memorization of benign syscall patterns

- **Attack Discriminator**
  - Suppressed or negative response
  - Expected due to normal-only training regime

- **Anomaly Score (Normal − Attack)**
  - Positive mean for normal behavior
  - Large variance, expected at prototype scale
  - Clear distribution shift between normal and abnormal traces

**Interpretation**
- The system behaves as a **statistical anomaly detector**
- No explicit thresholding is applied at this stage
- Scores must be interpreted relative to learned benign behavior
- This aligns with classical IDS design principles

**What Was Intentionally Deferred**
- Threshold calibration
- False-positive rate tuning
- ROC / precision–recall evaluation

**Outcome**  
Sentinel Sandbox now demonstrates:- End-to-end kernel-level anomaly scoring
- Stable and interpretable score distributions
- Readiness for the next research phase: **threshold calibration and false-positive analysis**

**Status**  
**Completed**


### Day 10: Temporal Feature Engineering (Research)
- **Context:**  
  Initial anomaly detection experiments using syscall *frequency-only* histograms showed heavy overlap between normal and abnormal behavior. While the system functioned end-to-end, the representation lacked temporal context.
- **Problem Identified:**  
  Syscall frequency captures *what* happens, but not *when* it happens.  
  Different behaviors (interactive shell vs stress workloads) can produce similar syscall counts, leading to weak anomaly separation.
- **Approach Taken:**  
  Improved the **data representation**, not the ML model.
  Implemented **temporal bucketing** in the syscall processing pipeline:
  - Each syscall window is divided into multiple ordered segments
  - A histogram is computed per segment
  - Histograms are concatenated to preserve coarse execution order
- **Implementation Details:**
  - Modified `SentinelBridge` to support `num_buckets`
  - Increased input dimensionality from **2688 → 10752 bits**
  - Left the DWN architecture, EFD training, and classifier unchanged
  - Retrained the model using only benign syscall traces
- **Experiment Conducted:**
  - Scored syscall traces from:
    - Normal interactive shell activity
    - Abnormal syscall-intensive workloads
  - Compared anomaly score distributions between the two cases
- **Observed Result:**
  - Normal behavior produced **strongly positive anomaly scores**
  - Abnormal behavior produced **negative anomaly scores**
  - Clear distribution shift observed after temporal bucketing
  - Separation was significantly stronger than the frequency-only baseline
- **Key Insight:**
  > Feature representation has a larger impact on syscall-based anomaly detection than model complexity.
- **Limitations:**
  - Small sample size (prototype stage)
  - No detection thresholds or accuracy metrics defined
  - Results validate architectural direction, not production readiness
- **Outcome:**  
  Temporal structure is critical for syscall anomaly detection.  
  Sentinel Sandbox now demonstrates a meaningful behavioral distinction using a lightweight, CPU-only Weightless Neural Network.
- **Status:**  
  <span style="color:#39FF14; font-weight:bold;">Completed</span>

### Day 9: Research Consolidation & System Understanding
- **Focus:** Reflection, documentation, and conceptual clarity after building Sentinel Sandbox.
- **Problem:**  
  After several days of intensive low-level systems and ML work, technical progress was outpacing conceptual understanding. Continuing without consolidation risked shallow learning and burnout.
- **What I Did:**
  - Reviewed the complete **Sentinel Sandbox pipeline** from kernel tracing → data representation → ML decision
  - Documented the system architecture, research intent, and limitations
  - Converted implementation work into **clear written explanations** (research dossier & project docs)
  - Refined README, architecture pages, and DevSecOps logs for accuracy and credibility
- **Key Learnings:**
  - Learning happens in phases: *exposure → confusion → clarity*
  - Surface-level familiarity is a valid and necessary research stage
  - Writing explanations reveals gaps faster than coding
  - Honest documentation is more valuable than exaggerated results
- **Outcome:**
  - Sentinel Sandbox documentation now accurately reflects the real system
  - Research work is better structured for future deep dives
  - Mental reset achieved before moving into anomaly scoring and experiments
- **Status:**  
  Consolidation complete. Ready to proceed with controlled experimentation.

> **Note:**  
> Day 9 was intentionally kept lightweight to allow concepts to settle before advancing further.


### Day 8: AI-Powered Intrusion Detection (Research)
- **Project Link:** [Sentinel Sandbox Source Code](https://github.com/nevinshine/sentinel-sandbox)

- **Problem:**  
  Kernel-level security systems require **low-latency and interpretable detection**, but traditional deep learning models (LSTMs, CNNs) are heavyweight and poorly suited for CPU-only environments.
- **Focus:**  
  Explore **behavior-based anomaly detection** using **Weightless Neural Networks (WiSARD-style)** instead of deep neural networks.
- **What I Built:**
  - A **ptrace-based syscall tracer** to observe real Linux program behavior
  - A data pipeline that converts syscall streams into:
    - Sliding windows
    - Bag-of-syscalls histograms
    - Thermometer-encoded binary vectors
  - A **Differentiable Weightless Neural Network (DWN)** trained using **Extended Finite Difference (EFD)**
- **Key Learnings:**
  - System calls represent ground-truth program behavior
  - Binary encoding strongly affects model stability
  - Weightless models can learn behavioral patterns without GPUs
  - Differentiable training enables learning while preserving lookup-based inference
- **Current Status:**
  - End-to-end pipeline validated on **real kernel syscall traces**
  - Normal-only behavioral learning demonstrated
  - Accuracy optimization and anomaly thresholding deferred to later experiments

> **Note:**  
> This day focused on **architecture validation and learning**, not production metrics or benchmark optimization.

### Day 7: Fail2Ban Intrusion Prevention
- **Problem:** Even with SSH keys, bots can flood the server with thousands of login attempts, wasting resources.
- **Solution:** Installed **Fail2Ban** to monitor `/var/log/auth.log` and automatically update Firewall rules.
- **Configuration:**
  - **Bantime:** 1 hour (Punishment duration)
  - **Maxretry:** 3 attempts (Strike limit)
  - **Action:** Immediate IP block via `iptables`/UFW.

### Day 6: SSH Hardening & Key Authentication
- **Problem:** Default SSH settings allow attackers to brute-force passwords and log in as `root`.
- **Solution:** Configured `/etc/ssh/sshd_config` to strictly enforce **Ed25519 SSH Keys**.
- **Hardening Steps:**
  - `PermitRootLogin no` (Stop God-mode login)
  - `PasswordAuthentication no` (Disable text passwords)
  - `PubkeyAuthentication yes` (Require cryptographic keys)

### Day 5: File Integrity Monitor (FIM)
- **Problem:** Attackers often modify system binaries or configs (like `/etc/shadow`) to maintain persistence.
- **Solution:** `tripwire.sh` - A script that creates SHA-256 baselines of critical files and alerts on modification.
- **Command:** `./tripwire.sh check`

### Day 4: Firewall Automation
- **Problem:** Leaving ports open is the #1 vulnerability.
- **Solution:** `setup_firewall.sh` - Automated UFW configuration to deny all incoming traffic except SSH.

### Day 3: Network Intrusion Detection
- **Problem:** Identifying unauthorized services listening on the network.
- **Solution:** `net_sentry.sh` - A scanner that detects listening ports and checks for public exposure (`0.0.0.0`).

### Day 2: Process Management
- **Topic:** Linux Process Lifecycle.
- **Artifact:** `proc_cheat_sheet.md` - Documentation on `top`, `ps aux`, and signal handling (`kill`).

### Day 1: Identity & Access Audit
- **Problem:** Unused accounts are potential backdoors.
- **Solution:** `user_audit.sh` - A script to list human users (Bash shells) and Root-privileged accounts (UID 0).

---
<small>Created by Nevin Shine as part of the 100 Days Challenge.</small>
