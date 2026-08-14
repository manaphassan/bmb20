/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - STARFLEET WEB AUDIO & VOICE SYNTHESIZER
 * Tactile Feedback Chirps, Red Alert Klaxon, TNG Chimes, Warp Drive & LCARS Voice
 * ==========================================================================
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioActive = false;
let voiceEnabled = true;
let humOsc = null;
let humHarmonicOsc = null;
let humGain = null;
let lfoOsc = null;
let redAlertInterval = null;
let isRedAlertPlaying = false;

// Auto-resume AudioContext on user interaction
function unlockAudioContext() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.warn("AudioContext resume failed:", e));
    }
}
window.addEventListener('click', unlockAudioContext, { once: true });
window.addEventListener('keydown', unlockAudioContext, { once: true });

/**
 * M.E.E.N.A. AI Voice Synthesizer (Web Speech API)
 * Master Electronic Executive Neural Assistant
 * Calibrated for a young, cheerful Asian/Japanese-accent English female AI assistant
 */
let meenaVoice = null;

function loadMeenaVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Prioritize Japanese Female / Asian English Voices (Nanami, Keiko, Kyoko, Luna, Singapore/Asian English)
    const match = voices.find(v => (v.name.includes('Nanami') || v.name.includes('Keiko') || v.name.includes('Kyoko') || v.name.includes('Ayumi') || v.name.includes('Haruka') || v.name.includes('Sayaka') || v.name.includes('Google 日本語')))
        || voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP')
        || voices.find(v => (v.lang === 'en-SG' || v.lang === 'en-PH' || v.lang === 'en-HK' || v.name.includes('Luna') || v.name.includes('Jenny') || v.name.includes('Sonia') || v.name.includes('Zira') || v.name.includes('Karen') || v.name.includes('Victoria')))
        || voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.includes('Natural')));

    if (match) meenaVoice = match;
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadMeenaVoice;
    loadMeenaVoice();
}

function speakComputerVoice(text) {
    if (!audioActive || !voiceEnabled || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel(); // Stop overlapping speech
        if (!meenaVoice) loadMeenaVoice();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.02;   // Serene, polite, composed Academy AI tempo
        utterance.pitch = 1.18;  // Gentle, melodic young Japanese female pitch
        utterance.volume = 1.0;

        if (meenaVoice) {
            utterance.voice = meenaVoice;
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("M.E.E.N.A. speech synthesis skipped:", e);
    }
}

/**
 * Starfleet Sound Synthesizer Engine
 */
function playSound(type) {
    if (!audioActive) return;
    try {
        unlockAudioContext();
        const now = audioCtx.currentTime;

        if (type === 'beep1') {
            // Starfleet LCARS High-Pitch Dual Chirp
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1760, now); // A6
            osc.frequency.setValueAtTime(2637, now + 0.035); // E7
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.095);
        } else if (type === 'beep2') {
            // Computer Terminal Affirmation
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.exponentialRampToValueAtTime(1479.98, now + 0.06); // F#6
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.085);
        } else if (type === 'chime') {
            // TNG Door / Comm Hail 3-Tone Ascending Chime
            playDoorChime();
        } else if (type === 'warp') {
            // Warp Drive Engagement Sequence
            playWarpSequence();
        } else if (type === 'beam') {
            // Transporter Beaming Shimmer Chime
            playTransporterChime();
        } else if (type === 'caution') {
            // Yellow Alert Caution Chime
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.25); // A4
            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.29);
        } else if (type === 'alert') {
            // Single Red Alert Klaxon Sweep
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2400, now);
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'ping') {
            // Tactical Sonar Ping
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2093.00, now); // C7
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } else {
            // Standard Tactical Tap
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1318.51, now); // E6
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.055);
        }
    } catch (e) {
        console.warn("Web Audio API trigger skipped:", e);
    }
}

/**
 * TNG Door / Comm Hail Ascending 3-Tone Chime (C5 -> E5 -> G5)
 */
function playDoorChime() {
    if (!audioActive) return;
    try {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const start = audioCtx.currentTime + (idx * 0.11);
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + 0.23);
        });
    } catch (e) {}
}

/**
 * Warp Drive Engagement Sequence
 * Deep sub-bass surge accelerating into a high-frequency warp pulse sweep
 */
function playWarpSequence() {
    if (!audioActive) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const subOsc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        subOsc.type = 'sine';
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(4.0, now);

        // Rising Frequency Sweep
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 1.2);

        subOsc.frequency.setValueAtTime(35, now);
        subOsc.frequency.exponentialRampToValueAtTime(180, now + 0.8);

        filter.frequency.setValueAtTime(90, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 1.2);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 1.45);
        subOsc.stop(now + 1.45);

        speakComputerVoice("Warp sequence initiated. Dimensional space translation underway, Commander.");
    } catch (e) {}
}

/**
 * Transporter Beaming Shimmer Chime
 */
function playTransporterChime() {
    if (!audioActive) return;
    try {
        const now = audioCtx.currentTime;
        const freqs = [880, 1108.73, 1318.51, 1760];
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f + (i * 12), now);
            osc.frequency.linearRampToValueAtTime(f + 60, now + 0.8);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.88);
        });
    } catch (e) {}
}

// Red Alert Repeating Klaxon Engine
function startRedAlertKlaxon() {
    isRedAlertPlaying = true;
    if (redAlertInterval) clearInterval(redAlertInterval);
    
    // Play immediately & speak announcement
    playSound('alert');
    speakComputerVoice("Code Red. Emergency defense barriers and tactical shields initialized. Please prepare for battle, Commander.");

    // Loop every 1200ms
    redAlertInterval = setInterval(() => {
        if (isRedAlertPlaying && audioActive) {
            playSound('alert');
        }
    }, 1200);
}

function stopRedAlertKlaxon() {
    isRedAlertPlaying = false;
    if (redAlertInterval) {
        clearInterval(redAlertInterval);
        redAlertInterval = null;
    }
}

// Yellow Alert Caution Chime
function playYellowAlertChirp() {
    stopRedAlertKlaxon();
    playSound('caution');
    speakComputerVoice("Code Yellow. Environmental sensors detecting subspace anomalies. Monitoring facility status, Commander.");
}

// Deep 48Hz Warp Core Engine Ambient Hum
function startAmbientHum() {
    if (humOsc) return;
    try {
        unlockAudioContext();

        humOsc = audioCtx.createOscillator();
        humHarmonicOsc = audioCtx.createOscillator();
        humGain = audioCtx.createGain();
        lfoOsc = audioCtx.createOscillator();

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(130, audioCtx.currentTime);

        humOsc.type = 'sawtooth';
        humOsc.frequency.setValueAtTime(48.0, audioCtx.currentTime);

        humHarmonicOsc.type = 'triangle';
        humHarmonicOsc.frequency.setValueAtTime(96.0, audioCtx.currentTime);

        lfoOsc.type = 'sine';
        lfoOsc.frequency.setValueAtTime(0.08, audioCtx.currentTime);

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(20, audioCtx.currentTime);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        humGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        humGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2.0);

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

function animateEqualizer(active) {
    const bars = document.querySelectorAll('.eq-bar');
    if (!active) {
        bars.forEach(b => b.style.height = '3px');
        return;
    }
    bars.forEach(b => {
        const h = Math.floor(4 + Math.random() * 10);
        b.style.height = `${h}px`;
    });
    if (audioActive) {
        setTimeout(() => animateEqualizer(true), 150);
    }
}

function toggleAudio() {
    unlockAudioContext();
    audioActive = !audioActive;
    const icon = document.getElementById('audio-icon');
    const label = document.getElementById('audio-label');
    const btn = document.getElementById('audio-toggle');

    if (audioActive) {
        if (icon) icon.innerText = 'volume_up';
        if (label) label.innerText = 'AUDIO: ON';
        if (btn) {
            btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.remove('bg-surface-variant');
        }
        startAmbientHum();
        animateEqualizer(true);
        playSound('chime');
        setTimeout(() => {
            speakComputerVoice("Konnichiwa, Commander. Meena system is online. Takahara neural protocols nominal.");
        }, 400);
    } else {
        if (icon) icon.innerText = 'volume_off';
        if (label) label.innerText = 'AUDIO: OFF';
        if (btn) {
            btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.add('bg-surface-variant');
        }
        stopAmbientHum();
        stopRedAlertKlaxon();
        animateEqualizer(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
}

/**
 * ==========================================================================
 * J.A.R.V.I.S. VOICE COMMAND RECOGNITION (Web Speech Recognition API)
 * ==========================================================================
 */
let recognition = null;
let isListening = false;

function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("SpeechRecognition API not supported in this browser.");
        return;
    }

    try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            updateVoiceHUD("LISTENING...", true);
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            handleVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                console.warn("Microphone access blocked on insecure HTTP origin.");
                isListening = false;
                updateVoiceHUD("MIC BLOCKED", false);
                openVoiceModal();
            } else if (event.error !== 'no-speech') {
                console.warn("Speech recognition error:", event.error);
            }
        };

        recognition.onend = () => {
            if (isListening) {
                // Auto-restart if user still wants mic on
                try { recognition.start(); } catch (e) {}
            } else {
                updateVoiceHUD("MIC OFF", false);
            }
        };
    } catch (e) {
        console.warn("Speech recognition init failed:", e);
    }
}

function toggleVoiceRecognition() {
    if (!recognition) initVoiceRecognition();
    if (!recognition) {
        openVoiceModal();
        return;
    }

    if (isListening) {
        isListening = false;
        recognition.stop();
        updateVoiceHUD("MIC OFF", false);
        if (playSound) playSound('beep1');
        if (speakComputerVoice) speakComputerVoice("Voice listening deactivated. Meena standing by.");
    } else {
        isListening = true;
        try {
            recognition.start();
            updateVoiceHUD("LISTENING...", true);
            if (playSound) playSound('beep2');
            if (speakComputerVoice) speakComputerVoice("Hai, Commander. Meena is listening.");
        } catch (e) {
            console.warn("Voice recognition start error:", e);
            openVoiceModal();
        }
    }
}

function openVoiceModal() {
    const modal = document.getElementById('voice-command-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeVoiceModal() {
    const modal = document.getElementById('voice-command-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    if (playSound) playSound('beep1');
}

function updateVoiceHUD(text, active) {
    const micBtn = document.getElementById('voice-mic-btn');
    const micIcon = document.getElementById('voice-mic-icon');
    const micLabel = document.getElementById('voice-mic-label');
    const hudBadge = document.getElementById('voice-hud-badge');

    if (micIcon) micIcon.innerText = active ? 'mic' : 'mic_off';
    if (micLabel) micLabel.innerText = active ? 'VOICE: ON' : 'VOICE: OFF';
    if (micBtn) {
        if (active) {
            micBtn.classList.add('bg-primary', 'text-black', 'active-condition');
            micBtn.classList.remove('bg-surface-variant', 'text-on-surface-variant');
        } else {
            micBtn.classList.remove('bg-primary', 'text-black', 'active-condition');
            micBtn.classList.add('bg-surface-variant', 'text-on-surface-variant');
        }
    }

    if (hudBadge) {
        hudBadge.innerText = text.toUpperCase();
        hudBadge.style.opacity = active ? '1' : '0.4';
    }
}

function handleVoiceCommand(cmd) {
    const hudBadge = document.getElementById('voice-hud-badge');
    if (hudBadge) {
        hudBadge.innerText = `CMD: "${cmd}"`;
    }

    if (cmd.includes('red') || cmd.includes('code red') || cmd.includes('shields up') || cmd.includes('battle stations')) {
        if (window.setAlertCondition) window.setAlertCondition('red', true);
    } else if (cmd.includes('yellow') || cmd.includes('code yellow') || cmd.includes('caution')) {
        if (window.setAlertCondition) window.setAlertCondition('yellow', true);
    } else if (cmd.includes('green') || cmd.includes('code green') || cmd.includes('nominal') || cmd.includes('all clear') || cmd.includes('stand down')) {
        if (window.setAlertCondition) window.setAlertCondition('green', true);
    } else if (cmd.includes('warp') || cmd.includes('engage') || cmd.includes('accelerate')) {
        if (window.playWarpSequence) window.playWarpSequence();
    } else if (cmd.includes('chime') || cmd.includes('door') || cmd.includes('hail')) {
        if (window.playDoorChime) window.playDoorChime();
    } else if (cmd.includes('beam') || cmd.includes('transport') || cmd.includes('energize')) {
        if (window.playTransporterChime) window.playTransporterChime();
    } else if (cmd.includes('terra') || cmd.includes('planet') || cmd.includes('earth') || cmd.includes('terrestrial')) {
        if (window.switchHologramView) window.switchHologramView('earth');
    } else if (cmd.includes('solar') || cmd.includes('system') || cmd.includes('sun')) {
        if (window.switchHologramView) window.switchHologramView('solar');
    } else if (cmd.includes('galaxy') || cmd.includes('milky way') || cmd.includes('stars')) {
        if (window.switchHologramView) window.switchHologramView('galaxy');
    } else if (cmd.includes('weather') || cmd.includes('forecast') || cmd.includes('atmospheric') || cmd.includes('meteo')) {
        speakVerbalWeatherReport();
    } else if (cmd.includes('status') || cmd.includes('report') || cmd.includes('diagnostics')) {
        speakVerbalStatusReport();
    } else if (cmd.includes('clarity') || cmd.includes('scanline') || cmd.includes('crt')) {
        if (window.toggleScanlines) window.toggleScanlines();
    } else if (cmd.includes('audio off') || cmd.includes('mute') || cmd.includes('silence')) {
        if (window.toggleAudio) window.toggleAudio();
    } else {
        if (window.playSound) window.playSound('beep2');
    }
}

function speakVerbalStatusReport() {
    const cpu = document.getElementById('cpu-val') ? document.getElementById('cpu-val').innerText : '24 percent';
    const mem = document.getElementById('mem-val') ? document.getElementById('mem-val').innerText : '26 percent';
    const temp = document.getElementById('temp-val') ? document.getElementById('temp-val').innerText : '52 degrees';
    const pihole = document.getElementById('header-pihole-pct') ? document.getElementById('header-pihole-pct').innerText : 'active';

    speakComputerVoice(`Diagnostic status report, Commander. Core processing load is ${cpu}, memory utilization is ${mem}. Thermal regulation is ${temp}. Facility defense shield is ${pihole}. All parameters optimal.`);
}

function speakVerbalWeatherReport() {
    const temp = document.getElementById('wx-temp') ? document.getElementById('wx-temp').innerText : '31 degrees';
    const desc = document.getElementById('wx-desc') ? document.getElementById('wx-desc').innerText : 'partly cloudy';
    const hum = document.getElementById('wx-humidity') ? document.getElementById('wx-humidity').innerText : '75 percent';
    const wind = document.getElementById('wx-wind') ? document.getElementById('wx-wind').innerText : '12 km/h';

    speakComputerVoice(`Atmospheric observation from Terra station, Commander. Currently ${temp} Celsius with ${desc}. Relative humidity is ${hum}, surface wind is ${wind}. The outside environment is pleasant today.`);
}

// Window Global Exports
window.playSound = playSound;
window.toggleAudio = toggleAudio;
window.toggleVoiceRecognition = toggleVoiceRecognition;
window.openVoiceModal = openVoiceModal;
window.closeVoiceModal = closeVoiceModal;
window.handleVoiceCommand = handleVoiceCommand;
window.startRedAlertKlaxon = startRedAlertKlaxon;
window.stopRedAlertKlaxon = stopRedAlertKlaxon;
window.playYellowAlertChirp = playYellowAlertChirp;
window.playDoorChime = playDoorChime;
window.playWarpSequence = playWarpSequence;
window.playTransporterChime = playTransporterChime;
window.speakComputerVoice = speakComputerVoice;
window.speakVerbalStatusReport = speakVerbalStatusReport;
window.speakVerbalWeatherReport = speakVerbalWeatherReport;
window.playTransporterChime = playTransporterChime;
window.speakComputerVoice = speakComputerVoice;
window.speakVerbalStatusReport = speakVerbalStatusReport;
