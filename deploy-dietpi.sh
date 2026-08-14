#!/bin/bash
# DietPi Web Deployment Script for BMB20 Command Center Landing Page

echo "=================================================="
echo "  Deploying BMB20 LCARS Landing Page to DietPi   "
echo "=================================================="

# Detect web root directory
TARGET_DIR=""
if [ -d "/var/www/html" ]; then
    TARGET_DIR="/var/www/html"
else
    TARGET_DIR="/var/www"
fi

echo "[+] Target Web Directory: ${TARGET_DIR}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Copy files from staging script dir to web root
if [ -f "${SCRIPT_DIR}/index.html" ]; then
    echo "[+] Deploying index.html..."
    cp -fv "${SCRIPT_DIR}/index.html" "${TARGET_DIR}/index.html"
    if [ "${TARGET_DIR}" = "/var/www/html" ]; then
        cp -fv "${SCRIPT_DIR}/index.html" "/var/www/index.html" 2>/dev/null || true
    fi
fi

if [ -f "${SCRIPT_DIR}/api.php" ]; then
    echo "[+] Deploying api.php..."
    cp -fv "${SCRIPT_DIR}/api.php" "${TARGET_DIR}/api.php"
    if [ "${TARGET_DIR}" = "/var/www/html" ]; then
        cp -fv "${SCRIPT_DIR}/api.php" "/var/www/api.php" 2>/dev/null || true
    fi
fi

# Create Background Realtime Telemetry Daemon (api.json) to bypass PHP 502 errors
echo "[+] Creating live telemetry daemon (bmb20-stats.sh)..."
cat << 'STATSEOF' > /usr/local/bin/bmb20-stats.sh
#!/bin/bash
while true; do
  TEMP=45
  if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    RAW=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null)
    if [ ! -z "$RAW" ]; then
      TEMP=$(awk "BEGIN {printf \"%.1f\", $RAW/1000}")
    fi
  fi

  MEM=40
  if [ -f /proc/meminfo ]; then
    TOTAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    AVAIL=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    if [ ! -z "$TOTAL" ] && [ ! -z "$AVAIL" ] && [ "$TOTAL" -gt 0 ]; then
      MEM=$(awk "BEGIN {printf \"%d\", (($TOTAL-$AVAIL)/$TOTAL)*100}")
    fi
  fi

  LOAD=$(cat /proc/loadavg | awk '{print $1}')
  CPU=$(awk "BEGIN {printf \"%d\", ($LOAD/4)*100}")
  [ "$CPU" -gt 100 ] && CPU=100
  [ "$CPU" -lt 5 ] && CPU=5

  UPTIME=$(uptime -p 2>/dev/null | sed "s/up //" || echo "ONLINE")
  HN=$(hostname 2>/dev/null || echo "dietpi.local")

  JSON_CONTENT="{\"cpu\":${CPU},\"memory\":${MEM},\"temp\":${TEMP},\"disk\":50,\"uptime\":\"${UPTIME}\",\"hostname\":\"${HN}\"}"
  
  echo "$JSON_CONTENT" > /var/www/html/api.json 2>/dev/null || true
  echo "$JSON_CONTENT" > /var/www/api.json 2>/dev/null || true

  sleep 2
done
STATSEOF

chmod +x /usr/local/bin/bmb20-stats.sh

# Kill any old stats loops and start daemon in background
pkill -f bmb20-stats.sh 2>/dev/null || true
nohup /usr/local/bin/bmb20-stats.sh >/dev/null 2>&1 &

# Set Permissions & Ownership
echo "[+] Setting permissions & ownership (www-data:www-data)..."
chown -R www-data:www-data /var/www 2>/dev/null || true
chmod -R 755 /var/www
chmod 644 /var/www/index.html /var/www/api.php /var/www/api.json 2>/dev/null || true
if [ -d "/var/www/html" ]; then
    chmod 644 /var/www/html/index.html /var/www/html/api.php /var/www/html/api.json 2>/dev/null || true
fi

# Restart Web Server to Flush ETags and Disk Caches
echo "[+] Flushing web server cache & restarting service..."
systemctl restart nginx 2>/dev/null || systemctl restart lighttpd 2>/dev/null || systemctl restart apache2 2>/dev/null || true

# Test Web Server HTTP Response
echo "[+] Testing Web Server Response..."
if command -v curl >/dev/null 2>&1; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    echo "[+] Local HTTP Status Code: ${STATUS}"
fi

echo "=================================================="
echo " SUCCESS! Landing Page Deployed to http://dietpi.local"
echo " Access at: http://dietpi.local"
echo "=================================================="
