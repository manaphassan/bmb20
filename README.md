# 🖖 BMB20 LCARS Command Center - DietPi SBC Edition

An authentic, high-performance Starfleet LCARS (Library Computer Access and Retrieval System) Command Dashboard and SBC Telemetry Hub, optimized for **DietPi single-board computers (Raspberry Pi 3 Model B)** at `192.168.0.100` or `dietpi.local`.

---

## 🚀 Key Features

### 1. 🪐 3D Holographic Tactical Stage (`Three.js`)
* **Multi-View Modes**:
  * **Planetary (`[PLANET]` / `P`)**: Rotating point-cloud Earth with Malaysia sector base beacon $[02.81^\circ\text{N}, 101.50^\circ\text{E}]$, geo-sync satellite, and live **ISS Space Station Orbit Tracking**.
  * **Solar System (`[SYSTEM]` / `S`)**: Sol star with 8 planets orbiting in concentric orbital paths.
  * **Galaxy Map (`[GALAXY]` / `G`)**: 3,800-star rotating 2-arm logarithmic spiral galaxy disk with core glow.
* **Vector Line Callout Notations**: Dynamic 60 FPS projected SVG leader lines and glassmorphic HUD telemetry cards tracking coordinates in real time.
* **Interactive Orbit & Zoom Controls**: Mouse drag / touch to orbit in 3D with smooth inertial damping; scroll wheel to zoom.

### 2. 🎙️ J.A.R.V.I.S. AI Voice Engine & Speech Recognition
* **Web Speech Recognition API (`[VOICE: ON]` / `V`)**: Direct voice commands through your microphone:
  * *"Computer, Red Alert"* $\to$ Arms tactical shields and sounds klaxon.
  * *"Computer, Status Report"* $\to$ J.A.R.V.I.S. speaks live CPU, temperature, memory, and Pi-hole metrics.
  * *"Computer, Warp Speed"* $\to$ Executes warp drive acceleration sweep.
  * *"Computer, Planet Earth"* $\to$ Switches 3D stage to terrestrial view.
* **Web Audio API Procedural Synthesizer**: TNG Door Chimes (`C`), Warp Drive (`W`), Transporter Beaming (`B`), 48Hz Warp Core Hum, and Emergency Klaxon.
* **High-Clarity / CRT Scanline Toggle (`R`)**: Instant toggle between razor-sharp typography and retro phosphor CRT scanlines.

### 3. 🛰️ ISS Space Station Subspace Tracker
* **Real-time Live Telemetry**: Live ISS coordinates $[Lat, Lon]$, velocity (~27,600 km/h), and altitude (~420 km) with dynamic 3D orbital mesh and leader line tracking.

### 4. ⛅ Planetary Weather Station & 3-Day Forecast
* **Real-time Atmospheric Telemetry**: Temperature (°C), Humidity (%), Barometric Pressure (hPa), and Surface Wind Vectors (km/h + Cardinal Bearing).
* **3-Day Forecast Strip**: High/Low temperatures and condition icons for Today, Tomorrow, and Day 3.
* **Zero-API-Key Data Source**: Live Open-Meteo meteorological feed for coordinate $[02.81^\circ\text{N}, 101.50^\circ\text{E}]$.

### 5. 🛰️ Subspace Network Radar & Tactical Action Console
* **LAN Node Scanner**: Real-time connected home devices mapped from `/proc/net/arp` with IP, MAC, and interface (`eth0`/`wlan0`).
* **Tactical Node Modal**: Click any node to run ICMP Ping Diagnostics, Flush DNS Cache, Purge Memory Buffers, or Reload the Telemetry Daemon.

### 6. ⚡ Realtime Hardware & Service Monitoring
* **Non-blocking Telemetry Daemon (`bmb20-stats.sh`)**: Direct `/proc` parser reading Delta CPU (100ms sample), RAM, SOC Temp, SD Storage, DietPi OS update status, and dynamic bandwidth.
* **Live Pi-hole v6 Engine**: Multi-tier extraction querying internal FTL socket port 4711 and SQLite database.
* **Real Kernel Event Log**: Live kernel events from `dmesg -T` and `journalctl`.

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
| **`1`** | Condition Green (*"All systems nominal"*) |
| **`2`** | Yellow Alert (*Caution Chime + Stand by*) |
| **`3`** | Red Alert (*Klaxon + "Shields up. Battle stations"*) |
| **`4`** or **`P`** | 3D Earth Planetary View |
| **`5`** or **`S`** | 3D Sol System Orbital View |
| **`6`** or **`G`** | 3D Milky Way Galaxy Map |
| **`W`** | Warp Drive Engagement Sequence |
| **`C`** | TNG Door / Comm Hail Chime |
| **`B`** | Transporter Beaming Shimmer |
| **`V`** | J.A.R.V.I.S. Voice Mic Toggle (Speech Recognition) |
| **`R`** | Retro CRT Scanline / High Clarity Toggle |
| **`M`** or **`A`** | Audio Interface Toggle (ON / OFF) |
| **`ESC`** | Close Tactical Action Modal |

---

## 📁 Repository Structure

```text
d:\HaNa_Innovation\bmb20\
├── index.html                   # Master LCARS UI Command Center
├── api.php                      # Telemetry & Tactical Actions API endpoint
├── css/
│   └── style.css                # LCARS Okuda Design System & Scanline Overlays
├── js/
│   ├── config.js                # Hostname, coordinates & service URL config
│   ├── audio.js                 # Starfleet Web Audio synth & Web Speech API engine
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
