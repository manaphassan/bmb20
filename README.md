<div align="center">

# Meena™ - Takahara Academy (高原学園)
### *Next-Generation Bilingual Intelligent AI Voice Assistant & Tactical Operations Hub for Single-Board Computers*

[![Version](https://img.shields.io/badge/version-2.6.0--takahara--meena-00F0FF?style=for-the-badge&logo=git&logoColor=black)](https://github.com/manaphassan/bmb20/releases)
[![Platform](https://img.shields.io/badge/Platform-DietPi%20%7C%20Raspberry%20Pi%203%2F4%2F5-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white)](https://dietpi.com)
[![Neural TTS](https://img.shields.io/badge/Neural%20TTS-Studio%20Voices%20%7C%20Edge--TTS-FFAA00?style=for-the-badge&logo=google-chrome&logoColor=black)](https://github.com/manaphassan/bmb20)
[![Bilingual AI](https://img.shields.io/badge/Language-English%20%2B%20Bahasa%20Melayu-00E676?style=for-the-badge&logo=translate&logoColor=black)](https://github.com/manaphassan/bmb20)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened%20Nginx%20%2B%20Masked%20URLs-792EE5?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

```
  ========================================================================================
   [ 高原学園 ]   MEENA™ AI BRIDGE     //   OPERATIONS COMMAND   //   [2] OBSERVATORY NOC 
  ========================================================================================
   - Bilingual AI Brain (EN + BM)   - Studio Server-Side Neural TTS     - Pi-hole v6 Shield
   - Universal LCARS Notification   - Hardened Nginx & Masked URLs      - Sentinel Daemon
   - 3D ISS Orbital Satellite Map   - 5 AI Agent Skills Suite           - Hands-Free Wake Word
  ========================================================================================
```

<p align="center">
  <a href="#key-features"><b>Key Features</b></a> •
  <a href="#bilingual-ai-and-neural-speech"><b>Bilingual Voice</b></a> •
  <a href="#server-hardening-and-clean-urls"><b>Security & URLs</b></a> •
  <a href="#ai-agent-skills-suite"><b>AI Agent Skills</b></a> •
  <a href="#quick-start--installation"><b>Quick Start</b></a>
</p>

---

</div>

## 🌟 Overview & Core Philosophy

**Meena™** (*Master Electronic Executive Neural Assistant*) is a high-performance, single-pane-of-glass **Home Personal Assistant & Infrastructure Command Center** designed for single-board computers (SBCs) such as **Raspberry Pi 3/4/5 running DietPi or Debian Linux**.

The system establishes **Takahara Academy (高原学園)** as your self-hosted, sovereign, zero-latency smart operations center.

### Core Architectural Tenets
* **Bilingual English & Bahasa Melayu Intelligence**: Natural question handling, Malay keyword detection, prefix stripping, and dual-endpoint Wikipedia search (`ms.wikipedia.org` + `en.wikipedia.org`).
* **Studio Server-Side Neural Speech (TTS)**: Dedicated asynchronous `edge-tts` microservice daemon on DietPi with MD5 disk caching and studio neural voice profiles (`Jenny`, `Aria`, `Sonia`, `Yasmin`, `Osman`, `Guy`).
* **Hardened Server Security & URL Masking**: Nginx defense headers, sensitive file lockdown (`.sh`, `.py`, `.service`, `.md`, `.env`, `.git`), and clean semantic REST endpoints (`/api/telemetry`, `/api/calendar`, `/api/hearth`, `/api/tts`, `/dashboard`, `/settings`).
* **Universal LCARS Tactical Notification Dispatcher**: Sci-Fi glassmorphic toast notification cards with audio chimes, proactive thermal/undervoltage alerts, and OS desktop push.
* **Dual-Brain Hybrid Architecture**: Seamless transition between **Cloud GenAI (Gemini 1.5 Flash)** and **100% Autonomous Local Offline Brain** with zero token cost.
* **Deck 2 Live ISS Orbital Satellite Tracker**: Three.js WebGL Earth globe tracking the International Space Station in real time ($27,580\text{ km/h}$, $418\text{ km}$ altitude) along its $51.6^\circ$ inclined orbit track.
* **DietPi Background Sentinel Daemon (`bmb20-patrol.sh`)**: Background watchdog scanning LAN ARP nodes, CPU temperature spikes ($>72^\circ\text{C}$), and Pi-hole DNS health.

---

## 🛠️ Key Features

<table>
  <tr>
    <td width="50%">
      <h3>Deck 1: Meena™ AI Assistant Bridge</h3>
      <ul>
        <li><b>Bilingual Voice Engine</b>: Speaks and understands both English and Bahasa Melayu seamlessly.</li>
        <li><b>Studio Neural TTS</b>: Low-latency crystal clear neural voice streaming from DietPi daemon.</li>
        <li><b>3D Dot-Matrix Neural Brain Core</b>: Point-cloud brain with dual cerebral hemispheres, cerebellum, and audio excitation.</li>
        <li><b>Obsidian-Style Neural Knowledge Graph</b>: Full-screen interactive HTML5 Canvas force-directed physics graph.</li>
        <li><b>Universal LCARS Notification Alerts</b>: Floating toast banners with sound effects and OS push.</li>
        <li><b>5 Production AI Agent Skills</b>: Deep Research, Report Audit, Morale Boost, Fact Check, and Self-Learning.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Deck 2: Observatory & Infrastructure NOC</h3>
      <ul>
        <li><b>Full-Screen 3D WebGL Hologram</b>: Point-cloud Earth, Solar System, and Milky Way Galaxy map.</li>
        <li><b>Live ISS Satellite Subspace Tracker</b>: Real-time orbital coordinates, altitude (~418 km), and speed (~27,580 km/h).</li>
        <li><b>Subspace Network Radar 2.0</b>: Live ARP scan of active LAN devices with auto-detected hardware icons.</li>
        <li><b>Pi-hole v6 Defense Shield</b>: Direct telemetry matching queries, blocked count, and 2.49M gravity list.</li>
        <li><b>Full-Height Kernel Log Stream</b>: Real-time dynamic Linux <code>dmesg</code> event feed.</li>
        <li><b>Hardware Telemetry Sidebar</b>: Continuous CPU, RAM, SOC Temp, and storage step gauges.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🌐 Bilingual AI and Neural Speech

| Language | Neural Voice | Use Cases & Command Examples |
|---|---|---|
| **English** | `en-US-JennyNeural` / `en-US-AriaNeural` / `en-GB-SoniaNeural` | *"What time is it?"*, *"Who is the actor in Oppenheimer?"*, *"System status report"*, *"Report analysis"* |
| **Bahasa Melayu** | `ms-MY-YasminNeural` / `ms-MY-OsmanNeural` | *"Siapa pelakon filem Polis Evo?"*, *"Pukul berapa sekarang?"*, *"Padam cache"*, *"Suhu CPU"*, *"Jadual hari ini"* |

---

## 🔒 Server Hardening & Clean URLs

| Clean Masked Route | Target Backend Payload | Security & Purpose |
|---|---|---|
| `/dashboard` / `/bridge` | `/index.html` | Tactical Dashboard |
| `/settings` | `/settings.html` | Settings & Synaptic Vault |
| `/api/telemetry` | `api.json` | Real-time Hardware & Telemetry stream |
| `/api/calendar` | `calendar_events.json` | Chrono Calendar Events |
| `/api/calendar/config` | `calendar_config.json` | Calendar Subscriptions |
| `/api/hearth` | `meenaHearth.json` | Master Synaptic Knowledge Vault |
| `/api/tts` | Reverse proxy `127.0.0.1:8088` | Neural Speech Generation |

---

## 🚀 Quick Start & Deployment

### 1. One-Click Automated Deployment (From Windows Dev Host)
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -TargetHost "dietpi.local"
```

### 2. Accessing the Command Bridge
Open your browser and navigate to:
* **`http://dietpi.local/dashboard`** or **`http://192.168.0.100/dashboard`**

---

## 📜 License
MIT License. Created with ❤️ for **Takahara Academy (高原学園)**.
