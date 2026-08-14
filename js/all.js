let cascadeActive = true;
let audioActive = false;
let ecoMode = false;
let isTabVisible = true;

// GeoIP target location variables
let userGeoLocation = { lat: 3.1390, lon: 101.6869, city: "KUALA LUMPUR", country: "MY", ip: "FETCHING..." };
let beaconMesh = null;
let beaconPulseRing = null;
let globeGroup = null;

// Page Visibility API
document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
});

function toggleEcoMode() {
    ecoMode = !ecoMode;
    const icon = document.getElementById('eco-icon');
    const text = document.getElementById('eco-text');
    const btn = document.getElementById('eco-toggle');
    if (ecoMode) {
        icon.innerText = 'eco';
        text.innerText = 'ECO: ON';
        btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
        btn.classList.remove('bg-surface-variant');
        if (cascadeActive) toggleCascade();
    } else {
        icon.innerText = 'bolt';
        text.innerText = 'ECO: OFF';
        btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
        btn.classList.add('bg-surface-variant');
    }
}

function updateClock() {
    const now = new Date();
    const clockElem = document.getElementById('clock');
    if (clockElem) clockElem.innerText = now.toISOString().substr(11, 8) + ' UTC';

    const stardateElem = document.getElementById('stardate');
    if (stardateElem) {
        // TNG / Voyager Authentic Stardate Formula
        const stardateVal = ((Date.now() - 1577836800000) / 3155760000 * 1000 + 75000).toFixed(2);
        stardateElem.innerText = `STARDATE ${stardateVal}`;
    }
}

// High-Precision Realtime Geolocation & GeoIP Cascade Engine
async function fetchRealtimeGeoIP() {
    const geoBadge = document.getElementById('geo-city-country');
    if (geoBadge) geoBadge.innerText = "LOCKING POSITION...";

    // 1. Query client's real Public IP via ipify CORS endpoint
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        if (ipRes.ok) {
            const ipData = await ipRes.json();
            const clientIP = ipData.ip;
            userGeoLocation.ip = clientIP;

            // 2. Resolve GeoIP for this Public IP
            const geoRes = await fetch(`https://ipwho.is/${clientIP}`, { cache: 'no-store' });
            if (geoRes.ok) {
                const data = await geoRes.json();
                if (data.success !== false && data.latitude && data.longitude) {
                    userGeoLocation = {
                        lat: parseFloat(data.latitude),
                        lon: parseFloat(data.longitude),
                        city: (data.city || "KUALA LUMPUR").toUpperCase(),
                        country: (data.country_code || data.country || "MY").toUpperCase(),
                        ip: clientIP
                    };
                    window.isGeoIPLocked = true;
                    updateGeoIPDisplay();
                    updateGlobeBeacon();
                    return;
                }
            }
        }
    } catch(e) {}

    // Fallback: Query server-side GeoIP payload from api.php
    fetchGeoIPCascade();
}

async function fetchGeoIPCascade() {
    // Cascade 1: ipwho.is (High reliability, native CORS)
    try {
        const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.success !== false && data.latitude && data.longitude) {
                userGeoLocation = {
                    lat: parseFloat(data.latitude),
                    lon: parseFloat(data.longitude),
                    city: (data.city || "UNKNOWN").toUpperCase(),
                    country: (data.country_code || data.country || "").toUpperCase(),
                    ip: data.ip || "LOCKED"
                };
                updateGeoIPDisplay();
                updateGlobeBeacon();
                return;
            }
        }
    } catch(e) {}

    // Cascade 2: ipapi.co
    try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
                userGeoLocation = {
                    lat: parseFloat(data.latitude),
                    lon: parseFloat(data.longitude),
                    city: (data.city || "UNKNOWN").toUpperCase(),
                    country: (data.country_code || data.country || "").toUpperCase(),
                    ip: data.ip || "LOCKED"
                };
                updateGeoIPDisplay();
                updateGlobeBeacon();
                return;
            }
        }
    } catch (e) {}

    // Cascade 3: ipify IP lookup fallback
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
            const data = await res.json();
            userGeoLocation.ip = data.ip;
            updateGeoIPDisplay();
        }
    } catch (err) {}
}

function updateGeoIPDisplay() {
    const cityCountryElem = document.getElementById('geo-city-country');
    const coordsElem = document.getElementById('geo-coords');
    const ipElem = document.getElementById('geo-ip');
    const telemetryCityElem = document.getElementById('telemetry-city');
    const telemetryCountryElem = document.getElementById('telemetry-country');

    if (cityCountryElem) cityCountryElem.innerText = `${userGeoLocation.city}, ${userGeoLocation.country}`;
    if (coordsElem) coordsElem.innerText = `LAT: ${userGeoLocation.lat.toFixed(2)}° | LON: ${userGeoLocation.lon.toFixed(2)}°`;
    if (ipElem) ipElem.innerText = `PUBLIC IP: ${userGeoLocation.ip}`;
    if (telemetryCityElem) telemetryCityElem.innerText = userGeoLocation.city;
    if (telemetryCountryElem) telemetryCountryElem.innerText = `REALTIME GEO LOCK [${userGeoLocation.country}]`;
}

// Telemetry Data Engine
async function fetchTelemetry() {
    if (!isTabVisible) return;

    // 1. Try api.json first (Live Daemon Endpoint)
    try {
        const res = await fetch('api.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data && data.cpu !== undefined) {
                updateMetricsUI(data.cpu, data.memory, data.temp, data.disk, data.uptime, "REAL DIETPI");
                updateBandwidth(data.tx_rate, data.rx_rate, data.vpn_tx_rate, data.vpn_rx_rate);
                appendSysLog(data.syslog);
                if (data.geoip && data.geoip.latitude && !window.isGeoIPLocked) {
                    userGeoLocation = {
                        lat: parseFloat(data.geoip.latitude),
                        lon: parseFloat(data.geoip.longitude),
                        city: data.geoip.city || "KUALA LUMPUR",
                        country: data.geoip.country || "MY",
                        ip: data.geoip.ip || "LOCKED"
                    };
                    updateGeoIPDisplay();
                    updateGlobeBeacon();
                }
                if (data.lan_devices && Array.isArray(data.lan_devices)) {
                    updateLANDevicesUI(data.lan_devices);
                }
                return;
            }
        }
    } catch (e) {}

    // 2. Try api.php fallback
    try {
        const res = await fetch('api.php', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data && data.cpu !== undefined) {
                updateMetricsUI(data.cpu, data.memory, data.temp, data.disk, data.uptime, "REAL DIETPI");
                updateBandwidth(data.tx_rate, data.rx_rate, data.vpn_tx_rate, data.vpn_rx_rate);
                appendSysLog(data.syslog);
                if (data.geoip && data.geoip.latitude && !window.isGeoIPLocked) {
                    userGeoLocation = {
                        lat: parseFloat(data.geoip.latitude),
                        lon: parseFloat(data.geoip.longitude),
                        city: data.geoip.city || "KUALA LUMPUR",
                        country: data.geoip.country || "MY",
                        ip: data.geoip.ip || "LOCKED"
                    };
                    updateGeoIPDisplay();
                    updateGlobeBeacon();
                }
                if (data.lan_devices && Array.isArray(data.lan_devices)) {
                    updateLANDevicesUI(data.lan_devices);
                }
                return;
            }
        }
    } catch (e) {}

    // 3. Fallback: Active live simulated telemetry + LAN devices
    const simulatedCpu = Math.floor(18 + Math.random() * 45);
    const simulatedMem = Math.floor(32 + Math.random() * 15);
    const simulatedTemp = Math.floor(43 + Math.random() * 8);
    const simulatedDisk = 38;
    updateMetricsUI(simulatedCpu, simulatedMem, simulatedTemp, simulatedDisk, "ONLINE", "SIMULATED");
    updateBandwidth(Math.random() * 1000000, Math.random() * 5000000, Math.random() * 500000, Math.random() * 500000);
    appendSysLog("telemetry signal lost... using simulated data");

    const defaultDevices = [
        { name: "DIETPI-GATEWAY", ip: "192.168.0.1", signal: "100%", status: "OK" },
        { name: "LOCAL-HOST", ip: "192.168.0.100", signal: "98%", status: "OK" },
        { name: "DESKTOP-CLIENT", ip: "192.168.0.105", signal: "88%", status: "OK" },
        { name: "MOBILE-NODE", ip: "192.168.0.42", signal: "94%", status: "OK" }
    ];
    updateLANDevicesUI(defaultDevices);
}

function updateLANDevicesUI(devices) {
    const listElem = document.getElementById('lan-devices-list');
    if (!listElem || !Array.isArray(devices)) return;

    let html = '';
    devices.forEach((dev, idx) => {
        const borderClass = idx < devices.length - 1 ? 'border-b border-outline-variant/20' : '';
        const statColor = dev.status === 'OK' ? 'text-primary font-bold' : 'text-error font-bold animate-pulse';
        html += `
            <div class="grid grid-cols-4 text-on-surface ${borderClass} py-0.5 items-center hover:bg-surface-bright transition-colors text-[10px]">
                <span class="truncate pr-1 font-bold text-[#ffcc66]">${dev.name}</span>
                <span class="text-[#66ccff] font-mono">${dev.ip}</span>
                <span class="text-center text-tertiary font-bold text-[9px]">📶 ${dev.signal}</span>
                <span class="text-right ${statColor}">${dev.status}</span>
            </div>
        `;
    });
    listElem.innerHTML = html;
}

function updateMetricsUI(cpu, mem, temp, disk, uptime, sourceText) {
    const srcElem = document.getElementById('telemetry-source');
    if (srcElem) srcElem.innerText = sourceText;
    const uptimeElem = document.getElementById('hero-uptime');
    if (uptimeElem) uptimeElem.innerText = uptime || "UPTIME OK";

    // Sidebar Telemetry Updates (CPU, RAM, TEMP, DISK)
    const sideCpuVal = document.getElementById('side-cpu-val');
    const sideCpuBar = document.getElementById('side-cpu-bar');
    if (sideCpuVal) sideCpuVal.innerText = `${cpu}%`;
    if (sideCpuBar) sideCpuBar.style.width = `${cpu}%`;

    const sideRamVal = document.getElementById('side-ram-val');
    const sideRamBar = document.getElementById('side-ram-bar');
    if (sideRamVal) sideRamVal.innerText = `${mem}%`;
    if (sideRamBar) sideRamBar.style.width = `${mem}%`;

    const sideTempVal = document.getElementById('side-temp-val');
    const sideTempBar = document.getElementById('side-temp-bar');
    if (sideTempVal) sideTempVal.innerText = `${temp}°C`;
    if (sideTempBar) sideTempBar.style.width = `${temp}%`;

    const sideDiskVal = document.getElementById('side-disk-val');
    const sideDiskBar = document.getElementById('side-disk-bar');
    if (sideDiskVal) sideDiskVal.innerText = `${disk}%`;
    if (sideDiskBar) sideDiskBar.style.width = `${disk}%`;
}

let txHistory = new Array(40).fill(0.3);
let rxHistory = new Array(40).fill(0.5);
let vpnHistory = new Array(24).fill(0.4);

function drawBandwidthCanvas() {
    const canvas = document.getElementById('bandwidth-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 250;
    const h = canvas.height = canvas.clientHeight || 45;

    ctx.clearRect(0, 0, w, h);

    // Horizontal Grid Lines
    ctx.strokeStyle = 'rgba(145, 143, 157, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    const step = w / (txHistory.length - 1);

    // Draw TX Area Waveform (Nemesis Cyan/Blue)
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < txHistory.length; i++) {
        const x = i * step;
        const y = h - (txHistory[i] * (h - 4));
        ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    const txGrad = ctx.createLinearGradient(0, 0, 0, h);
    txGrad.addColorStop(0, 'rgba(173, 198, 255, 0.45)');
    txGrad.addColorStop(1, 'rgba(173, 198, 255, 0.02)');
    ctx.fillStyle = txGrad;
function drawBandwidthCanvas() {
    const canvas = document.getElementById('bandwidth-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 250;
    const h = canvas.height = canvas.clientHeight || 50;

    ctx.clearRect(0, 0, w, h);

    const count = txHistory.length;
    const colWidth = Math.floor(w / count);
    const blockHeight = 3;
    const blockGap = 1.5;

    for (let i = 0; i < count; i++) {
        const x = i * colWidth;
        const txVal = txHistory[i];
        const rxVal = rxHistory[i];

        const totalBlocks = Math.floor((h - 4) / (blockHeight + blockGap));
        const txBlocks = Math.floor(txVal * totalBlocks);
        const rxBlocks = Math.floor(rxVal * totalBlocks);

        // Draw TX Stacked LCARS Blocks (Ice Blue / Secondary)
        for (let b = 0; b < txBlocks; b++) {
            const y = h - ((b + 1) * (blockHeight + blockGap));
            ctx.fillStyle = b > totalBlocks * 0.75 ? '#ff9900' : '#66ccff';
            ctx.fillRect(x, y, (colWidth / 2) - 1, blockHeight);
        }

        // Draw RX Stacked LCARS Blocks (Butterscotch Gold / Primary)
        for (let b = 0; b < rxBlocks; b++) {
            const y = h - ((b + 1) * (blockHeight + blockGap));
            ctx.fillStyle = b > totalBlocks * 0.75 ? '#cc3333' : '#ffcc66';
            ctx.fillRect(x + (colWidth / 2), y, (colWidth / 2) - 1, blockHeight);
        }
    }
}

function drawVPNCanvas() {
    const canvas = document.getElementById('vpn-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 250;
    const h = canvas.height = canvas.clientHeight || 50;

    ctx.clearRect(0, 0, w, h);

    const count = vpnHistory.length;
    const colWidth = Math.floor(w / count);
    const blockHeight = 3;
    const blockGap = 1.5;

    for (let i = 0; i < count; i++) {
        const x = i * colWidth;
        const vpnVal = vpnHistory[i];

        const totalBlocks = Math.floor((h - 4) / (blockHeight + blockGap));
        const vpnBlocks = Math.floor(vpnVal * totalBlocks);

        // Draw VPN Stacked LCARS Blocks (Okuda Orange & Magenta)
        for (let b = 0; b < vpnBlocks; b++) {
            const y = h - ((b + 1) * (blockHeight + blockGap));
            if (b > totalBlocks * 0.8) {
                ctx.fillStyle = '#cc3333'; // Starfleet Alert Red
            } else if (b > totalBlocks * 0.5) {
                ctx.fillStyle = '#ff9900'; // Okuda Orange
            } else {
                ctx.fillStyle = '#cc6699'; // LCARS Purple
            }
            ctx.fillRect(x, y, colWidth - 1.5, blockHeight);
        }

        // Top Glowing LCARS Pill Cap
        if (vpnBlocks > 0) {
            const topY = h - (vpnBlocks * (blockHeight + blockGap));
            ctx.fillStyle = '#ffcc66';
            ctx.fillRect(x, topY - 1, colWidth - 1.5, 2);
        }
    }
}

function initBandwidthGraph() {
    drawBandwidthCanvas();
    drawVPNCanvas();
}

function updateBandwidth(txRateBps, rxRateBps, vpnTxRateBps, vpnRxRateBps) {
    if (!isTabVisible || ecoMode) return;

    // Convert Bytes/sec to MB/s
    const txMB = (txRateBps || 0) / (1024 * 1024);
    const rxMB = (rxRateBps || 0) / (1024 * 1024);
    // VPN commonly in Mbps
    const vpnMbps = ((vpnTxRateBps || 0) + (vpnRxRateBps || 0)) * 8 / (1000 * 1000);

    // Normalize to 0.0 - 0.95 range for the canvas. Max scale 120 MB/s for physical, 50 Mbps for VPN
    const normTx = Math.min(0.95, txMB / 120.0);
    const normRx = Math.min(0.95, rxMB / 120.0);
    const normVpn = Math.min(0.95, vpnMbps / 50.0);

    txHistory.shift();
    txHistory.push(Math.max(0.05, normTx));

    rxHistory.shift();
    rxHistory.push(Math.max(0.05, normRx));

    vpnHistory.shift();
    vpnHistory.push(Math.max(0.05, normVpn));

    drawBandwidthCanvas();
    drawVPNCanvas();

    // Update Numerical Readouts
    const txElem = document.getElementById('tx-rate');
    const rxElem = document.getElementById('rx-rate');
    const vpnCurElem = document.getElementById('vpn-cur');

    if (txElem) txElem.innerText = `TX: ${txMB.toFixed(1)} MB/s`;
    if (rxElem) rxElem.innerText = `RX: ${rxMB.toFixed(1)} MB/s`;
    if (vpnCurElem) vpnCurElem.innerText = `CUR: ${vpnMbps.toFixed(1)} Mbps`;
}
function switchCol3Tab(tab) {
    const logElem = document.getElementById('sys-log');
    const metricsElem = document.getElementById('aux-sensor-metrics');
    const btnLog = document.getElementById('col3-tab-log');
    const btnMetrics = document.getElementById('col3-tab-metrics');

    if (tab === 'metrics') {
        if (logElem) logElem.classList.add('hidden');
        if (metricsElem) metricsElem.classList.remove('hidden');
        if (btnLog) { btnLog.className = 'bg-[#ffcc66] text-black px-1.5 py-0.2 text-[8px] font-bold rounded hover:bg-black hover:text-[#ffcc66] transition-all'; }
        if (btnMetrics) { btnMetrics.className = 'bg-black text-[#ffcc66] px-1.5 py-0.2 text-[8px] font-bold rounded hover:bg-[#ffcc66] hover:text-black transition-all'; }
    } else {
        if (logElem) logElem.classList.remove('hidden');
        if (metricsElem) metricsElem.classList.add('hidden');
        if (btnLog) { btnLog.className = 'bg-black text-[#ffcc66] px-1.5 py-0.2 text-[8px] font-bold rounded hover:bg-[#ffcc66] hover:text-black transition-all'; }
        if (btnMetrics) { btnMetrics.className = 'bg-[#ffcc66] text-black px-1.5 py-0.2 text-[8px] font-bold rounded hover:bg-black hover:text-[#ffcc66] transition-all'; }
    }
}

function appendSysLog(syslogLine) {
    if (!isTabVisible || ecoMode) return;
    const container = document.getElementById('sys-log');
    if (!container || !syslogLine) return;

    const formattedLine = `> ${syslogLine}`;
    if (container.lastElementChild && container.lastElementChild.innerText === formattedLine) {
        return;
    }

    const div = document.createElement('div');
    div.innerText = formattedLine;
    container.appendChild(div);
    if (container.children.length > 7) {
        container.removeChild(container.firstElementChild);
    }
}

const chars = '0123456789ABCDEF';
function generateCascade() {
    if (!cascadeActive || ecoMode || !isTabVisible) return;
    const container = document.getElementById('cascade-container');
    if (!container) return;
    const stream = document.createElement('div');
    stream.className = 'data-stream';
    stream.style.left = `${Math.random() * 100}vw`;
    let content = '';
    for(let i=0; i<12; i++) {
        content += chars[Math.floor(Math.random() * chars.length)] + '\n';
    }
    stream.innerText = content;
    const duration = 3 + Math.random() * 4;
    stream.style.animation = `cascadeDown ${duration}s linear`;
    container.appendChild(stream);
    setTimeout(() => {
        if(container.contains(stream)) container.removeChild(stream);
    }, duration * 1000);
}

function toggleCascade() {
    cascadeActive = !cascadeActive;
    const btn = document.getElementById('cascade-toggle');
    if (cascadeActive) {
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">pause_circle</span> <span>FREEZE</span>';
    } else {
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">play_circle</span> <span>PLAY</span>';
        const container = document.getElementById('cascade-container');
        if (container) container.innerHTML = '';
    }
}

// Advanced Web Audio API Sound Engine (Starship Ambient Hum + Sci-Fi Music + SFX)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let humOsc = null;
let humHarmonicOsc = null;
let humGain = null;
let lfoOsc = null;
let ambientPingInterval = null;
let synthChordInterval = null;
let arpeggioInterval = null;

// Modal Sci-Fi Command Bridge Harmonic Progression (Frequency Pairs & Chords)
const sciFiChords = [
    [110.00, 220.00, 329.63, 440.00, 659.25], // Low A Deep Sub + E/A Octaves
    [130.81, 261.63, 392.00, 523.25, 783.99], // C Maj High Resonance
    [146.83, 293.66, 440.00, 587.33, 880.00], // D Sub + A/D Octaves
    [98.00,  196.00, 293.66, 392.00, 587.33]  // Low G Bridge Sub
];
let currentChordIdx = 0;

function playSciFiChordPad() {
    if (!audioActive || !isTabVisible || ecoMode) return;
    try {
        const chord = sciFiChords[currentChordIdx];
        currentChordIdx = (currentChordIdx + 1) % sciFiChords.length;

        // Sub-bass sweep + multi-harmonic pad
        chord.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = idx === 0 ? 'sine' : (idx % 2 === 0 ? 'triangle' : 'sawtooth');
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220 + idx * 80, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(500 + idx * 120, audioCtx.currentTime + 3.0);
            filter.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 7.5);

            // Smooth LCARS bridge envelope
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(idx === 0 ? 0.04 : 0.015, audioCtx.currentTime + 2.0);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 7.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 7.9);
        });
    } catch (e) {}
}

const arpeggioNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
function playSciFiArpeggioNote() {
    if (!audioActive || !isTabVisible || ecoMode) return;
    try {
        const note = arpeggioNotes[Math.floor(Math.random() * arpeggioNotes.length)];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // High-tech glass computer telemetry blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(note * 1.5, audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {}
}

function startSciFiMusic() {
    if (synthChordInterval) clearInterval(synthChordInterval);
    if (arpeggioInterval) clearInterval(arpeggioInterval);

    playSciFiChordPad();
    synthChordInterval = setInterval(playSciFiChordPad, 8000);
    arpeggioInterval = setInterval(playSciFiArpeggioNote, 1200);
}

function stopSciFiMusic() {
    if (synthChordInterval) { clearInterval(synthChordInterval); synthChordInterval = null; }
    if (arpeggioInterval) { clearInterval(arpeggioInterval); arpeggioInterval = null; }
}

function toggleAudio() {
    audioActive = !audioActive;
    const icon = document.getElementById('audio-icon');
    const label = document.getElementById('audio-label');
    const btn = document.getElementById('audio-toggle');

    if (audioActive) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        icon.innerText = 'volume_up';
        label.innerText = 'AUDIO: ON';
        btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
        btn.classList.remove('bg-surface-variant');
        startAmbientHum();
        startSciFiMusic();
        animateEqualizer(true);
        startAmbientPings();
        playSound('command_on');
    } else {
        icon.innerText = 'volume_off';
        label.innerText = 'AUDIO: OFF';
        btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
        btn.classList.add('bg-surface-variant');
        stopAmbientHum();
        stopSciFiMusic();
        animateEqualizer(false);
        stopAmbientPings();
    }
}

function startAmbientHum() {
    if (humOsc) return;
    try {
        // Deep 48Hz Warp Core Engine Hum with Low Frequency LFO Modulation
        humOsc = audioCtx.createOscillator();
        humHarmonicOsc = audioCtx.createOscillator();
        humGain = audioCtx.createGain();
        lfoOsc = audioCtx.createOscillator();

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, audioCtx.currentTime);

        humOsc.type = 'sawtooth';
        humOsc.frequency.setValueAtTime(48.0, audioCtx.currentTime); // Deep Sub-Bass A0

        humHarmonicOsc.type = 'triangle';
        humHarmonicOsc.frequency.setValueAtTime(96.0, audioCtx.currentTime); // Harmonic A1

        lfoOsc.type = 'sine';
        lfoOsc.frequency.setValueAtTime(0.08, audioCtx.currentTime); // Ultra-slow Starship Breathing

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(25, audioCtx.currentTime);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        humGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        humGain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2.0);

        humOsc.connect(filter);
        humHarmonicOsc.connect(filter);
        filter.connect(humGain);
        humGain.connect(audioCtx.destination);

        humOsc.start();
        humHarmonicOsc.start();
        lfoOsc.start();
    } catch (e) {}
}

function stopAmbientHum() {
    if (humGain) {
        humGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5);
        setTimeout(() => {
            if (humOsc) { humOsc.stop(); humOsc.disconnect(); humOsc = null; }
            if (humHarmonicOsc) { humHarmonicOsc.stop(); humHarmonicOsc.disconnect(); humHarmonicOsc = null; }
            if (lfoOsc) { lfoOsc.stop(); lfoOsc.disconnect(); lfoOsc = null; }
        }, 500);
    }
}

// Morse Code Dictionary & Transmission Engine
const MORSE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',     'F': '..-.',
    'G': '--.',   'H': '....',  'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',  'Q': '--.-',  'R': '.-.',
    'S': '...',   'T': '-',     'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',  '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': ' '
};

let isMorseTransmitting = false;

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => MORSE_MAP[char] || '').join(' ');
}

function getTodayDateString() {
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function playTodayDateMorse() {
    const dateStr = getTodayDateString();
    const inputElem = document.getElementById('morse-input');
    if (inputElem) inputElem.value = dateStr;
    transmitMorseMessage();
}

function playMorseBeep(durationMs) {
    return new Promise((resolve) => {
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(750, audioCtx.currentTime); // 750Hz Standard CW Tone

            gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.005);
            gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (durationMs / 1000) - 0.005);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            // Light up TX LED
            const led = document.getElementById('morse-tx-led');
            if (led) led.className = 'w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_#ffe253] animate-pulse';

            osc.start();
            osc.stop(audioCtx.currentTime + (durationMs / 1000));

            setTimeout(() => {
                if (led) led.className = 'w-2.5 h-2.5 rounded-full bg-surface-variant';
                resolve();
            }, durationMs);
        } catch (e) {
            resolve();
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function transmitMorseMessage() {
    if (isMorseTransmitting) return;
    const inputElem = document.getElementById('morse-input');
    const statusElem = document.getElementById('morse-status');
    const codeElem = document.getElementById('morse-code-output');
    const liveElem = document.getElementById('morse-live-text');

    let text = inputElem ? inputElem.value.trim() : '';
    if (!text) text = 'BMB20 DIETPI';

    const morse = textToMorse(text);
    isMorseTransmitting = true;

    if (statusElem) { statusElem.innerText = 'TRANSMITTING'; statusElem.className = 'text-[9px] text-tertiary bg-surface-container px-1.5 py-0.5 border border-tertiary/40 rounded-sm font-bold animate-pulse'; }
    if (codeElem) codeElem.innerText = morse;
    if (liveElem) liveElem.innerText = `> ${text.toUpperCase()}`;

    const unit = 70; // 70ms Dot Unit

    for (let char of morse) {
        if (!isMorseTransmitting) break;
        if (char === '.') {
            await playMorseBeep(unit);
            await sleep(unit);
        } else if (char === '-') {
            await playMorseBeep(unit * 3);
            await sleep(unit);
        } else if (char === ' ') {
            await sleep(unit * 3);
        }
    }

    isMorseTransmitting = false;
    if (statusElem) { statusElem.innerText = 'SENT [OK]'; statusElem.className = 'text-[9px] text-primary bg-surface-container px-1.5 py-0.5 border border-primary/40 rounded-sm font-bold'; }
    setTimeout(() => {
        if (statusElem && !isMorseTransmitting) { statusElem.innerText = 'READY'; }
    }, 3000);
}

function startAmbientPings() {
    if (ambientPingInterval) clearInterval(ambientPingInterval);
    ambientPingInterval = setInterval(() => {
        if (audioActive && isTabVisible && !ecoMode && !isMorseTransmitting) {
            // Play background telemetry Morse code pulse ("DIETPI")
            const morseSignals = [
                "-.. .. . - .--. ..", // DIETPI
                "... --- ...",          // SOS
                "-... -- -... ...-- ......", // BMB20
                "-.-. --- -- -- .- -. -.." // COMMAND
            ];
            const chosenStr = morseSignals[Math.floor(Math.random() * morseSignals.length)];
            const unit = 60;
            let timeOffset = 0;

            for (let symbol of chosenStr) {
                if (symbol === '.') {
                    setTimeout(() => playMorseBeep(unit), timeOffset);
                    timeOffset += unit + unit;
                } else if (symbol === '-') {
                    setTimeout(() => playMorseBeep(unit * 3), timeOffset);
                    timeOffset += (unit * 3) + unit;
                } else if (symbol === ' ') {
                    timeOffset += unit * 2;
                }
            }
        }
    }, 9000);
}

function stopAmbientPings() {
    if (ambientPingInterval) {
        clearInterval(ambientPingInterval);
        ambientPingInterval = null;
    }
}

function animateEqualizer(active) {
    const bars = document.querySelectorAll('.eq-bar');
    if (!active) {
        bars.forEach(b => b.style.height = '3px');
        return;
    }
    bars.forEach((b, idx) => {
        const h = Math.floor(4 + Math.random() * 10);
        b.style.height = `${h}px`;
    });
    if (audioActive) {
        setTimeout(() => animateEqualizer(true), 150);
    }
}

function playSound(type) {
    if (!audioActive) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'beep1') {
            // Futuristic LCARS Double-Chirp Keypress
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // A6
            osc.frequency.setValueAtTime(2637, audioCtx.currentTime + 0.035); // E7
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.095);
        } else if (type === 'beep2') {
            // High-Tech Computer Terminal Affirmation
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
            osc.frequency.exponentialRampToValueAtTime(1479.98, audioCtx.currentTime + 0.06); // F#6
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.085);
        } else if (type === 'bridge_chirp' || type === 'ping') {
            // Starfleet Tactical Scanner Sonar Sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2093.00, audioCtx.currentTime); // C7
            osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.12); // C6
            gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.14);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'command_on') {
            // Futuristic Command Center Power On Swoop
            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(3200, audioCtx.currentTime + 0.3);
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.36);
        } else if (type === 'alert') {
            // Red Alert Tactical Klaxon Sweep
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.23);
        } else {
            // Standard Tactical Button Tap
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime); // E6
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.055);
        }
    } catch (e) {}
}

// Convert Lat/Lon coordinates to 3D Sphere Vector3
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Update 3D Beacon Mesh on Globe
function updateGlobeBeacon() {
    if (!globeGroup) return;
    const pos = latLonToVector3(userGeoLocation.lat, userGeoLocation.lon, 1.02);

    if (!beaconMesh) {
        const beaconGeo = new THREE.SphereGeometry(0.028, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffe253 });
        beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        globeGroup.add(beaconMesh);

        // Pulse Ring
        const ringGeo = new THREE.RingGeometry(0.03, 0.07, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xc2c1ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        beaconPulseRing = new THREE.Mesh(ringGeo, ringMat);
        globeGroup.add(beaconPulseRing);
    }

    beaconMesh.position.copy(pos);
    beaconPulseRing.position.copy(pos);
    beaconPulseRing.lookAt(new THREE.Vector3(0,0,0));

    // Smoothly rotate globe to face the target coordinates
    const targetRotY = -((userGeoLocation.lon + 180) * (Math.PI / 180));
    globeGroup.rotation.y = targetRotY;
}

// Three.js 3D Globe Initialization & Real Earth Map Sampler
let globalRenderer = null;
let globalCamera = null;
let earthMapCtx = null;

function initEarthMapCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 360;
    earthMapCtx = canvas.getContext('2d', { willReadFrequently: true });

    // Fill Ocean (Black)
    earthMapCtx.fillStyle = '#000000';
    earthMapCtx.fillRect(0, 0, 720, 360);

    // Draw High-Precision World Continent Map (White Landmasses)
    earthMapCtx.fillStyle = '#ffffff';

    // North America (Alaska, Canada, USA, Mexico, Central America)
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(30, 36); earthMapCtx.lineTo(260, 24); earthMapCtx.lineTo(270, 76); 
    earthMapCtx.lineTo(220, 144); earthMapCtx.lineTo(190, 156); earthMapCtx.lineTo(164, 130); 
    earthMapCtx.lineTo(110, 96); earthMapCtx.lineTo(70, 80); earthMapCtx.closePath();
    earthMapCtx.fill();

    // Greenland & Iceland
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(250, 16); earthMapCtx.lineTo(320, 20); earthMapCtx.lineTo(290, 64); earthMapCtx.closePath();
    earthMapCtx.fill();
    earthMapCtx.fillRect(330, 48, 12, 10); // Iceland

    // South America (Colombia, Brazil, Chile, Argentina, Patagonia)
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(196, 156); earthMapCtx.lineTo(290, 190); earthMapCtx.lineTo(270, 290); 
    earthMapCtx.lineTo(220, 310); earthMapCtx.lineTo(190, 230); earthMapCtx.closePath();
    earthMapCtx.fill();

    // British Isles (UK & Ireland)
    earthMapCtx.fillRect(344, 52, 16, 24);

    // Europe (Scandinavia, Iberian Peninsula, Italy, Balkans, Eastern Europe)
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(330, 36); earthMapCtx.lineTo(440, 44); earthMapCtx.lineTo(430, 110); 
    earthMapCtx.lineTo(340, 104); earthMapCtx.closePath();
    earthMapCtx.fill();

    // Africa & Madagascar
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(324, 104); earthMapCtx.lineTo(460, 110); earthMapCtx.lineTo(444, 250); 
    earthMapCtx.lineTo(380, 260); earthMapCtx.lineTo(324, 184); earthMapCtx.closePath();
    earthMapCtx.fill();
    earthMapCtx.fillRect(470, 200, 18, 50); // Madagascar

    // Asia (Siberia, China, India peninsula, Indochina, Arabia)
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(430, 24); earthMapCtx.lineTo(710, 24); earthMapCtx.lineTo(696, 170); 
    earthMapCtx.lineTo(570, 164); earthMapCtx.lineTo(500, 190); earthMapCtx.lineTo(476, 150); 
    earthMapCtx.lineTo(430, 104); earthMapCtx.closePath();
    earthMapCtx.fill();

    // Japan Archipelago & Korea
    earthMapCtx.fillRect(660, 70, 14, 40); // Japan
    earthMapCtx.fillRect(638, 82, 12, 22); // Korea

    // Indonesia & SE Asia Archipelago
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(560, 170); earthMapCtx.lineTo(670, 170); earthMapCtx.lineTo(660, 210); 
    earthMapCtx.lineTo(560, 210); earthMapCtx.closePath();
    earthMapCtx.fill();

    // Australia, Tasmania & New Zealand
    earthMapCtx.beginPath();
    earthMapCtx.moveTo(580, 220); earthMapCtx.lineTo(690, 220); earthMapCtx.lineTo(676, 296); 
    earthMapCtx.lineTo(580, 284); earthMapCtx.closePath();
    earthMapCtx.fill();
    earthMapCtx.fillRect(690, 270, 12, 34); // NZ

    // Antarctica
    earthMapCtx.fillRect(0, 316, 720, 44);
}

function isRealEarthLand(lat, lon) {
    if (!earthMapCtx) initEarthMapCanvas();
    const x = Math.floor(((lon + 180) / 360) * 720);
    const y = Math.floor(((90 - lat) / 180) * 360);
    try {
        const pixel = earthMapCtx.getImageData(x, y, 1, 1).data[0];
        return pixel > 128;
    } catch(e) {
        return false;
    }
}

function initEarth() {
    if (typeof THREE === 'undefined') {
        setTimeout(initEarth, 200);
        return;
    }
    const container = document.getElementById('earth-container');
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.4);
    camera.lookAt(0, 0, 0);
    globalCamera = camera;
    window.targetCamX = 0;
    window.targetCamY = 0;
    window.targetCamZ = 2.4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    globalRenderer = renderer;

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Milky Way Galaxy 3D Particle Spiral Disc
    const milkyWayGroup = new THREE.Group();
    const mwStarCount = 4500;
    const mwGeo = new THREE.BufferGeometry();
    const mwPos = new Float32Array(mwStarCount * 3);
    const mwCols = new Float32Array(mwStarCount * 3);

    for (let i = 0; i < mwStarCount; i++) {
        // Logarithmic 4-arm galaxy spiral structure
        const armIndex = i % 4;
        const armOffset = (armIndex * Math.PI) / 2;
        const dist = Math.pow(Math.random(), 1.8) * 18 + 0.5;
        const angle = dist * 0.45 + armOffset + (Math.random() * 0.4 - 0.2);

        const x = dist * Math.cos(angle);
        const y = (Math.random() * 2 - 1) * (1.2 / (dist * 0.2 + 1)); // Thin disc
        const z = dist * Math.sin(angle);

        mwPos[i * 3] = x;
        mwPos[i * 3 + 1] = y;
        mwPos[i * 3 + 2] = z;

        // Galactic Core (White/Gold) to Outer Spiral Arms (Blue/Purple)
        const rand = Math.random();
        if (dist < 3) {
            mwCols[i * 3] = 1.0; mwCols[i * 3 + 1] = 0.95; mwCols[i * 3 + 2] = 0.8; // Bright Core
        } else if (rand > 0.6) {
            mwCols[i * 3] = 0.76; mwCols[i * 3 + 1] = 0.77; mwCols[i * 3 + 2] = 1.0; // Cyan Arm
        } else if (rand > 0.3) {
            mwCols[i * 3] = 1.0; mwCols[i * 3 + 1] = 0.88; mwCols[i * 3 + 2] = 0.32; // Gold Arm
        } else {
            mwCols[i * 3] = 0.76; mwCols[i * 3 + 1] = 0.45; mwCols[i * 3 + 2] = 1.0; // Purple Arm
        }
    }

    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCols, 3));
    const mwMat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.75 });
    const milkyWayPoints = new THREE.Points(mwGeo, mwMat);
    milkyWayGroup.add(milkyWayPoints);
    milkyWayGroup.rotation.x = Math.PI / 4; // Tilted galaxy disc view
    milkyWayGroup.position.z = -4.0;
    scene.add(milkyWayGroup);
    window.milkyWayGroup = milkyWayGroup;
    window.milkyWayGroup.visible = false; // Hide in Minimized Earth View

    // 2. Solar System Planetary Orbits Engine (LCARS Dot-Matrix Particle Style)
    const solarSystemGroup = new THREE.Group();
    scene.add(solarSystemGroup);
    window.solarSystemGroup = solarSystemGroup;
    window.solarSystemGroup.visible = false; // Hide in Minimized Earth View

    // ☀️ 3D Glowing Central Sun Anchor for Maximized Solar System View
    const sunGroup = new THREE.Group();
    solarSystemGroup.add(sunGroup);
    window.sunGroup = sunGroup;

    // Sun Core Sphere (Golden Particle Sun Core)
    const sunDots = 1800;
    const sunGeo = new THREE.BufferGeometry();
    const sunPos = new Float32Array(sunDots * 3);
    for (let i = 0; i < sunDots; i++) {
        const phi = Math.acos(-1 + (2 * i) / sunDots);
        const theta = Math.sqrt(sunDots * Math.PI) * phi;
        sunPos[i * 3] = 0.65 * Math.cos(theta) * Math.sin(phi);
        sunPos[i * 3 + 1] = 0.65 * Math.sin(theta) * Math.sin(phi);
        sunPos[i * 3 + 2] = 0.65 * Math.cos(phi);
    }
    sunGeo.setAttribute('position', new THREE.BufferAttribute(sunPos, 3));
    const sunMat = new THREE.PointsMaterial({ size: 0.03, color: 0xffe253, transparent: true, opacity: 0.95 });
    const sunPoints = new THREE.Points(sunGeo, sunMat);
    sunGroup.add(sunPoints);

    // Sun Solar Corona Glow Aura
    const coronaGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffa726, transparent: true, opacity: 0.35, side: THREE.BackSide });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    window.solarPlanets = [];

    // Helper to generate an HD LCARS Dot-Matrix Particle Sphere planet matching Earth's dot-matrix style
    function createDotMatrixPlanet(name, colorHex, radius, orbitDist, speed, semimajor, velocity, type, mag, symbol) {
        // Concentric Orbit Ring Lines (Vivid Electric Blue)
        const ringGeo = new THREE.RingGeometry(orbitDist - 0.015, orbitDist + 0.015, 128);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x1976d2, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        solarSystemGroup.add(ringMesh);

        // HD Dot-Matrix Particle Sphere Geometry
        const dotCount = Math.max(800, Math.floor(radius * 9500));
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(dotCount * 3);
        const pCols = new Float32Array(dotCount * 3);

        const baseColor = new THREE.Color(colorHex);

        for (let i = 0; i < dotCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / dotCount);
            const theta = Math.sqrt(dotCount * Math.PI) * phi;

            pPos[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            pPos[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            pPos[i * 3 + 2] = radius * Math.cos(phi);

            // Colored particle variation
            const varRatio = 0.8 + Math.random() * 0.4;
            pCols[i * 3] = Math.min(1.0, baseColor.r * varRatio);
            pCols[i * 3 + 1] = Math.min(1.0, baseColor.g * varRatio);
            pCols[i * 3 + 2] = Math.min(1.0, baseColor.b * varRatio);
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pCols, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.035,
            vertexColors: true,
            transparent: true,
            opacity: 0.95
        });

        const planetPoints = new THREE.Points(pGeo, pMat);
        solarSystemGroup.add(planetPoints);

        // Saturn Dot-Matrix Rings
        if (name === 'Saturn') {
            const ringDots = 1400;
            const rGeo = new THREE.BufferGeometry();
            const rPos = new Float32Array(ringDots * 3);

            for (let i = 0; i < ringDots; i++) {
                const r = radius * 1.35 + Math.random() * (radius * 1.1);
                const a = Math.random() * Math.PI * 2;
                rPos[i * 3] = r * Math.cos(a);
                rPos[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
                rPos[i * 3 + 2] = r * Math.sin(a);
            }

            rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
            const rMat = new THREE.PointsMaterial({ size: 0.028, color: 0xffe253, transparent: true, opacity: 0.9 });
            const saturnRings = new THREE.Points(rGeo, rMat);
            saturnRings.rotation.x = Math.PI / 6;
            planetPoints.add(saturnRings);
        }

        // Earth Orbiting Dot-Matrix Moon
        if (name === 'Earth') {
            const moonDots = 300;
            const mGeo = new THREE.BufferGeometry();
            const mPos = new Float32Array(moonDots * 3);
            for (let i = 0; i < moonDots; i++) {
                const phi = Math.acos(-1 + (2 * i) / moonDots);
                const theta = Math.sqrt(moonDots * Math.PI) * phi;
                mPos[i * 3] = 0.06 * Math.cos(theta) * Math.sin(phi);
                mPos[i * 3 + 1] = 0.06 * Math.sin(theta) * Math.sin(phi);
                mPos[i * 3 + 2] = 0.06 * Math.cos(phi);
            }
            mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
            const mMat = new THREE.PointsMaterial({ size: 0.025, color: 0xffffff, transparent: true, opacity: 0.95 });
            const solarMoonMesh = new THREE.Points(mGeo, mMat);
            planetPoints.add(solarMoonMesh);
            planetPoints.userData.solarMoonMesh = solarMoonMesh;
        }

        const planetObj = {
            name: name,
            mesh: planetPoints,
            orbitDist: orbitDist,
            speed: speed,
            angle: Math.random() * Math.PI * 2,
            semimajor: semimajor,
            velocity: velocity,
            type: type,
            mag: mag,
            symbol: symbol
        };

        window.solarPlanets.push(planetObj);
    }

    // Create 8 Dot-Matrix Solar System Planets Orbiting the Sun with Exact Keplerian Scientific Telemetry
    createDotMatrixPlanet('Mercury', 0xd1d5db, 0.08, 1.4, 0.024,  0.387, 47.36, 'TERRESTRIAL', '-0.4', '☿');
    createDotMatrixPlanet('Venus',   0xffca28, 0.13, 2.2, 0.018,  0.723, 35.02, 'TERRESTRIAL', '-4.4', '♀');
    createDotMatrixPlanet('Earth',   0x64b5f6, 0.16, 3.4, 0.014,  1.000, 29.78, 'TERRESTRIAL', '-3.9', '🌎');
    createDotMatrixPlanet('Mars',    0xff5252, 0.11, 4.4, 0.010,  1.524, 24.07, 'TERRESTRIAL', '-1.5', '♂');
    createDotMatrixPlanet('Jupiter', 0xffa726, 0.32, 5.8, 0.006,  5.204, 13.07, 'GAS GIANT',   '-2.7', '♃');
    createDotMatrixPlanet('Saturn',  0xffe082, 0.26, 7.4, 0.004,  9.582, 9.69,  'GAS GIANT',   '+0.7', '♄');
    createDotMatrixPlanet('Uranus',  0x26c6da, 0.20, 9.0, 0.0028, 19.201,6.81,  'ICE GIANT',   '+5.7', '♅');
    createDotMatrixPlanet('Neptune', 0x42a5f5, 0.19, 10.6, 0.002, 30.047,5.43,  'ICE GIANT',   '+7.8', '♆');

    // 🌌 Solar System Scope-Style 3D Particle Asteroid Belt (Between Mars & Jupiter)
    const asteroidDots = 1600;
    const astGeo = new THREE.BufferGeometry();
    const astPos = new Float32Array(asteroidDots * 3);
    const astCols = new Float32Array(asteroidDots * 3);

    for (let i = 0; i < asteroidDots; i++) {
        const r = 4.8 + (Math.random() - 0.5) * 0.7; // Belt radius between Mars (4.4) and Jupiter (5.8)
        const a = Math.random() * Math.PI * 2;
        astPos[i * 3] = r * Math.cos(a);
        astPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15; // Vertical scatter
        astPos[i * 3 + 2] = r * Math.sin(a);

        // Rocky grey/amber dot-matrix color
        const c = 0.45 + Math.random() * 0.4;
        astCols[i * 3] = c * 0.9;
        astCols[i * 3 + 1] = c * 0.8;
        astCols[i * 3 + 2] = c * 0.7;
    }

    astGeo.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
    astGeo.setAttribute('color', new THREE.BufferAttribute(astCols, 3));
    const astMat = new THREE.PointsMaterial({ size: 0.024, vertexColors: true, transparent: true, opacity: 0.8 });
    const asteroidBeltPoints = new THREE.Points(astGeo, astMat);
    solarSystemGroup.add(asteroidBeltPoints);
    window.asteroidBeltPoints = asteroidBeltPoints;

    // Orbiting Dot-Matrix Moon around Earth
    const moonDots = 250;
    const mGeo = new THREE.BufferGeometry();
    const mPos = new Float32Array(moonDots * 3);
    for (let i = 0; i < moonDots; i++) {
        const phi = Math.acos(-1 + (2 * i) / moonDots);
        const theta = Math.sqrt(moonDots * Math.PI) * phi;
        mPos[i * 3] = 0.06 * Math.cos(theta) * Math.sin(phi);
        mPos[i * 3 + 1] = 0.06 * Math.sin(theta) * Math.sin(phi);
        mPos[i * 3 + 2] = 0.06 * Math.cos(phi);
    }
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    const mMat = new THREE.PointsMaterial({ size: 0.018, color: 0xffffff, transparent: true, opacity: 0.9 });
    window.moonMesh = new THREE.Points(mGeo, mMat);
    globeGroup.add(window.moonMesh);
    window.moonAngle = 0;

    // Tactical Orbital Satellite Ring
    const orbitRingGeo = new THREE.RingGeometry(1.25, 1.27, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0xadc6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 3;
    globeGroup.add(orbitRing);

    // 3. Translucent Glowing Atmospheric Aura
    const auraGeo = new THREE.SphereGeometry(1.08, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xadc6ff, transparent: true, opacity: 0.15, side: THREE.BackSide });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    globeGroup.add(auraMesh);

    // 4. Live Orbiting Satellite Constellation (ISS, STARLINK, SBC-SAT)
    window.satellites = [];
    function createSatellite(name, colorHex, orbitR, inclination, speed) {
        const satGroup = new THREE.Group();
        const satGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
        const satMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        satGroup.add(satMesh);

        // Solar Panel Wings
        const wingGeo = new THREE.BoxGeometry(0.12, 0.01, 0.03);
        const wingMat = new THREE.MeshBasicMaterial({ color: 0xadc6ff });
        const wingMesh = new THREE.Mesh(wingGeo, wingMat);
        satMesh.add(wingMesh);

        satGroup.rotation.z = inclination;
        globeGroup.add(satGroup);

        window.satellites.push({ group: satGroup, mesh: satMesh, orbitR, speed, angle: Math.random() * Math.PI * 2, name });
    }

    createSatellite('ISS Node', 0xffffff, 1.22, Math.PI / 4, 0.015);
    createSatellite('Starlink-01', 0xadc6ff, 1.30, -Math.PI / 3, 0.018);
    createSatellite('SBC-Sat 09', 0xffe253, 1.38, Math.PI / 6, 0.012);

    // Show standalone Earth globe in Minimized Monitor
    globeGroup.visible = true;

    // Camera View Presets & Dynamic Zoom Controls
    window.targetCamZ = 2.4; // Default Earth-only Minimized View
    window.zoomGlobe = function(delta) {
        if (typeof playSound === 'function') playSound('beep1');
        if (window.targetCamZ !== undefined) {
            window.targetCamZ = Math.max(1.1, Math.min(32.0, window.targetCamZ + delta));
        }
    };

    window.resetGlobeZoom = function() {
        if (typeof playSound === 'function') playSound('beep1');
        const modal = document.getElementById('globe-modal');
        if (modal && !modal.classList.contains('hidden')) {
            window.targetCamX = 0;
            window.targetCamY = 16.0;
            window.targetCamZ = 18.0;
        } else {
            window.targetCamX = 0;
            window.targetCamY = 0;
            window.targetCamZ = 2.4;
        }
    };

    window.setCameraView = function(view) {
        if (typeof playSound === 'function') playSound('beep1');
        if (view === 'earth') window.targetCamZ = 2.4;
        else if (view === 'solar') window.targetCamZ = 6.5;
        else if (view === 'galaxy') window.targetCamZ = 12.0;
    };

    // Futuristic Abstract 3D Dot-Matrix World Map Sphere for Minimized View
    const count = 30000;
    const dotGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        const lat = 90 - (phi * (180 / Math.PI));
        const lon = ((theta * (180 / Math.PI)) % 360) - 180;

        pos[i * 3] = Math.cos(theta) * Math.sin(phi);
        pos[i * 3 + 1] = Math.sin(theta) * Math.sin(phi);
        pos[i * 3 + 2] = Math.cos(phi);

        // Abstract Dot-Matrix World Map Styling
        if (isRealEarthLand(lat, lon)) {
            // Futuristic Electric Cyan / Amber Gold Gradient Landmass Points
            const landGradient = (lat + 90) / 180;
            cols[i * 3] = 0.0 + landGradient * 1.0;      // Red
            cols[i * 3 + 1] = 0.95 - landGradient * 0.1; // Green
            cols[i * 3 + 2] = 0.83 - landGradient * 0.5; // Blue
        } else {
            // Abstract Latitude/Longitude Coordinate Grid Points for Oceans
            const isLatGrid = Math.abs(lat % 15) < 0.6;
            const isLonGrid = Math.abs(lon % 15) < 0.6;
            if (isLatGrid || isLonGrid) {
                // Neon Indigo Grid Lines
                cols[i * 3] = 0.23;
                cols[i * 3 + 1] = 0.45;
                cols[i * 3 + 2] = 0.95;
            } else {
                // Dim Ocean Space Dots
                cols[i * 3] = 0.05;
                cols[i * 3 + 1] = 0.12;
                cols[i * 3 + 2] = 0.28;
            }
        }
    }

    dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const dotMat = new THREE.PointsMaterial({
        size: 0.022,
        vertexColors: true,
        transparent: true,
        opacity: 0.92
    });

    const earthPoints = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(earthPoints);

    // 3D Abstract Holographic Coordinate Grid Rings around Abstract Earth
    const eqRingGeo = new THREE.RingGeometry(1.01, 1.025, 96);
    const eqRingMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI / 2;
    globeGroup.add(eqRing);

    const pmRingGeo = new THREE.RingGeometry(1.01, 1.025, 96);
    const pmRingMat = new THREE.MeshBasicMaterial({ color: 0xffca28, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const pmRing = new THREE.Mesh(pmRingGeo, pmRingMat);
    pmRing.rotation.y = Math.PI / 2;
    globeGroup.add(pmRing);

    updateGlobeBeacon();

    // Mouse & Touch Controls (Rotate & Zoom)
    let isUserDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let autoRotateResumeTimeout = null;
    const canvasElem = renderer.domElement;
    canvasElem.style.cursor = 'grab';

    canvasElem.addEventListener('mousedown', (e) => {
        isUserDragging = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
        canvasElem.style.cursor = 'grabbing';
    });

    canvasElem.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.8 : -0.8;
        window.zoomGlobe(delta);
    }, { passive: false });

    // Raycaster for Interactive Planet & Sun Hover Tooltips
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    const tooltipElem = document.getElementById('planet-hud-tooltip');
    const nameElem = document.getElementById('tooltip-planet-name');
    const infoElem = document.getElementById('tooltip-planet-info');

    canvasElem.addEventListener('mousemove', (e) => {
        const rect = canvasElem.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (tooltipElem) {
            tooltipElem.style.left = `${e.clientX - rect.left + 15}px`;
            tooltipElem.style.top = `${e.clientY - rect.top - 10}px`;
        }

        if (window.solarSystemGroup && window.solarSystemGroup.visible) {
            raycaster.setFromCamera(mouseVec, camera);
            
            // Check Sun Core Anchor hover
            if (window.sunGroup) {
                const sunHits = raycaster.intersectObjects(window.sunGroup.children, true);
                if (sunHits.length > 0) {
                    if (tooltipElem) tooltipElem.classList.remove('hidden');
                    if (nameElem) nameElem.innerText = "☀️ SUN (SOLAR ANCHOR CORE)";
                    if (infoElem) infoElem.innerText = "TEMP: 5,778 K | MASS: 1.989 × 10^30 KG";
                    return;
                }
            }

            // Check Orbiting Planets hover
            if (window.solarPlanets) {
                for (let p of window.solarPlanets) {
                    const hits = raycaster.intersectObject(p.mesh, true);
                    if (hits.length > 0) {
                        if (tooltipElem) tooltipElem.classList.remove('hidden');
                        if (nameElem) nameElem.innerText = `🪐 ${p.name.toUpperCase()}`;
                        if (infoElem) infoElem.innerText = `ORBIT: ${p.orbitDist.toFixed(1)} AU | SPEED: ${(p.speed * 1000).toFixed(0)} KM/S`;
                        return;
                    }
                }
            }
        }
        if (tooltipElem) tooltipElem.classList.add('hidden');

        if (!isUserDragging) return;
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;

        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;
        globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x));

        prevMousePos = { x: e.clientX, y: e.clientY };

        if (autoRotateResumeTimeout) clearTimeout(autoRotateResumeTimeout);
        autoRotateResumeTimeout = setTimeout(() => {
            isUserDragging = false;
        }, 3500);
    });

    window.addEventListener('mouseup', () => {
        if (isUserDragging) {
            isUserDragging = false;
            canvasElem.style.cursor = 'grab';
        }
    });

    // Scroll Wheel Zoom
    window.addEventListener('wheel', (e) => {
        if (!camera) return;
        window.targetCamZ += e.deltaY * 0.003;
        window.targetCamZ = Math.max(1.1, Math.min(14.0, window.targetCamZ));
    }, { passive: true });

    // Touch Support
    canvasElem.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isUserDragging = true;
            prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    canvasElem.addEventListener('touchmove', (e) => {
        if (!isUserDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;

        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    canvasElem.addEventListener('touchend', () => {
        isUserDragging = false;
    });

    // Dynamic 3D-to-2D Vector Callout / Annotation Leader Line Generator
    function updateCalloutAnnotations() {
        if (!camera || !globalRenderer) return;

        const isModalOpen = document.getElementById('globe-modal') && !document.getElementById('globe-modal').classList.contains('hidden');
        const svgElem = isModalOpen ? document.getElementById('modal-callout-svg-overlay') : document.getElementById('callout-svg-overlay');
        const activeContainer = isModalOpen ? document.getElementById('modal-earth-container') : document.getElementById('earth-container');

        if (!svgElem || !activeContainer) return;

        const w = activeContainer.clientWidth || 400;
        const h = activeContainer.clientHeight || 300;

        let svgHTML = '';

        // Project 3D vector to 2D Callout Leader Line with Scientific Telemetry Support
        function drawCalloutPin(pos3D, labelTitle, labelDetail, strokeColor, offsetX = 50, offsetY = -35, labelDetail2 = "") {
            const tempVec = pos3D.clone();
            tempVec.project(camera);

            if (tempVec.z > 1.0) return; // Behind camera

            const x1 = (tempVec.x * 0.5 + 0.5) * w;
            const y1 = (-tempVec.y * 0.5 + 0.5) * h;

            if (x1 < -200 || x1 > w + 200 || y1 < -200 || y1 > h + 200) return;

            const x2 = x1 + offsetX;
            const y2 = y1 + offsetY;
            const x3 = x2 + (offsetX > 0 ? 30 : -30);
            const boxW = labelDetail2 ? 195 : 170;
            const boxH = labelDetail2 ? 31 : 23;
            const textAnchor = offsetX > 0 ? x3 + 4 : x3 - (boxW + 4);

            svgHTML += `
                <polyline points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y2.toFixed(1)}" 
                          fill="none" stroke="${strokeColor}" stroke-width="1.3" stroke-dasharray="3,2" opacity="0.95" />
                <circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="3.5" fill="${strokeColor}" opacity="0.95" />
                <circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="7" fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.6" />
                
                <g transform="translate(${textAnchor.toFixed(1)}, ${(y2 - 11).toFixed(1)})">
                    <rect x="0" y="0" width="${boxW}" height="${boxH}" fill="#070b19" fill-opacity="0.93" stroke="${strokeColor}" stroke-width="1" rx="3" />
                    <text x="6" y="10" fill="${strokeColor}" font-family="monospace" font-size="8.5" font-weight="bold">${labelTitle}</text>
                    <text x="6" y="18" fill="#c0c5d5" font-family="monospace" font-size="7.5">${labelDetail}</text>
                    ${labelDetail2 ? `<text x="6" y="26" fill="#4af626" font-family="monospace" font-size="7">${labelDetail2}</text>` : ''}
                </g>
            `;
        }

        // 1. Maximized Solar System View: Draw 3D Dot Matrix Planet Alignment, Dotted Lines & Callout Pins with Name + Distance from Earth
        if (window.solarSystemGroup && window.solarSystemGroup.visible) {
            // Sun Center Callout
            if (window.sunGroup && window.sunGroup.visible) {
                const sunWorld = new THREE.Vector3();
                window.sunGroup.getWorldPosition(sunWorld);
                drawCalloutPin(sunWorld, "☀️ SOL (SUN CORE)", "SPECTRAL TYPE G2V | 0.0 AU", "#ffe253", -50, -45, "SOLAR ANCHOR | T_EFF 5778 K");
            }

            // Find Earth 3D & 2D Screen Position
            let earthWorldPos = null;
            let earthScreenPos = null;
            if (window.solarPlanets) {
                const earthObj = window.solarPlanets.find(p => p.name === 'Earth');
                if (earthObj) {
                    earthWorldPos = new THREE.Vector3();
                    earthObj.mesh.getWorldPosition(earthWorldPos);
                    const tempVec = earthWorldPos.clone();
                    tempVec.project(camera);
                    if (tempVec.z <= 1.0) {
                        earthScreenPos = {
                            x: (tempVec.x * 0.5 + 0.5) * w,
                            y: (-tempVec.y * 0.5 + 0.5) * h
                        };
                    }
                }

                const planetColors = {
                    'Mercury': '#d1d5db', 'Venus': '#ffca28', 'Earth': '#64b5f6',
                    'Mars': '#ff5252', 'Jupiter': '#ffa726', 'Saturn': '#ffe082',
                    'Uranus': '#26c6da', 'Neptune': '#42a5f5'
                };
                const offsets = [
                    [55, -35], [-60, 30], [-65, -45], [60, -35],
                    [-70, -45], [70, 40], [-75, 35], [75, -40]
                ];

                window.solarPlanets.forEach((p, idx) => {
                    const pWorld = new THREE.Vector3();
                    p.mesh.getWorldPosition(pWorld);
                    const tempVec = pWorld.clone();
                    tempVec.project(camera);
                    if (tempVec.z > 1.0) return;

                    const px = (tempVec.x * 0.5 + 0.5) * w;
                    const py = (-tempVec.y * 0.5 + 0.5) * h;

                    // Draw Dotted White Alignment Line from Earth to this Planet
                    if (earthScreenPos && p.name !== 'Earth') {
                        svgHTML += `
                            <line x1="${earthScreenPos.x.toFixed(1)}" y1="${earthScreenPos.y.toFixed(1)}" 
                                  x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" 
                                  stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.85" />
                        `;
                    }

                    // Calculate Realtime Distance from Earth in 3D Scene & Heliocentric Position
                    let distText = "ORIGIN 0.00 AU";
                    let astroDetail2 = "";

                    if (earthWorldPos && p.name !== 'Earth') {
                        const dist3D = earthWorldPos.distanceTo(pWorld);
                        const distAU = dist3D / 3.4; // 3.4 is Earth's orbit radius scale
                        const distKmMillions = Math.round(distAU * 149.6);
                        const lonDeg = Math.round((Math.atan2(pWorld.z, pWorld.x) * 180 / Math.PI + 360) % 360);

                        distText = `DIST FROM EARTH: ${distAU.toFixed(2)} AU (${distKmMillions}M KM)`;
                        astroDetail2 = `HELIOCENTRIC LON: ${lonDeg}° | VEL: ${p.velocity} KM/S`;
                    } else if (p.name === 'Earth') {
                        const lonDeg = Math.round((Math.atan2(earthWorldPos.z, earthWorldPos.x) * 180 / Math.PI + 360) % 360);
                        distText = "EARTH ORIGIN [GEO BEACON]";
                        astroDetail2 = `HELIOCENTRIC LON: ${lonDeg}° | VEL: 29.78 KM/S`;
                    }

                    const col = planetColors[p.name] || '#ffffff';
                    const off = offsets[idx % offsets.length];

                    // Draw Callout Pin with Planet Name, Type, Distance from Earth & Heliocentric Longitude / Speed
                    drawCalloutPin(pWorld, `${p.symbol} ${p.name.toUpperCase()} [${p.type}]`, distText, col, off[0], off[1], astroDetail2);
                });
            }
        }

        // 2. Minimized Earth View: Dedicated Satellite Constellation & Target Callout Pins
        if (window.globeGroup && window.globeGroup.visible) {
            // Earth Globe Center Tag
            const earthWorld = new THREE.Vector3();
            globeGroup.getWorldPosition(earthWorld);
            drawCalloutPin(earthWorld, "🌎 PLANET EARTH", "25,000 HD POINTS", "#42a5f5", -75, -50);

            // Orbiting Satellite Constellation Callouts (ISS, Starlink, SBC-Sat)
            if (window.satellites) {
                const satDetails = [
                    { title: "🛰️ ISS NODE", sub: "ALT: 408 KM | INCL: 51.6°", color: "#ff5252", off: [-70, 45] },
                    { title: "🛰️ STARLINK-01", sub: "ALT: 550 KM | LEO BROADBAND", color: "#adc6ff", off: [70, -40] },
                    { title: "🛰️ SBC-SAT 09", sub: "ALT: 650 KM | DIETPI TELEMETRY", color: "#ffe253", off: [-75, -45] }
                ];

                window.satellites.forEach((s, idx) => {
                    const sWorld = new THREE.Vector3();
                    s.mesh.getWorldPosition(sWorld);
                    const info = satDetails[idx % satDetails.length];
                    drawCalloutPin(sWorld, info.title, info.sub, info.color, info.off[0], info.off[1]);
                });
            }

            // Realtime GeoIP Target Beacon Tag
            if (beaconMesh) {
                const bWorld = new THREE.Vector3();
                beaconMesh.getWorldPosition(bWorld);
                drawCalloutPin(bWorld, "📍 TARGET BEACON", `${userGeoLocation.city}, ${userGeoLocation.country}`, "#26c6da", 70, -35);
            }

            // Luna Moon Tag
            if (window.moonMesh) {
                const mWorld = new THREE.Vector3();
                window.moonMesh.getWorldPosition(mWorld);
                drawCalloutPin(mWorld, "🌕 LUNA MOON", "RANGE: 384,400 KM", "#e0e0e0", 65, 40);
            }
        }

        svgElem.innerHTML = svgHTML;
    }

    let ringScale = 1.0;
    function animate(t) {
        requestAnimationFrame(animate);
        if (!isTabVisible || ecoMode) return;
        
        // Render 3D-to-2D Vector Callout Leader Lines
        updateCalloutAnnotations();
        
        // Smooth Camera X, Y & Z Interpolation & Always Point at Origin (0,0,0)
        const activeCam = (typeof camera !== 'undefined' && camera) ? camera : window.globalCamera;
        if (activeCam) {
            if (window.targetCamX !== undefined) {
                activeCam.position.x += (window.targetCamX - activeCam.position.x) * 0.08;
            }
            if (window.targetCamY !== undefined) {
                activeCam.position.y += (window.targetCamY - activeCam.position.y) * 0.08;
            }
            if (window.targetCamZ !== undefined) {
                activeCam.position.z += (window.targetCamZ - activeCam.position.z) * 0.08;
            }
            activeCam.lookAt(0, 0, 0);
        }

        if (!isUserDragging) {
            globeGroup.rotation.y += 0.002;
        }

        // Rotate Milky Way Galaxy Disc
        if (milkyWayGroup) {
            milkyWayGroup.rotation.z += 0.0003;
            milkyWayGroup.rotation.y += 0.0001;
        }

        // Animate Satellites Orbiting Earth
        if (window.satellites) {
            window.satellites.forEach(s => {
                s.angle += s.speed;
                s.mesh.position.x = Math.cos(s.angle) * s.orbitR;
                s.mesh.position.y = Math.sin(s.angle) * s.orbitR;
                s.mesh.rotation.y += 0.03;
            });
        }

        // Rotate Sun Anchor in Maximized View
        if (window.sunGroup) {
            window.sunGroup.rotation.y += 0.005;
        }

        // Animate Solar System Planets & Moon Orbiting Sun Anchor
        if (window.solarPlanets) {
            window.solarPlanets.forEach(p => {
                p.angle += p.speed;
                p.mesh.position.x = Math.cos(p.angle) * p.orbitDist;
                p.mesh.position.z = Math.sin(p.angle) * p.orbitDist;
                p.mesh.rotation.y += 0.02;

                if (p.name === 'Earth' && p.mesh.userData.solarMoonMesh) {
                    p.mesh.userData.moonAngle = (p.mesh.userData.moonAngle || 0) + 0.04;
                    p.mesh.userData.solarMoonMesh.position.x = Math.cos(p.mesh.userData.moonAngle) * 0.35;
                    p.mesh.userData.solarMoonMesh.position.z = Math.sin(p.mesh.userData.moonAngle) * 0.35;
                }
            });
        }

        // Rotate Solar System Scope 3D Particle Asteroid Belt
        if (window.asteroidBeltPoints) {
            window.asteroidBeltPoints.rotation.y += 0.0008;
        }

        // Orbit Moon around Earth
        if (window.moonMesh) {
            window.moonAngle += 0.03;
            window.moonMesh.position.x = Math.cos(window.moonAngle) * 1.35;
            window.moonMesh.position.z = Math.sin(window.moonAngle) * 1.35;
            window.moonMesh.position.y = Math.sin(window.moonAngle * 0.5) * 0.2;
        }

        if (orbitRing) {
            orbitRing.rotation.z += 0.002;
        }

        if (beaconPulseRing) {
            ringScale += 0.015;
            if (ringScale > 2.2) ringScale = 1.0;
            beaconPulseRing.scale.set(ringScale, ringScale, ringScale);
        }

        renderer.render(scene, camera);
    }
    animate(0);

    window.addEventListener('resize', () => {
        const modalElem = document.getElementById('globe-modal');
        const activeContainer = (modalElem && !modalElem.classList.contains('hidden')) ? 
            document.getElementById('modal-earth-container') : 
            document.getElementById('earth-container');

        if (activeContainer && renderer && camera) {
            const w = activeContainer.clientWidth || 400;
            const h = activeContainer.clientHeight || 300;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    });
}

function openGlobeModal() {
    const modal = document.getElementById('globe-modal');
    const modalContainer = document.getElementById('modal-earth-container');
    if (!modal || !modalContainer || !globalRenderer) return;

    modal.classList.remove('hidden');
    playSound('beep2');

    // MAXIMIZED VIEW: Hide central Earth globe & Sun anchor, leave only planet system orbits & Milky Way
    if (window.globeGroup) window.globeGroup.visible = false;
    if (window.sunGroup) window.sunGroup.visible = false; // Hide central globe / sun
    if (window.solarSystemGroup) window.solarSystemGroup.visible = true;
    if (window.milkyWayGroup) window.milkyWayGroup.visible = true;

    // SOLAR SYSTEM SCOPE 3D PERSPECTIVE MODE: Tilted 3D Orbit View looking over ecliptic plane
    window.targetCamX = 0;
    window.targetCamY = 16.0;
    window.targetCamZ = 18.0;

    const activeCam = (typeof camera !== 'undefined' && camera) ? camera : window.globalCamera;
    if (activeCam) {
        activeCam.position.set(0, 16.0, 18.0);
        activeCam.lookAt(0, 0, 0);
    }

    // Move 3D Globe Canvas into Modal Container
    modalContainer.appendChild(globalRenderer.domElement);

    // Update modal telemetry readouts
    const locElem = document.getElementById('modal-target-loc');
    const coordsElem = document.getElementById('modal-target-coords');
    const ipElem = document.getElementById('modal-target-ip');

    if (locElem) locElem.innerText = `TARGET: ${userGeoLocation.city.toUpperCase()}, ${userGeoLocation.country.toUpperCase()}`;
    if (coordsElem) coordsElem.innerText = `COORDS: LAT ${userGeoLocation.lat.toFixed(2)}° | LON ${userGeoLocation.lon.toFixed(2)}°`;
    if (ipElem) ipElem.innerText = `PUBLIC IP: ${userGeoLocation.ip}`;

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 50);
}

function closeGlobeModal() {
    const modal = document.getElementById('globe-modal');
    const earthContainer = document.getElementById('earth-container');
    if (!modal || !earthContainer || !globalRenderer) return;

    modal.classList.add('hidden');
    playSound('beep1');

    // MINIMIZED VIEW: Restore Earth-only globe, hide outer planet system
    if (window.globeGroup) window.globeGroup.visible = true;
    if (window.solarSystemGroup) window.solarSystemGroup.visible = false;
    if (window.milkyWayGroup) window.milkyWayGroup.visible = false;

    // Reset camera back to default angled Earth view for Minimized Monitor
    window.targetCamX = 0;
    window.targetCamY = 0;
    window.targetCamZ = 2.4;

    const activeCam = (typeof camera !== 'undefined' && camera) ? camera : window.globalCamera;
    if (activeCam) {
        activeCam.position.set(0, 0, 2.4);
        activeCam.lookAt(0, 0, 0);
    }

    // Move 3D Globe Canvas back to Main Hero Container
    earthContainer.appendChild(globalRenderer.domElement);

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 50);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGlobeModal();
});

window.onload = () => {
    updateClock();
    setInterval(updateClock, 1000);
    fetchTelemetry();
    setInterval(fetchTelemetry, 1000);
    initBandwidthGraph();
    setInterval(generateCascade, 250);
    initEarth();
    fetchRealtimeGeoIP();
    setInterval(fetchRealtimeGeoIP, 30000);

    const inputElem = document.getElementById('morse-input');
    if (inputElem) inputElem.value = getTodayDateString();
};
</script>
</body>
