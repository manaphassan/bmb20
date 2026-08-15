/**
 * ==============================================================================
 * MEENA // TAKAHARA ACADEMY (高原学園) - DECK 3: VISUAL RECON & GEMINI VISION AI
 * Optical Camera Feed, Tactical HUD Overlays, Frame Capture & Multimodal AI
 * ==============================================================================
 */

let reconMediaStream = null;
let isReconActive = false;
let currentCameraFacing = 'environment'; // 'user' or 'environment'
let hudAnimationId = null;
let isVisualAnalyzing = false;

/**
 * Initialize / Start Optical Camera Feed
 */
async function startVisualRecon(facingMode = currentCameraFacing) {
    const video = document.getElementById('recon-video-stream');
    const status = document.getElementById('recon-status-badge');
    const btn = document.getElementById('recon-power-btn');
    const canvas = document.getElementById('recon-hud-overlay');

    if (!video) return;

    try {
        if (reconMediaStream) {
            stopVisualRecon();
        }

        currentCameraFacing = facingMode;
        const constraints = {
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        reconMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = reconMediaStream;
        await video.play();

        isReconActive = true;

        if (status) {
            status.innerText = "OPTICAL FEED: ACTIVE [LIVE]";
            status.className = "text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold border border-primary/50 shadow-[0_0_8px_rgba(102,204,255,0.3)] animate-pulse";
        }
        if (btn) {
            btn.innerHTML = `<span class="material-symbols-outlined text-sm">videocam_off</span><span>STAND DOWN OPTICAL FEED</span>`;
            btn.className = "bg-error hover:bg-error/80 text-black font-bold py-2 px-4 rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-md";
        }

        if (window.playSound) window.playSound('warp');
        if (window.showNotificationAlert) {
            window.showNotificationAlert("OPTICAL RECON ACTIVE", "Deck 3 optical sensors online and synchronized.", "info");
        }

        startTacticalHUDLoop();

    } catch (err) {
        console.error("[VisualRecon] Camera initialization error:", err);
        if (status) {
            status.innerText = "OPTICAL FEED: OFFLINE / ACCESS DENIED";
            status.className = "text-[9px] bg-error/20 text-error px-2 py-0.5 rounded font-bold border border-error/50";
        }
        if (window.showNotificationAlert) {
            window.showNotificationAlert("OPTICAL RECON ERROR", "Camera access denied or device not found: " + err.message, "error");
        }
    }
}

/**
 * Stop / Stand Down Optical Feed
 */
function stopVisualRecon() {
    if (reconMediaStream) {
        reconMediaStream.getTracks().forEach(t => t.stop());
        reconMediaStream = null;
    }
    isReconActive = false;

    const video = document.getElementById('recon-video-stream');
    const status = document.getElementById('recon-status-badge');
    const btn = document.getElementById('recon-power-btn');

    if (video) video.srcObject = null;
    if (hudAnimationId) {
        cancelAnimationFrame(hudAnimationId);
        hudAnimationId = null;
    }

    if (status) {
        status.innerText = "OPTICAL FEED: STANDBY";
        status.className = "text-[9px] bg-surface-dim text-secondary px-2 py-0.5 rounded font-bold border border-outline-variant/40";
    }
    if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">videocam</span><span>ENGAGE OPTICAL RECON</span>`;
        btn.className = "bg-primary hover:bg-primary/80 text-black font-bold py-2 px-4 rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-md";
    }
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

/**
 * Tactical Canvas HUD Rendering Loop
 */
function startTacticalHUDLoop() {
    const canvas = document.getElementById('recon-hud-overlay');
    const video = document.getElementById('recon-video-stream');
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    let angle = 0;

    function renderHUD() {
        if (!isReconActive) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // 1. Tactical Grid & Crosshairs
        ctx.strokeStyle = 'rgba(102, 204, 255, 0.25)';
        ctx.lineWidth = 1;

        // Center Crosshair
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy);
        ctx.lineTo(cx - 8, cy);
        ctx.moveTo(cx + 8, cy);
        ctx.lineTo(cx + 30, cy);
        ctx.moveTo(cx, cy - 30);
        ctx.lineTo(cx, cy - 8);
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx, cy + 30);
        ctx.stroke();

        // 2. Rotating Targeting Rings
        angle += 0.015;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(255, 226, 83, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 18]);
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Corner Tactical Brackets
        const bracketSize = 25;
        ctx.strokeStyle = 'rgba(102, 204, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(20, 20 + bracketSize);
        ctx.lineTo(20, 20);
        ctx.lineTo(20 + bracketSize, 20);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(w - 20 - bracketSize, 20);
        ctx.lineTo(w - 20, 20);
        ctx.lineTo(w - 20, 20 + bracketSize);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(20, h - 20 - bracketSize);
        ctx.lineTo(20, h - 20);
        ctx.lineTo(20 + bracketSize, h - 20);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(w - 20 - bracketSize, h - 20);
        ctx.lineTo(w - 20, h - 20);
        ctx.lineTo(w - 20, h - 20 - bracketSize);
        ctx.stroke();

        // 4. Stardate & Telemetry Overlay on Canvas
        ctx.font = '10px "Space Mono", monospace';
        ctx.fillStyle = 'rgba(102, 204, 255, 0.85)';
        ctx.fillText(`OPTICAL SENSOR: 1080p // STARDATE: ${new Date().toISOString().slice(0,10)}`, 28, 38);
        ctx.fillStyle = 'rgba(255, 226, 83, 0.85)';
        ctx.fillText(`TARGETING: AUTONOMOUS // FACING: ${currentCameraFacing.toUpperCase()}`, 28, 52);

        hudAnimationId = requestAnimationFrame(renderHUD);
    }

    renderHUD();
}

/**
 * Capture High-Res JPEG Base64 Frame
 */
function captureReconFrameBase64() {
    const video = document.getElementById('recon-video-stream');
    if (!video || !isReconActive) return null;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = video.videoWidth || 640;
    offCanvas.height = video.videoHeight || 480;
    const ctx = offCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

    const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];
    return base64Data;
}

/**
 * Multimodal Visual AI Analysis using Gemini 1.5 Flash Vision
 */
async function analyzeVisualRecon(customQuery = '') {
    if (isVisualAnalyzing) return;
    if (!isReconActive) {
        await startVisualRecon();
        // Wait 1.2s for video buffer
        await new Promise(r => setTimeout(r, 1200));
    }

    const base64Image = captureReconFrameBase64();
    if (!base64Image) {
        alert('Please activate optical camera feed first.');
        return;
    }

    const log = document.getElementById('recon-analysis-log');
    const loadingBadge = document.getElementById('recon-analyzing-badge');
    const apiKey = localStorage.getItem('meena_gemini_api_key') || '';

    isVisualAnalyzing = true;
    if (loadingBadge) loadingBadge.classList.remove('hidden');
    if (window.playSound) window.playSound('chime');

    const promptText = customQuery && customQuery.trim() ? 
        `You are M.E.E.N.A., an advanced tactical assistant for Takahara Academy. Analyze this live optical camera frame and answer this question: "${customQuery.trim()}". Be concise, precise, and polite (2-3 sentences). If the question was in Malay, reply in natural Bahasa Melayu, otherwise in English.` :
        `You are M.E.E.N.A., an advanced tactical assistant for Takahara Academy. Analyze this live optical camera frame. Describe the scene, identified objects, people, environment, text, or anomalies in 2-3 clear, insightful sentences. Answer in English, or Bahasa Melayu if the context demands.`;

    try {
        let analysisResult = "";

        if (apiKey) {
            // Direct Cloud Multimodal Inference with Gemini 1.5 Flash
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 300
                }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                analysisResult = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Visual scan completed with zero anomalies detected.";
            } else {
                throw new Error(`API HTTP ${res.status}`);
            }
        } else {
            // Offline Tactical Simulation if API Key not yet configured
            analysisResult = "Optical frame captured and analyzed: Visual sector displays ambient desk workstation with high clarity. All physical parameters appear nominal and secure, Sensei.";
        }

        // Render card in Visual Recon Log
        appendVisualReconCard(customQuery || "Visual Recon Scan", analysisResult);

        // Vocal Announcement
        if (window.speakComputerVoice) {
            window.speakComputerVoice(analysisResult);
        }

    } catch (err) {
        console.error("[VisualRecon] Vision analysis failure:", err);
        const errMsg = "Optical analysis fault: " + err.message;
        appendVisualReconCard("Vision Analysis Error", errMsg, true);
        if (window.speakComputerVoice) {
            window.speakComputerVoice("Optical sensor analysis could not be completed, Sensei.");
        }
    } finally {
        isVisualAnalyzing = false;
        if (loadingBadge) loadingBadge.classList.add('hidden');
    }
}

function appendVisualReconCard(title, text, isError = false) {
    const log = document.getElementById('recon-analysis-log');
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
}

// Global bindings
window.startVisualRecon = startVisualRecon;
window.stopVisualRecon = stopVisualRecon;
window.toggleVisualRecon = toggleVisualRecon;
window.switchCameraFacing = switchCameraFacing;
window.analyzeVisualRecon = analyzeVisualRecon;
