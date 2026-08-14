/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - MASTER LIFECYCLE ORCHESTRATOR
 * Tactical Alert System, Hotkeys, Clocks, and Page Visibility Power Saving
 * ==========================================================================
 */

let cascadeActive = true;
let isTabFocused = true;
let cascadeTimer = null;
let telemetryTimer = null;
let activeAlertCondition = 'green';
let isManualAlertOverride = false;

// Tactical Alert Condition Master Controller
function setAlertCondition(condition, isManual = true) {
    if (isManual) {
        isManualAlertOverride = (condition !== 'green');
    }

    activeAlertCondition = condition;
    const body = document.body;
    const badge = document.getElementById('telemetry-source');

    // Remove existing alert classes
    body.classList.remove('alert-yellow', 'alert-red');

    // Update Strobe Overlay Element
    let overlay = document.getElementById('alert-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'alert-overlay';
        overlay.className = 'alert-strobe-overlay';
        body.appendChild(overlay);
    }

    // Update Button Highlight States
    const btnGreen = document.getElementById('btn-cond-green');
    const btnYellow = document.getElementById('btn-cond-yellow');
    const btnRed = document.getElementById('btn-cond-red');

    if (btnGreen) btnGreen.className = "condition-btn px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer transition-all " + (condition === 'green' ? "bg-primary text-black active-condition font-bold shadow-[0_0_8px_#66ccff]" : "bg-surface-bright text-on-surface-variant hover:text-primary");
    if (btnYellow) btnYellow.className = "condition-btn px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer transition-all " + (condition === 'yellow' ? "bg-tertiary text-black active-condition font-bold shadow-[0_0_8px_#ffe253]" : "bg-surface-bright text-on-surface-variant hover:text-tertiary");
    if (btnRed) btnRed.className = "condition-btn px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer transition-all " + (condition === 'red' ? "bg-error text-white active-condition font-bold shadow-[0_0_12px_#cc3333] animate-pulse" : "bg-surface-bright text-on-surface-variant hover:text-error");

    if (condition === 'red') {
        body.classList.add('alert-red');
        overlay.style.display = 'block';
        if (badge) {
            badge.innerText = "RED ALERT: BATTLE STATIONS";
            badge.className = "text-error font-bold tracking-wider animate-pulse";
        }
        if (window.setGlobeAlertColor) window.setGlobeAlertColor('red');
        if (window.startRedAlertKlaxon) window.startRedAlertKlaxon();
    } else if (condition === 'yellow') {
        body.classList.add('alert-yellow');
        overlay.style.display = 'block';
        if (badge) {
            badge.innerText = "YELLOW ALERT: CAUTION ADVISED";
            badge.className = "text-tertiary font-bold tracking-wider";
        }
        if (window.setGlobeAlertColor) window.setGlobeAlertColor('yellow');
        if (window.playYellowAlertChirp) window.playYellowAlertChirp();
    } else {
        overlay.style.display = 'none';
        if (badge) {
            badge.innerText = "CONDITION GREEN [NOMINAL]";
            badge.className = "text-primary font-bold tracking-wider";
        }
        if (window.setGlobeAlertColor) window.setGlobeAlertColor('green');
        if (window.stopRedAlertKlaxon) window.stopRedAlertKlaxon();
        if (isManual && window.speakComputerVoice) {
            window.speakComputerVoice("All systems operating within nominal parameters, sir.");
        }
    }
}

// Clock & Authentic Star Trek Stardate Calculator
function updateClock() {
    const now = new Date();
    const clockElem = document.getElementById('clock');
    if (clockElem) {
        clockElem.innerText = now.toISOString().substr(11, 8) + ' UTC';
    }

    const stardateElem = document.getElementById('stardate');
    if (stardateElem) {
        // Authentic TNG Era Stardate formula
        const stardateVal = ((Date.now() - 1577836800000) / 3155760000 * 1000 + 75000).toFixed(1);
        stardateElem.innerText = `STARDATE ${stardateVal}`;
    }
}

// Matrix Data Stream Generator
const cascadeChars = '0123456789ABCDEF';
function generateCascade() {
    if (!cascadeActive || !isTabFocused) return;
    const container = document.getElementById('cascade-container');
    if (!container) return;

    const stream = document.createElement('div');
    stream.className = 'data-stream';
    stream.style.left = `${Math.random() * 100}vw`;
    stream.style.top = `-20px`;

    let charCount = Math.floor(6 + Math.random() * 10);
    let str = '';
    for (let i = 0; i < charCount; i++) {
        str += cascadeChars[Math.floor(Math.random() * cascadeChars.length)] + '<br/>';
    }
    stream.innerHTML = str;

    const duration = 2.5 + Math.random() * 3.5;
    stream.style.animation = `fall ${duration}s linear forwards`;
    container.appendChild(stream);

    setTimeout(() => {
        if (stream.parentNode) stream.parentNode.removeChild(stream);
    }, duration * 1000);
}

// CRT Retro Scanline & High-Clarity Mode Engine
let scanlinesActive = false; // Default to OFF for maximum text readability

function initScanlines() {
    const saved = localStorage.getItem('lcars_scanlines');
    if (saved !== null) {
        scanlinesActive = (saved === 'true');
    }
    applyScanlinesUI();
}

function applyScanlinesUI() {
    const body = document.body;
    const btn = document.getElementById('scanline-toggle');
    const icon = document.getElementById('scanline-icon');
    const label = document.getElementById('scanline-label');

    if (scanlinesActive) {
        body.classList.remove('no-scanlines');
        if (icon) icon.innerText = 'tv';
        if (label) label.innerText = 'CRT: ON';
        if (btn) {
            btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.remove('bg-surface-variant');
        }
    } else {
        body.classList.add('no-scanlines');
        if (icon) icon.innerText = 'tv_off';
        if (label) label.innerText = 'CRT: OFF';
        if (btn) {
            btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.add('bg-surface-variant');
        }
    }
}

function toggleScanlines() {
    scanlinesActive = !scanlinesActive;
    localStorage.setItem('lcars_scanlines', scanlinesActive ? 'true' : 'false');
    applyScanlinesUI();
    if (window.playSound) window.playSound('beep2');
    if (window.speakComputerVoice) {
        window.speakComputerVoice(scanlinesActive ? "Retro scan lines enabled, sir." : "Display clarity optimized, sir.");
    }
}

// Page Visibility Lifecycle Engine
document.addEventListener('visibilitychange', () => {
    isTabFocused = !document.hidden;
    if (window.setGlobeVisibility) {
        window.setGlobeVisibility(isTabFocused);
    }
    if (window.setTelemetryActive) {
        window.setTelemetryActive(isTabFocused);
    }
});

// Keyboard Hotkey Support (1=Green, 2=Yellow, 3=Red, 4/P=Planet, 5/S=System, 6/G=Galaxy, W=Warp, C=Chime, B=Beam, R=CRT Toggle, M/A=Audio)
window.addEventListener('keydown', (e) => {
    // Ignore input if focused in text fields
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const k = e.key.toLowerCase();
    if (e.key === '1') {
        setAlertCondition('green', true);
    } else if (e.key === '2') {
        setAlertCondition('yellow', true);
    } else if (e.key === '3') {
        setAlertCondition('red', true);
    } else if (e.key === '4' || k === 'p') {
        if (window.switchHologramView) window.switchHologramView('earth');
    } else if (e.key === '5' || k === 's') {
        if (window.switchHologramView) window.switchHologramView('solar');
    } else if (e.key === '6' || k === 'g') {
        if (window.switchHologramView) window.switchHologramView('galaxy');
    } else if (k === 'w') {
        if (window.playWarpSequence) window.playWarpSequence();
    } else if (k === 'c') {
        if (window.playDoorChime) window.playDoorChime();
    } else if (k === 'b') {
        if (window.playTransporterChime) window.playTransporterChime();
    } else if (k === 'r') {
        toggleScanlines();
    } else if (k === 'm' || k === 'a') {
        if (window.toggleAudio) window.toggleAudio();
    }
});

// Master App Startup Sequence
window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Clocks
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Initialize CRT Scanline Display Preference (Default High Clarity Mode)
    initScanlines();

    // 3. Initialize 3D Earth Hologram
    if (window.initEarth) {
        window.initEarth();
    }

    // 4. Start Telemetry Engine & Initial Canvas Draw
    if (window.drawBandwidthCanvas) {
        window.drawBandwidthCanvas();
    }
    if (window.fetchTelemetry) {
        window.fetchTelemetry();
        telemetryTimer = setInterval(window.fetchTelemetry, (window.BMB20_CONFIG && window.BMB20_CONFIG.pollIntervalMs) || 1000);
    }

    // 5. Start Background Cascade Effect
    cascadeTimer = setInterval(generateCascade, 250);

    // 6. Default Condition Green
    setAlertCondition('green', false);
});

window.toggleScanlines = toggleScanlines;
window.setAlertCondition = setAlertCondition;
