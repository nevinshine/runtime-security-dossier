---
title: "Day 12: Runtime Anomaly Classification (Threshold Calibration)"
description: "Calibrating anomaly scores from syscall-based DWN models into actionable runtime security decisions."
sidebar:
  order: 12
---

## Objective
Transform raw anomaly scores produced by the Sentinel Sandbox into **meaningful runtime security decisions** without using labeled attack data.

The goal was to move from *“the model outputs a number”* to *“the system makes a decision.”*

---

## Background
By the end of Day 11, Sentinel Sandbox had a complete pipeline for:

- Linux syscall interception using `ptrace`
- Feature extraction via sliding windows and temporal bucketing
- CPU-only Weightless Neural Network (DWN/WiSARD-style)
- Anomaly scoring based on **Normal − Attack discriminator response**

However, anomaly **scores alone are not actionable** unless they are calibrated and interpreted.

---

## Problem Identified
Raw anomaly scores:
- Have no inherent scale
- Cannot be compared across runs
- Do not directly indicate severity

Hard-coded thresholds or supervised attack training would reduce robustness and generality.

---

## Approach
Implemented **statistical threshold calibration** using *normal behavior only*.

### Calibration Strategy
1. Run the trained DWN model on syscall traces from benign execution
2. Collect anomaly score distribution
3. Compute:
   - Mean (μ)
   - Standard deviation (σ)
4. Define severity thresholds based on deviation from μ

### Severity Levels
| Level | Condition |
|-----|----------|
| **NORMAL** | score ≥ μ − 1σ |
| **SUSPICIOUS** | μ − 2σ ≤ score < μ − 1σ |
| **ANOMALOUS** | μ − 3σ ≤ score < μ − 2σ |
| **CRITICAL** | score < μ − 3σ |

Thresholds are persisted to disk and reused for runtime classification.

---

## Runtime Classification
Each syscall window is evaluated independently and assigned a severity label:

- NORMAL → expected execution
- SUSPICIOUS → behavioral deviation
- ANOMALOUS → likely misuse or abnormal execution
- CRITICAL → severe deviation

This completes Sentinel’s detection loop:

> syscall trace → feature encoding → ML inference → calibrated decision

---

## Experiment
- Model trained on normal syscall traces only
- Thresholds calibrated using normal execution
- Applied to live syscall traces including abnormal workloads

### Observed Results
- Majority of windows classified as **NORMAL**
- Natural variance appears as **SUSPICIOUS**
- Rare **ANOMALOUS** detections observed
- No false **CRITICAL** escalation during benign runs

This indicates stable behavior modeling and conservative thresholding.

---

## Key Insight
> In syscall-based anomaly detection, **representation and calibration matter more than model complexity**.

Lightweight models combined with principled statistical decision layers can achieve meaningful runtime detection without GPUs or deep learning.

---

## Limitations
- Small sample size (prototype stage)
- No blocking or enforcement logic implemented
- No false-positive rate analysis yet

This work validates architectural direction, not production readiness.

---

## Outcome
Sentinel Sandbox now performs **end-to-end kernel-level behavioral anomaly detection** with:

- Unsupervised training
- Statistical calibration
- Runtime classification

---

## Status
<span style="color:#39FF14; font-weight:bold;">Completed</span>
