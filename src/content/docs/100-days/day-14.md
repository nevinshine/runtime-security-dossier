---
title: "Day 14: Research Environment Stabilization"
description: "Stabilizing the Linux research environment and aligning Sentinel Sandbox for reproducible experiments."
---

## 🎯 Objective
Prepare a **clean, reproducible, research-ready Linux environment** to support continued development and experimentation with the Sentinel Sandbox project.

---

## 🧠 Context
After multiple days of kernel-level experimentation, ML feature engineering, and anomaly detection experiments, the development environment required consolidation and verification.

Unstable environments undermine research credibility.  
Day 14 focused on **stability over new features**.

---

## 🔧 Work Completed

### 1. Native Ubuntu Setup
- Migrated from VM-based development to **native Ubuntu 22.04**
- Verified:
  - WiFi drivers
  - Keyboard & input latency
  - CPU frequency scaling
- Reduced thermal overhead compared to virtualization

### 2. Python Environment Hardening
- Created isolated virtual environment (`.venv`)
- Installed CPU-only stack:
  - `torch`
  - `numpy`
  - `pandas`
  - `matplotlib`
  - `scikit-learn`
- Confirmed **no CUDA / NVIDIA dependency**

### 3. Sentinel Sandbox Alignment
- Rebuilt and verified:
  - `SentinelBridge`
  - DWN model loading
  - Score generation pipeline
- Fixed:
  - Module import paths
  - Inconsistent feature dimensions
  - Missing checkpoint directories

### 4. Experiment Pipeline Validation
- Verified end-to-end flow:
  - syscall trace → features → model → scores → thresholds
- Generated and saved:
  - `scores_normal.npy`
  - `scores_abnormal.npy`
  - `thresholds.json`

---

## 🧪 Outcome
- Environment is now **research-stable**
- Sentinel Sandbox runs end-to-end without runtime errors
- Ready for:
  - Extended experiments
  - Dataset expansion
  - Research documentation

---

## 🔍 Key Insight
> Research velocity depends more on **environment stability** than on adding new features.

---

## ✅ Status
**Completed**


