---
name: auto-deploy-after-build
description: >-
  Automatically deploy web assets (index.html, api.php, styles) to the DietPi server (192.168.0.100 or dietpi.local) immediately after each build, edit, or file update. Use when the user requests auto-deployment post-build, continuous deployment, or live syncing to the server.
---

# Auto Deploy After Build Skill

This skill configures and manages automatic background deployment of web application builds directly to the **DietPi server** (`192.168.0.100` / `dietpi.local`) at `/var/www/html`.

## Auto-Deployment Architecture

- **Lifecycle Hook (`.agents/hooks.json`)**: Configured with a `PostToolUse` event matcher (`write_to_file|replace_file_content`).
- **Hook Trigger**: Automatically triggers `.agents/scripts/hook-auto-deploy.ps1` whenever source files (`index.html`, `api.php`, `deploy-dietpi.sh`) are generated or modified.
- **PowerShell Deployer (`deploy.ps1`)**: Transfers updated files via SCP and executes remote permission fixes on `/var/www/html` via SSH.

## Workflow Instructions

1. **On Code Modification / Build**:
   - Save or update project files (`index.html`, `api.php`).
   - The `.agents/hooks.json` lifecycle hook will automatically sync changes to `192.168.0.100`.

2. **Manual Verification Command**:
   If an explicit manual deployment is needed:
   ```powershell
   .\deploy.ps1 -TargetHost "192.168.0.100" -User "root"
   ```

3. **Check Live Remote Status**:
   ```bash
   curl -I http://192.168.0.100/
   curl -s http://192.168.0.100/api.php
   ```
