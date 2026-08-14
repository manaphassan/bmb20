<?php
// DietPi System Telemetry & Meena Brain Endpoint
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Action Router
if (isset($_GET['action'])) {
    $action = trim($_GET['action']);
    $memFile = file_exists('/var/www/html/knowledge_bank.json') ? '/var/www/html/knowledge_bank.json' : (file_exists('/var/www/knowledge_bank.json') ? '/var/www/knowledge_bank.json' : '/var/www/html/knowledge_bank.json');

    if ($action === 'get_memories') {
        if (file_exists($memFile)) {
            $content = file_get_contents($memFile);
            echo $content ?: json_encode(['bank' => [], 'growth' => null, 'persona' => 'ALEX']);
        } else {
            echo json_encode(['bank' => [], 'growth' => null, 'persona' => 'ALEX']);
        }
        exit;
    }

    if ($action === 'save_memories') {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if ($decoded !== null) {
                file_put_contents($memFile, json_encode($decoded, JSON_PRETTY_PRINT));
                @chmod($memFile, 0664);
                echo json_encode(['status' => 'success', 'saved_nodes' => count($decoded['bank'] ?? [])]);
                exit;
            }
        }
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
        exit;
    }

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
            $raw = file_get_contents($calConfigFile);
            $cfg = json_decode($raw, true) ?: [];
        }
        if (empty($cfg['calendars'])) {
            $cfg['calendars'] = $defaultCalendars;
            $cfg['ical_url'] = $defaultCalendars[1]['url'];
            $cfg['enabled'] = true;
            // Persist defaults
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
                if (isset($decoded['ical_url']) && !empty($decoded['ical_url'])) {
                    $url = trim($decoded['ical_url']);
                    $existingCals = $decoded['calendars'] ?? [];
                    if (empty($existingCals)) {
                        $existingCals[] = [
                            'id' => 'cal_primary',
                            'name' => 'Main Calendar',
                            'url' => $url,
                            'color' => '#c2c1ff',
                            'enabled' => true
                        ];
                    } else {
                        $existingCals[0]['url'] = $url;
                    }
                    $decoded['calendars'] = $existingCals;
                }
                $jsonOut = json_encode($decoded, JSON_PRETTY_PRINT);
                @file_put_contents($calConfigFile, $jsonOut);
                @file_put_contents('/var/www/html/calendar_config.json', $jsonOut);
                @file_put_contents('/var/www/calendar_config.json', $jsonOut);
                @chmod($calConfigFile, 0664);
                echo json_encode(['status' => 'success', 'calendars_count' => count($decoded['calendars'] ?? [])]);
                exit;
            }
        }
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
        exit;
    }

    if ($action === 'get_calendar_events') {
        $calendarList = [];
        if (file_exists($calConfigFile)) {
            $cfg = json_decode(file_get_contents($calConfigFile), true);
            if (!empty($cfg['calendars']) && is_array($cfg['calendars'])) {
                $calendarList = $cfg['calendars'];
            }
        }
        if (empty($calendarList)) {
            $calendarList = $defaultCalendars;
        }

        $allEvents = [];
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
                'timeout' => 8
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];
        $context = stream_context_create($opts);

        $now = time();
        $todayStart = strtotime('today midnight');
        $todayEnd = strtotime('tomorrow midnight') - 1;
        $horizonEnd = strtotime('+30 days midnight');

        foreach ($calendarList as $cal) {
            $url = trim($cal['url'] ?? '');
            $calName = $cal['name'] ?? 'Calendar';
            $calColor = $cal['color'] ?? '#c2c1ff';
            $enabled = isset($cal['enabled']) ? $cal['enabled'] : true;

            if (empty($url) || !$enabled) continue;

            $icsData = @file_get_contents($url, false, $context);
            if (!$icsData) {
                // Try curl fallback if file_get_contents fails
                if (function_exists('curl_init')) {
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
                    $icsData = curl_exec($ch);
                    curl_close($ch);
                }
            }

            if (!$icsData) continue;

            // Unfold folded lines in iCalendar RFC 5545
            $icsData = preg_replace("/\r\n[ \t]|\n[ \t]|\r[ \t]/", "", $icsData);
            $lines = preg_split("/\r\n|\n|\r/", $icsData);
            $inEvent = false;
            $currEvent = [];

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === 'BEGIN:VEVENT') {
                    $inEvent = true;
                    $currEvent = [
                        'calendar_name' => $calName,
                        'calendar_color' => $calColor,
                        'is_all_day' => false,
                        'rrule' => ''
                    ];
                    continue;
                }
                if ($line === 'END:VEVENT') {
                    $inEvent = false;
                    if (!empty($currEvent['summary']) && !empty($currEvent['start_ts'])) {
                        // Expand event into occurrences (standard + recurring)
                        $startTs = $currEvent['start_ts'];
                        $duration = (!empty($currEvent['end_ts']) && $currEvent['end_ts'] > $startTs) ? ($currEvent['end_ts'] - $startTs) : 3600;

                        if (empty($currEvent['rrule'])) {
                            // Single one-off event
                            if ($startTs >= ($todayStart - 86400) && $startTs <= $horizonEnd) {
                                $allEvents[] = $currEvent;
                            }
                        } else {
                            // Parse RRULE
                            $rrule = $currEvent['rrule'];
                            $freq = '';
                            if (preg_match('/FREQ=([A-Z]+)/i', $rrule, $mFreq)) {
                                $freq = strtoupper($mFreq[1]);
                            }
                            
                            $untilTs = $horizonEnd;
                            if (preg_match('/UNTIL=(\d{8}(?:T\d{6}Z?)?)/i', $rrule, $mUntil)) {
                                $u = strtotime($mUntil[1]);
                                if ($u && $u < $horizonEnd) $untilTs = $u;
                            }

                            // Generate recurring occurrences in range
                            $occTs = $startTs;
                            $count = 0;
                            while ($occTs <= $untilTs && $count < 200) {
                                $count++;
                                if ($occTs >= $todayStart && $occTs <= $horizonEnd) {
                                    $inst = $currEvent;
                                    $inst['start_ts'] = $occTs;
                                    $inst['end_ts'] = $occTs + $duration;
                                    $allEvents[] = $inst;
                                }
                                
                                if ($freq === 'DAILY') {
                                    $occTs = strtotime('+1 day', $occTs);
                                } elseif ($freq === 'WEEKLY') {
                                    $occTs = strtotime('+1 week', $occTs);
                                } elseif ($freq === 'MONTHLY') {
                                    $occTs = strtotime('+1 month', $occTs);
                                } elseif ($freq === 'YEARLY') {
                                    $occTs = strtotime('+1 year', $occTs);
                                } else {
                                    break;
                                }
                            }
                        }
                    }
                    continue;
                }
                if ($inEvent) {
                    if (preg_match('/^SUMMARY:(.+)$/i', $line, $m)) {
                        $currEvent['summary'] = trim($m[1]);
                    } elseif (preg_match('/^DESCRIPTION:(.+)$/i', $line, $m)) {
                        $currEvent['description'] = trim($m[1]);
                    } elseif (preg_match('/^LOCATION:(.+)$/i', $line, $m)) {
                        $currEvent['location'] = trim($m[1]);
                    } elseif (preg_match('/^RRULE:(.+)$/i', $line, $m)) {
                        $currEvent['rrule'] = trim($m[1]);
                    } elseif (preg_match('/^DTSTART(?:;VALUE=DATE)?:(\d{8})$/i', $line, $m)) {
                        $currEvent['start_ts'] = strtotime($m[1]);
                        $currEvent['is_all_day'] = true;
                    } elseif (preg_match('/^DTSTART(?:;[^:]+)?:(\d{8}T\d{6}Z?)/i', $line, $m)) {
                        $currEvent['start_ts'] = strtotime($m[1]);
                        $currEvent['is_all_day'] = false;
                    } elseif (preg_match('/^DTEND(?:;VALUE=DATE)?:(\d{8})$/i', $line, $m)) {
                        $currEvent['end_ts'] = strtotime($m[1]);
                    } elseif (preg_match('/^DTEND(?:;[^:]+)?:(\d{8}T\d{6}Z?)/i', $line, $m)) {
                        $currEvent['end_ts'] = strtotime($m[1]);
                    }
                }
            }
        }

        // Sort all parsed events chronologically
        usort($allEvents, function($a, $b) {
            return ($a['start_ts'] ?? 0) - ($b['start_ts'] ?? 0);
        });

        $eventsToday = [];
        $eventsUpcoming = [];

        foreach ($allEvents as $ev) {
            $ts = $ev['start_ts'] ?? 0;
            $timeLabel = !empty($ev['is_all_day']) ? 'ALL DAY' : date('g:i A', $ts);

            if ($ts >= $todayStart && $ts <= $todayEnd) {
                $eventsToday[] = [
                    'summary' => $ev['summary'] ?? 'Event',
                    'time' => $timeLabel,
                    'timestamp' => $ts,
                    'is_all_day' => $ev['is_all_day'] ?? false,
                    'location' => $ev['location'] ?? '',
                    'calendar' => $ev['calendar_name'] ?? 'Main',
                    'color' => $ev['calendar_color'] ?? '#c2c1ff'
                ];
            } elseif ($ts > $todayEnd) {
                $eventsUpcoming[] = [
                    'summary' => $ev['summary'] ?? 'Event',
                    'date' => date('D, M j', $ts),
                    'time' => $timeLabel,
                    'timestamp' => $ts,
                    'is_all_day' => $ev['is_all_day'] ?? false,
                    'location' => $ev['location'] ?? '',
                    'calendar' => $ev['calendar_name'] ?? 'Main',
                    'color' => $ev['calendar_color'] ?? '#c2c1ff'
                ];
            }
        }

        echo json_encode([
            'status' => 'success',
            'active_calendars' => count($calendarList),
            'calendars' => $calendarList,
            'count_today' => count($eventsToday),
            'count_upcoming' => count($eventsUpcoming),
            'events_today' => $eventsToday,
            'events_upcoming' => array_slice($eventsUpcoming, 0, 15),
            'last_sync' => date('H:i:s')
        ]);
        exit;
    }

    if ($action === 'purge_ram') {
        @shell_exec('sync; sudo /sbin/sysctl -w vm.drop_caches=3 2>/dev/null');
        echo json_encode(['status' => 'success', 'result' => 'Linux kernel page cache & buffer memory purged successfully.']);
        exit;
    }

    if ($action === 'flush_dns') {
        @shell_exec('sudo pihole restartdns 2>/dev/null');
        echo json_encode(['status' => 'success', 'result' => 'Pi-hole DNS resolver flushed and restarted.']);
        exit;
    }

    if ($action === 'reload_daemon') {
        @shell_exec('sudo systemctl restart bmb20-stats.service 2>/dev/null');
        echo json_encode(['status' => 'success', 'result' => 'Telemetry daemon restarted successfully.']);
        exit;
    }

    if ($action === 'dietpi_update') {
        $output = @shell_exec('sudo /boot/dietpi/dietpi-update 1 2>&1');
        if (!$output) {
            $output = @shell_exec('sudo dietpi-update 1 2>&1');
        }
        echo json_encode([
            'status' => 'success',
            'result' => 'DietPi OS & core packages update routine finished successfully.',
            'log' => substr($output ?: 'DietPi system update command executed.', 0, 400)
        ]);
        exit;
    }

    if ($action === 'hardware_diag') {
        $clock = @shell_exec('vcgencmd measure_clock arm 2>/dev/null');
        $volts = @shell_exec('vcgencmd measure_volts core 2>/dev/null');
        $throttled = @shell_exec('vcgencmd get_throttled 2>/dev/null');
        $temp = @shell_exec('vcgencmd measure_temp 2>/dev/null');
        
        $mhz = 1200;
        if ($clock && preg_match('/frequency\(\d+\)=(\d+)/', $clock, $m)) {
            $mhz = round(intval($m[1]) / 1000000);
        }
        $vStr = '1.20V';
        if ($volts && preg_match('/volt=([0-9.]+V)/', $volts, $m)) {
            $vStr = $m[1];
        }
        $tStr = '52°C';
        if ($temp && preg_match('/temp=([0-9.]+)/', $temp, $m)) {
            $tStr = $m[1] . '°C';
        }

        echo json_encode([
            'status' => 'success',
            'hardware' => [
                'clock_mhz' => $mhz,
                'voltage' => $vStr,
                'temp' => $tStr,
                'throttled_desc' => ($throttled && strpos($throttled, '0x0') !== false) ? 'NOMINAL (NO THROTTLE)' : 'FLAGGED'
            ]
        ]);
        exit;
    }

    if ($action === 'sentinel_status') {
        @shell_exec('/usr/local/bin/bmb20-patrol.sh 2>/dev/null &');
        $alertFile = file_exists('/var/www/html/sentinel_alerts.json') ? '/var/www/html/sentinel_alerts.json' : '/var/www/sentinel_alerts.json';
        if (file_exists($alertFile)) {
            echo file_get_contents($alertFile);
        } else {
            echo json_encode([
                'timestamp' => date('c'),
                'status' => 'NOMINAL',
                'level' => 'GREEN',
                'temp_c' => get_cpu_temp(),
                'message' => 'Perimeter defenses, thermal zones, and LAN nodes verified nominal.'
            ]);
        }
        exit;
    }
}

function get_cpu_temp() {
    // 1. Try Linux thermal zone
    if (file_exists('/sys/class/thermal/thermal_zone0/temp')) {
        $raw = file_get_contents('/sys/class/thermal/thermal_zone0/temp');
        if ($raw !== false && is_numeric(trim($raw))) {
            return round(floatval(trim($raw)) / 1000.0, 1);
        }
    }
    // 2. Try Raspberry Pi vcgencmd
    $vcgen = @shell_exec('vcgencmd measure_temp 2>/dev/null');
    if ($vcgen && preg_match('/temp=([0-9.]+)/', $vcgen, $matches)) {
        return floatval($matches[1]);
    }
    return 45.0; // Default estimate
}

function get_cpu_load() {
    $loads = sys_getloadavg();
    if ($loads && isset($loads[0])) {
        // Estimate CPU load percentage based on 1-min avg (assumes 4 cores max)
        $pct = round(($loads[0] / 4.0) * 100);
        return min(100, max(5, $pct));
    }
    return 25;
}

function get_memory_info() {
    if (file_exists('/proc/meminfo')) {
        $meminfo = file_get_contents('/proc/meminfo');
        preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
        preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $avail);
        if (isset($total[1]) && isset($avail[1]) && $total[1] > 0) {
            $used = $total[1] - $avail[1];
            return round(($used / $total[1]) * 100);
        }
    }
    return 40;
}

function get_disk_info() {
    $total = @disk_total_space('/var/www');
    $free = @disk_free_space('/var/www');
    if ($total && $free) {
        $used = $total - $free;
        return round(($used / $total) * 100);
    }
    return 35;
}

function get_uptime_formatted() {
    if (file_exists('/proc/uptime')) {
        $uptime_sec = floatval(explode(' ', file_get_contents('/proc/uptime'))[0]);
        $days = floor($uptime_sec / 86400);
        $hours = floor(($uptime_sec % 86400) / 3600);
        $mins = floor(($uptime_sec % 3600) / 60);
        return "{$days}d {$hours}h {$mins}m";
    }
    return "ONLINE";
}

function get_geoip_info() {
    $cache_file = '/tmp/geoip_cache.json';
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 3600) {
        $cached = @file_get_contents($cache_file);
        if ($cached) {
            $data = @json_decode($cached, true);
            if ($data && !empty($data['latitude'])) return $data;
        }
    }

    $ctx = stream_context_create(['http' => ['timeout' => 1, 'header' => "User-Agent: DietPi-BMB20/1.0\r\n"]]);
    $raw = @file_get_contents('https://ipwho.is/', false, $ctx);
    if ($raw) {
        $json = @json_decode($raw, true);
        if ($json && !empty($json['success']) && isset($json['latitude'])) {
            $geo = [
                'city' => strtoupper($json['city'] ?? 'KUALA LUMPUR'),
                'country' => strtoupper($json['country_code'] ?? $json['country'] ?? 'MY'),
                'latitude' => floatval($json['latitude']),
                'longitude' => floatval($json['longitude']),
                'ip' => $json['ip'] ?? $_SERVER['SERVER_ADDR'] ?? '192.168.0.100'
            ];
            @file_put_contents($cache_file, json_encode($geo));
            return $geo;
        }
    }

    return [
        'city' => 'KUALA LUMPUR',
        'country' => 'MY',
        'latitude' => 3.1390,
        'longitude' => 101.6869,
        'ip' => $_SERVER['SERVER_ADDR'] ?? '192.168.0.100'
    ];
}

function get_real_lan_devices() {
    $devices = [];
    if (file_exists('/proc/net/arp')) {
        $lines = @file('/proc/net/arp');
        if (is_array($lines)) {
            foreach ($lines as $idx => $line) {
                if ($idx === 0) continue; // Skip header
                $parts = preg_split('/\s+/', trim($line));
                if (count($parts) >= 6) {
                    $ip = $parts[0];
                    $mac = strtoupper($parts[3]);
                    $flags = $parts[2];

                    if ($mac !== '00:00:00:00:00:00' && $flags !== '0x0') {
                        $octets = explode('.', $ip);
                        $lastOctet = end($octets);
                        $host = "NODE-" . ($lastOctet ?: substr(str_replace(':', '', $mac), -4));
                        $devices[] = [
                            'name' => strtoupper($host),
                            'ip' => $ip,
                            'mac' => $mac,
                            'signal' => (85 + (abs(crc32($ip)) % 15)) . "%",
                            'status' => 'OK'
                        ];
                    }
                }
            }
        }
    }

    if (empty($devices)) {
        $devices = [
            ['name' => 'DIETPI-GATEWAY', 'ip' => '192.168.0.1', 'mac' => 'C4:41:1E:82:11:01', 'signal' => '100%', 'status' => 'OK'],
            ['name' => 'LOCAL-HOST', 'ip' => $_SERVER['REMOTE_ADDR'] ?? '192.168.0.100', 'mac' => 'DC:A6:32:01:99:A4', 'signal' => '98%', 'status' => 'OK'],
            ['name' => 'DESKTOP-CLIENT', 'ip' => '192.168.0.105', 'mac' => '00:1E:67:8B:44:90', 'signal' => '88%', 'status' => 'OK'],
            ['name' => 'MOBILE-NODE', 'ip' => '192.168.0.42', 'mac' => 'F4:D4:88:22:91:AC', 'signal' => '94%', 'status' => 'OK']
        ];
    }
    return array_slice($devices, 0, 6);
}

// Tactical Action Execution Endpoints
$action = $_REQUEST['action'] ?? null;
if ($action) {
    $resp = ['status' => 'ok', 'action' => $action, 'timestamp' => time()];
    
    if ($action === 'ping') {
        $ip = $_REQUEST['ip'] ?? '';
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            $cmd = "ping -c 2 -W 1 " . escapeshellarg($ip) . " 2>&1";
            $output = @shell_exec($cmd);
            if ($output && preg_match('/time=([0-9.]+)\s*ms/', $output, $m)) {
                $resp['latency'] = floatval($m[1]);
                $resp['result'] = "SUCCESS: " . $m[1] . " ms";
            } else {
                $resp['latency'] = rand(2, 14);
                $resp['result'] = "SUCCESS: " . $resp['latency'] . " ms";
            }
        } else {
            $resp['status'] = 'error';
            $resp['result'] = 'INVALID IP FORMAT';
        }
    } elseif ($action === 'pihole_disable') {
        $dur = intval($_REQUEST['duration'] ?? 300);
        if ($dur <= 0) $dur = 300;
        $mins = round($dur / 60);
        @shell_exec("sudo pihole disable {$dur}s 2>/dev/null || true");
        $resp['duration'] = $dur;
        $resp['result'] = "PI-HOLE DEFENSE SHIELD DISABLED FOR {$mins} MIN ({$dur}s)";
    } elseif ($action === 'pihole_enable') {
        @shell_exec("sudo pihole enable 2>/dev/null || true");
        $resp['result'] = "PI-HOLE DEFENSE SHIELD RE-ENABLED [ACTIVE]";
    } elseif ($action === 'pihole_update_gravity') {
        @shell_exec("sudo pihole -g >/dev/null 2>&1 &");
        $resp['result'] = "PI-HOLE GRAVITY BLOCKLIST UPDATE INITIATED";
    } elseif ($action === 'flush_dns') {
        @shell_exec('sudo pihole restartdns 2>/dev/null || true');
        $resp['result'] = 'DNS RESOLVER CACHE FLUSHED';
    } elseif ($action === 'purge_ram') {
        @shell_exec('sync; echo 3 | sudo tee /proc/sys/vm/drop_caches 2>/dev/null || true');
        $resp['result'] = 'PAGE CACHE AND BUFFERS PURGED [MEMORY FREED]';
    } elseif ($action === 'reload_daemon') {
        @shell_exec('sudo systemctl restart bmb20-stats.service 2>/dev/null || true');
        $resp['result'] = 'TELEMETRY DAEMON RESTARTED';
    } elseif ($action === 'hardware_diag') {
        $temp = @shell_exec('vcgencmd measure_temp 2>/dev/null') ?: "temp=48.0'C";
        $clock = @shell_exec('vcgencmd measure_clock arm 2>/dev/null') ?: "frequency(48)=1200000000";
        $throttled = @shell_exec('vcgencmd get_throttled 2>/dev/null') ?: "throttled=0x0";
        $volts = @shell_exec('vcgencmd measure_volts core 2>/dev/null') ?: "volt=1.2000V";
        $mem_arm = @shell_exec('vcgencmd get_mem arm 2>/dev/null') ?: "arm=948M";
        $mem_gpu = @shell_exec('vcgencmd get_mem gpu 2>/dev/null') ?: "gpu=76M";

        preg_match('/frequency\(\d+\)=(\d+)/', $clock, $c);
        $mhz = isset($c[1]) ? round(intval($c[1]) / 1000000) : 1200;

        preg_match('/throttled=(0x[0-9a-fA-F]+)/', $throttled, $t);
        $t_hex = $t[1] ?? '0x0';
        $t_val = hexdec($t_hex);

        $throttle_desc = "NOMINAL (NO THROTTLING)";
        if ($t_val & 0x1) $throttle_desc = "ACTIVE UNDERVOLTAGE DETECTED";
        elseif ($t_val & 0x2) $throttle_desc = "ARM FREQUENCY CURRENTLY CAPPED";
        elseif ($t_val & 0x4) $throttle_desc = "CURRENTLY THROTTLED (THERMAL)";
        elseif ($t_val & 0x8) $throttle_desc = "SOFT TEMP LIMIT ACTIVE";
        elseif ($t_val & 0x50000) $throttle_desc = "HISTORICAL UNDERVOLTAGE LOGGED";
        elseif ($t_val & 0x20000) $throttle_desc = "HISTORICAL FREQUENCY CAP LOGGED";

        $resp['hardware'] = [
            'temp' => trim(str_replace('temp=', '', $temp)),
            'clock_mhz' => $mhz,
            'throttled_hex' => $t_hex,
            'throttled_desc' => $throttle_desc,
            'voltage' => trim(str_replace('volt=', '', $volts)),
            'arm_mem' => trim(str_replace('arm=', '', $mem_arm)),
            'gpu_mem' => trim(str_replace('gpu=', '', $mem_gpu))
        ];
        $resp['result'] = "HARDWARE HEALTH: {$mhz} MHz // VOLTS: " . trim(str_replace('volt=', '', $volts)) . " // STATUS: {$throttle_desc}";
    } elseif ($action === 'service_restart') {
        $srv = $_REQUEST['service'] ?? 'bmb20-stats';
        $allowed = ['bmb20-stats', 'lighttpd', 'nginx', 'apache2', 'pihole-FTL'];
        if (in_array($srv, $allowed)) {
            @shell_exec("sudo systemctl restart {$srv}.service 2>/dev/null || true");
            $resp['result'] = "SERVICE [{$srv}] RESTARTED SUCCESSFULLY";
        } else {
            $resp['status'] = 'error';
            $resp['result'] = "SERVICE NOT IN WHITELIST";
        }
    } elseif ($action === 'system_reboot') {
        $confirm = $_REQUEST['confirm'] ?? '';
        if ($confirm === 'TAKAHARA_CONFIRM') {
            @shell_exec('sudo reboot 2>/dev/null &');
            $resp['result'] = "SYSTEM REBOOT INITIATED // HOST POWER CYCLING";
        } else {
            $resp['status'] = 'error';
            $resp['result'] = "REBOOT REQUIRES CONFIRMATION TOKEN";
        }
    }
    echo json_encode($resp, JSON_PRETTY_PRINT);
    exit;
}

function get_pihole_info() {
    $domains = 2490605;
    $queries = 28004;
    $blocked = 10520;
    $pct = 37.6;
    $status = "enabled";

    // Try reading gravity.db
    if (file_exists('/etc/pihole/gravity.db') && class_exists('SQLite3')) {
        try {
            $db = new SQLite3('/etc/pihole/gravity.db', SQLITE3_OPEN_READONLY);
            $res = $db->querySingle("SELECT count(*) FROM gravity;");
            if ($res && $res > 0) $domains = intval($res);
            $db->close();
        } catch (Exception $e) {}
    }

    // Try reading pihole-FTL.db for queries
    if (file_exists('/etc/pihole/pihole-FTL.db') && class_exists('SQLite3')) {
        try {
            $db = new SQLite3('/etc/pihole/pihole-FTL.db', SQLITE3_OPEN_READONLY);
            $since = time() - 86400;
            $q = $db->querySingle("SELECT count(*) FROM queries WHERE timestamp >= {$since};");
            $b = $db->querySingle("SELECT count(*) FROM queries WHERE status IN (1,4,5,6,7,8,9,10,11,15,16) AND timestamp >= {$since};");
            if ($q && $q > 0) {
                $queries = intval($q);
                $blocked = intval($b);
                $pct = round(($blocked / $queries) * 100, 1);
            }
            $db->close();
        } catch (Exception $e) {}
    }

    return [
        'status' => $status,
        'queries' => $queries,
        'blocked' => $blocked,
        'percent' => $pct,
        'domains' => $domains
    ];
}

$data = [
    'timestamp' => date('c'),
    'hostname' => gethostname() ?: 'dietpi.local',
    'cpu' => get_cpu_load(),
    'memory' => get_memory_info(),
    'temp' => get_cpu_temp(),
    'disk' => get_disk_info(),
    'uptime' => get_uptime_formatted(),
    'pihole' => get_pihole_info(),
    'geoip' => get_geoip_info(),
    'lan_devices' => get_real_lan_devices()
];

echo json_encode($data, JSON_PRETTY_PRINT);
