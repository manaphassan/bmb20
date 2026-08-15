# Release v2.6.0 — Meena™ // Takahara Academy (高原学園)

## 🌟 What's New in v2.6.0

### 1. 🌐 Bilingual English & Bahasa Melayu Natural Intelligence
* **Dual-Language Query Optimization**: `analyzeBilingualQuery(raw)` dynamically analyzes query intent, removes Malay/English question prefixes (e.g., `siapa pelakon filem polis evo` -> `Polis Evo`), and extracts entities.
* **Dual Wikipedia Knowledge Pipeline**: Seamless queries across `ms.wikipedia.org` and `en.wikipedia.org` with automatic cast list and synopsis extraction.
* **Bilingual Spoken Commands**: Full voice command support for Malay triggers (`padam cache`, `bersihkan ram`, `suhu cpu`, `jadual`, `cuaca`, `taklimat pagi`, `profil meena`, `semak fakta`, `kajian mendalam`).

### 2. 🎙️ Studio Neural Speech (TTS) Microservice Pipeline
* **DietPi Server Daemon**: Created asynchronous `edge-tts` daemon `bmb20-tts.py` running on port `8088` with systemd unit `bmb20-tts.service`.
* **Neural Voices**: Studio quality voices for English (`Jenny`, `Aria`, `Sonia`, `Guy`) and Bahasa Melayu (`Yasmin`, `Osman`).
* **MD5 Hashed Audio Caching**: Instant sub-millisecond audio responses from `/tmp/bmb20_tts/` disk cache.
* **Dynamic Language Voice Switching**: Auto-speaks Malay queries using `ms-MY-YasminNeural` and English queries with `en-US-JennyNeural`.

### 3. 🛡️ Server Hardening & Security Lockdown
* **Block Direct Access to Sensitive Files**: Strictly blocks `.sh`, `.py`, `.service`, `.md`, `.env`, `.git`, `.bak`, `.log`, `.sql`, `.conf`, `.ini` with `404/403 Forbidden`.
* **HTTP Defense Headers**: Injected `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self)`.
* **Server Footprint Protection**: Hidden server tokens and disabled directory listing (`autoindex off`).

### 4. 🎭 Clean Masked Semantic URL Routing
* **Zero Raw File Exposure**: Rewrote direct `.json` and `.php` requests to clean semantic endpoints:
  - `/api/telemetry` &rarr; Host hardware & metrics stream
  - `/api/calendar` &rarr; Chrono calendar events
  - `/api/calendar/config` &rarr; Calendar subscription configs
  - `/api/hearth` &rarr; Synaptic Master Vault
  - `/api/tts` &rarr; Neural TTS Reverse Proxy
  - `/dashboard`, `/settings`, `/bridge` &rarr; Direct clean routes

### 5. 🔔 Universal LCARS Tactical Notification & Alert Dispatcher
* **Visual Glassmorphic Toasts**: High-contrast, sci-fi toast notifications slide into the viewport with status icons, timestamps, and audio chimes.
* **Proactive Host Health Alarms**: Real-time alerts for CPU thermal spikes ($>70^\circ\text{C}$), undervoltage throttles, and Sentinel patrol anomalies.
* **Background Task Notifications**: Spoken announcements and native OS desktop/mobile push when background tasks complete.

### 6. 📱 Responsive Layout & UI Enhancements
* **Full-Height Displays**: Kernel Log stream and Tactical Calendar expanded to full available viewport height.
* **3D Holo-Brain Avatar**: Rotating 3D neural brain rendered inside the avatar container.
* **Mobile Starfleet Communicator**: Dedicated PTT drawer and full calendar modal.

---

**Full Changelog**: [v2.5.0...v2.6.0](https://github.com/manaphassan/bmb20/compare/master)
