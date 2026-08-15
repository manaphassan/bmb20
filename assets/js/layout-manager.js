/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - STARFLEET DUAL-LAYOUT MANAGER
 * Handles Holographic Boot Scanner, Mobile Communicator, and Desktop Bridge
 * ==========================================================================
 */

let currentLayoutMode = 'auto'; // 'bridge' | 'communicator' | 'auto'
let bootCountdownTimer = null;
let bootCountdownSeconds = 1.5;
let isTelemetryDrawerOpen = false;

// 1. Device Profile Detector
function detectDeviceProfile() {
    const w = window.innerWidth;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    return {
        width: w,
        height: window.innerHeight,
        isMobile: w < 768 || (isTouch && w < 1024),
        isTouch: isTouch,
        orientation: window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait'
    };
}

// 2. Initialize Holographic Boot Scanner Screen
function initBootScanner() {
    const overlay = document.getElementById('lcars-boot-overlay');
    if (!overlay) return;

    const savedMode = localStorage.getItem('bmb20_layout_mode');
    const rememberChoice = localStorage.getItem('bmb20_remember_layout') === 'true';

    const profile = detectDeviceProfile();
    const recommendedMode = profile.isMobile ? 'communicator' : 'bridge';

    // Update Probe Readouts in DOM
    const probeRes = document.getElementById('boot-probe-res');
    const probeTarget = document.getElementById('boot-probe-target');
    const countText = document.getElementById('boot-countdown-text');
    const progressBar = document.getElementById('boot-progress-bar');
    const rememberCheckbox = document.getElementById('boot-remember-checkbox');

    if (probeRes) {
        probeRes.innerText = `${profile.width} x ${profile.height} px (${profile.orientation})`;
    }
    if (probeTarget) {
        probeTarget.innerText = recommendedMode === 'communicator' ? 'MOBILE COMMUNICATOR' : 'COMMAND BRIDGE';
    }
    if (rememberCheckbox && rememberChoice) {
        rememberCheckbox.checked = true;
    }

    // If preference was saved and rememberChoice is on, fast-boot in 0.3s
    if (rememberChoice && (savedMode === 'bridge' || savedMode === 'communicator')) {
        setTimeout(() => {
            selectLayoutMode(savedMode, false);
        }, 300);
        return;
    }

    // Auto-countdown loop (1.5 seconds)
    let startTime = Date.now();
    const totalDuration = 1500;

    bootCountdownTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (totalDuration - elapsed) / 1000);
        const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100));

        if (progressBar) progressBar.style.width = `${pct}%`;
        if (countText) countText.innerText = `AUTO-ENGAGING IN ${remaining.toFixed(1)}s...`;

        if (elapsed >= totalDuration) {
            clearInterval(bootCountdownTimer);
            bootCountdownTimer = null;
            selectLayoutMode(savedMode || recommendedMode, false);
        }
    }, 50);
}

// 3. User Selection & Layout Engagement
function selectLayoutMode(mode, playSoundEffect = true) {
    if (bootCountdownTimer) {
        clearInterval(bootCountdownTimer);
        bootCountdownTimer = null;
    }

    const rememberCheckbox = document.getElementById('boot-remember-checkbox');
    const shouldRemember = rememberCheckbox ? rememberCheckbox.checked : false;

    if (shouldRemember) {
        localStorage.setItem('bmb20_layout_mode', mode);
        localStorage.setItem('bmb20_remember_layout', 'true');
    } else {
        localStorage.removeItem('bmb20_remember_layout');
    }

    // Play Authorization Affirmation Chime
    if (playSoundEffect && window.playSound) {
        window.playSound('beep1');
    }

    // Fade out boot overlay
    const overlay = document.getElementById('lcars-boot-overlay');
    if (overlay) {
        overlay.classList.add('boot-fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400);
    }

    applyLayoutMode(mode);
}

// 4. Apply Chosen Layout Mode
function applyLayoutMode(mode) {
    currentLayoutMode = mode;
    const bridgeLayout = document.getElementById('layout-bridge');
    const commLayout = document.getElementById('layout-communicator');
    const headerModeBadge = document.getElementById('header-mode-badge');
    const commModeBadge = document.getElementById('comm-mode-badge');

    if (mode === 'communicator') {
        if (bridgeLayout) bridgeLayout.style.display = 'none';
        if (commLayout) commLayout.style.display = 'flex';
        document.body.classList.add('mode-communicator');
        document.body.classList.remove('mode-bridge');
        if (headerModeBadge) headerModeBadge.innerText = 'MODE: COMM';
        if (commModeBadge) commModeBadge.innerText = 'COMMUNICATOR';

        // Trigger immediate sync of transcript and telemetry
        syncCommunicatorTranscript();
    } else {
        if (commLayout) commLayout.style.display = 'none';
        if (bridgeLayout) bridgeLayout.style.display = 'flex';
        document.body.classList.add('mode-bridge');
        document.body.classList.remove('mode-communicator');
        if (headerModeBadge) headerModeBadge.innerText = 'MODE: BRIDGE';

        // Resize 3D WebGL and 2D Knowledge Graph canvases
        if (window.resizeKnowledgeGraphCanvas) window.resizeKnowledgeGraphCanvas();
        if (window.initEarth) {
            const earthCont = document.getElementById('earth-container');
            if (earthCont && !earthCont.children.length) window.initEarth();
        }
    }
}

// 5. Toggle Layout Mode between Bridge & Communicator
function toggleLayoutMode() {
    const nextMode = currentLayoutMode === 'communicator' ? 'bridge' : 'communicator';
    selectLayoutMode(nextMode, true);
}

// 6. Mobile Push-To-Talk (PTT) Communicator Button Handling (Strict Hold-To-Talk)
function initCommunicatorPTT() {
    const pttBtn = document.getElementById('comm-ptt-button');
    if (!pttBtn) return;

    let pressStartTime = 0;
    let isHoldingPTT = false;

    const handlePointerDown = (e) => {
        e.preventDefault();
        pressStartTime = Date.now();
        isHoldingPTT = true;

        // Start PTT transmission
        if (window.startPTTListening) {
            window.startPTTListening();
        }
    };

    const handlePointerUp = (e) => {
        if (!isHoldingPTT) return;
        e.preventDefault();
        const duration = Date.now() - pressStartTime;
        isHoldingPTT = false;

        // Stop PTT transmission and dispatch speech to Meena
        if (window.stopPTTListening) {
            window.stopPTTListening();
        }

        // If tap was too brief (< 180ms), show helpful reminder
        if (duration < 180) {
            const pttLabel = document.getElementById('comm-ptt-label');
            if (pttLabel) {
                pttLabel.innerText = 'HOLD TO TALK';
                setTimeout(() => {
                    if (!isHoldingPTT && pttLabel) pttLabel.innerText = 'PUSH TO TRANSMIT';
                }, 1200);
            }
        }
    };

    // Mobile Touch Listeners (Immediate responsive touch)
    pttBtn.addEventListener('touchstart', handlePointerDown, { passive: false });
    pttBtn.addEventListener('touchend', handlePointerUp, { passive: false });
    pttBtn.addEventListener('touchcancel', handlePointerUp, { passive: false });

    // Desktop Mouse Listeners
    pttBtn.addEventListener('mousedown', handlePointerDown);
    pttBtn.addEventListener('mouseup', handlePointerUp);
    pttBtn.addEventListener('mouseleave', (e) => {
        if (isHoldingPTT) handlePointerUp(e);
    });
}

// 7. Slide-Up Telemetry Drawer on Communicator
function toggleTelemetryDrawer() {
    isTelemetryDrawerOpen = !isTelemetryDrawerOpen;
    const drawer = document.getElementById('comm-telemetry-drawer');
    const tabIcon = document.getElementById('comm-drawer-icon');
    if (!drawer) return;

    if (isTelemetryDrawerOpen) {
        drawer.classList.remove('translate-y-[calc(100%-36px)]');
        drawer.classList.add('translate-y-0');
        if (tabIcon) tabIcon.innerText = 'expand_more';
        if (window.playSound) window.playSound('beep2');
    } else {
        drawer.classList.remove('translate-y-0');
        drawer.classList.add('translate-y-[calc(100%-36px)]');
        if (tabIcon) tabIcon.innerText = 'expand_less';
    }
}

// 8. Synchronize Transcript Messages to Communicator Feed
function syncCommunicatorTranscript() {
    const bridgeFeed = document.getElementById('meena-dialogue-stream');
    const commFeed = document.getElementById('comm-transcript-stream');
    if (bridgeFeed && commFeed) {
        commFeed.innerHTML = bridgeFeed.innerHTML;
        commFeed.scrollTop = commFeed.scrollHeight;
    }
}

// Export functions to global scope
window.initBootScanner = initBootScanner;
window.selectLayoutMode = selectLayoutMode;
window.toggleLayoutMode = toggleLayoutMode;
window.applyLayoutMode = applyLayoutMode;
window.toggleTelemetryDrawer = toggleTelemetryDrawer;
window.syncCommunicatorTranscript = syncCommunicatorTranscript;
window.initCommunicatorPTT = initCommunicatorPTT;
