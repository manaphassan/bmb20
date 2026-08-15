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

    // Dynamic Single Status Pill Button Updates
    const cycleBtn = document.getElementById('status-cycle-btn');
    const cycleText = document.getElementById('status-cycle-text');
    const cycleDot = document.getElementById('status-cycle-dot');

    if (condition === 'red') {
        body.classList.add('alert-red');
        overlay.style.display = 'block';
        if (badge) {
            badge.innerText = "RED ALERT: BATTLE STATIONS";
            badge.className = "text-error font-bold tracking-wider animate-pulse";
        }
        if (cycleBtn) {
            cycleBtn.className = "flex items-center gap-1.5 bg-error/20 hover:bg-error/30 text-error border border-error/60 px-3 py-1 rounded-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_12px_rgba(255,84,73,0.4)] animate-pulse";
        }
        if (cycleText) cycleText.innerText = "CONDITION: RED // BATTLE STATIONS";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-error animate-ping";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('red');
        if (window.startRedAlertKlaxon) window.startRedAlertKlaxon();
    } else if (condition === 'yellow') {
        body.classList.add('alert-yellow');
        overlay.style.display = 'block';
        if (badge) {
            badge.innerText = "YELLOW ALERT: CAUTION ADVISED";
            badge.className = "text-tertiary font-bold tracking-wider";
        }
        if (cycleBtn) {
            cycleBtn.className = "flex items-center gap-1.5 bg-tertiary/20 hover:bg-tertiary/30 text-tertiary border border-tertiary/60 px-3 py-1 rounded-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_8px_rgba(255,226,83,0.3)]";
        }
        if (cycleText) cycleText.innerText = "CONDITION: YELLOW // CAUTION";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-tertiary animate-pulse";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('yellow');
        if (window.playYellowAlertChirp) window.playYellowAlertChirp();
    } else {
        overlay.style.display = 'none';
        if (badge) {
            badge.innerText = "CONDITION GREEN [NOMINAL]";
            badge.className = "text-primary font-bold tracking-wider";
        }
        if (cycleBtn) {
            cycleBtn.className = "flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 px-3 py-1 rounded-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_8px_rgba(102,204,255,0.2)]";
        }
        if (cycleText) cycleText.innerText = "CONDITION: GREEN // NOMINAL";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-primary animate-pulse";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('green');
        if (window.stopRedAlertKlaxon) window.stopRedAlertKlaxon();
        if (isManual && window.speakComputerVoice) {
            window.speakComputerVoice("All systems operating within nominal parameters, sir.");
        }
    }
}

// Single-Button Dynamic Alert State Cycler (GREEN -> YELLOW -> RED -> GREEN)
function cycleAlertCondition() {
    if (activeAlertCondition === 'green') {
        setAlertCondition('yellow', true);
    } else if (activeAlertCondition === 'yellow') {
        setAlertCondition('red', true);
    } else {
        setAlertCondition('green', true);
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

// 4-Deck Operational Routing Master Controller
let currentDeck = 1;

function switchDeck(deckNumber) {
    currentDeck = deckNumber;
    const decks = [
        document.getElementById('deck-1-container'),
        document.getElementById('deck-2-container'),
        document.getElementById('deck-3-container'),
        document.getElementById('deck-4-container')
    ];
    const tabs = [
        document.getElementById('deck-tab-1'),
        document.getElementById('deck-tab-2'),
        document.getElementById('deck-tab-3'),
        document.getElementById('deck-tab-4')
    ];

    decks.forEach((deck, idx) => {
        if (deck) {
            if (idx + 1 === deckNumber) {
                deck.classList.remove('hidden');
            } else {
                deck.classList.add('hidden');
            }
        }
    });

    tabs.forEach((tab, idx) => {
        if (tab) {
            if (idx + 1 === deckNumber) {
                tab.className = "px-2.5 py-0.5 rounded font-bold text-xs bg-primary text-black transition-all shadow-[0_0_8px_#c2c1ff] active-condition";
            } else {
                tab.className = "px-2.5 py-0.5 rounded font-bold text-xs bg-surface-bright text-on-surface-variant hover:text-primary transition-all";
            }
        }
    });

    if (deckNumber === 1) {
        if (window.initKnowledgeGraph) window.initKnowledgeGraph();
        if (window.updateGrowthUI) window.updateGrowthUI();
    } else if (deckNumber === 2) {
        window.dispatchEvent(new Event('resize'));
    } else if (deckNumber === 3) {
        if (window.loadCalendarFeed) window.loadCalendarFeed();
    } else if (deckNumber === 4) {
        if (window.loadAllSettings) window.loadAllSettings();
    }
}

// Keyboard Hotkey Support (1=Deck 1 Meena AI, 2=Deck 2 Observatory NOC, 3=Red Alert, 4/P=Planet, 5/S=System, 6/G=Galaxy, W=Warp, C=Chime, B=Beam, R=CRT Toggle, V=Voice Mic, M/A=Audio)
window.addEventListener('keydown', (e) => {
    // Ignore input if focused in text fields
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    const k = e.key.toLowerCase();
    if (e.key === '1') {
        switchDeck(1);
    } else if (e.key === '2') {
        switchDeck(2);
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
    } else if (k === 'v') {
        if (window.openVoiceModal) window.openVoiceModal();
    } else if (k === 'm' || k === 'a') {
        if (window.toggleAudio) window.toggleAudio();
    }
});

// Master App Startup Sequence with Isolated Fault Circuit Breakers
window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Clocks & Time Ticker
    try {
        updateClock();
        setInterval(updateClock, 1000);
    } catch (e) { console.warn("[Clock] Init error:", e); }

    // 2. Start Real-Time Telemetry Engine Immediately
    try {
        if (window.fetchTelemetry) {
            window.fetchTelemetry();
            telemetryTimer = setInterval(window.fetchTelemetry, (window.BMB20_CONFIG && window.BMB20_CONFIG.pollIntervalMs) || 1000);
        }
        if (window.drawBandwidthCanvas) {
            window.drawBandwidthCanvas();
        }
    } catch (e) { console.warn("[Telemetry] Init error:", e); }

    // 3. Initialize CRT Scanline Display Preference
    try {
        initScanlines();
    } catch (e) { console.warn("[Scanlines] Init error:", e); }

    // 4. Initialize Meena AI Avatar Core & Knowledge Bank
    try {
        if (window.initMeenaAvatarCanvas) window.initMeenaAvatarCanvas();
    } catch (e) { console.warn("[Avatar] Init error:", e); }

    try {
        if (window.updateGrowthUI) window.updateGrowthUI();
    } catch (e) { console.warn("[Growth] Init error:", e); }

    try {
        if (window.initKnowledgeGraph) window.initKnowledgeGraph();
    } catch (e) { console.warn("[KnowledgeGraph] Init error:", e); }

    try {
        if (window.initAmbientCognition) window.initAmbientCognition();
    } catch (e) { console.warn("[Cognition] Init error:", e); }

    // 5. Initialize 3D Earth / Orbit Hologram
    try {
        if (window.initEarth) window.initEarth();
    } catch (e) { console.warn("[Earth3D] Init error:", e); }

    // 6. Start Background Cascade Effect
    try {
        cascadeTimer = setInterval(generateCascade, 250);
    } catch (e) { console.warn("[Cascade] Init error:", e); }

    // 7. Default Condition Green & Default Deck 1 (Meena AI Deck)
    try {
        setAlertCondition('green', false);
        switchDeck(1);
    } catch (e) { console.warn("[Deck] Init error:", e); }

    // 8. Initialize Holographic Boot Scanner & Mobile Communicator PTT
    try {
        if (window.initBootScanner) window.initBootScanner();
        if (window.initCommunicatorPTT) window.initCommunicatorPTT();
    } catch (e) { console.warn("[LayoutManager] Init error:", e); }
});

window.toggleScanlines = toggleScanlines;
window.setAlertCondition = setAlertCondition;
window.cycleAlertCondition = cycleAlertCondition;
window.switchDeck = switchDeck;

