<?php
// High-Speed Non-Regex Chrono Calendar Engine for MEENA™
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

@set_time_limit(10);
@ini_set('memory_limit', '64M');

$action = $_GET['action'] ?? $_POST['action'] ?? $_REQUEST['action'] ?? 'get_calendar_events';
if (empty($action) && !empty($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $qs);
    $action = $qs['action'] ?? 'get_calendar_events';
}
$action = trim($action);

$calConfigFile = __DIR__ . '/calendar_config.json';
if (!file_exists($calConfigFile)) {
    if (file_exists('/var/www/html/calendar_config.json')) {
        $calConfigFile = '/var/www/html/calendar_config.json';
    } elseif (file_exists('/var/www/calendar_config.json')) {
        $calConfigFile = '/var/www/calendar_config.json';
    }
}

$defaultCalendars = [
    [
        'id' => 'cal_school',
        'name' => 'School',
        'url' => 'https://calendar.google.com/calendar/ical/family18415538213271862905%40group.calendar.google.com/private-c9be2f37a11684206fb6444787171026/basic.ics',
        'color' => '#ffe253',
        'enabled' => true
    ],
    [
        'id' => 'cal_manaphassan',
        'name' => 'Manaphassan',
        'url' => 'https://calendar.google.com/calendar/ical/manaphassan%40gmail.com/private-7c930b7bb4f28b86c63cc1868910d334/basic.ics',
        'color' => '#c2c1ff',
        'enabled' => true
    ]
];

if ($action === 'get_calendar_config') {
    $cfg = [];
    if (file_exists($calConfigFile)) {
        $raw = @file_get_contents($calConfigFile);
        $cfg = json_decode($raw, true) ?: [];
    }
    if (empty($cfg['calendars'])) {
        $cfg['calendars'] = $defaultCalendars;
        $cfg['ical_url'] = $defaultCalendars[1]['url'];
        $cfg['enabled'] = true;
        @file_put_contents($calConfigFile, json_encode($cfg, JSON_PRETTY_PRINT));
        @file_put_contents('/var/www/html/calendar_config.json', json_encode($cfg, JSON_PRETTY_PRINT));
        @file_put_contents('/var/www/calendar_config.json', json_encode($cfg, JSON_PRETTY_PRINT));
    }
    echo json_encode($cfg);
    exit;
}

if ($action === 'save_calendar_config') {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $decoded = json_decode($raw, true);
        if ($decoded !== null) {
            $jsonOut = json_encode($decoded, JSON_PRETTY_PRINT);
            @file_put_contents($calConfigFile, $jsonOut);
            @file_put_contents('/var/www/html/calendar_config.json', $jsonOut);
            @file_put_contents('/var/www/calendar_config.json', $jsonOut);
            @chmod($calConfigFile, 0664);
            @array_map('unlink', glob('/tmp/bmb20_cal_*.ics'));
            echo json_encode(['status' => 'success', 'calendars_count' => count($decoded['calendars'] ?? [])]);
            exit;
        }
    }
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
    exit;
}

// Get Calendar Events
$calendarList = [];
if (file_exists($calConfigFile)) {
    $cfg = json_decode(@file_get_contents($calConfigFile), true);
    if (!empty($cfg['calendars']) && is_array($cfg['calendars'])) {
        $calendarList = $cfg['calendars'];
    }
}
if (empty($calendarList)) {
    $calendarList = $defaultCalendars;
}

$now = time();
$todayStart = strtotime('today midnight');
$todayEnd = strtotime('tomorrow midnight') - 1;
$horizonStart = strtotime('-30 days midnight');
$horizonEnd = strtotime('+180 days midnight');

$allEvents = [];

foreach ($calendarList as $cal) {
    $url = trim($cal['url'] ?? '');
    $calName = $cal['name'] ?? 'Calendar';
    $calColor = $cal['color'] ?? '#c2c1ff';
    $enabled = isset($cal['enabled']) ? $cal['enabled'] : true;

    if (empty($url) || !$enabled) continue;

    $cacheFile = '/tmp/bmb20_cal_' . md5($url) . '.ics';
    $icsData = '';

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < 600 && filesize($cacheFile) > 100) {
        $icsData = @file_get_contents($cacheFile);
    }

    if (empty($icsData)) {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
            $icsData = curl_exec($ch);
            curl_close($ch);
        }
        if (empty($icsData)) {
            $opts = [
                'http' => [
                    'method' => 'GET',
                    'header' => "User-Agent: Mozilla/5.0\r\n",
                    'timeout' => 6
                ],
                'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
            ];
            $icsData = @file_get_contents($url, false, stream_context_create($opts));
        }

        if (!empty($icsData)) {
            @file_put_contents($cacheFile, $icsData);
        }
    }

    if (empty($icsData)) continue;

    // Fast Line-by-Line Parser (Zero Regex Backtracking)
    $lines = preg_split("/\r\n|\n|\r/", $icsData);
    $inEvent = false;
    $curr = [];

    foreach ($lines as $rawLine) {
        $line = trim($rawLine);
        if ($line === 'BEGIN:VEVENT') {
            $inEvent = true;
            $curr = [
                'summary' => '',
                'location' => '',
                'start_ts' => 0,
                'is_all_day' => false,
                'rrule' => '',
                'calendar_name' => $calName,
                'calendar_color' => $calColor
            ];
            continue;
        }
        if ($line === 'END:VEVENT') {
            $inEvent = false;
            if (!empty($curr['summary']) && $curr['start_ts'] > 0) {
                $startTs = $curr['start_ts'];
                if (empty($curr['rrule'])) {
                    if ($startTs >= $horizonStart && $startTs <= $horizonEnd) {
                        $allEvents[] = $curr;
                    }
                } else {
                    $rrule = $curr['rrule'];
                    $freq = 'WEEKLY';
                    if (strpos($rrule, 'FREQ=DAILY') !== false) $freq = 'DAILY';
                    elseif (strpos($rrule, 'FREQ=MONTHLY') !== false) $freq = 'MONTHLY';
                    elseif (strpos($rrule, 'FREQ=YEARLY') !== false) $freq = 'YEARLY';

                    $untilTs = $horizonEnd;
                    if (preg_match('/UNTIL=(\d{8})/i', $rrule, $mU)) {
                        $u = strtotime($mU[1]);
                        if ($u && $u < $horizonEnd) $untilTs = $u;
                    }

                    // Fast forward
                    $occTs = $startTs;
                    if ($freq === 'WEEKLY' && $occTs < $horizonStart) {
                        $diffWeeks = floor(($horizonStart - $occTs) / (7 * 86400));
                        if ($diffWeeks > 0) $occTs += ($diffWeeks * 7 * 86400);
                    } elseif ($freq === 'DAILY' && $occTs < $horizonStart) {
                        $diffDays = floor(($horizonStart - $occTs) / 86400);
                        if ($diffDays > 0) $occTs += ($diffDays * 86400);
                    }

                    $c = 0;
                    while ($occTs <= $untilTs && $c < 30) {
                        $c++;
                        if ($occTs >= $horizonStart && $occTs <= $horizonEnd) {
                            $inst = $curr;
                            $inst['start_ts'] = $occTs;
                            $allEvents[] = $inst;
                        }
                        if ($freq === 'DAILY') $occTs = strtotime('+1 day', $occTs);
                        elseif ($freq === 'WEEKLY') $occTs = strtotime('+1 week', $occTs);
                        elseif ($freq === 'MONTHLY') $occTs = strtotime('+1 month', $occTs);
                        elseif ($freq === 'YEARLY') $occTs = strtotime('+1 year', $occTs);
                        else break;
                    }
                }
            }
            continue;
        }

        if ($inEvent) {
            if (strpos($line, 'SUMMARY:') === 0) {
                $curr['summary'] = str_replace(['\,', '\;'], [',', ';'], substr($line, 8));
            } elseif (strpos($line, 'LOCATION:') === 0) {
                $curr['location'] = str_replace(['\,', '\;'], [',', ';'], substr($line, 9));
            } elseif (strpos($line, 'RRULE:') === 0) {
                $curr['rrule'] = substr($line, 6);
            } elseif (strpos($line, 'DTSTART') === 0) {
                $parts = explode(':', $line, 2);
                if (count($parts) === 2) {
                    $dtVal = trim($parts[1]);
                    if (strlen($dtVal) === 8) { // 20260815
                        $curr['start_ts'] = strtotime($dtVal);
                        $curr['is_all_day'] = true;
                    } elseif (strlen($dtVal) >= 15) { // 20260815T090000Z
                        $curr['start_ts'] = strtotime($dtVal);
                        $curr['is_all_day'] = false;
                    }
                }
            }
        }
    }
}

// Sort all events
usort($allEvents, function($a, $b) {
    return ($a['start_ts'] ?? 0) - ($b['start_ts'] ?? 0);
});

$eventsToday = [];
$eventsUpcoming = [];
$eventsFormatted = [];

foreach ($allEvents as $ev) {
    $ts = $ev['start_ts'] ?? 0;
    $timeLabel = !empty($ev['is_all_day']) ? 'ALL DAY' : date('g:i A', $ts);
    $formatted = [
        'summary' => $ev['summary'] ?? 'Event',
        'date' => date('D, M j', $ts),
        'time' => $timeLabel,
        'timestamp' => $ts,
        'is_all_day' => $ev['is_all_day'] ?? false,
        'location' => $ev['location'] ?? '',
        'calendar' => $ev['calendar_name'] ?? 'Main',
        'color' => $ev['calendar_color'] ?? '#c2c1ff'
    ];

    $eventsFormatted[] = $formatted;

    if ($ts >= $todayStart && $ts <= $todayEnd) {
        $eventsToday[] = $formatted;
    } elseif ($ts > $todayEnd) {
        $eventsUpcoming[] = $formatted;
    }
}

echo json_encode([
    'status' => 'success',
    'active_calendars' => count($calendarList),
    'calendars' => $calendarList,
    'count_today' => count($eventsToday),
    'count_upcoming' => count($eventsUpcoming),
    'total_events' => count($allEvents),
    'events_today' => $eventsToday,
    'events_upcoming' => array_slice($eventsUpcoming, 0, 20),
    'all_events' => $eventsFormatted,
    'last_sync' => date('H:i:s')
]);
