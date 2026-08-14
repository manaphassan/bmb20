# 🌸 MEENA // TAKAHARA ACADEMY (高原学園)
### *Next-Generation Anime-Inspired Home Personal Assistant & Command Hub*

An authentic, high-performance **Home Personal Assistant** and Smart Home Telemetry Hub inspired by ***Tengoku Daimakyou (Heavenly Delusion)*** and ***Neon Genesis Evangelion***, managed by AI supercomputer **M.E.E.N.A.** (*Master Electronic Executive Neural Assistant*) for home base **Takahara Academy (高原学園)**.

Hosted locally on **DietPi (Raspberry Pi 3 Model B)** at `dietpi.local` or `192.168.0.100`.

---

## 🎯 Project Vision & Mission

The goal of **Project MEENA** is to create an intuitive, zero-cost, privacy-first **Home Personal Assistant**:
* **Home Base**: Designated as **Takahara Academy (高原学園)**.
* **AI Persona**: Inspired by **Misato Katsuragi** (NERV Operations Director) and **Meena** (*Tengoku Daimakyou*) — a cheerful, charismatic, dramatic young female Japanese-accented English voice that addresses the user as **Sensei**.
* **Zero Cloud Token Cost**: 100% client-accelerated Web Speech API and Web Audio procedural synthesis running locally in your browser with 0% CPU overhead on the Raspberry Pi.

---

## 🚀 Key Subsystems & Features

### 1. 🎙️ M.E.E.N.A. Home Voice Assistant
* **Wake Word Standby**: Call *"Meena"*, *"Hey Meena"*, or *"Mina"* to put her on active standby (*"Good evening, Sensei! All tactical stations are ready!"*).
* **Dynamic Time-of-Day Greetings**:
  * 🌅 **Morning (05:00 - 11:59)**: *"Ohayou, Sensei! Good morning! Meena tactical operations center online and ready for action!"*
  * ☀️ **Afternoon (12:00 - 17:59)**: *"Service, service! Konnichiwa, Sensei! All facility telemetry nominal and running at full power!"*
  * 🌆 **Evening (18:00 - 21:59)**: *"Konbanwa, Sensei! Good evening! Operations center is fully secured and standing by for orders!"*
  * 🌙 **Late Night (22:00 - 04:59)**: *"Otsukare, Sensei! Working late tonight? Don't push yourself too much! Meena is watching your six!"*
* **Natural Voice Commands**:
  * 🗣️ *"Meena, Status Report"* $\to$ Speaks live CPU load, memory utilization, SOC temperature, and Pi-hole defense shield state.
  * 🗣️ *"Meena, Weather Forecast"* $\to$ Speaks current temperature, sky conditions, humidity, and wind for Terra home base.
  * 🗣️ *"Meena, Code Red"* $\to$ *"All personnel, battle stations! Code Red! Raise the absolute defense barrier, Sensei!"*
  * 🗣️ *"Meena, Warp Speed"* $\to$ *"All power to the main thrusters! Warp speed, ikimashou!"*
  * 🗣️ *"Meena, Terra"* $\to$ Switches 3D stage to Terra observation view.
* **Live Voice Engine Selector (`V`)**: Built-in voice switcher dropdown in the Meena modal to preview and choose your preferred Japanese/Asian female voice engine with instant `localStorage` persistence.

---

## 🪐 2. 3D Holographic Observation Stage (`Three.js`)
* **Multi-View Modes**:
  * **Terra (`[TERRA]` / `P`)**: Rotating point-cloud Earth with Malaysia sector base beacon $[02.81^\circ\text{N}, 101.50^\circ\text{E}]$, geo-sync satellite, and live **ISS Space Station Orbit Tracking**.
  * **Solar System (`[SYSTEM]` / `S`)**: Sol star with 8 planets orbiting in concentric orbital paths.
  * **Galaxy Map (`[GALAXY]` / `G`)**: 3,800-star rotating 2-arm logarithmic spiral galaxy disk with core glow.
* **Interactive 3D Controls**: Mouse drag / touch to orbit with smooth inertial damping; scroll wheel to zoom.
* **Vector Line Callout Notations**: Dynamic 60 FPS projected SVG leader lines and glassmorphic HUD telemetry cards tracking coordinates in real time.

---

## 🛰️ 3. ISS Space Station Subspace Tracker
* **Real-time Live Telemetry**: Live ISS coordinates $[Lat, Lon]$, velocity (~27,600 km/h), and altitude (~420 km) with dynamic 3D orbital mesh and leader line tracking.

---

## ⛅ 4. Atmospheric Station & 3-Day Forecast
* **Real-time Atmospheric Telemetry**: Temperature (°C), Humidity (%), Barometric Pressure (hPa), and Surface Wind Vectors (km/h + Cardinal Bearing).
* **3-Day Forecast Strip**: High/Low temperatures and condition icons for Today, Tomorrow, and Day 3.
* **Zero-API-Key Data Source**: Live Open-Meteo meteorological feed for coordinate $[02.81^\circ\text{N}, 101.50^\circ\text{E}]$.

---

## 🛡️ 5. Subspace Network Radar & Security Console
* **LAN Node Scanner**: Real-time connected home devices mapped from `/proc/net/arp` with IP, MAC, and interface (`eth0`/`wlan0`).
* **Tactical Node Modal**: Click any node to run ICMP Ping Diagnostics, Flush DNS Cache, Purge Memory Buffers, or Reload the Telemetry Daemon.
* **Pi-hole v6 Shield Integration**: Real-time DNS query statistics and ad-blocking status.

---

## ⚡ 6. Realtime Hardware & Service Monitoring
* **Non-blocking Telemetry Daemon (`bmb20-stats.sh`)**: Direct `/proc` parser reading Delta CPU (100ms sample), RAM, SOC Temp, SD Storage, DietPi OS update status, and dynamic bandwidth.
* **Retro CRT Scanline / High-Clarity Toggle (`R`)**: Instant toggle between razor-sharp typography and retro phosphor CRT scanlines.

---

## 🌐 Active Services Roster & Ports

| Identifier | Service | Port / URL | Description |
| :--- | :--- | :--- | :--- |
| **`[01-89]`** | **Pi-hole v6** | `http://dietpi.local:8089/admin/login` | DNS Ad-blocking & Network Shield |
| **`[80-84]`** | **File Browser** | `http://dietpi.local:8084/` | Web-based Local File Manager |
| **`[33-84]`** | **Syncthing** | `http://dietpi.local:8384` | Continuous File Synchronization |
| **`[10-52]`** | **Tailscale VPN** | `https://login.tailscale.com/admin/machines` | Secure Mesh Network Console |
| **`[52-52]`** | **Cockpit** | `http://dietpi.local:5252` | Linux Server Web Administration |

---

## ⌨️ Master Keyboard Hotkey Guide

| Key | Action |
| :--- | :--- |
| **`1`** | Code Green (*"All facility sectors nominal, Sensei"*) |
| **`2`** | Code Yellow (*Caution Chime + "Subspace anomaly detected"*) |
| **`3`** | Code Red (*Klaxon + "All personnel, battle stations!"*) |
| **`4`** or **`P`** | 3D Terra Planetary View |
| **`5`** or **`S`** | 3D Sol System Orbital View |
| **`6`** or **`G`** | 3D Milky Way Galaxy Map |
| **`W`** | Warp Drive Engagement Sequence (*"Warp speed, ikimashou!"*) |
| **`C`** | Facility Door / Comm Hail Chime |
| **`B`** | Transporter Beaming Shimmer |
| **`V`** | Meena Voice Mic & Tactical Command Console |
| **`R`** | Retro CRT Scanline / High Clarity Toggle |
| **`M`** or **`A`** | Audio Interface Toggle (ON / OFF) |
| **`ESC`** | Close Tactical Action Modal |

---

## 📁 Repository Structure

```text
d:\HaNa_Innovation\bmb20\
├── index.html                   # Master Takahara Academy UI Command Center
├── api.php                      # Telemetry & Tactical Actions API endpoint
├── css/
│   └── style.css                # Okuda LCARS Design System & Scanline Overlays
├── js/
│   ├── config.js                # Hostname, coordinates & service URL config
│   ├── audio.js                 # Misato / Meena Voice Engine & Web Audio synthesizer
│   ├── globe.js                 # Three.js 3D WebGL Hologram & SVG Callouts
│   ├── telemetry.js             # Telemetry parser, weather & tactical modal
│   ├── tailwind-config.js       # Color palette & font token mappings
│   └── main.js                  # Master application lifecycle & hotkey router
├── daemon/
│   ├── bmb20-stats.sh           # Background systemd telemetry scraper daemon
│   └── bmb20-stats.service      # Linux systemd service unit definition
├── deploy.ps1                   # Automated Windows PowerShell deployment script
└── README.md                    # System documentation and operational guide
```

---

## 🛠️ Deployment Instructions

### Automated Push to DietPi Host
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -TargetHost "dietpi.local"
```

Once deployed, access the dashboard at:
👉 **`http://dietpi.local`** (or `http://192.168.0.100`)
