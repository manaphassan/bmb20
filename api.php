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

$data = [
    'timestamp' => date('c'),
    'hostname' => gethostname() ?: 'dietpi.local',
    'cpu' => get_cpu_load(),
    'memory' => get_memory_info(),
    'temp' => get_cpu_temp(),
    'disk' => get_disk_info(),
    'uptime' => get_uptime_formatted()
];

echo json_encode($data, JSON_PRETTY_PRINT);
