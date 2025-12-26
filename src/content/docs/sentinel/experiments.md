---
title: Experiments
description: Experimental evaluation of syscall-based anomaly detection in Sentinel Sandbox.
---

## Overview

This document describes the experimental workflow used in Sentinel Sandbox to evaluate syscall-based behavioral anomaly detection using a CPU-only Weightless Neural Network (DWN).

All experiments operate on real Linux syscall traces captured via `ptrace`.

---

## Experimental Pipeline

Each experiment follows the same pipeline:

1. Syscall interception using a C-based `ptrace` tracer
2. Sliding window segmentation of syscall streams
3. Temporal bucketing of each window
4. Histogram construction per bucket
5. Thermometer encoding into fixed-length binary vectors
6. Scoring using a trained DWN classifier

---

## Temporal Feature Engineering

Early experiments used syscall frequency-only histograms. These representations showed poor separation between benign and abnormal executions.

The limitation was that frequency captures **what** happens, but not **when** it happens.

To address this, temporal bucketing was introduced.

Each syscall window is divided into ordered segments. A histogram is computed per segment and encoded independently. Encoded segments are concatenated into a single binary vector.

This preserves coarse execution order while remaining computationally lightweight.

---

## Anomaly Scoring

The DWN classifier contains two independent discriminators:

- Normal behavior discriminator
- Attack behavior discriminator

For each window, an anomaly score is computed as:

```

anomaly_score = normal_score - attack_score

```

Positive scores indicate similarity to benign behavior. Lower or negative scores indicate anomalous behavior.

---

## Threshold Calibration

Thresholds are calibrated using statistics from benign syscall traces.

The following categories are defined:

- NORMAL
- SUSPICIOUS
- ANOMALOUS
- CRITICAL

Thresholds are derived from the mean and standard deviation of baseline scores and stored in a JSON file for reuse during classification.

---

## Window-Level Classification

Each syscall window is classified independently based on calibrated thresholds.

This enables fine-grained behavioral inspection and forms the basis for future real-time enforcement.

---

## Limitations

- Prototype-scale dataset
- No labeled attack corpus yet
- No live blocking or response implemented

The experiments validate architectural direction rather than production readiness.

---

## Key Insight

Feature representation has a greater impact on syscall anomaly detection than model complexity.

Temporal structure is essential for behavioral separation when using syscall data.

---

## Status

The experimental pipeline from syscall interception to anomaly scoring and threshold-based classification is complete.
```
