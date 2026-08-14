# Automated PowerShell Deployer for DietPi Landing Page
param (
    [string]$TargetHost = "dietpi.local",
    [string]$User = "dietpi",
    [string]$RemoteStaging = "/tmp/bmb20_deploy"
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Auto-deploying LCARS Landing Page to $User@$TargetHost" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
$LocalDir = $PSScriptRoot

if (-not (Test-Path "$LocalDir\index.html")) {
    Write-Error "index.html not found in $LocalDir"
    exit 1
}

# Helper function to convert CRLF -> LF for Linux execution
function Get-UnixContent ($path) {
    return (Get-Content $path -Raw).Replace("`r`n", "`n")
}

# 1. Create remote staging directory
Write-Host "[1/4] Creating staging directory $RemoteStaging on $TargetHost..." -ForegroundColor Yellow
if (Test-Path $KeyPath) {
    ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${TargetHost}" "mkdir -p ${RemoteStaging}"
} else {
    ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "mkdir -p ${RemoteStaging}"
}

# 2. Upload files to /tmp staging directory with Unix LF line endings
Write-Host "[2/4] Uploading index.html, api.php, deploy-dietpi.sh with Unix LF line endings..." -ForegroundColor Yellow
Get-UnixContent "$LocalDir\index.html" | ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "cat > ${RemoteStaging}/index.html"
Get-UnixContent "$LocalDir\api.php" | ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "cat > ${RemoteStaging}/api.php"
Get-UnixContent "$LocalDir\deploy-dietpi.sh" | ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "cat > ${RemoteStaging}/deploy-dietpi.sh"

# 3. Execute remote deployment script with sudo
Write-Host "[3/4] Executing remote deployment script with sudo..." -ForegroundColor Yellow
if (Test-Path $KeyPath) {
    ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${TargetHost}" "sed -i 's/\r$//' ${RemoteStaging}/deploy-dietpi.sh && chmod +x ${RemoteStaging}/deploy-dietpi.sh && sudo ${RemoteStaging}/deploy-dietpi.sh"
} else {
    ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "sed -i 's/\r$//' ${RemoteStaging}/deploy-dietpi.sh && chmod +x ${RemoteStaging}/deploy-dietpi.sh && sudo ${RemoteStaging}/deploy-dietpi.sh"
}

# 4. Reload web server to clear cache
Write-Host "[4/4] Reloading web server service..." -ForegroundColor Yellow
if (Test-Path $KeyPath) {
    ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${TargetHost}" "sudo systemctl reload lighttpd 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || sudo systemctl reload apache2 2>/dev/null || true"
} else {
    ssh -o StrictHostKeyChecking=no "${User}@${TargetHost}" "sudo systemctl reload lighttpd 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || sudo systemctl reload apache2 2>/dev/null || true"
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Deployment Complete! Please Hard Refresh Browser:" -ForegroundColor Green
Write-Host " Press Ctrl + F5 or Ctrl + Shift + R on http://$TargetHost" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
