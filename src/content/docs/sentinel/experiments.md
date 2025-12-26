---
title: Experiments
description: Experimental workflow, anomaly scoring, and threshold calibration for Sentinel Sandbox.
sidebar:
  order: 3
---

## Overview

This section documents the **experimental phase** of the Sentinel Sandbox project.  
The goal of these experiments is to evaluate whether **kernel-level syscall behavior**, when properly represented, can be separated into *normal* and *abnormal* executions using a **CPU-only Weightless Neural Network (DWN)**.

All experiments are conducted on **real syscall traces** captured via `ptrace` on a Linux system.

---

## Experiment Pipeline

Each experiment follows the same core pipeline:

1. **Trace Collection**
   - Syscalls are intercepted using a C-based `ptrace` tracer.
   - Output is logged as structured CSV (`pid, syscall_nr, arg_class`).

2. **Feature Construction**
   - Syscall streams are segmented into sliding windows.
   - Each window is divided into **temporal buckets**.
   - Histograms are computed per bucket.
   - Histograms are encoded using **thermometer encoding** into fixed-size binary vectors.

3. **Model Scoring**
   - Binary vectors are passed to a trained DWN classifier.
   - Two independent discriminators produce scores:
     - Normal discriminator
     - Attack discriminator
   - Anomaly score is computed as:

     ```
     anomaly_score = normal_score - attack_score
     ```

---

## Temporal Feature Engineering

### Motivation

Early experiments using **frequency-only syscall histograms** showed heavy overlap between benign and abnormal traces.

The issue:
- Frequency captures *what* syscalls occur
- It does **not capture execution order**

### Solution

Introduce **temporal bucketing**:

- Each syscall window is divided into ordered segments
- A histogram is computed per segment
- Encoded segments are concatenated into one binary vector

This preserves **coarse execution order** while remaining lightweight.

### Result

- Input dimensionality increased from `2,688 → 43,008 bits`
- No changes were required to:
  - DWN architecture
  - Training logic
  - Loss formulation

Only the **representation** changed.

---

## Anomaly Scoring Experiment

### Setup

- Model trained using **benign-only syscall traces**
- Scoring performed on:
  - Normal interactive shell execution
  - Abnormal syscall-intensive workloads

### Observations

- Normal traces produce **positive anomaly scores**
- Abnormal traces shift toward **lower / negative scores**
- Distribution separation improves significantly with temporal encoding

Example summary (representative):

```

Normal Discriminator Response
mean: positive
Attack Discriminator Response
mean: negative
Anomaly Score (Normal - Attack)
clear distribution shift

```

This validates that **behavioral structure**, not model complexity, is the key driver.

---

## Threshold Calibration

To move from raw scores to actionable signals, thresholds were calibrated using **normal baseline statistics**.

### Categories

Based on score distribution:

- **NORMAL**
- **SUSPICIOUS**
- **ANOMALOUS**
- **CRITICAL**

Thresholds are derived from mean and standard deviation of benign traces and saved as:

```

checkpoints/thresholds.json

```

This enables **deterministic classification** without retraining.

---

## Window-Level Classification

Each syscall window is classified independently using calibrated thresholds.

Example output:

```

NORMAL      : 38
SUSPICIOUS  : 9
ANOMALOUS   : 1
CRITICAL    : 0

```

This allows:
- Fine-grained behavioral inspection
- Timeline-based alerting
- Future real-time enforcement

---

## Limitations

- Small sample size (prototype scale)
- No labeled attack dataset yet
- No runtime blocking implemented
- Evaluation focuses on **separation**, not accuracy metrics

These experiments validate **architectural direction**, not production readiness.

---

## Key Insight

> **Feature representation has a greater impact on syscall anomaly detection than model complexity.**

Temporal structure is essential.  
Weightless Neural Networks are sufficient when the input is engineered correctly.

---

## Current Status

- ✔ End-to-end syscall → ML → score pipeline complete
- ✔ Temporal feature engineering validated
- ✔ Threshold-based classification implemented
- 🔜 Live enforcement and continuous learning experiments planned
```