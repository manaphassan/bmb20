# Automated PowerShell Deployer for DietPi Landing Page
param (
    [string]$TargetHost = "dietpi.local",
    [string]$User = "dietpi",
    [string]$RemoteStaging = "/tmp/bmb20_deploy"
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Auto-deploying MEENA // Takahara Academy to $User@$TargetHost" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$KeyPath = "$env:USERPROFILE\.ssh\id_dietpi"
if (-not (Test-Path $KeyPath)) {
    $KeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
}
$LocalDir = $PSScriptRoot

if (-not (Test-Path "$LocalDir\index.html")) {
    Write-Error "index.html not found in $LocalDir"
    exit 1
}

# Helper function to convert CRLF -> LF for Linux execution with UTF-8 encoding
function Get-UnixContent ($path) {
    if (Test-Path $path) {
        return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8).Replace("`r`n", "`n")
    }
    return ""
}

# Helper to run SSH command
function Invoke-SSH ($cmd) {
    if (Test-Path $KeyPath) {
        ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${TargetHost}" "$cmd"
    } else {
        ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "$cmd"
    }
}

# Helper to upload file via SSH
function Send-SSHFile ($localPath, $remotePath) {
    if (Test-Path $localPath) {
        if (Test-Path $KeyPath) {
            Get-UnixContent "$localPath" | ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${TargetHost}" "cat > '$remotePath'"
        } else {
            Get-UnixContent "$localPath" | ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "cat > '$remotePath'"
        }
    }
}

# 1. Create remote staging directory
Write-Host "[1/4] Creating staging directories on $TargetHost..." -ForegroundColor Yellow
Invoke-SSH "mkdir -p ${RemoteStaging}/daemon ${RemoteStaging}/assets"

# 2. Upload files to /tmp staging directory
Write-Host "[2/4] Uploading core files, assets, and daemon modules..." -ForegroundColor Yellow
Send-SSHFile "$LocalDir\index.html" "${RemoteStaging}/index.html"
Send-SSHFile "$LocalDir\settings.html" "${RemoteStaging}/settings.html"
Send-SSHFile "$LocalDir\api.php" "${RemoteStaging}/api.php"
Send-SSHFile "$LocalDir\cal.php" "${RemoteStaging}/cal.php"
if (Test-Path "$LocalDir\calendar_config.json") {
    Send-SSHFile "$LocalDir\calendar_config.json" "${RemoteStaging}/calendar_config.json"
}
if (Test-Path "$LocalDir\calendar_events.json") {
    Send-SSHFile "$LocalDir\calendar_events.json" "${RemoteStaging}/calendar_events.json"
}
if (Test-Path "$LocalDir\meenaHearth.json") {
    Send-SSHFile "$LocalDir\meenaHearth.json" "${RemoteStaging}/meenaHearth.json"
}
Send-SSHFile "$LocalDir\deploy-dietpi.sh" "${RemoteStaging}/deploy-dietpi.sh"

# Upload Assets recursively
if (Test-Path "$LocalDir\assets") {
    Get-ChildItem -Path "$LocalDir\assets" -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring("$LocalDir\assets\".Length).Replace('\', '/')
        $targetDir = [System.IO.Path]::GetDirectoryName($rel).Replace('\', '/')
        if ($targetDir) {
            Invoke-SSH "mkdir -p '${RemoteStaging}/assets/${targetDir}'"
        }
        Send-SSHFile $_.FullName "${RemoteStaging}/assets/${rel}"
    }
}

Send-SSHFile "$LocalDir\daemon\bmb20-stats.sh" "${RemoteStaging}/daemon/bmb20-stats.sh"
Send-SSHFile "$LocalDir\daemon\bmb20-stats.service" "${RemoteStaging}/daemon/bmb20-stats.service"

# 3. Execute remote deployment script with sudo
Write-Host "[3/4] Executing remote deployment script with sudo..." -ForegroundColor Yellow
Invoke-SSH "sed -i 's/\r$//' ${RemoteStaging}/deploy-dietpi.sh && chmod +x ${RemoteStaging}/deploy-dietpi.sh && sudo ${RemoteStaging}/deploy-dietpi.sh"

# 4. Restart web server to flush ETags & clear cache
Write-Host "[4/4] Restarting web server service..." -ForegroundColor Yellow
Invoke-SSH "sudo systemctl restart nginx 2>/dev/null || sudo systemctl restart lighttpd 2>/dev/null || sudo systemctl restart apache2 2>/dev/null || true"

# 5. Execute Automated Modular Verification Gate
if (Test-Path "$LocalDir\scripts\smoketest-modules.ps1") {
    Write-Host "[5/5] Executing Pre-Flight Smoke Test Gate..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File "$LocalDir\scripts\smoketest-modules.ps1" -TargetHost $TargetHost
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Deployment Complete! Please Hard Refresh Browser:" -ForegroundColor Green
Write-Host " Press Ctrl + F5 or Ctrl + Shift + R on http://$TargetHost" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
