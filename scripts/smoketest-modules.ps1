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

# 1. Telemetry Stream Validation
Test-Endpoint -Name "Telemetry Data" -Url "http://$TargetHost/api.json?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.cpu -and $null -ne $j.memory -and $null -ne $j.temp)
}

# 2. Chrono Calendar Events Validation
Test-Endpoint -Name "Calendar Events" -Url "http://$TargetHost/calendar_events.json?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.all_events -or $null -ne $j.events_upcoming)
}

# 3. Calendar Config Validation
Test-Endpoint -Name "Calendar Config" -Url "http://$TargetHost/calendar_config.json?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($null -ne $j.calendars -and $j.calendars.Count -ge 1)
}

# 4. Meena Hearth Master Memory Validation
Test-Endpoint -Name "Meena Hearth Vault" -Url "http://$TargetHost/meenaHearth.json?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -Validator {
    param($j)
    return ($j.name -eq "meenaHearth" -and $null -ne $j.core_memories -and $null -ne $j.persona_and_personality)
}

# 5. Core HTML Landing Pages
Write-Host "[...] Testing Main Dashboard (http://$TargetHost/index.html)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/index.html" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
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

Write-Host "[...] Testing Settings Portal (http://$TargetHost/settings.html)..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "http://$TargetHost/settings.html" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
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

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Test Summary: $Passed Passed, $Failed Failed" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "==================================================" -ForegroundColor Cyan

if ($Failed -gt 0) {
    exit 1
}
exit 0
