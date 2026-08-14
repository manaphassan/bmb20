---
name: ssh-dietpi-deploy
description: Automated SSH/SCP background deployment skill targeting DietPi server (192.168.0.100 or dietpi.local) using passwordless key id_dietpi.
---

# SSH DietPi Auto-Deploy Skill

Use this skill whenever building, modifying, or updating HTML, CSS, JavaScript, or PHP assets for the DietPi LCARS Command Center.

## 🚀 Execution Workflow

### 1. Dedicated Key Resolution
The deployment script and background hooks use the passwordless key:
- `$env:USERPROFILE\.ssh\id_dietpi`

### 2. Auto-Deploy Background Hook
The `.agents/hooks.json` lifecycle hook monitors `PostToolUse` events on:
- `index.html`
- `api.php`
- `deploy-dietpi.sh`
- `deploy.ps1`

When any file edit tool finishes (`write_to_file`, `replace_file_content`, `multi_replace_file_content`), the background hook automatically triggers:
```powershell
powershell -ExecutionPolicy Bypass -File ./.agents/scripts/hook-auto-deploy.ps1
```

### 3. Manual Command Trigger
To trigger an immediate manual deploy from PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -Command ".\deploy.ps1 -TargetHost '192.168.0.100' -User 'dietpi'"
```

### 4. Server Targets
- **Host**: `192.168.0.100` / `dietpi.local`
- **User**: `dietpi`
- **Web Root**: `/var/www/html/` and `/var/www/`
- **Permissions**: `www-data:www-data` (`755` dirs, `644` files)
- **Web Server Restart**: `systemctl restart nginx`
