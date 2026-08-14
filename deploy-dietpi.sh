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

if [ -f "${SCRIPT_DIR}/calendar.html" ]; then
    echo "[+] Deploying calendar.html..."
    cp -fv "${SCRIPT_DIR}/calendar.html" "${TARGET_DIR}/calendar.html"
    cp -fv "${SCRIPT_DIR}/calendar.html" "/var/www/calendar.html" 2>/dev/null || true
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

if [ -d "${SCRIPT_DIR}/css" ]; then
    echo "[+] Deploying CSS modules..."
    mkdir -p "${TARGET_DIR}/css" "/var/www/css"
    cp -rfv "${SCRIPT_DIR}/css/"* "${TARGET_DIR}/css/"
    cp -rfv "${SCRIPT_DIR}/css/"* "/var/www/css/" 2>/dev/null || true
fi

if [ -d "${SCRIPT_DIR}/js" ]; then
    echo "[+] Deploying JS modules..."
    mkdir -p "${TARGET_DIR}/js" "/var/www/js"
    cp -rfv "${SCRIPT_DIR}/js/"* "${TARGET_DIR}/js/"
    cp -rfv "${SCRIPT_DIR}/js/"* "/var/www/js/" 2>/dev/null || true
fi

# Configure sudoers for www-data to manage Pi-hole, hardware and daemon actions without password
if [ -d "/etc/sudoers.d" ]; then
    echo "www-data ALL=(ALL) NOPASSWD: /usr/local/bin/pihole, /usr/bin/pihole, /usr/bin/systemctl, /usr/bin/sync, /usr/bin/tee, /usr/bin/vcgencmd, /sbin/reboot, /usr/sbin/reboot, /boot/dietpi/dietpi-update, /usr/sbin/dietpi-update, /usr/bin/dietpi-update, /usr/bin/apt, /usr/bin/apt-get" > /etc/sudoers.d/dietpi-bmb20
    chmod 0440 /etc/sudoers.d/dietpi-bmb20
fi

# 2. Deploy Background Telemetry Daemon & Sentinel Patrol
echo "[+] Installing telemetry & sentinel daemon services..."
if [ -f "${SCRIPT_DIR}/daemon/bmb20-stats.sh" ]; then
    cp -fv "${SCRIPT_DIR}/daemon/bmb20-stats.sh" /usr/local/bin/bmb20-stats.sh
    chmod +x /usr/local/bin/bmb20-stats.sh
elif [ -f "/usr/local/bin/bmb20-stats.sh" ]; then
    chmod +x /usr/local/bin/bmb20-stats.sh
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

# Fallback background execution if systemd service is inactive
if ! systemctl is-active --quiet bmb20-stats 2>/dev/null; then
    echo "[!] Starting daemon via nohup fallback..."
    pkill -f bmb20-stats.sh 2>/dev/null || true
    nohup /usr/local/bin/bmb20-stats.sh >/dev/null 2>&1 &
fi

# 3. Add Nginx static routing if available
if [ -f "/etc/nginx/sites-available/default" ]; then
    if ! grep -q "location = /api.php" /etc/nginx/sites-available/default; then
        echo "[+] Adding Nginx static route for /api.php..."
        sed -i '/server_name/a \	location = /api.php {\n\t\tdefault_type application/json;\n\t\talias /var/www/html/api.json;\n\t}' /etc/nginx/sites-available/default 2>/dev/null || true
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
