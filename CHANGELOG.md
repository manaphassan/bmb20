# Changelog

All notable changes to the BMB20 Command Center and Meena AI Bridge will be documented in this file.

## [2.6.0] - 2026-08-15

### Added
- **Bilingual English & Bahasa Melayu Natural Query Engine**:
  - `analyzeBilingualQuery(raw)` with intelligent language detection, prefix cleaning (e.g. `siapa pelakon filem polis evo` -> `Polis Evo`), and entity extraction.
  - Multi-endpoint Wikipedia query fallback across `ms.wikipedia.org` and `en.wikipedia.org` with cast and synopsis extraction.
  - Bilingual voice command dictionary (`padam cache`, `bersihkan ram`, `suhu cpu`, `jadual`, `cuaca`, `taklimat pagi`, `profil meena`, `semak fakta`, `kajian mendalam`).
- **Server-Side Neural Speech (TTS) Microservice**:
  - Asynchronous `edge-tts` daemon `bmb20-tts.py` running on DietPi port `8088` with systemd unit `bmb20-tts.service`.
  - Studio Neural Voice profiles: `en-US-JennyNeural`, `en-US-AriaNeural`, `en-GB-SoniaNeural`, `ms-MY-YasminNeural`, `ms-MY-OsmanNeural`, `en-US-GuyNeural`.
  - MD5 disk caching in `/tmp/bmb20_tts/` for instant zero-latency audio playback.
  - Dynamic language-aware voice routing with fallback to browser Web Speech API.
- **Hardened Nginx Server Security**:
  - Blocked direct access to sensitive files (`.sh`, `.py`, `.service`, `.md`, `.env`, `.git`, `.bak`, `.log`, `.sql`, `.conf`, `.ini`).
  - Added HTTP defense headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self)`.
  - Disabled server tokens and directory indexing (`autoindex off`).
- **Clean Masked URL Architecture**:
  - Masked raw `.json` and `.php` files behind semantic REST routes: `/api/telemetry`, `/api/calendar`, `/api/calendar/config`, `/api/hearth`, `/api/tts`, `/dashboard`, `/settings`, `/bridge`.
- **Universal LCARS Tactical Notification & Alert Dispatcher**:
  - `showNotificationAlert(title, message, type, options)`: Sci-Fi glassmorphic toast notification cards with audio chimes (`alert`, `caution`, `beep2`, `chime`), timestamps, and auto-dismiss.
  - Proactive thermal monitoring (>70°C) and power bus undervoltage alerts.
  - Sentinel patrol subnet anomaly notifications.
  - Background task completion alerts (`notifyOnCompletion` with voice + OS desktop push).
- **UI & Layout Optimizations**:
  - Full-height Kernel Log and Full-height Tactical Calendar views.
  - 3D Holographic Brain avatar rendering in both desktop and mobile views.
  - Mobile Starfleet Communicator with dedicated PTT (Push-To-Transmit) drawer and calendar modal.

## [2.5.0] - 2026-08-15

### Added
- **Alex Dunphy (Hyper-Genius) Default Persona**: Configured Alex Dunphy as the permanent default persona with calibrated pitch (1.10x), rate (1.14x), academic lexicon, and deadpan wit.
- **5 Production AI Agent Skills Suite**:
  - `executeSkillDeepResearch`: Multi-step query decomposition, fact & source extraction, and Knowledge Graph auto-mapping.
  - `executeSkillReportAnalysis`: System telemetry & Pi-hole audit with Grade A+ scoring.
  - `executeSkillMoraleBoost`: Ergonomic posture check, hydration reminder, and intellectual encouragement.
  - `executeSkillFactVerify`: Strict academic claim verification with empirical confidence ratings.
  - `executeSkillSelfLearn`: Continuous concept abstraction and persistent host memory sync.
- **Deck 2 Live ISS Orbital Satellite Tracker**: Integrated real-time International Space Station telemetry with 3D solar-wing satellite model, 51.6° inclined ground track ring, and live HUD overlay.
- **Autonomous DietPi Background Sentinel Daemon (`bmb20-patrol.sh`)**: Background watchdog installed on DietPi scanning LAN ARP nodes, CPU temperature spikes (>72°C), and Pi-hole DNS health.
- **Always-Listening Hands-Free Wake Word Engine**: Continuous client-side hotword detection for `"Hey Meena"`, `"Meena"`, `"Hey Alex"`, `"Alex"`, and `"Computer"` with Starfleet acknowledgement chimes.
- **Live AI Token Consumption Telemetry Meter**: Real-time prompt/candidate token tracking, estimated cost ($0.00 Free Tier), and quota audit in Deck 1 and `[AI DOSSIER]`.
- **Natural Everyday Conversation & Casual Chit-Chat Matrix**: Full conversational support for casual greetings, daily check-ins, jokes, humor, boredom, and companionship.
- **Autonomous Local Offline Brain Engine**: Zero-network offline brain supporting real-time mathematics, radicals, exponents, unit conversions, embedded physics encyclopedia, and Linux kernel commands.
- **DietPi Server-Side Persistent Memory Sync**: Two-way synchronization of knowledge graph memories and growth levels saved to `/var/www/html/knowledge_bank.json`.

### Changed
- **Streamlined LCARS Architecture**: Removed legacy CRT scanlines and relocated `[MANAGE SHIELD]` exclusively into the left sidebar for instant 1-click access across all decks.
- **Maximized Knowledge Graph Viewport**: Expanded the Obsidian-style force-directed canvas in Deck 1.

### Fixed
- **Telemetry Polling Syntax**: Resolved dangling function closure in `js/telemetry.js` to ensure real-time metric streams never stall.
