# Changelog

All notable changes to the BMB20 Command Center will be documented in this file.

## [Unreleased]

### Added
- **Realtime Telemetry Daemon**: Added a new background daemon (`bmb20-stats.sh`) that executes continuously on the DietPi host, querying system hardware sensors and writing a pure JSON payload to `/var/www/html/api.json`.
- **LAN Device Discovery**: Real-time LAN device mapping using system `arp` to identify devices connected to the network and display their IP/MAC addresses dynamically.
- **Bandwidth Metrics**: Real-time evaluation of TX/RX transmission rates directly from `/proc/net/dev`.
- **System Log Streaming**: The UI now streams the latest entries from `/var/log/syslog`.

### Changed
- **Telemetry Fetch Engine**: The frontend `index.html` UI has been entirely refactored to pull actual metric values instead of simulating UI jitter. 
- **Polling Interval**: Decreased data refresh interval from `2000ms` down to `1000ms` for enhanced realtime feedback.
- **Nginx Architecture**: Modified the deployment script to instruct Nginx to intercept `api.php` calls and statically serve `api.json` instead, circumventing traditional PHP FastCGI execution which had previously caused 502 Bad Gateway errors under heavy concurrent polling loads.

### Fixed
- **Daemon Arithmetic Errors**: Fixed critical Bash parsing errors where modern Linux kernel `/proc/stat` output containing more than 10 columns caused math syntax errors.
- **Disk Usage Edge-Cases**: Fixed `awk` misparsing of disk `df` utility by enforcing POSIX standards (`df -P`), ensuring text wrap does not cause an empty telemetry block.
- **Javascript UI Freeze**: Repaired an anomaly where a missing closing brace `}` in the `updateBandwidth` function crippled execution across the entire frontend. All dashboard telemetry successfully initializes.
- **Telemetry Null Checks**: Established robust fallbacks within `bmb20-stats.sh` to guarantee invalid or incomplete hardware readouts never result in corrupted, unparseable JSON files.
