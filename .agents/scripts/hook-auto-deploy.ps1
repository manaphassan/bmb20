# PostToolUse Hook for Auto-Deploying to DietPi Server
[CmdletBinding()]
param()

# Read stdin to consume JSON context payload
$inputJson = [System.Console]::In.ReadToEnd()

# Target host details
$TargetHost = "dietpi.local"
$User = "dietpi"
$RemoteStaging = "/tmp/bmb20_deploy"
$ScriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$ProjectDir = (Get-Item $ScriptDir).Parent.Parent.FullName
$DeployScript = Join-Path $ProjectDir "deploy.ps1"
$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519"

if (Test-Path $DeployScript) {
    try {
        if (Test-Path $KeyPath) {
            ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "mkdir -p ${RemoteStaging}" 2>$null
            Get-Content "$ProjectDir\index.html" -Raw | ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/index.html" 2>$null
            Get-Content "$ProjectDir\api.php" -Raw | ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/api.php" 2>$null
            Get-Content "$ProjectDir\deploy-dietpi.sh" -Raw | ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/deploy-dietpi.sh" 2>$null
            ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "chmod +x ${RemoteStaging}/deploy-dietpi.sh && sudo ${RemoteStaging}/deploy-dietpi.sh" 2>$null
        } else {
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "mkdir -p ${RemoteStaging}" 2>$null
            Get-Content "$ProjectDir\index.html" -Raw | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/index.html" 2>$null
            Get-Content "$ProjectDir\api.php" -Raw | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/api.php" 2>$null
            Get-Content "$ProjectDir\deploy-dietpi.sh" -Raw | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "cat > ${RemoteStaging}/deploy-dietpi.sh" 2>$null
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 "${User}@${TargetHost}" "chmod +x ${RemoteStaging}/deploy-dietpi.sh && sudo ${RemoteStaging}/deploy-dietpi.sh" 2>$null
        }
    } catch {
        # Ignore silent network timeout during background editing
    }
}

# Output empty JSON object required by PostToolUse contract
Write-Output "{}"
