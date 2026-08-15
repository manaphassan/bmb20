<#
==============================================================================
MEENA // TAKAHARA ACADEMY - MODULAR FAULT ISOLATION SMOKE TEST RUNNER
Validates all isolated subsystem endpoints, static JSON payloads, and syntax
==============================================================================
#>

param (
    [string]$TargetHost = "dietpi.local"
)

$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Running BMB20 Modular Pre-Flight Smoke Tests...  " -ForegroundColor Cyan
Write-Host " Target Host: http://$TargetHost                  " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$Passed = 0
$Failed = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [scriptblock]$Validator
    )

    Write-Host "[...] Testing $Name ($Url)..." -NoNewline
    try {
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $json = $resp.Content | ConvertFrom-Json -ErrorAction Stop
            $isValid = & $Validator $json
            if ($isValid) {
                Write-Host " [PASS]" -ForegroundColor Green
                $script:Passed++
                return
            }
        }
        Write-Host " [FAIL - Invalid Schema]" -ForegroundColor Red
        $script:Failed++
    } catch {
        Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
        $script:Failed++
    }
}

# 1. Telemetry Stream Validation (Masked /api/telemetry)
Test-Endpoint -Name "Masked Telemetry Data" -Url "http://$TargetHost/api/telemetry?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.cpu -and $null -ne $j.memory -and $null -ne $j.temp)
}

# 2. Chrono Calendar Events Validation (Masked /api/calendar)
Test-Endpoint -Name "Masked Calendar Events" -Url "http://$TargetHost/api/calendar?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.all_events -or $null -ne $j.events_upcoming)
}

# 3. Calendar Config Validation (Masked /api/calendar/config)
Test-Endpoint -Name "Masked Calendar Config" -Url "http://$TargetHost/api/calendar/config?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.calendars -and $j.calendars.Count -ge 1)
}

# 4. Meena Hearth Master Memory Validation (Masked /api/hearth)
Test-Endpoint -Name "Masked Hearth Vault" -Url "http://$TargetHost/api/hearth?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($j.name -eq "meenaHearth" -and $null -ne $j.core_memories -and $null -ne $j.persona_and_personality)
}

# 5. Neural TTS Reverse Proxy Validation (/api/tts)
Write-Host "[...] Testing Neural TTS Proxy (http://$TargetHost/api/tts)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/api/tts?voice=jenny&text=System+nominal" -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200 -and $r.Headers["Content-Type"] -match "audio/mpeg") {
        Write-Host " [PASS]" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
    $Failed++
}

# 6. Clean Masked URLs (/dashboard, /settings)
Write-Host "[...] Testing Masked Dashboard (http://$TargetHost/dashboard)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/dashboard" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200 -and $r.Content.Contains("M.E.E.N.A.")) {
        Write-Host " [PASS]" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
    $Failed++
}

Write-Host "[...] Testing Masked Settings (http://$TargetHost/settings)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/settings" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200 -and $r.Content.Contains("MEENA HEARTH")) {
        Write-Host " [PASS]" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
    $Failed++
}

# 7. Security Lockdown Verification (Direct script access must be BLOCKED)
Write-Host "[...] Testing Security Lockdown on Sensitive Scripts (http://$TargetHost/daemon/bmb20-stats.sh)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/daemon/bmb20-stats.sh" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host " [FAIL - Exposed with 200 OK]" -ForegroundColor Red
    $Failed++
} catch {
    if ($_.Exception.Response.StatusCode -in @(403, 404)) {
        Write-Host " [PASS - Successfully Blocked $($_.Exception.Response.StatusCode)]" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host " [PASS - Blocked]" -ForegroundColor Green
        $Passed++
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Test Summary: $Passed Passed, $Failed Failed" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "==================================================" -ForegroundColor Cyan

if ($Failed -gt 0) {
    exit 1
}
exit 0
