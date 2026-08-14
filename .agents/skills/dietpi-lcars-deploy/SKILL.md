---
name: dietpi-lcars-deploy
description: >-
  Build, optimize, and auto-deploy HTML5 LCARS command center landing pages and web dashboards to DietPi single-board computer (SBC) servers (e.g. 192.168.0.100 or dietpi.local). Use when creating or updating web interfaces for DietPi web server (/var/www or /var/www/html) with PHP telemetry backend and SSH/SCP deployment.
---

# DietPi LCARS Web Deploy Skill

This skill provides step-by-step procedures for customizing, optimizing, and deploying HTML5 LCARS Command Center dashboards on DietPi servers.

## Workflow Overview

1. **Frontend Optimization (`index.html`)**:
   - Maintain LCARS Nemesis Blue design tokens (surface `#131319`, primary `#c2c1ff`, secondary `#adc6ff`, tertiary `#e1c639`).
   - Implement `visibilitychange` API and Eco-Mode toggle to preserve SBC CPU/GPU resources.
   - Configure local network service launchers (Pi-hole `:80`, Syncthing `:8384`, Jellyfin `:8096`, Cockpit `:9090`, DietPi-Dashboard `:5252`).

2. **Telemetry API (`api.php`)**:
   - Serve system metrics via JSON at `/api.php`.
   - Read Linux `/sys/class/thermal/thermal_zone0/temp`, `/proc/meminfo`, `/proc/loadavg`, `/proc/uptime`, and `/var/www` disk usage.

3. **Automated Server Deployment**:
   - Deploy files to `/var/www/html` or `/var/www` using SCP / SSH.
   - Enforce file permissions (`644` for files, `755` for directories) and ownership (`www-data:www-data`).

## Commands & Scripts

- **Windows PowerShell Deployment**:
  ```powershell
  .\deploy.ps1 -TargetHost "192.168.0.100" -User "root"
  ```
- **Direct Linux SSH Deployment**:
  ```bash
  chmod +x deploy-dietpi.sh && ./deploy-dietpi.sh
  ```

## Verification

1. Verify HTTP response status from target host:
   ```bash
   curl -I http://192.168.0.100/
   ```
2. Verify PHP Telemetry JSON API:
   ```bash
   curl -s http://192.168.0.100/api.php
   ```
