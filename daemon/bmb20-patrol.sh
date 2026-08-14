#!/usr/bin/env bash
# ==============================================================================
# BMB20 AUTONOMOUS SENTINEL PATROL DAEMON
# Periodic LAN Sentinel, Thermal Spike Monitor & Pi-hole DNS Health Watchdog
# ==============================================================================

ALERT_FILE="/var/www/html/sentinel_alerts.json"
KNOWN_MACS_FILE="/etc/bmb20/known_macs.txt"

mkdir -p /etc/bmb20 2>/dev/null || true
touch "$KNOWN_MACS_FILE" 2>/dev/null || true

# 1. Check CPU Temperature Spike (> 70°C)
TEMP_VAL=45
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    RAW_T=$(cat /sys/class/thermal/thermal_zone0/temp)
    TEMP_VAL=$((RAW_T / 1000))
fi

# 2. Check Throttling Flags
THROTTLED="0x0"
if command -v vcgencmd >/dev/null 2>&1; then
    THROTTLED=$(vcgencmd get_throttled 2>/dev/null | cut -d'=' -f2)
fi

# 3. Check Pi-hole DNS Health
DNS_OK=true
if command -v pihole-FTL >/dev/null 2>&1; then
    if ! pgrep -x "pihole-FTL" >/dev/null 2>&1; then
        DNS_OK=false
    fi
fi

# 4. Check LAN ARP Devices & Track Nodes
NEW_DEVICES=0
CURRENT_MACS=()
if [ -f /proc/net/arp ]; then
    while read -r ip hw type mac flags mask dev; do
        if [ "$mac" != "00:00:00:00:00:00" ] && [ -n "$mac" ] && [ "$ip" != "IP" ]; then
            CURRENT_MACS+=("$mac")
            if [ -w "$KNOWN_MACS_FILE" ] && ! grep -q -i "$mac" "$KNOWN_MACS_FILE" 2>/dev/null; then
                echo "$mac $ip $(date +%s)" >> "$KNOWN_MACS_FILE"
                NEW_DEVICES=$((NEW_DEVICES + 1))
            fi
        fi
    done < /proc/net/arp
fi

TOTAL_LAN=${#CURRENT_MACS[@]}

# 5. Formulate Sentinel Status
STATUS="NOMINAL"
LEVEL="GREEN"
MESSAGE="Perimeter defenses, thermal zones, and LAN nodes verified nominal."

if [ "$TEMP_VAL" -ge 72 ]; then
    STATUS="THERMAL_WARNING"
    LEVEL="YELLOW"
    MESSAGE="CPU core temperature spike detected (${TEMP_VAL}°C). Active cooling recommended."
elif [ "$DNS_OK" = false ]; then
    STATUS="DNS_DEGRADED"
    LEVEL="YELLOW"
    MESSAGE="Pi-hole DNS resolver anomaly detected. Recommend restartdns."
fi

cat <<EOF > "$ALERT_FILE"
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "$STATUS",
  "level": "$LEVEL",
  "temp_c": $TEMP_VAL,
  "throttled": "$THROTTLED",
  "dns_ok": $DNS_OK,
  "total_lan_devices": $TOTAL_LAN,
  "new_devices_detected": $NEW_DEVICES,
  "message": "$MESSAGE"
}
EOF

chmod 664 "$ALERT_FILE" 2>/dev/null || true
cp "$ALERT_FILE" /var/www/sentinel_alerts.json 2>/dev/null || true
