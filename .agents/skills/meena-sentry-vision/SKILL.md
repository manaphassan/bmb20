---
name: meena-sentry-vision
description: Architect, configure, and optimize Deck 4 Computer Vision, Alex Dunphy Study Sentry ergonomics tracking, Holographic OCR Document Scanning with Gemini Vision, and 60 FPS presence-aware head-tracking callouts for MEENA AI.
---

# MEENA™ Deck 4 Sentry & Computer Vision Skill

This skill defines the technical standard for Deck 4 optical telemetry, real-time posture analysis, ocular health management, and multimodal visual analysis.

## Core Capabilities

1. **60 FPS Presence-Aware Head Tracking**:
   - Calculates optical flow & centroid $(\bar{x}, \bar{y})$ differentials.
   - Automatically filters out tracking callouts when no human subject is present (`headCentroid.active === false`), displaying a tactical standby radar crosshair instead.
   - Smooths coordinate jitter with exponential moving average $(\alpha = 0.25)$.

2. **Alex Dunphy's Study Sentry & Ergonomics Coach**:
   - Analyzes cervical angle deviations ($88^\circ$ optimal $\rightarrow$ $<70^\circ$ slouching).
   - Generates dynamic glowing corona halos (Green = Optimal, Gold = Fair, Crimson = Slouching).
   - Triggers verbal intellectual nudges with Alex Dunphy's witty academic personality when slouching persists for $>3$ continuous frames.

3. **20-20-20 Ocular Rest Sentry**:
   - Tracks continuous ocular focus time.
   - Triggers 20-second optical rest reminders every 20 minutes to preserve ocular health and combat screen fatigue.

4. **Holographic Math & Document OCR with Gemini Vision**:
   - Captures ultra-sharp video frames via hidden canvas.
   - Sends base64 JPEG payload to `/api/ocr` (or client-side Gemini Flash API proxy).
   - Streams formatted step-by-step LaTeX derivations and academic summaries directly into Meena's conversational feed.

5. **Real-Time Line Callout System**:
   - High-contrast dark glass cards (`rgba(6, 12, 24, 0.94)`) with neon borders.
   - Crisp monospace typography (`11px Space Mono` + `10px JetBrains Mono`).
   - Dynamic leader lines with $32^\circ$ elbow joints and pulsing crosshairs reticles.
