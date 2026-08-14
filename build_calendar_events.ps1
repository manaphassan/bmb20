# Build high-performance pre-rendered calendar_events.json
$u1 = "https://calendar.google.com/calendar/ical/family18415538213271862905%40group.calendar.google.com/private-c9be2f37a11684206fb6444787171026/basic.ics"
$u2 = "https://calendar.google.com/calendar/ical/manaphassan%40gmail.com/private-7c930b7bb4f28b86c63cc1868910d334/basic.ics"

$calendars = @(
    @{ id = "cal_school"; name = "School"; url = $u1; color = "#ffe253"; enabled = $true },
    @{ id = "cal_manaphassan"; name = "Manaphassan"; url = $u2; color = "#c2c1ff"; enabled = $true }
)

$allEvents = @()
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$todayStart = [DateTimeOffset]::new((Get-Date).Date).ToUnixTimeSeconds()
$todayEnd = $todayStart + 86399
$horizonStart = $todayStart - (30 * 86400)
$horizonEnd = $todayStart + (180 * 86400)

foreach ($cal in $calendars) {
    try {
        $ics = (Invoke-WebRequest -Uri $cal.url -UseBasicParsing -TimeoutSec 10).Content
        $lines = $ics -split "`r?`n"
        $inEvent = $false
        $curr = @{}

        foreach ($line in $lines) {
            $line = $line.Trim()
            if ($line -eq 'BEGIN:VEVENT') {
                $inEvent = $true
                $curr = @{
                    summary = ""
                    location = ""
                    start_ts = 0
                    is_all_day = $false
                    calendar = $cal.name
                    color = $cal.color
                }
                continue
            }
            if ($line -eq 'END:VEVENT') {
                $inEvent = $false
                if ($curr.summary -and $curr.start_ts -gt 0) {
                    if ($curr.start_ts -ge $horizonStart -and $curr.start_ts -le $horizonEnd) {
                        $allEvents += $curr
                    }
                }
                continue
            }
            if ($inEvent) {
                if ($line -match '^SUMMARY:(.*)$') {
                    $curr.summary = $matches[1].Replace('\,', ',').Replace('\;', ';')
                } elseif ($line -match '^LOCATION:(.*)$') {
                    $curr.location = $matches[1].Replace('\,', ',').Replace('\;', ';')
                } elseif ($line -match '^DTSTART(?:;VALUE=DATE)?:(\d{8})$') {
                    $dStr = $matches[1]
                    $d = [DateTime]::ParseExact($dStr, "yyyyMMdd", [System.Globalization.CultureInfo]::InvariantCulture)
                    $curr.start_ts = [DateTimeOffset]::new($d).ToUnixTimeSeconds()
                    $curr.is_all_day = $true
                } elseif ($line -match '^DTSTART(?:;[^:]+)?:(\d{8}T\d{6}Z?)') {
                    $dStr = $matches[1].Replace("Z", "")
                    $d = [DateTime]::ParseExact($dStr, "yyyyMMddTHHmmss", [System.Globalization.CultureInfo]::InvariantCulture)
                    $curr.start_ts = [DateTimeOffset]::new($d).ToUnixTimeSeconds()
                    $curr.is_all_day = $false
                }
            }
        }
    } catch {
        Write-Host "Failed to fetch $($cal.name): $($_.Exception.Message)"
    }
}

# Sort events chronologically
$allEvents = $allEvents | Sort-Object { $_.start_ts }

$eventsToday = @()
$eventsUpcoming = @()
$eventsFormatted = @()

foreach ($ev in $allEvents) {
    $ts = $ev.start_ts
    $dt = [DateTimeOffset]::FromUnixTimeSeconds($ts).ToLocalTime()
    $timeLabel = if ($ev.is_all_day) { "ALL DAY" } else { $dt.ToString("h:mm tt") }
    $dateLabel = $dt.ToString("ddd, MMM d")

    $item = @{
        summary = $ev.summary
        date = $dateLabel
        time = $timeLabel
        timestamp = $ts
        is_all_day = $ev.is_all_day
        location = $ev.location
        calendar = $ev.calendar
        color = $ev.color
    }

    $eventsFormatted += $item

    if ($ts -ge $todayStart -and $ts -le $todayEnd) {
        $eventsToday += $item
    } elseif ($ts -gt $todayEnd) {
        $eventsUpcoming += $item
    }
}

$output = @{
    status = "success"
    active_calendars = $calendars.Count
    calendars = $calendars
    count_today = $eventsToday.Count
    count_upcoming = $eventsUpcoming.Count
    total_events = $eventsFormatted.Count
    events_today = $eventsToday
    events_upcoming = ($eventsUpcoming | Select-Object -First 25)
    all_events = $eventsFormatted
    last_sync = (Get-Date).ToString("HH:mm:ss")
}

$json = $output | ConvertTo-Json -Depth 6
$outPath = "d:\HaNa_Innovation\bmb20\calendar_events.json"
[System.IO.File]::WriteAllText($outPath, $json, [System.Text.Encoding]::UTF8)
Write-Host "Generated $outPath with $($eventsFormatted.Count) total events!"
