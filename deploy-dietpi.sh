#!/bin/bash
# ==============================================================================
# DietPi Web Deployment Script for BMB20 LCARS Command Center
# ==============================================================================

echo "=================================================="
echo "  Deploying MEENA // Takahara Academy to DietPi   "
echo "=================================================="

TARGET_DIR="/var/www/html"
if [ ! -d "$TARGET_DIR" ]; then
    TARGET_DIR="/var/www"
fi

echo "[+] Target Web Directory: ${TARGET_DIR}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 1. Deploy Frontend Assets & API Backend
if [ -f "${SCRIPT_DIR}/index.html" ]; then
    echo "[+] Deploying index.html..."
    cp -fv "${SCRIPT_DIR}/index.html" "${TARGET_DIR}/index.html"
    cp -fv "${SCRIPT_DIR}/index.html" "/var/www/index.html" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/settings.html" ]; then
    echo "[+] Deploying settings.html..."
    cp -fv "${SCRIPT_DIR}/settings.html" "${TARGET_DIR}/settings.html"
    cp -fv "${SCRIPT_DIR}/settings.html" "/var/www/settings.html" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/api.php" ]; then
    echo "[+] Deploying api.php backend..."
    cp -fv "${SCRIPT_DIR}/api.php" "${TARGET_DIR}/api.php"
    cp -fv "${SCRIPT_DIR}/api.php" "/var/www/api.php" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/cal.php" ]; then
    echo "[+] Deploying cal.php calendar backend..."
    cp -fv "${SCRIPT_DIR}/cal.php" "${TARGET_DIR}/cal.php"
    cp -fv "${SCRIPT_DIR}/cal.php" "/var/www/cal.php" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/calendar_config.json" ]; then
    echo "[+] Deploying calendar_config.json..."
    cp -fv "${SCRIPT_DIR}/calendar_config.json" "${TARGET_DIR}/calendar_config.json"
    cp -fv "${SCRIPT_DIR}/calendar_config.json" "/var/www/calendar_config.json" 2>/dev/null || true
    chmod 0664 "${TARGET_DIR}/calendar_config.json" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/calendar_events.json" ]; then
    echo "[+] Deploying pre-rendered calendar_events.json..."
    cp -fv "${SCRIPT_DIR}/calendar_events.json" "${TARGET_DIR}/calendar_events.json"
    cp -fv "${SCRIPT_DIR}/calendar_events.json" "/var/www/calendar_events.json" 2>/dev/null || true
    chmod 0664 "${TARGET_DIR}/calendar_events.json" 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/meenaHearth.json" ]; then
    echo "[+] Deploying meenaHearth.json master core memory..."
    cp -fv "${SCRIPT_DIR}/meenaHearth.json" "${TARGET_DIR}/meenaHearth.json"
    cp -fv "${SCRIPT_DIR}/meenaHearth.json" "/var/www/meenaHearth.json" 2>/dev/null || true
    chmod 0664 "${TARGET_DIR}/meenaHearth.json" 2>/dev/null || true
fi

if [ -d "${SCRIPT_DIR}/assets" ]; then
    echo "[+] Deploying unified assets directory..."
    mkdir -p "${TARGET_DIR}/assets" "/var/www/assets"
    cp -rfv "${SCRIPT_DIR}/assets/"* "${TARGET_DIR}/assets/"
    cp -rfv "${SCRIPT_DIR}/assets/"* "/var/www/assets/" 2>/dev/null || true
fi

# Configure sudoers for www-data to manage Pi-hole, hardware and daemon actions without password
if [ -d "/etc/sudoers.d" ]; then
    echo "www-data ALL=(ALL) NOPASSWD: /usr/local/bin/pihole, /usr/bin/pihole, /usr/bin/systemctl, /usr/bin/sync, /usr/bin/tee, /usr/bin/vcgencmd, /sbin/reboot, /usr/sbin/reboot, /boot/dietpi/dietpi-update, /usr/sbin/dietpi-update, /usr/bin/dietpi-update, /usr/bin/apt, /usr/bin/apt-get" > /etc/sudoers.d/dietpi-bmb20
    chmod 0440 /etc/sudoers.d/dietpi-bmb20
fi

# 2. Deploy Background Telemetry Daemon, Sentinel Patrol & Neural TTS Daemon
echo "[+] Installing telemetry & neural speech daemon services..."
if [ -f "${SCRIPT_DIR}/daemon/bmb20-stats.sh" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-stats.sh" /usr/local/bin/bmb20-stats.sh
    chmod +x /usr/local/bin/bmb20-stats.sh
elif [ -f "/usr/local/bin/bmb20-stats.sh" ]; then
    chmod +x /usr/local/bin/bmb20-stats.sh
fi

if [ -f "${SCRIPT_DIR}/daemon/bmb20-tts.py" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-tts.py" /usr/local/bin/bmb20-tts.py
    chmod +x /usr/local/bin/bmb20-tts.py
fi

if [ -f "${SCRIPT_DIR}/daemon/bmb20-patrol.sh" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-patrol.sh" /usr/local/bin/bmb20-patrol.sh
    chmod +x /usr/local/bin/bmb20-patrol.sh
fi

if [ -f "${SCRIPT_DIR}/daemon/bmb20-stats.service" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-stats.service" /etc/systemd/system/bmb20-stats.service
    systemctl daemon-reload 2>/dev/null || true
    systemctl enable bmb20-stats.service 2>/dev/null || true
    systemctl restart bmb20-stats.service 2>/dev/null || true
fi

if [ -f "${SCRIPT_DIR}/daemon/bmb20-tts.service" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-tts.service" /etc/systemd/system/bmb20-tts.service
    systemctl daemon-reload 2>/dev/null || true
    systemctl enable bmb20-tts.service 2>/dev/null || true
    systemctl restart bmb20-tts.service 2>/dev/null || true
fi

# Fallback background execution if systemd service is inactive
if ! systemctl is-active --quiet bmb20-stats 2>/dev/null; then
    echo "[!] Starting daemon via nohup fallback..."
    pkill -f bmb20-stats.sh 2>/dev/null || true
    nohup /usr/local/bin/bmb20-stats.sh >/dev/null 2>&1 &
fi

if ! systemctl is-active --quiet bmb20-tts 2>/dev/null; then
    pkill -f bmb20-tts.py 2>/dev/null || true
    nohup /usr/bin/python3 /usr/local/bin/bmb20-tts.py >/dev/null 2>&1 &
fi

# 3. Add Nginx static routing & TTS reverse proxy if available
if [ -f "/etc/nginx/sites-available/default" ]; then
    if ! grep -q "location = /api.php" /etc/nginx/sites-available/default; then
        echo "[+] Adding Nginx static route for /api.php..."
        sed -i '/server_name/a \	location = /api.php {\n\t\tdefault_type application/json;\n\t\talias /var/www/html/api.json;\n\t}' /etc/nginx/sites-available/default 2>/dev/null || true
    fi
    if ! grep -q "location /tts" /etc/nginx/sites-available/default; then
        echo "[+] Adding Nginx reverse proxy route for /tts..."
        sed -i '/server_name/a \	location /tts {\n\t\tproxy_pass http://127.0.0.1:8088/tts;\n\t\tproxy_set_header Host $host;\n\t\tproxy_set_header X-Real-IP $remote_addr;\n\t}' /etc/nginx/sites-available/default 2>/dev/null || true
    fi
fi

# 4. Set Permissions & Ownership
echo "[+] Setting permissions & ownership (www-data:www-data)..."
chown -R www-data:www-data /var/www 2>/dev/null || true
find /var/www -type d -exec chmod 755 {} \; 2>/dev/null || true
find /var/www -type f -exec chmod 644 {} \; 2>/dev/null || true
chmod +x /usr/local/bin/bmb20-stats.sh 2>/dev/null || true

# 5. Flush Web Server Service
echo "[+] Flushing web server cache & restarting service..."
nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || systemctl restart lighttpd 2>/dev/null || systemctl restart apache2 2>/dev/null || true

# 6. Test Response
echo "[+] Testing Web Server Response..."
if command -v curl >/dev/null 2>&1; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    echo "[+] Local HTTP Status Code: ${STATUS}"
fi

echo "=================================================="
echo " SUCCESS! Landing Page Deployed to http://dietpi.local"
echo " Access at: http://dietpi.local or http://192.168.0.100"
echo "=================================================="
