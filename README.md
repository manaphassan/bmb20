# BMB20 Command Center - DietPi LCARS Landing Page

A high-performance, sci-fi LCARS (Starship Command Center) HTML5 landing page optimized for hosting on **DietPi Linux SBC servers** (e.g. `192.168.0.100` or `dietpi.local`).

## 📁 Repository & Project Structure

```text
d:\HaNa_Innovation\bmb20\
├── .agents/
│   └── skills/
│       └── dietpi-lcars-deploy/
│           └── SKILL.md                 # Agent Skill for DietPi LCARS deployment
├── DESIGN.md                            # Nemesis Blue LCARS Design Specification
├── code.html                            # Original Base HTML5 Command Center UI
├── index.html                           # Optimized Production Landing Page
├── api.php                              # Lightweight DietPi PHP System Telemetry API
├── deploy-dietpi.sh                     # Linux Web Server Deployment Shell Script
├── deploy.ps1                           # Automated Windows PowerShell SSH/SCP Deployer
└── README.md                            # Project Overview & Usage Guide
```

---

## ⚡ Features

- **LCARS Nemesis Blue Aesthetics**: High-contrast, glowing sci-fi UI based on [DESIGN.md](DESIGN.md).
- **DietPi Service Dashboard**: Quick launchers for Pi-hole, Syncthing, Jellyfin, Cockpit, and DietPi-Dashboard.
- **SBC Resource Protection**: Integrated Eco-Mode toggle and `visibilitychange` API listener to pause WebGL/3D Earth when tab is in background or running on low-resource SBC hardware.
- **Real & Fallback Telemetry**: Fetches real SOC temperature, memory utilization, CPU load, and disk stats from [api.php](api.php) with simulated fallback if PHP is disabled.
- **Synthesized Web Audio**: Interactive beep sounds generated using Web Audio API (no external MP3 asset dependency).

---

## 🚀 Deployment Instructions

### 1. Auto-Deploy via PowerShell (From Windows Host)
```powershell
.\deploy.ps1 -TargetHost "192.168.0.100" -User "root"
```

### 2. Manual Linux SSH Deployment (On DietPi Host)
```bash
# Upload files via SCP
scp index.html api.php deploy-dietpi.sh root@192.168.0.100:/var/www/html/

# Run setup script via SSH
ssh root@192.168.0.100 "chmod +x /var/www/html/deploy-dietpi.sh && /var/www/html/deploy-dietpi.sh"
```

---

## 🌐 Web Server Access

After deployment, open your browser at:
- **`http://192.168.0.100`**
- **`http://dietpi.local`**
