---
name: modular-fault-isolation
description: Enforce strict modular separation of concerns and error boundaries for BMB20 / Takahara Academy codebase to prevent regressions when modifying or adding features.
---

# Modular Fault Isolation & Core Protection Skill

This skill enforces strict separation of concerns across all frontend and backend subsystems in the **BMB20 // MEENA** repository (`d:\HaNa_Innovation\bmb20`).

---

## 1. Core Architectural Modules

The codebase is partitioned into 5 independent, decoupled subsystems:

| Subsystem | Primary Script | Core Responsibility | Dependency Rule |
| :--- | :--- | :--- | :--- |
| **Telemetry & Sentinel** | `assets/js/telemetry.js` | CPU, RAM, Temp, Network, Pi-hole polling | **ZERO** audio, speech, or calendar deps. |
| **Chrono Calendar** | `assets/js/calendar.js` | Google iCal feeds, agenda, monthly grid | **ZERO** voice, NOC, or telemetry deps. |
| **Meena Voice & AI** | `assets/js/audio.js` | Speech synth, speech recognition, Gemini API | Must fail silently if Web Speech API unavailable. |
| **Meena Hearth Core** | `assets/js/settings.js` | `meenaHearth.json`, knowledge graph, vault | Independent static 1ms data loading. |
| **3D Observatory NOC** | `assets/js/globe.js` | 3D Earth, Solar System, ISS tracker, LAN | Independent canvas rendering context. |

---

## 2. Mandatory Rules for All Edits

### Rule 1: Single-Module Scope
When fixing or implementing a feature, only touch the file responsible for that subsystem. Never introduce cross-module imports or synchronous dependencies between telemetry, calendar, and voice.

### Rule 2: 100% Null-Safe DOM Access
Never assume a DOM element exists. Always wrap DOM manipulations with a null-check:
```javascript
// ✅ CORRECT
const elem = document.getElementById('my-element-id');
if (elem) {
    elem.innerText = 'Value';
}

// ❌ FORBIDDEN (will throw TypeError and crash the script thread if element is missing)
document.getElementById('my-element-id').innerText = 'Value';
```

### Rule 3: Circuit Breakers & Isolated Error Boundaries
Wrap each module's initialization and fetch pipelines in independent `try/catch` blocks:
```javascript
// ✅ CORRECT
try {
    initTelemetryStream();
} catch (err) {
    console.warn('[Telemetry] Safe boundary caught error:', err);
}
```

### Rule 4: Prefer Static 1ms JSON Over Heavy Dynamic Execution
For high-frequency or critical UI data (like calendar events and Hearth restoration points), always attempt direct static fetch first (`calendar_events.json?t=`, `meenaHearth.json?t=`) before falling back to dynamic PHP scripts.

---

## 3. Pre-Flight Verification Gate

Before committing or deploying to DietPi, always run the automated pre-flight smoke test:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoketest-modules.ps1
```
Ensure all modules report `[PASS]` before deployment.
