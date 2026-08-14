<div align="center">

# 🌸 M.E.E.N.A. // 高原学園 (TAKAHARA ACADEMY)
### *Next-Generation Anime AI Voice Assistant & Dual-Deck Operations Hub for Single-Board Computers*

[![Version](https://img.shields.io/badge/version-2.0.0--takahara--meena-00F0FF?style=for-the-badge&logo=git&logoColor=black)](https://github.com/manaphassan/bmb20/releases)
[![Platform](https://img.shields.io/badge/Platform-DietPi%20%7C%20Raspberry%20Pi%203%2F4%2F5-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white)](https://dietpi.com)
[![Web Speech API](https://img.shields.io/badge/AI%20Voice-Web%20Speech%20%2B%20Web%20Audio-FFAA00?style=for-the-badge&logo=google-chrome&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Zero Cost](https://img.shields.io/badge/Token%20Cost-%240.00%20Zero%20Cloud%20Billing-00E676?style=for-the-badge&logo=cashapp&logoColor=black)](https://github.com/manaphassan/bmb20)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-792EE5?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

```
  ========================================================================================
   [1] MEENA AI BRIDGE        //  TACTICAL COMMAND CENTER  //   [2] OBSERVATORY NOC      
  ========================================================================================
   - Holographic AI Avatar Core     - Dynamic 4-Category Knowledge Bank     - Pi-hole v6 Shield
   - Neural Sync EXP Engine (1-99)  - Real-Time 3D Earth ISS Tracker        - Subspace Radar
  ========================================================================================
```

<p align="center">
  <a href="#-key-features"><b>Key Features</b></a> •
  <a href="#-dual-deck-architecture"><b>Dual-Deck Modes</b></a> •
  <a href="#-neural-growth-engine"><b>Meena Growth System</b></a> •
  <a href="#-quick-start--installation"><b>Quick Start</b></a> •
  <a href="#-hotkeys--voice-commands"><b>Voice Commands</b></a> •
  <a href="#-roadmap"><b>Roadmap</b></a>
</p>

---

</div>

## 📖 Overview & Core Philosophy

**M.E.E.N.A.** (*Master Electronic Executive Neural Assistant*) is an authentic, anime-inspired, single-pane-of-glass **Home Personal Assistant & Infrastructure Command Center** designed for single-board computers (SBCs) such as **Raspberry Pi 3/4/5 running DietPi or Debian**.

Inspired by the visual design language of ***Tengoku Daimakyou (Heavenly Delusion)*** and the tactical operations bridges of ***Neon Genesis Evangelion***, Meena transforms your home server into **Takahara Academy (高原学園)**.

### 💎 Why MEENA?
* 🚀 **Zero Cloud Token Cost**: 100% client-accelerated Web Speech API and procedural Web Audio synthesis. Runs locally in any browser with **0% CPU load** on your SBC.
* 🌸 **Living Anime Personality**: High-energy, charismatic assistant speaking fluent English with a natural Japanese anime accent and polite honorifics (*Sensei*, *Ohayou*, *Konnichiwa*, *Otsukare*).
* 📈 **Neural Growth & Sync EXP Engine**: Meena actively learns what you teach her, gaining Synapse EXP from every interaction to rank up from Cadet to Soulbound Guardian.
* 🖥️ **Dual-Deck Operations**: Seamless instant tab switching between **Deck 1 (AI Assistant Bridge)** and **Deck 2 (3D Observatory & System NOC)** without reloading or interrupting audio.
* ⚡ **Ultra-Lightweight Linux Footprint**: Near-zero RAM consumption with static memory caching and an atomic background Bash telemetry daemon (`bmb20-stats.sh`).

---

## 🌟 Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🌸 Deck 1: Meena Tactical AI Bridge</h3>
      <ul>
        <li><b>Holographic Avatar Core</b>: Rotating orbital rings with real-time reactive audio waveform EQ arcs.</li>
        <li><b>Neural Sync EXP System</b>: Real-time Level 1 to 99 progression with custom rank badges and voice fanfares.</li>
        <li><b>Dynamic Mood Matrix</b>: Visual emotional states (<code>CHEERFUL</code>, <code>TACTICAL</code>, <code>CARING</code>, <code>PROUD</code>).</li>
        <li><b>4-Category Knowledge Bank</b>: Remembers facility devices, user habits, routines, and missions.</li>
        <li><b>Live Conversational Console</b>: Real-time dialogue feed with direct text & voice triggers.</li>
        <li><b>Atmospheric Sensors</b>: Real-time weather telemetry & 3-day meteorological forecast.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🛰️ Deck 2: Observatory & Infrastructure NOC</h3>
      <ul>
        <li><b>Full-Screen 3D WebGL Hologram</b>: Point-cloud Earth, Solar System, and Milky Way Galaxy map.</li>
        <li><b>Live ISS Subspace Tracker</b>: Real-time orbital coordinates, altitude (~420 km), and speed (~27,600 km/h).</li>
        <li><b>Subspace Network Radar</b>: Live ARP scan of active LAN devices with ICMP ping diagnostics.</li>
        <li><b>Subspace Bandwidth Meter</b>: Real-time dynamic Tx/Rx canvas throughput graph.</li>
        <li><b>Linux Kernel Stream</b>: Real-time system event & <code>dmesg</code> log feed.</li>
        <li><b>Hardware Telemetry Sidebar</b>: Continuous CPU, RAM, SOC Temp, and SD storage step gauges.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    subgraph Raspberry Pi Host (DietPi)
        HW[Linux Kernel / Hardware] -->|/proc/stat, /sys/thermal, /proc/net| DAEMON[bmb20-stats.sh Systemd Daemon]
        DAEMON -->|Atomic JSON Write every 1s| JSON[/var/www/html/api.json]
        NGINX[Lighttpd / Nginx Web Server] -->|Static Memory Cache| JSON
        NGINX -->|Serves Web Assets| WEB[HTML5 / CSS / ES6 Modules]
    end

    subgraph Client Browser / Touchscreen Dashboard
        WEB --> UI[Dual-Deck Interface]
        UI --> DECK1[🌸 Deck 1: Meena AI Assistant Bridge]
        UI --> DECK2[🛰️ Deck 2: Takahara Observatory NOC]
        JSON -->|1000ms Polling| TELEMETRY[telemetry.js Gauges & Radar]
        DECK1 --> AUDIO[audio.js Web Speech + Waveform Synth]
        DECK2 --> GLOBE[globe.js Three.js 3D WebGL Engine]
    end
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* Raspberry Pi 3 Model B, 4, 5, or any Linux SBC running **DietPi / Debian**.
* Web server installed (**Lighttpd**, **Nginx**, or **Apache2** with PHP).

### 1. One-Line Remote Deployment (From Windows / Linux)

```powershell
# From your development machine with SSH keys configured:
.\deploy.ps1 -TargetHost "dietpi.local"
```

### 2. Manual Linux Server Setup

```bash
# Clone the repository to the web root
git clone https://github.com/manaphassan/bmb20.git /var/www/html/

# Install the background telemetry daemon
sudo cp /var/www/html/daemon/bmb20-stats.sh /usr/local/bin/bmb20-stats.sh
sudo chmod +x /usr/local/bin/bmb20-stats.sh
sudo cp /var/www/html/daemon/bmb20-stats.service /etc/systemd/system/bmb20-stats.service

# Enable and start the telemetry service
sudo systemctl daemon-reload
sudo systemctl enable --now bmb20-stats.service

# Set web permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

Access the dashboard instantly in your browser at:  
👉 **`http://dietpi.local`** or **`http://<YOUR_PI_IP>`**

---

## 🎙️ Voice Commands & Hotkeys Guide

### 🌸 Spoken Voice Dialogues (Default: English with Japanese Anime Accent)

| Trigger Command | Meena Spoken Response / Action |
| :--- | :--- |
| **`"Meena"`** / **`"Hey Meena"`** | *"Konnichiwa, Sensei! Standing by and ready for orders!"* |
| **`"Status Report"`** | Reads verbal CPU load, RAM utilization, SOC temperature, and Pi-hole shield state. |
| **`"Weather Forecast"`** | Speaks current temperature, sky condition, humidity, and wind for home base. |
| **`"Remember [note]"`** | Learns and indexes fact into the 4-category tactical knowledge bank (`+25 EXP`). |
| **`"Recall Memory"`** | Reads back recent learned notes and records. |
| **`"Code Red"`** | Triggers red alert klaxon and raises absolute defense barrier. |
| **`"Warp Speed"`** | Plays main thrusters acceleration warp sound sequence. |

---

### ⌨️ Master Keyboard Shortcuts

| Hotkey | Action | Hotkey | Action |
| :---: | :--- | :---: | :--- |
| **`1`** | **Switch to Deck 1 (Meena AI Bridge)** | **`W`** | Warp Drive Engagement |
| **`2`** | **Switch to Deck 2 (Observatory NOC)** | **`C`** | Facility Door / Comm Hail Chime |
| **`3`** | Trigger Code Red Alert Klaxon | **`B`** | Transporter Beaming Shimmer |
| **`4`** / **`P`** | 3D Terra Planetary View | **`V`** | Open Voice & Acoustic Settings Modal |
| **`5`** / **`S`** | 3D Solar System View | **`R`** | Toggle Retro CRT Scanlines / Clarity |
| **`6`** / **`G`** | 3D Milky Way Galaxy View | **`M`** / **`A`** | Audio Interface Toggle (Mute/Unmute) |

---

## 🌐 Connected Services Roster

| Identifier | Service | Port / Endpoint | Description |
| :---: | :--- | :--- | :--- |
| **`[01-89]`** | **Pi-hole v6** | `http://dietpi.local:8089/admin/login` | DNS Ad-Blocking & Network Shield |
| **`[80-84]`** | **File Browser** | `http://dietpi.local:8084/` | Web-Based File Manager |
| **`[33-84]`** | **Syncthing** | `http://dietpi.local:8384` | Continuous P2P File Synchronization |
| **`[10-52]`** | **Tailscale VPN** | `https://login.tailscale.com/admin/machines` | Secure Mesh Network Gateway |
| **`[52-52]`** | **Cockpit** | `http://dietpi.local:5252` | Linux Server Web Administration |

---

## 🗺️ Project Roadmap

- [x] **v1.0.0**: LCARS Starfleet Telemetry & 3D Earth Globe (`Three.js`).
- [x] **v1.5.0**: Interactive Pi-hole v6 Action Modal & Automated Sudoers Controls.
- [x] **v2.0.0**: **MEENA // Takahara Academy** Dual-Deck Architecture, Neural Growth EXP Engine, Holographic Avatar HUD, and 4-Category Knowledge Bank.
- [ ] **v2.1.0**: Smart Home & IoT Switch Controls (Home Assistant / Tasmota / Tuya integration).
- [ ] **v2.2.0**: Scheduled Audio Reminders & Hourly Chimes.
- [ ] **v2.3.0**: Dedicated Local Voicevox Engine Container.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See `LICENSE` for more information.

* Created by **[manaphassan](https://github.com/manaphassan)** for **Takahara Academy (高原学園)**.
* Design inspirations: ***Tengoku Daimakyou (Heavenly Delusion)***, ***Neon Genesis Evangelion (NERV MAGI)***, and Star Trek LCARS.
