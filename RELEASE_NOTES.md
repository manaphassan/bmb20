# Release v3.1.0 — MEENA™ Optical AI // Takahara Academy (高原学園)

## 🌟 Optical AI Release: Neuromorphic Event Sentry & Multi-Subject Precision

**MEENA™ v3.1.0** upgrades the Deck 4 Visual Recon subsystem with cutting-edge **Neuromorphic Event Surface Simulation (UZH-RPG)**, **Claude Pageau Connected Spatial Moments**, **Multi-Subject Peak Density Clustering**, and **Adaptive 1-Euro Jitter Damping**.

---

## 🚀 What's New in v3.1.0

### 1. 👁️ Neuromorphic Event Surface (`SAE`) & Temporal Gradients (UZH-RPG)
* **Logarithmic Intensity Deltas ($\Delta \ln I_t > \theta$)**: Simulates biological neuromorphic event cameras (Dynamic Vision Sensors) in pure JavaScript.
* **$380\text{ms}$ Exponential Decay Surface**: Static walls, curtains, doorframes, and staircases rapidly decay to absolute zero black, keeping active human eye movements, head turns, and breathing crisply illuminated.

### 2. 🎯 Claude Pageau Spatial Moments ($M_{00}, M_{10}, M_{01}$) & Cluster Peak Isolation
* **Connected-Component Moments Engine**: Pure JS implementation of Claude Pageau's `cam-track` OpenCV algorithm for exact center-of-mass centroid tracking.
* **Multi-Person Dominant Peak Isolation**: Separates the primary commander (Sensei) from cadets or family members in the room, eliminating midpoint drift in multi-person environments.

### 3. 🛡️ Cranial Biometric Isolation & Zero-Ghost Presence Disconnect
* **Top 30% Cranial Envelope**: Anchors tactical reticles strictly on the forehead and eyes, completely immune to bare chest/shoulder contours.
* **Instant Ghost Deactivation ($\le 300\text{ms}$)**: When Sensei leaves the frame, the reticle cleanly vanishes with zero wall clinging, instantly re-snapping on return.
* **Aspect-Ratio Viewport Transformation**: `getVideoRenderBox` maps coordinates accurately across $4:3$ and $16:9$ webcams inside responsive `object-contain` viewports.
* **Biometric Calibration**: Calibrated Sensei's chronological profile to **Age 39 (Manap Hassan, Takahara Supreme Commander)**.

---

# Release v3.0.0 — MEENA™ Sovereign Horizon // Takahara Academy (高原学園)

## 🌟 Major Release Announcement: MEENA™ v3.0.0

**MEENA™ v3.0.0 ("Sovereign Horizon")** marks a monumental milestone, transforming the platform into a 100% self-hosted, enterprise-grade **Sovereign Home AI & Tactical Operations Center** tailored for Single-Board Computers (DietPi / Raspberry Pi 3, 4, 5).

---

## 🚀 What's New in v3.0.0

### 1. 👁️ Deck 4: Multimodal Camera Vision Recon & Optical OCR
* **Live Camera Stream Analytics**: Full WebRTC / USB camera integration with dynamic frame freezing and real-time visual inspection.
* **Gemini 1.5 Flash Vision OCR**: Optical document scanning, whiteboard transcription, component inspection, and home perimeter monitoring with zero-lag telemetry feedback.

### 2. 🛡️ Real-Time Pi-hole v6 SQLite Database Engine
* **Direct Embedded Database Queries**: Queries `/etc/pihole/pihole-FTL.db` directly via `pihole-FTL sqlite3 -ni` for zero-lag blocking metrics.
* **Live Telemetry & Gravity Counts**: Monitors 2,994,000+ gravity blocked domains, query volume today (23,000+), and real-time block percentages (`45.6% BLK`).
* **1-Tap Defense Management**: Instant temporary shield disable (10s, 30s, 5m) or toggle directly from the tactical interface.

### 3. 📡 Subspace Network Radar 2.0 (LAN Topology)
* **Real-Time ARP Table Inspection**: Continuous `/proc/net/arp` polling across `eth0` and `wlan0`.
* **Hardware Device Fingerprinting**: Categorizes connected devices into Routers, Phones, Workstations, IoT Sensors, and Gaming Consoles with live ping round-trip times and MAC vendors.

### 4. 📅 Chrono Calendar & Automated Waktu Solat Scheduler
* **Private Multi-Source iCal Parser (`cal.php`)**: Synchronizes multiple Google/Apple/Outlook ICS feeds with local JSON storage, multi-line folding repair, and `Asia/Kuala_Lumpur` timezone formatting.
* **Waktu Solat Engine (`routine-scheduler.js`)**: Sub-second Malaysian prayer time calculation with automated audio Adhan alerts, countdown timers, and daily morning mission briefings.

### 5. 📱 Starfleet Dual-Layout System (Desktop Bridge & PADD Communicator)
* **Desktop Command Bridge**: High-density 4-Deck LCARS operations layout with Three.js 3D WebGL globe, ISS orbital tracking ($27,580\text{ km/h}$), and dynamic obsidian force-directed knowledge graph.
* **Handheld PADD Communicator**: Ultra-ergonomic mobile interface featuring touch Hold-To-Talk Push-To-Talk (PTT), real-time chat stream, horizontal quick chips, and slide-up hardware diagnostics drawer.

### 6. 🌐 Bilingual Neural Voice & Studio TTS
* **Bilingual English & Bahasa Melayu Intelligence**: Natural question handling, Malay keyword detection, prefix stripping, and dual-endpoint Wikipedia search (`ms.wikipedia.org` + `en.wikipedia.org`).
* **Studio Server-Side Neural Speech (TTS)**: Dedicated asynchronous `edge-tts` microservice daemon on DietPi with MD5 disk caching and studio neural voice profiles (`Jenny`, `Aria`, `Sonia`, `Yasmin`, `Osman`, `Guy`).

### 7. 🔒 Hardened Server Security & URL Masking
* **Nginx Defense Lockdown**: Strict protection blocking direct access to `.sh`, `.py`, `.service`, `.md`, `.env`, `.git`.
* **Semantic Clean REST Endpoints**: `/api/telemetry`, `/api/calendar`, `/api/hearth`, `/api/tts`, `/dashboard`, `/settings`.

---

## 📦 Installation & Upgrade

### Remote Deployment (PowerShell)
```powershell
git pull origin master
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -TargetHost "dietpi.local"
```

### Direct SBC Deployment (Bash)
```bash
sudo git pull origin master
sudo bash deploy-dietpi.sh
```

---

## 📜 Full Commit Comparison
[v2.6.0...v3.0.0](https://github.com/manaphassan/bmb20/compare/master)
