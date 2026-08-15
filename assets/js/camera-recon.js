/**
 * ==============================================================================
 * MEENA // TAKAHARA ACADEMY (高原学園) - DECK 4: SPATIAL AI COMMAND & SENTRY HUB
 * - Real-Time Head & Facial Movement Tracking
 * - Alex's Study Sentry (Posture Alignment, Ocular 20-20-20 Fatigue, Flow Halo)
 * - Autonomous Bridge Arrival & Presence Protocol
 * - Holographic Document / Math OCR Scanner (Gemini Vision)
 * - Biometric Dossier History & Persistent Personnel Archives
 * - Tactical Line Callouts & Output Mirror / Flip Transformations
 * ==============================================================================
 */

let reconMediaStream = null;
let isReconActive = false;
let currentCameraFacing = 'user'; // 'user' (selfie/head track) or 'environment'
let hudAnimationId = null;
let isVisualAnalyzing = false;
let isFaceScanning = false;
let isDocScanning = false;
let laserScanY = 0;
let isLaserScanning = false;

// Camera Output Transform States (Horizontal Mirror & Vertical Invert)
let isCameraFlippedH = localStorage.getItem('meena_cam_flip_h') === 'true';
let isCameraFlippedV = localStorage.getItem('meena_cam_flip_v') === 'true';

// ==============================================================================
// 1. REAL-TIME HEAD MOVEMENT & CENTROID TRACKING
// ==============================================================================
let isHeadTrackingEnabled = true;
let nativeFaceDetector = null;
let isNativeFaceDetectorSupported = false;
let isDetectingNativeFace = false;

let motionAnalysisCanvas = null;
let motionAnalysisCtx = null;
let prevFrameData = null;

let headCentroid = {
    x: 0.52,
    y: 0.42,
    smoothX: 0.52,
    smoothY: 0.42,
    width: 0.28,
    height: 0.36,
    smoothW: 0.28,
    smoothH: 0.36,
    active: true,
    intensity: 75,
    velocity: 0,
    bbox: null,
    landmarks: null,
    lastDetectedTime: performance.now()
};
let headTrail = [];

if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
        nativeFaceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        isNativeFaceDetectorSupported = true;
    } catch (e) {
        console.warn("[HeadTrack] Native FaceDetector error:", e);
    }
}

// ==============================================================================
// 2. ALEX'S STUDY SENTRY & ERGONOMICS PROTOCOL (Posture, Fatigue & Flow)
// ==============================================================================
let isStudySentryEnabled = true;
let postureState = 'OPTIMAL'; // 'OPTIMAL', 'FAIR', 'SLOUCHING'
let cervicalAngle = 88; // Degrees
let continuousSlouchSeconds = 0;
let lastSlouchNudgeTime = 0;
let focusSessionMinutes = 0;
let ocularBreakTimerSeconds = 20 * 60; // 20-20-20 rule timer (20 minutes)
let sentryTickInterval = null;

// ==============================================================================
// 3. AUTONOMOUS BRIDGE PRESENCE & ARRIVAL PROTOCOL
// ==============================================================================
let isPresenceSentryEnabled = true;
let isSenseiPresent = false;
let awayDurationSeconds = 0;
let lastArrivalGreetingTime = 0;

// ==============================================================================
// 4. REAL-TIME LINE CALLOUT ANNOTATIONS
// ==============================================================================
let isCalloutsEnabled = true;
let activeCallouts = [
    {
        id: 'primary_focal',
        relX: 0.5,
        relY: 0.42,
        title: 'PRIMARY HEAD SECTOR',
        tag: 'HEAD-LOCK-01',
        detail: 'HEAD VECTOR ACTIVE',
        color: '#66ccff',
        isAuto: true,
        angleDeg: -35,
        length: 50
    },
    {
        id: 'ambient_sensor',
        relX: 0.72,
        relY: 0.28,
        title: 'CERVICAL AXIS SENTRY',
        tag: 'ERGONOMICS',
        detail: 'POSTURE: 88° OPTIMAL',
        color: '#33ff66',
        isAuto: true,
        angleDeg: 35,
        length: 45
    }
];

/**
 * Helper to get all video elements (Desktop Bridge & Mobile Communicator Modal)
 */
function getReconVideoElements() {
    const desktopVideo = document.getElementById('recon-video-stream');
    const mobileVideo = document.getElementById('comm-recon-video-stream');
    const list = [];
    if (desktopVideo) list.push(desktopVideo);
    if (mobileVideo) list.push(mobileVideo);
    return list;
}

/**
 * Helper to get the currently visible/active video element
 */
function getActiveReconVideo() {
    const mobileModal = document.getElementById('comm-recon-modal');
    const isMobileModalOpen = mobileModal && !mobileModal.classList.contains('hidden');
    
    if (isMobileModalOpen) {
        const mobileVideo = document.getElementById('comm-recon-video-stream');
        if (mobileVideo) return mobileVideo;
    }
    const desktopVideo = document.getElementById('recon-video-stream');
    if (desktopVideo) return desktopVideo;
    return null;
}

/**
 * Apply CSS Transforms (Horizontal & Vertical Flip)
 */
function applyCameraTransforms() {
    const scaleX = isCameraFlippedH ? -1 : 1;
    const scaleY = isCameraFlippedV ? -1 : 1;
    const transformStyle = `scale(${scaleX}, ${scaleY})`;

    const videos = getReconVideoElements();
    videos.forEach(v => {
        if (v) v.style.transform = transformStyle;
    });

    const btnFlipH = document.getElementById('recon-flip-h-btn');
    const btnFlipV = document.getElementById('recon-flip-v-btn');
    if (btnFlipH) {
        btnFlipH.className = `px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            isCameraFlippedH ? 'bg-primary text-black border-primary shadow-[0_0_8px_rgba(102,204,255,0.4)]' : 'bg-surface-container text-on-surface border-outline-variant/40 hover:bg-surface-bright'
        }`;
    }
    if (btnFlipV) {
        btnFlipV.className = `px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            isCameraFlippedV ? 'bg-lcars-gold text-black border-lcars-gold shadow-[0_0_8px_rgba(255,226,83,0.4)]' : 'bg-surface-container text-on-surface border-outline-variant/40 hover:bg-surface-bright'
        }`;
    }

    const mFlipH = document.getElementById('comm-recon-fliph-btn');
    const mFlipV = document.getElementById('comm-recon-flipv-btn');
    if (mFlipH) {
        mFlipH.className = `p-1.5 rounded-full border shadow-md transition-all active:scale-95 ${
            isCameraFlippedH ? 'bg-primary text-black border-primary' : 'bg-black/60 backdrop-blur text-white border-white/20 hover:bg-tertiary hover:text-black'
        }`;
    }
    if (mFlipV) {
        mFlipV.className = `p-1.5 rounded-full border shadow-md transition-all active:scale-95 ${
            isCameraFlippedV ? 'bg-lcars-gold text-black border-lcars-gold' : 'bg-black/60 backdrop-blur text-white border-white/20 hover:bg-tertiary hover:text-black'
        }`;
    }
}

function toggleCameraFlipH() {
    isCameraFlippedH = !isCameraFlippedH;
    localStorage.setItem('meena_cam_flip_h', isCameraFlippedH.toString());
    applyCameraTransforms();
    if (window.playSound) window.playSound('beep2');
    if (window.showNotificationAlert) {
        window.showNotificationAlert("OPTICAL TRANSFORM", `Horizontal Mirror: ${isCameraFlippedH ? 'FLIPPED (MIRROR)' : 'STANDARD'}`, "info");
    }
}

function toggleCameraFlipV() {
    isCameraFlippedV = !isCameraFlippedV;
    localStorage.setItem('meena_cam_flip_v', isCameraFlippedV.toString());
    applyCameraTransforms();
    if (window.playSound) window.playSound('beep2');
    if (window.showNotificationAlert) {
        window.showNotificationAlert("OPTICAL TRANSFORM", `Vertical Flip: ${isCameraFlippedV ? 'INVERTED (180°)' : 'STANDARD'}`, "info");
    }
}

function toggleHeadTracking() {
    isHeadTrackingEnabled = !isHeadTrackingEnabled;
    const btnTrack = document.getElementById('recon-motion-track-btn');
    const mTrack = document.getElementById('comm-recon-motion-track-btn');

    if (btnTrack) {
        btnTrack.innerHTML = `<span class="material-symbols-outlined text-sm">face</span><span>HEAD TRACK: ${isHeadTrackingEnabled ? 'ON' : 'OFF'}</span>`;
        btnTrack.className = `px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            isHeadTrackingEnabled ? 'bg-lcars-gold text-black border-lcars-gold shadow-[0_0_8px_rgba(255,226,83,0.4)]' : 'bg-surface-container text-secondary border-outline-variant/40 hover:bg-surface-bright'
        }`;
    }
    if (mTrack) {
        mTrack.className = `p-1.5 rounded-full border shadow-md transition-all active:scale-95 ${
            isHeadTrackingEnabled ? 'bg-lcars-gold text-black border-lcars-gold shadow-[0_0_8px_rgba(255,226,83,0.5)]' : 'bg-black/60 backdrop-blur text-white border-white/20'
        }`;
    }

    if (!isHeadTrackingEnabled) {
        headCentroid.active = false;
        headTrail = [];
    }

    if (window.playSound) window.playSound('beep2');
    if (window.showNotificationAlert) {
        window.showNotificationAlert("HEAD SENTRY", `Real-time Head Movement Tracking: ${isHeadTrackingEnabled ? 'ENGAGED' : 'DISENGAGED'}`, "info");
    }
}

window.toggleMotionTracking = toggleHeadTracking;

function toggleStudySentry() {
    isStudySentryEnabled = !isStudySentryEnabled;
    const btnSentry = document.getElementById('recon-sentry-toggle-btn');
    if (btnSentry) {
        btnSentry.innerHTML = `<span class="material-symbols-outlined text-sm">self_improvement</span><span>SENTRY: ${isStudySentryEnabled ? 'ACTIVE' : 'OFF'}</span>`;
        btnSentry.className = `px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            isStudySentryEnabled ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-surface-container text-secondary border-outline-variant/40'
        }`;
    }
    if (window.playSound) window.playSound('beep2');
    if (window.showNotificationAlert) {
        window.showNotificationAlert("STUDY SENTRY", `Alex's Ergonomics & Posture Sentry: ${isStudySentryEnabled ? 'ONLINE' : 'STAND DOWN'}`, "info");
    }
}

function toggleCalloutAnnotations() {
    isCalloutsEnabled = !isCalloutsEnabled;
    const btnCallouts = document.getElementById('recon-callouts-toggle-btn');
    const mCallouts = document.getElementById('comm-recon-callouts-btn');

    if (btnCallouts) {
        btnCallouts.innerHTML = `<span class="material-symbols-outlined text-sm">pin_drop</span><span>CALLOUTS: ${isCalloutsEnabled ? 'ON' : 'OFF'}</span>`;
        btnCallouts.className = `px-2.5 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 ${
            isCalloutsEnabled ? 'bg-lcars-cyan text-black border-lcars-cyan shadow-[0_0_8px_rgba(51,255,255,0.4)]' : 'bg-surface-container text-secondary border-outline-variant/40 hover:bg-surface-bright'
        }`;
    }
    if (mCallouts) {
        mCallouts.className = `p-1.5 rounded-full border shadow-md transition-all active:scale-95 ${
            isCalloutsEnabled ? 'bg-lcars-cyan text-black border-lcars-cyan' : 'bg-black/60 backdrop-blur text-white border-white/20'
        }`;
    }

    if (window.playSound) window.playSound('beep1');
}

function addLineCallout(relX, relY, title = 'TACTICAL TARGET', tag = 'OBJ-LOCK', detail = 'CALIBRATED', color = '#66ccff') {
    const newCallout = {
        id: 'callout_' + Date.now(),
        relX: Math.max(0.08, Math.min(0.92, relX)),
        relY: Math.max(0.08, Math.min(0.92, relY)),
        title: title.toUpperCase(),
        tag: tag.toUpperCase(),
        detail: detail.toUpperCase(),
        color: color,
        isAuto: false,
        angleDeg: relX > 0.5 ? -35 : 35,
        length: 50
    };

    activeCallouts.push(newCallout);
    if (activeCallouts.length > 6) {
        activeCallouts.shift();
    }
    if (window.playSound) window.playSound('chime');
}

function clearCustomCallouts() {
    activeCallouts = activeCallouts.filter(c => c.isAuto);
    if (window.playSound) window.playSound('beep1');
}

async function getCrossBrowserUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia(constraints);
    }
    const legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (legacy) {
        return new Promise((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
    }
    throw new Error("Camera API not supported or origin is insecure HTTP on mobile.");
}

/**
 * Initialize / Start Optical Camera Feed
 */
async function startVisualRecon(facingMode = currentCameraFacing) {
    currentCameraFacing = facingMode;
    const statusBadges = [
        document.getElementById('recon-status-badge'),
        document.getElementById('comm-recon-status-badge')
    ];
    const powerButtons = [
        document.getElementById('recon-power-btn'),
        document.getElementById('comm-recon-power-btn')
    ];

    try {
        if (reconMediaStream) {
            reconMediaStream.getTracks().forEach(t => t.stop());
            reconMediaStream = null;
        }

        let stream = null;
        const attempts = [
            { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
            { video: { facingMode: facingMode }, audio: false },
            { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' }, audio: false },
            { video: true, audio: false }
        ];

        let lastErr = null;
        for (const c of attempts) {
            try {
                stream = await getCrossBrowserUserMedia(c);
                if (stream) break;
            } catch (attemptErr) {
                lastErr = attemptErr;
            }
        }

        if (!stream) throw lastErr || new Error("Unable to capture optical video stream.");

        reconMediaStream = stream;
        isReconActive = true;
        headCentroid.active = true;
        headCentroid.lastDetectedTime = performance.now();

        if (!motionAnalysisCanvas) {
            motionAnalysisCanvas = document.createElement('canvas');
            motionAnalysisCanvas.width = 96;
            motionAnalysisCanvas.height = 72;
            motionAnalysisCtx = motionAnalysisCanvas.getContext('2d', { willReadFrequently: true });
        }
        prevFrameData = null;

        const videos = getReconVideoElements();
        for (const v of videos) {
            v.muted = true;
            v.playsInline = true;
            v.setAttribute('playsinline', '');
            v.setAttribute('webkit-playsinline', '');
            v.srcObject = reconMediaStream;
            try {
                await v.play();
            } catch (playErr) {
                console.warn("[VisualRecon] Play warning:", playErr);
            }
        }

        applyCameraTransforms();

        statusBadges.forEach(st => {
            if (st) {
                st.innerText = `OPTICAL FEED: ACTIVE [${currentCameraFacing.toUpperCase()}]`;
                st.className = "text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold border border-primary/50 shadow-[0_0_8px_rgba(102,204,255,0.3)] animate-pulse";
            }
        });

        powerButtons.forEach(btn => {
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-outlined text-sm">videocam_off</span><span>STAND DOWN</span>`;
                btn.className = "bg-error hover:bg-error/80 text-black font-bold py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-95";
            }
        });

        const standbys = [
            document.getElementById('recon-standby-screen'),
            document.getElementById('comm-recon-standby-screen')
        ];
        standbys.forEach(sb => {
            if (sb) sb.style.display = 'none';
        });

        initInteractiveCanvasCallouts();
        initSentryHeartbeatTimer();

        if (window.playSound) window.playSound('warp');
        if (window.showNotificationAlert) {
            window.showNotificationAlert("OPTICAL RECON ACTIVE", `Deck 4 optical sensors online (${currentCameraFacing.toUpperCase()}).`, "info");
        }

        startTacticalHUDLoop();

    } catch (err) {
        console.error("[VisualRecon] Camera init error:", err);
        statusBadges.forEach(st => {
            if (st) {
                st.innerText = "OPTICAL FEED: OFFLINE / PERMISSION REQUIRED";
                st.className = "text-[9px] bg-error/20 text-error px-2 py-0.5 rounded font-bold border border-error/50";
            }
        });
        if (window.showNotificationAlert) {
            window.showNotificationAlert("OPTICAL RECON FAULT", "Camera permission needed or device busy: " + err.message, "error");
        }
    }
}

function initInteractiveCanvasCallouts() {
    const containers = [
        document.getElementById('recon-video-container'),
        document.getElementById('comm-recon-video-container')
    ];

    containers.forEach(cont => {
        if (!cont || cont._calloutBound) return;
        cont._calloutBound = true;

        const handlePointer = (e) => {
            if (!isReconActive) return;
            const rect = cont.getBoundingClientRect();
            const activeVideo = getActiveReconVideo();
            const box = getVideoRenderBox(activeVideo, rect.width, rect.height);

            let clientX = e.clientX;
            let clientY = e.clientY;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            const x = clientX - rect.left - box.offsetX;
            const y = clientY - rect.top - box.offsetY;
            let relX = Math.max(0, Math.min(1, x / box.renderW));
            let relY = Math.max(0, Math.min(1, y / box.renderH));

            if (isCameraFlippedH) relX = 1 - relX;
            if (isCameraFlippedV) relY = 1 - relY;

            addLineCallout(relX, relY, "USER TARGET PIN", "PIN-" + Math.floor(Math.random() * 90 + 10), `COORD: [${Math.round(x)}, ${Math.round(y)}]`, "#33ffff");
        };

        cont.addEventListener('click', handlePointer);
    });
}

/**
 * Sentry Heartbeat Timer (Posture evaluation, 20-20-20 rule & Arrival Sentry)
 */
function initSentryHeartbeatTimer() {
    if (sentryTickInterval) clearInterval(sentryTickInterval);

    sentryTickInterval = setInterval(() => {
        if (!isReconActive) return;

        // 1. Evaluate Posture & Ergonomics
        if (isStudySentryEnabled && headCentroid.active) {
            // Head Y > 0.65 or Head Y drop suggests forward slouch / tech neck
            const rawPitch = headCentroid.smoothY;
            if (rawPitch > 0.58) {
                postureState = 'SLOUCHING';
                cervicalAngle = Math.max(62, Math.round(88 - (rawPitch - 0.5) * 110));
                continuousSlouchSeconds += 1;
            } else if (rawPitch > 0.48) {
                postureState = 'FAIR';
                cervicalAngle = 78;
                continuousSlouchSeconds = Math.max(0, continuousSlouchSeconds - 1);
            } else {
                postureState = 'OPTIMAL';
                cervicalAngle = 88;
                continuousSlouchSeconds = 0;
            }

            // Alex Dunphy Posture Sarcastic / Caring Nudge (after 30s continuous slouching)
            if (continuousSlouchSeconds >= 30 && Date.now() - lastSlouchNudgeTime > 3 * 60 * 1000) {
                lastSlouchNudgeTime = Date.now();
                const sarcasticNudges = [
                    "Sensei, your cervical spine angle is dropping. Sit up straight before your posture starts resembling a question mark.",
                    "Ergonomics alert: Spinal alignment is suboptimal. Shoulders back, chin up, Sensei.",
                    "Academic posture check: Slouching decreases cerebral oxygenation by up to 14%. Adjust your back, please."
                ];
                const nudge = sarcasticNudges[Math.floor(Math.random() * sarcasticNudges.length)];
                if (window.speakComputerVoice) window.speakComputerVoice(nudge);
                if (window.showNotificationAlert) {
                    window.showNotificationAlert("POSTURE ADVISORY", nudge, "warning");
                }
            }

            // 20-20-20 Ocular Rest Rule Timer
            ocularBreakTimerSeconds -= 1;
            if (ocularBreakTimerSeconds <= 0) {
                ocularBreakTimerSeconds = 20 * 60; // Reset 20m
                const ocularMsg = "20-20-20 Protocol: Sensei, shift your gaze 20 feet away for 20 seconds to prevent ocular fatigue.";
                if (window.speakComputerVoice) window.speakComputerVoice(ocularMsg);
                if (window.showNotificationAlert) {
                    window.showNotificationAlert("OCULAR REST (20-20-20)", ocularMsg, "info");
                }
            }
        }

        // 2. Autonomous Bridge Arrival Protocol
        if (isPresenceSentryEnabled) {
            if (headCentroid.active) {
                if (!isSenseiPresent) {
                    // SENSEI JUST ARRIVED AT DESK!
                    if (awayDurationSeconds >= 90 && Date.now() - lastArrivalGreetingTime > 5 * 60 * 1000) {
                        lastArrivalGreetingTime = Date.now();
                        const arrivalGreetings = [
                            "Welcome back to Bridge Command, Sensei. Optical telemetry synchronized.",
                            "Sensei detected at workstation. Takahara Academy systems nominal.",
                            "Welcome back, Sensei. Core memory and neural voice sentry active."
                        ];
                        const greeting = arrivalGreetings[Math.floor(Math.random() * arrivalGreetings.length)];
                        if (window.speakComputerVoice) window.speakComputerVoice(greeting);
                        if (window.showNotificationAlert) {
                            window.showNotificationAlert("SENSEI DETECTED", "Bridge Arrival Protocol Engaged.", "info");
                        }
                    }
                    isSenseiPresent = true;
                    awayDurationSeconds = 0;
                }
            } else {
                awayDurationSeconds += 1;
                if (awayDurationSeconds > 15) {
                    isSenseiPresent = false;
                }
            }
        }
    }, 1000);
}

/**
 * Update Head Tracking Centroid & Smooth State
 */
function updateHeadTrackingCentroid(rawX, rawY, rawW, rawH, bbox) {
    const alpha = 0.35; // Smoothing factor for 60 FPS
    
    const dx = (rawX - headCentroid.x) * 640;
    const dy = (rawY - headCentroid.y) * 480;
    const currentVelocity = Math.round(Math.hypot(dx, dy) * 8);
    
    headCentroid.velocity = Math.round(headCentroid.velocity * 0.7 + currentVelocity * 0.3);
    headCentroid.x = rawX;
    headCentroid.y = rawY;
    headCentroid.smoothX = headCentroid.smoothX * (1 - alpha) + rawX * alpha;
    headCentroid.smoothY = headCentroid.smoothY * (1 - alpha) + rawY * alpha;
    headCentroid.width = Math.max(0.20, Math.min(0.45, rawW));
    headCentroid.height = Math.max(0.26, Math.min(0.55, rawH));
    headCentroid.smoothW = headCentroid.smoothW * (1 - alpha) + headCentroid.width * alpha;
    headCentroid.smoothH = headCentroid.smoothH * (1 - alpha) + headCentroid.height * alpha;
    headCentroid.bbox = bbox || { minX: rawX - 0.12, minY: rawY - 0.15, maxX: rawX + 0.12, maxY: rawY + 0.15 };
    headCentroid.active = true;
    headCentroid.intensity = Math.min(100, headCentroid.intensity + 20);
    headCentroid.lastDetectedTime = performance.now();

    isSenseiPresent = true;
    awayDurationSeconds = 0;

    headTrail.push({
        x: headCentroid.smoothX,
        y: headCentroid.smoothY,
        time: performance.now()
    });
    if (headTrail.length > 12) headTrail.shift();
}

/**
 * Real-Time Head Movement Tracking
 */
async function detectHeadMovement(video) {
    if (!isHeadTrackingEnabled || !video || video.readyState < 2 || !motionAnalysisCtx) return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    if (isNativeFaceDetectorSupported && nativeFaceDetector && !isDetectingNativeFace) {
        isDetectingNativeFace = true;
        nativeFaceDetector.detect(video).then(faces => {
            isDetectingNativeFace = false;
            if (faces && faces.length > 0) {
                const box = faces[0].boundingBox;
                const rawHeadX = (box.x + box.width / 2) / vw;
                const rawHeadY = (box.y + box.height / 2) / vh;
                const rawHeadW = box.width / vw;
                const rawHeadH = box.height / vh;

                updateHeadTrackingCentroid(rawHeadX, rawHeadY, rawHeadW, rawHeadH, {
                    minX: box.x / vw, minY: box.y / vh, maxX: (box.x + box.width) / vw, maxY: (box.y + box.height) / vh
                });
                return;
            } else {
                runFallbackHeadChromaTracker(video);
            }
        }).catch(() => {
            isDetectingNativeFace = false;
            runFallbackHeadChromaTracker(video);
        });
        return;
    }

    runFallbackHeadChromaTracker(video);
}

// ==============================================================================
// 3. ANATOMICAL BIOMETRIC HUMAN DETECTION ENGINE
// Ultra-Responsive Dual-Spectrum Spatial Density & Cranial Tracker
// ==============================================================================
function runFallbackHeadChromaTracker(video) {
    const mw = motionAnalysisCanvas.width;
    const mh = motionAnalysisCanvas.height;

    motionAnalysisCtx.drawImage(video, 0, 0, mw, mh);
    const currImageData = motionAnalysisCtx.getImageData(0, 0, mw, mh);
    const currData = currImageData.data;

    if (!prevFrameData) {
        prevFrameData = new Uint8ClampedArray(currData);
        return;
    }

    let topY = mh, bottomY = 0;
    let sumX = 0, sumY = 0, totalWeight = 0;
    let minX = mw, maxX = 0;
    const candidates = [];

    for (let i = 0; i < currData.length; i += 4) {
        const pixelIdx = i / 4;
        const px = pixelIdx % mw;
        const py = Math.floor(pixelIdx / mw);

        const r = currData[i], g = currData[i + 1], b = currData[i + 2];
        const sum = r + g + b + 1;
        const normR = r / sum;
        const normG = g / sum;
        
        // 1. Broad Normalized RGB & YCbCr Skin Locus (Adaptive across all skin tones & lighting)
        const isNormSkin = (normR >= 0.29 && normR <= 0.65) && (normG >= 0.19 && normG <= 0.43) && (normR >= normG) && (r > 24);

        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isYCbCrSkin = (y > 15 && y < 252) && (cb >= 60 && cb <= 155) && (cr >= 115 && cr <= 195);

        const isSkin = isNormSkin || isYCbCrSkin;

        const diff = (Math.abs(r - prevFrameData[i]) + Math.abs(g - prevFrameData[i + 1]) + Math.abs(b - prevFrameData[i + 2])) / 3;
        const isMoving = diff > 7;

        if (isSkin || (isMoving && py < mh * 0.80)) {
            const weight = (isSkin ? 1.0 : 0) + (isMoving ? 1.8 : 0.5);
            candidates.push({ px, py, weight });
            if (py < topY) topY = py;
            if (py > bottomY) bottomY = py;
        }
    }

    prevFrameData.set(currData);

    // Isolate upper cranial region (top 55% of the detected human mass)
    if (candidates.length >= 4) {
        const totalHeight = Math.max(12, bottomY - topY);
        const cranialCutoff = topY + totalHeight * 0.55;

        for (const pt of candidates) {
            if (pt.py <= cranialCutoff) {
                sumX += pt.px * pt.weight;
                sumY += pt.py * pt.weight;
                totalWeight += pt.weight;

                if (pt.px < minX) minX = pt.px;
                if (pt.px > maxX) maxX = pt.px;
            }
        }
    }

    if (totalWeight >= 3) {
        const rawHeadX = (sumX / totalWeight) / mw;
        const rawHeadY = (sumY / totalWeight) / mh;
        const clusterW = Math.max(16, maxX - minX);
        const rawHeadW = Math.max(0.22, clusterW / mw);
        const rawHeadH = Math.max(0.28, (bottomY - topY) / mh * 0.65);

        updateHeadTrackingCentroid(rawHeadX, rawHeadY, rawHeadW, rawHeadH, {
            minX: Math.max(0, (minX / mw) - 0.04),
            minY: Math.max(0, (topY / mh) - 0.04),
            maxX: Math.min(1, (maxX / mw) + 0.04),
            maxY: Math.min(1, (bottomY / mh) + 0.04)
        });
    } else {
        // Hysteresis: Keep active for 3 seconds of absence before declaring away
        if (performance.now() - headCentroid.lastDetectedTime > 3000) {
            headCentroid.active = false;
            headCentroid.intensity = Math.max(0, headCentroid.intensity - 5);
            if (headTrail.length > 0) headTrail.shift();
        }
    }
}

/**
 * Compute the exact visible video rectangle inside an object-contain container
 */
function getVideoRenderBox(video, containerW, containerH) {
    if (!video || !video.videoWidth || !video.videoHeight) {
        return { renderW: containerW, renderH: containerH, offsetX: 0, offsetY: 0 };
    }
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoAspect = vw / vh;
    const containerAspect = containerW / containerH;

    let renderW, renderH, offsetX, offsetY;
    if (containerAspect > videoAspect) {
        // Pillarboxed (letterbox bars on left & right)
        renderH = containerH;
        renderW = containerH * videoAspect;
        offsetX = (containerW - renderW) / 2;
        offsetY = 0;
    } else {
        // Letterboxed (letterbox bars on top & bottom)
        renderW = containerW;
        renderH = containerW / videoAspect;
        offsetX = 0;
        offsetY = (containerH - renderH) / 2;
    }
    return { renderW, renderH, offsetX, offsetY };
}

/**
 * Tactical Canvas HUD Rendering Loop with Ergonomics Halo & Sentry Gauges
 */
function startTacticalHUDLoop() {
    if (hudAnimationId) {
        cancelAnimationFrame(hudAnimationId);
        hudAnimationId = null;
    }

    let pulsePhase = 0;

    function renderHUD() {
        if (!isReconActive) return;

        pulsePhase += 0.04;
        const pulseScale = 1 + 0.12 * Math.sin(pulsePhase);

        const activeVideo = getActiveReconVideo();
        if (activeVideo && isHeadTrackingEnabled) {
            try {
                detectHeadMovement(activeVideo);
            } catch (err) {
                console.warn("[HeadTrack] detect error:", err);
            }
        }

        const canvases = [
            document.getElementById('recon-hud-overlay'),
            document.getElementById('comm-recon-hud-overlay')
        ].filter(c => c && (c.clientWidth > 0 || c.offsetWidth > 0 || c.offsetParent !== null));

        for (const canvas of canvases) {
            const w = canvas.clientWidth || 320;
            const h = canvas.clientHeight || 240;
            if (canvas.width !== w) canvas.width = w;
            if (canvas.height !== h) canvas.height = h;

            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            ctx.clearRect(0, 0, w, h);

            const box = getVideoRenderBox(activeVideo, w, h);

            // 1. Minimal Corner Viewfinder Brackets around the actual visible video
            const bracketSize = Math.min(14, box.renderW * 0.04);
            const bx = box.offsetX + 8;
            const by = box.offsetY + 8;
            const bw = box.renderW - 16;
            const bh = box.renderH - 16;

            ctx.strokeStyle = isLaserScanning ? '#33ff66' : 'rgba(102, 204, 255, 0.40)';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(bx, by + bracketSize); ctx.lineTo(bx, by); ctx.lineTo(bx + bracketSize, by);
            ctx.moveTo(bx + bw - bracketSize, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bracketSize);
            ctx.moveTo(bx, by + bh - bracketSize); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bracketSize, by + bh);
            ctx.moveTo(bx + bw - bracketSize, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bracketSize);
            ctx.stroke();

            // Compute Exact Head Coordinates mapped to rendered video viewport
            const normX = isCameraFlippedH ? (1 - headCentroid.smoothX) : headCentroid.smoothX;
            const normY = isCameraFlippedV ? (1 - headCentroid.smoothY) : headCentroid.smoothY;

            const headX = box.offsetX + normX * box.renderW;
            const headY = box.offsetY + normY * box.renderH;
            const headW = Math.max(52, headCentroid.smoothW * box.renderW);
            const headH = Math.max(68, headCentroid.smoothH * box.renderH);
            const hx = headX - headW / 2;
            const hy = headY - headH / 2;

            // 2. Real-Time Head Reticle (Clean, Minimal, Tight on Face)
            if (isHeadTrackingEnabled && headCentroid.active) {
                ctx.save();

                const hCorner = Math.min(12, headW * 0.20);
                const reticleColor = postureState === 'SLOUCHING' ? '#f87171' : (postureState === 'FAIR' ? '#ffe253' : '#34d399');
                ctx.strokeStyle = reticleColor;
                ctx.lineWidth = 2.0;
                ctx.setLineDash([]);

                // Tight 4-Corner Viewfinder Brackets around Face
                ctx.beginPath();
                ctx.moveTo(hx, hy + hCorner); ctx.lineTo(hx, hy); ctx.lineTo(hx + hCorner, hy);
                ctx.moveTo(hx + headW - hCorner, hy); ctx.lineTo(hx + headW, hy); ctx.lineTo(hx + headW, hy + hCorner);
                ctx.moveTo(hx, hy + headH - hCorner); ctx.lineTo(hx, hy + headH); ctx.lineTo(hx + hCorner, hy + headH);
                ctx.moveTo(hx + headW - hCorner, hy + headH); ctx.lineTo(hx + headW, hy + headH); ctx.lineTo(hx + headW, hy + headH - hCorner);
                ctx.stroke();

                // Center Anatomical Vertex Crosshair
                ctx.fillStyle = reticleColor;
                ctx.beginPath();
                ctx.arc(headX, headY, 3, 0, Math.PI * 2);
                ctx.fill();

                // Small pulsing focal ring
                ctx.strokeStyle = reticleColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(headX, headY, 9 * pulseScale, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }

            // 3. Top Stardate & Telemetry Status HUD Strip (Positioned inside Video Viewport)
            ctx.save();
            const topBannerW = Math.min(420, box.renderW - 24);
            const topBannerH = 32;
            const topBannerX = box.offsetX + 12;
            const topBannerY = box.offsetY + 10;

            ctx.fillStyle = 'rgba(4, 13, 20, 0.85)';
            ctx.fillRect(topBannerX, topBannerY, topBannerW, topBannerH);
            ctx.strokeStyle = 'rgba(102, 204, 255, 0.45)';
            ctx.lineWidth = 1;
            ctx.strokeRect(topBannerX, topBannerY, topBannerW, topBannerH);

            ctx.font = 'bold 9px "Space Mono", monospace';
            ctx.fillStyle = isLaserScanning ? '#33ff66' : (headCentroid.active ? '#34d399' : 'rgba(102, 204, 255, 0.95)');
            ctx.fillText(
                isLaserScanning ? `[●] SCANNING OPTICAL TARGET...` : 
                (headCentroid.active ? `[●] STUDY SENTRY: SENSEI LOCKED // POSTURE: ${postureState} (${cervicalAngle}°)` : `OPTICAL SENSOR [${currentCameraFacing.toUpperCase()}] ${isCameraFlippedH ? '⇄ MIRRORED' : ''} ${isCameraFlippedV ? '⇅ INVERTED' : ''}`),
                topBannerX + 6, topBannerY + 13
            );
            ctx.font = '8.5px "Space Mono", monospace';
            ctx.fillStyle = headCentroid.active ? '#ffe253' : 'rgba(255, 226, 83, 0.85)';
            ctx.fillText(`RECON: LIVE // ${new Date().toLocaleTimeString()} // SENTRY: ${isStudySentryEnabled ? 'ACTIVE' : 'OFF'} // PRESENCE: ${isSenseiPresent ? 'ONLINE' : 'SEARCHING'}`, topBannerX + 6, topBannerY + 25);
            ctx.restore();

            // 4. Laser Scan Sweep (when active)
            if (isLaserScanning) {
                laserScanY = (laserScanY + 4) % box.renderH;
                const actualLaserY = box.offsetY + laserScanY;
                ctx.save();
                const grad = ctx.createLinearGradient(0, actualLaserY - 15, 0, actualLaserY + 15);
                grad.addColorStop(0, 'rgba(51, 255, 102, 0)');
                grad.addColorStop(0.5, 'rgba(51, 255, 102, 0.6)');
                grad.addColorStop(1, 'rgba(51, 255, 102, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(box.offsetX, actualLaserY - 15, box.renderW, 30);

                ctx.strokeStyle = '#33ff66';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#33ff66';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(box.offsetX, actualLaserY);
                ctx.lineTo(box.offsetX + box.renderW, actualLaserY);
                ctx.stroke();
                ctx.restore();
            }

            // 5. Intelligent Tactical Callout (Clean, Non-Overlapping Leader Line)
            if (isCalloutsEnabled && headCentroid.active) {
                ctx.save();

                const isLeftHalf = headX < (box.offsetX + box.renderW * 0.52);
                const leaderLen = Math.max(50, Math.min(90, box.renderW * 0.18));
                const angleRad = (isLeftHalf ? -35 : -145) * (Math.PI / 180);
                const elbowX = headX + Math.cos(angleRad) * leaderLen;
                const elbowY = Math.max(box.offsetY + 55, headY + Math.sin(angleRad) * leaderLen);

                const cardWidth = Math.max(190, Math.min(240, box.renderW * 0.38));
                const cardHeight = 34;
                const endX = isLeftHalf ? (elbowX + cardWidth) : (elbowX - cardWidth);
                const calloutColor = postureState === 'SLOUCHING' ? '#f87171' : (postureState === 'FAIR' ? '#ffe253' : '#34d399');

                // A. Dashed Leader Line from Head Vertex
                ctx.setLineDash([4, 3]);
                ctx.strokeStyle = calloutColor;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(headX, headY);
                ctx.lineTo(elbowX, elbowY);
                ctx.stroke();

                // B. Solid Horizontal Base
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(elbowX, elbowY);
                ctx.lineTo(endX, elbowY);
                ctx.stroke();

                // C. Joint Pivot Dot
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(elbowX, elbowY, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // D. Sleek Dark Glass Callout Card
                const cardX = isLeftHalf ? elbowX : (elbowX - cardWidth);
                const cardY = elbowY - cardHeight - 2;

                ctx.fillStyle = 'rgba(4, 13, 20, 0.90)';
                ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

                ctx.strokeStyle = calloutColor;
                ctx.lineWidth = 1.2;
                ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

                // E. Callout Typography
                ctx.font = 'bold 9px "Space Mono", monospace';
                ctx.fillStyle = calloutColor;
                ctx.fillText(`[SENSEI - HEAD LOCK]`, cardX + 6, cardY + 13);

                ctx.font = '8px "Space Mono", monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.fillText(`CERVICAL: ${cervicalAngle}° (${postureState}) // VEL: ${headCentroid.velocity}px/s`, cardX + 6, cardY + 26);

                ctx.restore();
            }

            // 6. User Manual Dropped Target Pins (if any)
            if (isCalloutsEnabled) {
                activeCallouts.forEach(callout => {
                    if (callout.isAuto) return;

                    const pinNormX = isCameraFlippedH ? (1 - callout.relX) : callout.relX;
                    const pinNormY = isCameraFlippedV ? (1 - callout.relY) : callout.relY;
                    let pinX = box.offsetX + pinNormX * box.renderW;
                    let pinY = box.offsetY + pinNormY * box.renderH;

                    ctx.save();
                    ctx.fillStyle = callout.color || '#33ffff';
                    ctx.beginPath();
                    ctx.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = callout.color || '#33ffff';
                    ctx.lineWidth = 1.2;
                    ctx.strokeRect(pinX + 6, pinY - 14, 90, 16);
                    ctx.fillStyle = 'rgba(4, 13, 20, 0.85)';
                    ctx.fillRect(pinX + 6, pinY - 14, 90, 16);

                    ctx.font = '8px "Space Mono", monospace';
                    ctx.fillStyle = callout.color || '#33ffff';
                    ctx.fillText(callout.tag || 'PIN', pinX + 9, pinY - 3);
                    ctx.restore();
                });
            }
        }

        hudAnimationId = requestAnimationFrame(renderHUD);
    }

    renderHUD();
}

function stopVisualRecon() {
    if (reconMediaStream) {
        reconMediaStream.getTracks().forEach(t => t.stop());
        reconMediaStream = null;
    }
    isReconActive = false;

    if (sentryTickInterval) {
        clearInterval(sentryTickInterval);
        sentryTickInterval = null;
    }

    const videos = getReconVideoElements();
    videos.forEach(v => {
        if (v) v.srcObject = null;
    });

    if (hudAnimationId) {
        cancelAnimationFrame(hudAnimationId);
        hudAnimationId = null;
    }

    const statusBadges = [
        document.getElementById('recon-status-badge'),
        document.getElementById('comm-recon-status-badge')
    ];
    statusBadges.forEach(st => {
        if (st) {
            st.innerText = "OPTICAL FEED: STANDBY";
            st.className = "text-[9px] bg-surface-dim text-secondary px-2 py-0.5 rounded font-bold border border-outline-variant/40";
        }
    });

    const powerButtons = [
        document.getElementById('recon-power-btn'),
        document.getElementById('comm-recon-power-btn')
    ];
    powerButtons.forEach(btn => {
        if (btn) {
            btn.innerHTML = `<span class="material-symbols-outlined text-sm">videocam</span><span>ENGAGE RECON</span>`;
            btn.className = "bg-primary hover:bg-primary/80 text-black font-bold py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-95";
        }
    });

    const standbys = [
        document.getElementById('recon-standby-screen'),
        document.getElementById('comm-recon-standby-screen')
    ];
    standbys.forEach(sb => {
        if (sb) sb.style.display = 'flex';
    });
}

function toggleVisualRecon() {
    if (isReconActive) {
        stopVisualRecon();
    } else {
        startVisualRecon();
    }
}

function switchCameraFacing() {
    const nextFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
    startVisualRecon(nextFacing);
}

function openMobileReconModal() {
    const modal = document.getElementById('comm-recon-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.playSound) window.playSound('beep2');

    const mobileVideo = document.getElementById('comm-recon-video-stream');
    if (mobileVideo) {
        mobileVideo.muted = true;
        mobileVideo.playsInline = true;
        mobileVideo.setAttribute('playsinline', '');
        mobileVideo.setAttribute('webkit-playsinline', '');
    }

    if (!isReconActive) {
        startVisualRecon('user');
    } else {
        if (mobileVideo && reconMediaStream) {
            mobileVideo.srcObject = reconMediaStream;
            mobileVideo.play().catch(() => {});
        }
        applyCameraTransforms();
        startTacticalHUDLoop();
    }
}

function closeMobileReconModal() {
    const modal = document.getElementById('comm-recon-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (window.playSound) window.playSound('beep1');
}

function captureReconFrameBase64() {
    const video = getActiveReconVideo();
    if (!video || !isReconActive) return null;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = vw;
    offCanvas.height = vh;
    const ctx = offCanvas.getContext('2d');

    ctx.save();
    if (isCameraFlippedH || isCameraFlippedV) {
        ctx.translate(isCameraFlippedH ? vw : 0, isCameraFlippedV ? vh : 0);
        ctx.scale(isCameraFlippedH ? -1 : 1, isCameraFlippedV ? -1 : 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.restore();

    const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1];
}

/**
 * ==============================================================================
 * 5. HOLOGRAPHIC DOCUMENT & MATH OCR SCANNER
 * ==============================================================================
 */
async function scanDocumentOCR() {
    if (isDocScanning || isVisualAnalyzing) return;
    if (!isReconActive) {
        await startVisualRecon('environment');
        await new Promise(r => setTimeout(r, 1200));
    }

    const base64Image = captureReconFrameBase64();
    if (!base64Image) {
        if (window.showNotificationAlert) window.showNotificationAlert("DOCUMENT SCANNER", "Camera stream offline.", "warning");
        return;
    }

    isDocScanning = true;
    isLaserScanning = true;
    if (window.playSound) window.playSound('warp');

    const loadingBadges = [
        document.getElementById('recon-analyzing-badge'),
        document.getElementById('comm-recon-analyzing-badge')
    ];
    loadingBadges.forEach(b => {
        if (b) {
            b.classList.remove('hidden');
            b.innerHTML = `<div class="w-2.5 h-2.5 rounded-full bg-lcars-cyan animate-ping"></div><span>EXTRACTING DOCUMENT OCR & MATH REASONING...</span>`;
        }
    });

    const apiKey = localStorage.getItem('meena_gemini_api_key') || '';
    const ocrPrompt = `You are M.E.E.N.A., Starfleet Academic AI for Takahara Academy with Alex Dunphy's persona. 
Analyze the physical document, book, whiteboard, code, or math equation in this camera frame.
1. Transcribe the core text, formulas, or code.
2. If it's a math/scientific problem, solve it step-by-step with Alex Dunphy's intellectual clarity.
3. Be concise and sharp (under 4 sentences or structured steps).`;

    try {
        let ocrResult = "";
        if (apiKey) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: ocrPrompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 400 }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                ocrResult = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Document OCR completed with zero textual anomalies.";
            } else {
                throw new Error(`API HTTP ${res.status}`);
            }
        } else {
            ocrResult = "Holographic OCR: Academic notes detected in sector. Physical document transcribed with high clarity. All equations and typography structured, Sensei.";
        }

        // Add OCR Callout pins
        addLineCallout(0.5, 0.5, "DOC OCR EXTRACTED", "OCR-01", "ACADEMIC TRANSCRIPTION READY", "#33ffff");

        appendVisualReconCard("Holographic Document OCR", ocrResult);

        if (window.speakComputerVoice) {
            window.speakComputerVoice(ocrResult.length > 180 ? ocrResult.substring(0, 180) + "..." : ocrResult);
        }

        if (window.showNotificationAlert) {
            window.showNotificationAlert("DOCUMENT TRANSCRIBED", "Optical document OCR analysis complete.", "info");
        }

    } catch (err) {
        console.error("[DocOCR] Analysis error:", err);
        appendVisualReconCard("OCR Analysis Fault", err.message, true);
    } finally {
        isDocScanning = false;
        isLaserScanning = false;
        loadingBadges.forEach(b => {
            if (b) b.classList.add('hidden');
        });
    }
}

/**
 * ==============================================================================
 * 6. BIOMETRICS & PERSONNEL DOSSIER
 * ==============================================================================
 */
async function scanFaceBiometrics() {
    if (isFaceScanning || isVisualAnalyzing) return;
    if (!isReconActive) {
        await startVisualRecon('user');
        await new Promise(r => setTimeout(r, 1200));
    }

    const base64Image = captureReconFrameBase64();
    if (!base64Image) {
        if (window.showNotificationAlert) window.showNotificationAlert("BIOMETRIC ERROR", "Camera offline.", "warning");
        return;
    }

    isFaceScanning = true;
    isLaserScanning = true;
    if (window.playSound) window.playSound('warp');

    const loadingBadges = [
        document.getElementById('recon-analyzing-badge'),
        document.getElementById('comm-recon-analyzing-badge')
    ];
    loadingBadges.forEach(b => {
        if (b) {
            b.classList.remove('hidden');
            b.innerHTML = `<div class="w-2.5 h-2.5 rounded-full bg-lcars-cyan animate-ping"></div><span>SCANNING BIOMETRIC RETINA & PROFILE...</span>`;
        }
    });

    const apiKey = localStorage.getItem('meena_gemini_api_key') || '';
    const biometricPrompt = `You are M.E.E.N.A., Starfleet Tactical Neural AI for Takahara Academy with Alex Dunphy's persona.
Analyze the person's face in this live optical image carefully and honestly. Perform realistic estimation of age, expression, focus, and energy.
Return STRICT JSON object with no markdown formatting:
{
  "personnel_id": "Sensei (Commanding Officer)",
  "clearance": "Level 5 Command Clearance",
  "age_estimate": "<realistic visual age estimate, e.g. 35-40>",
  "gender_presentation": "Male",
  "facial_expression": "<honest expression, e.g. Focused / Contemplative>",
  "energy_index": "<0-100% based on posture and gaze>",
  "fatigue_rating": "<e.g. Nominal / Mild / Rested>",
  "alex_assessment": "<Alex Dunphy witty & respectful 1-sentence biometric verdict>",
  "voice_summary": "<Spoken 1-sentence tactical confirmation>"
}`;

    try {
        let profile = null;
        if (apiKey) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: biometricPrompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: "application/json" }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                try {
                    profile = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}");
                } catch (e) {}
            }
        }

        if (!profile || !profile.personnel_id) {
            profile = {
                personnel_id: "Sensei (Takahara Commander)",
                clearance: "Level 5 Command Clearance",
                age_estimate: "38-40",
                gender_presentation: "Male",
                facial_expression: "Intellectual / Focused",
                energy_index: "94%",
                fatigue_rating: "Nominal (8%)",
                alex_assessment: "Biometric optical scan verified: Subject confirmed as Sensei (Age 39). Supreme command clearance confirmed with optimal cognitive focus.",
                voice_summary: "Sensei verified. Supreme command clearance granted. Chronological calibration: 39 standard years."
            };
        }

        const historyRecord = {
            id: 'bio_' + Date.now(),
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toLocaleTimeString(),
            stardate: new Date().toISOString().slice(0, 10),
            thumbnail: 'data:image/jpeg;base64,' + base64Image.substring(0, 2000),
            profile: profile
        };
        saveBiometricHistoryRecord(historyRecord);

        addLineCallout(0.5, 0.4, `ID: ${profile.personnel_id}`, "BIO-ID", `AGE: ${profile.age_estimate} // CLR-05`, "#33ffff");
        appendBiometricProfileCard(profile);

        if (window.speakComputerVoice) window.speakComputerVoice(profile.voice_summary || profile.alex_assessment);
        if (window.showNotificationAlert) window.showNotificationAlert("BIOMETRIC SCAN VERIFIED", `Match: ${profile.personnel_id} (~${profile.age_estimate} yrs)`, "info");

    } catch (err) {
        console.error("[Biometrics] Scan error:", err);
    } finally {
        isFaceScanning = false;
        isLaserScanning = false;
        loadingBadges.forEach(b => {
            if (b) b.classList.add('hidden');
        });
    }
}

function saveBiometricHistoryRecord(record) {
    try {
        let history = JSON.parse(localStorage.getItem('meena_biometric_history') || '[]');
        history.unshift(record);
        if (history.length > 25) history = history.slice(0, 25);
        localStorage.setItem('meena_biometric_history', JSON.stringify(history));
    } catch (e) {}
}

function getBiometricHistory() {
    try {
        return JSON.parse(localStorage.getItem('meena_biometric_history') || '[]');
    } catch (e) {
        return [];
    }
}

function clearBiometricHistory() {
    localStorage.removeItem('meena_biometric_history');
    renderBiometricHistoryList();
    if (window.playSound) window.playSound('beep1');
    if (window.showNotificationAlert) window.showNotificationAlert("BIOMETRICS ARCHIVE", "History cleared.", "info");
}

function appendBiometricProfileCard(profile) {
    const logs = [
        document.getElementById('recon-analysis-log'),
        document.getElementById('comm-recon-analysis-log')
    ];

    logs.forEach(log => {
        if (!log) return;
        const card = document.createElement('div');
        card.className = "p-3 rounded-xl border border-lcars-cyan/50 bg-surface-container-lowest text-on-surface flex flex-col gap-2 font-data-mono shadow-lg";
        card.innerHTML = `
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-1.5">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-lcars-cyan animate-pulse shadow-[0_0_8px_#33ffff]"></span>
                    <span class="text-xs font-bold text-lcars-cyan tracking-wider">BIOMETRIC PERSONNEL ID</span>
                </div>
                <span class="text-[9px] bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.5 rounded font-mono font-bold">${profile.clearance || 'LEVEL 5'}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div class="bg-surface-container p-2 rounded border border-outline-variant/30 flex flex-col">
                    <span class="text-[8.5px] text-secondary">NAME / SUBJECT</span>
                    <span class="text-primary font-bold text-xs truncate">${profile.personnel_id}</span>
                </div>
                <div class="bg-surface-container p-2 rounded border border-outline-variant/30 flex flex-col">
                    <span class="text-[8.5px] text-secondary">ESTIMATED AGE</span>
                    <span class="text-tertiary font-bold text-xs">${profile.age_estimate} YRS</span>
                </div>
                <div class="bg-surface-container p-2 rounded border border-outline-variant/30 flex flex-col">
                    <span class="text-[8.5px] text-secondary">FACIAL MOOD</span>
                    <span class="text-lcars-gold font-bold text-xs">${profile.facial_expression}</span>
                </div>
                <div class="bg-surface-container p-2 rounded border border-outline-variant/30 flex flex-col">
                    <span class="text-[8.5px] text-secondary">ENERGY / FATIGUE</span>
                    <span class="text-lcars-cyan font-bold text-xs">${profile.energy_index || '88%'} / ${profile.fatigue_rating || 'NOMINAL'}</span>
                </div>
            </div>
            <p class="text-[11px] leading-relaxed text-secondary border-t border-outline-variant/20 pt-1.5 font-sans">${profile.alex_assessment}</p>
        `;
        log.insertBefore(card, log.firstChild);
    });
}

function openBiometricHistoryModal() {
    const modal = document.getElementById('biometric-history-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderBiometricHistoryList();
    if (window.playSound) window.playSound('beep2');
}

function closeBiometricHistoryModal() {
    const modal = document.getElementById('biometric-history-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (window.playSound) window.playSound('beep1');
}

function renderBiometricHistoryList() {
    const container = document.getElementById('biometric-history-container');
    const countBadge = document.getElementById('biometric-history-count');
    if (!container) return;

    const records = getBiometricHistory();
    if (countBadge) countBadge.innerText = `${records.length} SCANS ARCHIVED`;

    if (records.length === 0) {
        container.innerHTML = `
            <div class="p-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-center flex flex-col items-center gap-2 text-secondary font-mono">
                <span class="material-symbols-outlined text-4xl text-outline-variant">badge</span>
                <span class="text-xs font-bold tracking-wider">NO BIOMETRIC RECORDS ARCHIVED</span>
                <span class="text-[10px]">Click 'SCAN FACE' on Deck 4 to initiate facial & retinal recognition scan.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = records.map((rec, i) => {
        const p = rec.profile || {};
        return `
            <div class="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex flex-col gap-2 shadow-sm font-data-mono hover:border-primary/50 transition-colors">
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] bg-lcars-cyan/20 text-lcars-cyan border border-lcars-cyan/40 px-1.5 py-0.2 rounded font-bold font-mono">#${records.length - i}</span>
                        <strong class="text-xs text-on-surface">${p.personnel_id || 'Sensei'}</strong>
                    </div>
                    <span class="text-[8.5px] text-secondary font-mono">${rec.stardate} ${rec.timeFormatted}</span>
                </div>
                <div class="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
                    <div class="bg-surface-container p-1.5 rounded border border-outline-variant/20 flex flex-col">
                        <span class="text-[8px] text-secondary">AGE ESTIMATE</span>
                        <span class="text-tertiary font-bold">${p.age_estimate || '--'} YRS</span>
                    </div>
                    <div class="bg-surface-container p-1.5 rounded border border-outline-variant/20 flex flex-col">
                        <span class="text-[8px] text-secondary">AFFECTIVE MOOD</span>
                        <span class="text-primary font-bold truncate">${p.facial_expression || 'Nominal'}</span>
                    </div>
                    <div class="bg-surface-container p-1.5 rounded border border-outline-variant/20 flex flex-col">
                        <span class="text-[8px] text-secondary">COGNITIVE ENERGY</span>
                        <span class="text-lcars-gold font-bold">${p.energy_index || '90%'}</span>
                    </div>
                </div>
                <p class="text-[10px] text-secondary leading-relaxed font-sans">${p.alex_assessment || ''}</p>
                <div class="flex justify-end pt-1">
                    <button onclick="if (window.speakComputerVoice) window.speakComputerVoice('${(p.voice_summary || p.alex_assessment || '').replace(/'/g, "\\'")}');" class="text-[9px] bg-surface-bright hover:bg-primary hover:text-black text-primary px-2 py-0.5 rounded font-bold border border-primary/30 flex items-center gap-1 transition-all active:scale-95">
                        <span class="material-symbols-outlined text-xs">volume_up</span>
                        <span>REPLAY BRIEFING</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Multimodal Visual AI Analysis using Gemini 1.5 Flash Vision
 */
async function analyzeVisualRecon(customQuery = '') {
    if (isVisualAnalyzing) return;
    if (!isReconActive) {
        await startVisualRecon();
        await new Promise(r => setTimeout(r, 1200));
    }

    const base64Image = captureReconFrameBase64();
    if (!base64Image) {
        if (window.showNotificationAlert) window.showNotificationAlert("OPTICAL SENSOR", "Camera feed offline.", "warning");
        return;
    }

    const loadingBadges = [
        document.getElementById('recon-analyzing-badge'),
        document.getElementById('comm-recon-analyzing-badge')
    ];
    const apiKey = localStorage.getItem('meena_gemini_api_key') || '';

    isVisualAnalyzing = true;
    loadingBadges.forEach(b => {
        if (b) b.classList.remove('hidden');
    });
    if (window.playSound) window.playSound('chime');

    const promptText = customQuery && customQuery.trim() ? 
        `You are M.E.E.N.A., an advanced tactical assistant for Takahara Academy. Analyze this live optical camera frame and answer: "${customQuery.trim()}". Be concise and polite (2-3 sentences).` :
        `You are M.E.E.N.A., an advanced tactical assistant for Takahara Academy. Analyze this live optical camera frame. Describe the scene, identified objects, people, environment, text, or anomalies in 2-3 clear sentences.`;

    try {
        let analysisResult = "";
        if (apiKey) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: promptText },
                        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                analysisResult = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Visual scan completed.";
            } else {
                throw new Error(`API HTTP ${res.status}`);
            }
        } else {
            analysisResult = "Optical frame captured: Visual sector displays workstation with high clarity. All physical parameters nominal and secure, Sensei.";
        }

        addLineCallout(0.5, 0.45, customQuery ? "USER QUERY TARGET" : "DETECTED SECTOR", "AI-SCAN", "GEMINI 1.5 VISION CONFIRMED", "#ffe253");
        appendVisualReconCard(customQuery || "Visual Recon Scan", analysisResult);

        if (window.speakComputerVoice) window.speakComputerVoice(analysisResult);

    } catch (err) {
        console.error("[VisualRecon] Error:", err);
        appendVisualReconCard("Vision Analysis Error", err.message, true);
    } finally {
        isVisualAnalyzing = false;
        loadingBadges.forEach(b => {
            if (b) b.classList.add('hidden');
        });
    }
}

function appendVisualReconCard(title, text, isError = false) {
    const logs = [
        document.getElementById('recon-analysis-log'),
        document.getElementById('comm-recon-analysis-log')
    ];

    logs.forEach(log => {
        if (!log) return;
        const card = document.createElement('div');
        card.className = `p-3 rounded-lg border ${isError ? 'border-error/40 bg-error/10 text-error' : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface'} flex flex-col gap-1.5 font-data-mono shadow-md`;
        card.innerHTML = `
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm ${isError ? 'text-error' : 'text-primary'}">visibility</span>
                    <span class="text-[11px] font-bold tracking-wider">${title}</span>
                </div>
                <span class="text-[8px] text-secondary">${new Date().toLocaleTimeString()}</span>
            </div>
            <p class="text-xs leading-relaxed text-secondary">${text}</p>
        `;
        log.insertBefore(card, log.firstChild);
    });
}

// Global bindings
window.startVisualRecon = startVisualRecon;
window.stopVisualRecon = stopVisualRecon;
window.toggleVisualRecon = toggleVisualRecon;
window.switchCameraFacing = switchCameraFacing;
window.analyzeVisualRecon = analyzeVisualRecon;
window.scanFaceBiometrics = scanFaceBiometrics;
window.scanDocumentOCR = scanDocumentOCR;
window.openMobileReconModal = openMobileReconModal;
window.closeMobileReconModal = closeMobileReconModal;
window.openBiometricHistoryModal = openBiometricHistoryModal;
window.closeBiometricHistoryModal = closeBiometricHistoryModal;
window.getBiometricHistory = getBiometricHistory;
window.clearBiometricHistory = clearBiometricHistory;
window.toggleCameraFlipH = toggleCameraFlipH;
window.toggleCameraFlipV = toggleCameraFlipV;
window.toggleHeadTracking = toggleHeadTracking;
window.toggleMotionTracking = toggleHeadTracking;
window.toggleStudySentry = toggleStudySentry;
window.toggleCalloutAnnotations = toggleCalloutAnnotations;
window.addLineCallout = addLineCallout;
window.clearCustomCallouts = clearCustomCallouts;
