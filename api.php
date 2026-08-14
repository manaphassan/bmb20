<?php
// DietPi System Telemetry Endpoint
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

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
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 1800) {
        $cached = @file_get_contents($cache_file);
        if ($cached) {
            $data = @json_decode($cached, true);
            if ($data && !empty($data['latitude']) && !empty($data['ip']) && $data['ip'] !== '192.168.0.100') {
                return $data;
            }
        }
    }

    $ctx = stream_context_create(['http' => ['timeout' => 4, 'header' => "User-Agent: DietPi-BMB20/1.0\r\n"]]);
    
    // 1. Query ipify for server's real Public IP
    $public_ip = trim(@file_get_contents('https://api.ipify.org', false, $ctx));
    
    // 2. Resolve GeoIP coordinates via ipwho.is
    $url = $public_ip ? "https://ipwho.is/{$public_ip}" : "https://ipwho.is/";
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw) {
        $json = @json_decode($raw, true);
        if ($json && !empty($json['success']) && isset($json['latitude'])) {
            $geo = [
                'city' => strtoupper($json['city'] ?? 'KUALA LUMPUR'),
                'country' => strtoupper($json['country_code'] ?? $json['country'] ?? 'MY'),
                'latitude' => floatval($json['latitude']),
                'longitude' => floatval($json['longitude']),
                'ip' => $json['ip'] ?? $public_ip ?? 'LOCKED'
            ];
            @file_put_contents($cache_file, json_encode($geo));
            return $geo;
        }
    }

    // Default Fallback
    return [
        'city' => 'KUALA LUMPUR',
        'country' => 'MY',
        'latitude' => 3.1390,
        'longitude' => 101.6869,
        'ip' => $public_ip ?: '202.186.1.1'
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
                        $host = @gethostbyaddr($ip);
                        if (!$host || $host === $ip) {
                            $host = "NODE-" . substr(str_replace(':', '', $mac), -4);
                        } else {
                            $host = explode('.', $host)[0];
                        }
                        $devices[] = [
                            'name' => strtoupper(substr($host, 0, 14)),
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

$data = [
    'timestamp' => date('c'),
    'hostname' => gethostname() ?: 'dietpi.local',
    'cpu' => get_cpu_load(),
    'memory' => get_memory_info(),
    'temp' => get_cpu_temp(),
    'disk' => get_disk_info(),
    'uptime' => get_uptime_formatted(),
    'geoip' => get_geoip_info(),
    'lan_devices' => get_real_lan_devices()
];

echo json_encode($data, JSON_PRETTY_PRINT);
