/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - MASTER LIFECYCLE ORCHESTRATOR
 * Tactical Alert System, Hotkeys, Clocks, and Page Visibility Power Saving
 * ==========================================================================
 */

// Clean Address Bar: Hide 'index.html' seamlessly from browser address bar
if (typeof window !== 'undefined' && window.location.pathname.endsWith('/index.html')) {
    const cleanPath = window.location.pathname.replace(/\/index\.html$/, '/') + window.location.search + window.location.hash;
    window.history.replaceState(null, '', cleanPath);
}

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
            cycleBtn.className = "w-full flex items-center justify-between bg-error/20 hover:bg-error/30 text-error border border-error/60 py-1.5 px-2.5 rounded-l-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_12px_rgba(255,84,73,0.4)] animate-pulse mr-2";
        }
        if (cycleText) cycleText.innerText = "COND: RED // ALERT";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-error animate-ping";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('red');
        if (window.startRedAlertKlaxon) window.startRedAlertKlaxon();
        if (isManual) {
            showNotificationAlert("CONDITION: RED // BATTLE STATIONS", "Tactical defense shields and full combat readiness activated!", "error", { silent: true });
        }
    } else if (condition === 'yellow') {
        body.classList.add('alert-yellow');
        overlay.style.display = 'block';
        if (badge) {
            badge.innerText = "YELLOW ALERT: CAUTION ADVISED";
            badge.className = "text-tertiary font-bold tracking-wider";
        }
        if (cycleBtn) {
            cycleBtn.className = "w-full flex items-center justify-between bg-tertiary/20 hover:bg-tertiary/30 text-tertiary border border-tertiary/60 py-1.5 px-2.5 rounded-l-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_8px_rgba(255,226,83,0.3)] mr-2";
        }
        if (cycleText) cycleText.innerText = "COND: YELLOW // CAUTION";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-tertiary animate-pulse";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('yellow');
        if (window.playYellowAlertChirp) window.playYellowAlertChirp();
        if (isManual) {
            showNotificationAlert("CONDITION: YELLOW // CAUTION", "Subspace anomalies detected. Systems under elevated monitoring.", "warning", { silent: true });
        }
    } else {
        overlay.style.display = 'none';
        if (badge) {
            badge.innerText = "CONDITION GREEN [NOMINAL]";
            badge.className = "text-primary font-bold tracking-wider";
        }
        if (cycleBtn) {
            cycleBtn.className = "w-full flex items-center justify-between bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 py-1.5 px-2.5 rounded-l-full font-data-mono text-[10px] font-bold transition-all shadow-[0_0_8px_rgba(102,204,255,0.2)] mr-2";
        }
        if (cycleText) cycleText.innerText = "COND: GREEN // NOMINAL";
        if (cycleDot) cycleDot.className = "w-2 h-2 rounded-full bg-primary animate-pulse";

        if (window.setGlobeAlertColor) window.setGlobeAlertColor('green');
        if (window.stopRedAlertKlaxon) window.stopRedAlertKlaxon();
        if (isManual && window.speakComputerVoice) {
            window.speakComputerVoice("All systems operating within nominal parameters, sir.");
        }
        if (isManual) {
            showNotificationAlert("CONDITION GREEN // NOMINAL", "Bridge telemetry and facility security nominal.", "success", { silent: true });
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

// Clock & Authentic Star Trek Stardate Calculator (Malaysian Standard Time MYT UTC+8)
function updateClock() {
    const now = new Date();
    const clockElem = document.getElementById('clock');
    if (clockElem) {
        try {
            const mytStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
            clockElem.innerText = `${mytStr} MYT`;
        } catch (e) {
            const mytDate = new Date(now.getTime() + (8 * 3600 * 1000));
            const hrs = String(mytDate.getUTCHours()).padStart(2, '0');
            const mins = String(mytDate.getUTCMinutes()).padStart(2, '0');
            const secs = String(mytDate.getUTCSeconds()).padStart(2, '0');
            clockElem.innerText = `${hrs}:${mins}:${secs} MYT`;
        }
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
                deck.classList.remove('deck-hidden', 'hidden');
                deck.classList.add('deck-active', 'deck-view');
            } else {
                deck.classList.add('deck-hidden', 'hidden');
                deck.classList.remove('deck-active');
            }
        }
    });

    tabs.forEach((tab, idx) => {
        if (tab) {
            if (idx + 1 === deckNumber) {
                tab.className = "px-2.5 py-0.5 rounded font-bold text-xs bg-primary text-black transition-all shadow-[0_0_8px_#c2c1ff] active-condition scale-105";
            } else {
                tab.className = "px-2.5 py-0.5 rounded font-bold text-xs bg-surface-bright text-on-surface-variant hover:text-primary transition-all";
            }
        }
    });

    if (deckNumber === 1) {
        if (window.initKnowledgeGraph) window.initKnowledgeGraph();
        if (window.updateGrowthUI) window.updateGrowthUI();
        if (window.initNeuralWaveform) window.initNeuralWaveform();
    } else if (deckNumber === 2) {
        setTimeout(() => {
            if (window.onWindowResize) window.onWindowResize();
            window.dispatchEvent(new Event('resize'));
        }, 60);
    } else if (deckNumber === 3) {
        if (window.loadCalendarFeed) window.loadCalendarFeed();
        if (window.renderSolatTimelineArc) window.renderSolatTimelineArc();
    } else if (deckNumber === 4) {
        if (window.startVisualRecon && !isReconActive) window.startVisualRecon();
    }
}

// Touch Gesture Engine for Tablet & Mobile Kiosks (Swipe Left/Right between Decks)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Minimum swipe distance threshold of 60px, horizontal dominance
        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0 && currentDeck < 4) {
                // Swipe Left -> Next Deck
                switchDeck(currentDeck + 1);
                if (window.playSound) window.playSound('beep2');
            } else if (deltaX > 0 && currentDeck > 1) {
                // Swipe Right -> Previous Deck
                switchDeck(currentDeck - 1);
                if (window.playSound) window.playSound('beep2');
            }
        }
    }
}, { passive: true });

// Keyboard Hotkey Support (1=Deck 1 Meena, 2=Deck 2 Observatory, 3=Deck 3 Calendar, 4=Deck 4 Visual Recon, 0/!=Red Alert)
window.addEventListener('keydown', (e) => {
    // Ignore input if focused in text fields
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    const k = e.key.toLowerCase();
    if (e.key === 'Escape') {
        if (window.closeNeuralCoreInspectorModal) window.closeNeuralCoreInspectorModal();
        if (window.closeMeenaDossierModal) window.closeMeenaDossierModal();
        if (window.closeNodeModal) window.closeNodeModal();
        if (window.closePiholeModal) window.closePiholeModal();
        if (window.closeVoiceModal) window.closeVoiceModal();
        if (window.closeCalendarModal) window.closeCalendarModal();
        if (window.closeCommCalendarModal) window.closeCommCalendarModal();
    } else if (e.key === '1') {
        switchDeck(1);
    } else if (e.key === '2') {
        switchDeck(2);
    } else if (e.key === '3') {
        switchDeck(3);
    } else if (e.key === '4') {
        switchDeck(4);
    } else if (e.key === '0' || e.key === '!') {
        setAlertCondition('red', true);
    } else if (k === 'n') {
        if (window.openNeuralCoreInspectorModal) window.openNeuralCoreInspectorModal();
    } else if (k === 'p') {
        if (window.switchHologramView) window.switchHologramView('earth');
    } else if (k === 's') {
        if (window.switchHologramView) window.switchHologramView('solar');
    } else if (k === 'g') {
        if (window.switchHologramView) window.switchHologramView('galaxy');
    } else if (k === 'w') {
        if (window.playWarpSequence) window.playWarpSequence();
    } else if (k === 'c') {
        if (window.playDoorChime) window.playDoorChime();
    } else if (k === 'b') {
        if (window.playTransporterChime) window.playTransporterChime();
    } else if (k === 'r') {
        toggleScanlines();
    } else if (k === 'v' || k === 'm') {
        if (window.toggleVoiceListeningMute) window.toggleVoiceListeningMute();
    } else if (k === 'd') {
        if (window.openMeenaDossierModal) window.openMeenaDossierModal();
    } else if (k === 'a') {
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

    // 3. Initialize Autonomous Routine & Waktu Solat Scheduler
    try {
        if (window.initRoutineScheduler) window.initRoutineScheduler();
    } catch (e) { console.warn("[RoutineScheduler] Init error:", e); }

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

    // Request notification permissions gracefully on first user interaction
    document.addEventListener('click', () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, { once: true });
});

/**
 * ==========================================================================
 * LCARS TACTICAL NOTIFICATION & ALERT DISPATCHER
 * Universal Toast, OS Desktop Notification, Sound Chime & Voice Dispatcher
 * ==========================================================================
 */
function showNotificationAlert(title, message, type = 'info', options = {}) {
    // 1. Ensure Toast Container exists in DOM
    let container = document.getElementById('lcars-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'lcars-toast-container';
        container.className = 'fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-[92vw] sm:w-80';
        document.body.appendChild(container);
    }

    // 2. Determine Styling and Tone by Type
    let borderColor = 'border-primary shadow-[0_0_12px_rgba(102,204,255,0.3)]';
    let bgColor = 'bg-surface-container/95';
    let icon = 'info';
    let iconColor = 'text-primary';
    let soundType = 'beep1';

    if (type === 'error' || type === 'red') {
        borderColor = 'border-error shadow-[0_0_15px_rgba(255,84,73,0.5)]';
        icon = 'fmd_bad';
        iconColor = 'text-error';
        soundType = 'alert';
    } else if (type === 'warning' || type === 'yellow') {
        borderColor = 'border-tertiary shadow-[0_0_12px_rgba(255,226,83,0.4)]';
        icon = 'warning';
        iconColor = 'text-tertiary';
        soundType = 'caution';
    } else if (type === 'success') {
        borderColor = 'border-lcars-cyan shadow-[0_0_12px_rgba(77,208,225,0.4)]';
        icon = 'check_circle';
        iconColor = 'text-lcars-cyan';
        soundType = 'beep2';
    } else if (type === 'task') {
        borderColor = 'border-secondary shadow-[0_0_12px_rgba(255,179,160,0.4)]';
        icon = 'task_alt';
        iconColor = 'text-secondary';
        soundType = 'chime';
    }

    // 3. Play audio effect
    if (window.playSound && !options.silent) {
        window.playSound(soundType);
    }

    // 4. Create Toast Element
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto border-2 ${borderColor} ${bgColor} backdrop-blur-md p-3 rounded-tl-xl rounded-br-xl flex items-start gap-2.5 shadow-2xl transition-all duration-300 transform translate-y-[-10px] opacity-0 font-data-mono`;
    
    toast.innerHTML = `
        <div class="mt-0.5 flex-shrink-0">
            <span class="material-symbols-outlined text-lg ${iconColor} animate-pulse">${icon}</span>
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="text-xs font-bold text-on-surface font-headline tracking-wider truncate">${title}</span>
                <span class="text-[8px] text-secondary font-mono">${new Date().toLocaleTimeString()}</span>
            </div>
            <p class="text-[10px] text-secondary leading-snug break-words">${message}</p>
        </div>
        <button class="text-secondary hover:text-on-surface p-0.5 transition-colors flex-shrink-0" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-10px]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto dismiss after duration (default 6.5s)
    const duration = options.duration || 6500;
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);

    // 5. Send Native OS Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted' && (!isTabFocused || options.forceOsNotify)) {
        try {
            new Notification(`[MEENA // LCARS] ${title}`, {
                body: message,
                icon: '/assets/images/screen.png'
            });
        } catch (e) {}
    }

    // 6. Optional Spoken Recital
    if (options.speak && window.speakComputerVoice) {
        window.speakComputerVoice(`${title}. ${message}`);
    }
}

window.toggleScanlines = toggleScanlines;
window.setAlertCondition = setAlertCondition;
window.cycleAlertCondition = cycleAlertCondition;
window.switchDeck = switchDeck;
window.showNotificationAlert = showNotificationAlert;

