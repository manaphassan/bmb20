/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - STARFLEET WEB AUDIO & VOICE SYNTHESIZER
 * Tactile Feedback Chirps, Red Alert Klaxon, TNG Chimes, Warp Drive & LCARS Voice
 * ==========================================================================
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioActive = localStorage.getItem('lcars_audio_active') !== 'false';
let voiceEnabled = true;
let humOsc = null;
let humHarmonicOsc = null;
let humGain = null;
let lfoOsc = null;
let redAlertInterval = null;
let isRedAlertPlaying = false;
let audioInitialized = false;

// Auto-resume AudioContext on first user interaction and start default audio
function unlockAudioContext() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.warn("AudioContext resume failed:", e));
    }
    if (audioActive && !audioInitialized) {
        audioInitialized = true;
        animateEqualizer(true);
        setTimeout(() => {
            speakComputerVoice(getMeenaTimeGreeting());
        }, 400);
    }
}
window.addEventListener('click', unlockAudioContext, { once: true });
window.addEventListener('keydown', unlockAudioContext, { once: true });
window.addEventListener('touchstart', unlockAudioContext, { once: true });

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

    // Check if user has saved a preference
    const savedVoiceName = localStorage.getItem('lcars_meena_voice');
    if (savedVoiceName) {
        const saved = voices.find(v => v.name === savedVoiceName);
        if (saved) {
            meenaVoice = saved;
            populateVoiceSelector();
            return;
        }
    }

    // Priority 1: Fluent English with Japanese Accent / Multilingual Neural Japanese Female Voices
    const match = voices.find(v => v.name.includes('Nanami') || v.name.includes('Keiko') || v.name.includes('Aoi') || v.name.includes('Mayu') || v.name.includes('Shiori'))
        || voices.find(v => (v.name.includes('Jenny Multilingual') || v.name.includes('Aria Multilingual') || v.name.includes('Luna') || v.name.includes('HiuMaan') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi')))
        || voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.name.includes('Google 日本語') || v.name.includes('Kyoko') || v.name.includes('Ayumi'))
        || voices.find(v => v.lang === 'en-SG' || v.lang === 'en-PH' || v.lang === 'en-HK')
        || voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.includes('Natural') || v.name.includes('Zira')));

    if (match) meenaVoice = match;
    populateVoiceSelector();
}

function populateVoiceSelector() {
    const select = document.getElementById('meena-voice-select');
    if (!select || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    select.innerHTML = '';
    
    // Sort: Japanese and Asian voices first
    const sorted = [...voices].sort((a, b) => {
        const aScore = (a.lang.includes('ja') || a.name.includes('Nanami') || a.name.includes('Keiko') || a.lang.includes('SG')) ? 2 : (a.lang.startsWith('en') ? 1 : 0);
        const bScore = (b.lang.includes('ja') || b.name.includes('Nanami') || b.name.includes('Keiko') || b.lang.includes('SG')) ? 2 : (b.lang.startsWith('en') ? 1 : 0);
        return bScore - aScore;
    });

    sorted.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.innerText = `${v.name} (${v.lang})`;
        if (meenaVoice && v.name === meenaVoice.name) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

function setMeenaVoiceByName(voiceName) {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const found = voices.find(v => v.name === voiceName);
    if (found) {
        meenaVoice = found;
        localStorage.setItem('lcars_meena_voice', voiceName);
        testMeenaVoice();
    }
}

function testMeenaVoice() {
    speakComputerVoice("All personnel, battle stations! Konnichiwa, Sensei! Meena tactical operations online and ready for action!");
}

function getMeenaTimeGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Ohayou, Sensei! Good morning! Meena tactical operations center online and ready for action!";
    } else if (hour >= 12 && hour < 18) {
        return "Service, service! Konnichiwa, Sensei! All facility telemetry nominal and running at full power!";
    } else if (hour >= 18 && hour < 22) {
        return "Konbanwa, Sensei! Good evening! Operations center is fully secured and standing by for orders!";
    } else {
        return "Otsukare, Sensei! Working late tonight? Don't push yourself too much! Meena is watching your six!";
    }
}

let meenaPitch = parseFloat(localStorage.getItem('lcars_meena_pitch') || '1.10');
let meenaRate = parseFloat(localStorage.getItem('lcars_meena_rate') || '1.05');

function setMeenaPitch(val) {
    meenaPitch = parseFloat(val) || 1.10;
    localStorage.setItem('lcars_meena_pitch', meenaPitch);
    const label = document.getElementById('pitch-val-label');
    if (label) label.innerText = meenaPitch.toFixed(2);
}

function setMeenaRate(val) {
    meenaRate = parseFloat(val) || 1.05;
    localStorage.setItem('lcars_meena_rate', meenaRate);
    const label = document.getElementById('rate-val-label');
    if (label) label.innerText = meenaRate.toFixed(2);
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
        utterance.rate = meenaRate;   // Natural teenage girl conversational tempo
        utterance.pitch = meenaPitch; // Lower, natural teenage girl pitch (1.10)
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

        speakComputerVoice("All power to the main thrusters! Warp speed, ikimashou!");
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
    speakComputerVoice("All personnel, battle stations! Code Red! Raise the absolute defense barrier, Sensei!");

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
    speakComputerVoice("Code Yellow! Subspace sensors detecting an anomaly! Stay sharp, Sensei!");
}

// Ambient Hum Disabled (Clean, silent audio background)
function startAmbientHum() {
    // Disabled per user request for silent background
}

function stopAmbientHum() {
    // Disabled
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
    localStorage.setItem('lcars_audio_active', audioActive ? 'true' : 'false');
    const icon = document.getElementById('audio-icon');
    const label = document.getElementById('audio-label');
    const btn = document.getElementById('audio-toggle');

    if (audioActive) {
        audioInitialized = true;
        if (icon) icon.innerText = 'volume_up';
        if (label) label.innerText = 'AUDIO: ON';
        if (btn) {
            btn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.remove('bg-surface-variant', 'text-on-surface-variant');
        }
        startAmbientHum();
        animateEqualizer(true);
        playSound('chime');
        setTimeout(() => {
            speakComputerVoice(getMeenaTimeGreeting());
        }, 400);
    } else {
        if (icon) icon.innerText = 'volume_off';
        if (label) label.innerText = 'AUDIO: OFF';
        if (btn) {
            btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
            btn.classList.add('bg-surface-variant', 'text-on-surface-variant');
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
            const hour = new Date().getHours();
            let promptGreeting = "Hai, Sensei! Meena is listening.";
            if (hour >= 5 && hour < 12) promptGreeting = "Good morning, Sensei! Meena is listening.";
            else if (hour >= 18 && hour < 22) promptGreeting = "Good evening, Sensei! Meena is listening.";
            if (speakComputerVoice) speakComputerVoice(promptGreeting);
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

function handleVoiceCommand(rawCmd) {
    const cmd = rawCmd.trim().toLowerCase();
    const hudBadge = document.getElementById('voice-hud-badge');
    if (hudBadge) {
        hudBadge.innerText = `CMD: "${rawCmd}"`;
        hudBadge.style.opacity = '1';
    }

    // 1. Wake Word Only Trigger ("Meena", "Hey Meena", "Mina", "Computer")
    const isWakeWordOnly = (cmd === 'meena' || cmd === 'hey meena' || cmd === 'mina' || cmd === 'hey mina' || cmd === 'computer' || cmd === 'hello meena' || cmd === 'konnichiwa meena');
    if (isWakeWordOnly) {
        if (playSound) playSound('beep2');
        if (hudBadge) hudBadge.innerText = `MEENA: READY!`;
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            speakComputerVoice("Good morning, Sensei! Standing by and ready for orders!");
        } else if (hour >= 12 && hour < 18) {
            speakComputerVoice("Konnichiwa, Sensei! What's our next mission?");
        } else if (hour >= 18 && hour < 22) {
            speakComputerVoice("Good evening, Sensei! All tactical stations are ready!");
        } else {
            speakComputerVoice("Hai, Sensei! Don't stay up too late! I'm standing by!");
        }
        return;
    }

    // 2. Action Voice Commands
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
    } else if (cmd.includes('disable pi') || cmd.includes('pause pi') || cmd.includes('disable shield') || cmd.includes('pause shield') || cmd.includes('stop pihole')) {
        if (window.executePiholeAction) window.executePiholeAction('pihole_disable', 300);
    } else if (cmd.includes('enable pi') || cmd.includes('resume pi') || cmd.includes('enable shield') || cmd.includes('shield on') || cmd.includes('start pihole')) {
        if (window.executePiholeAction) window.executePiholeAction('pihole_enable');
    } else if (cmd.includes('update gravity') || cmd.includes('update blocklist') || cmd.includes('reload gravity')) {
        if (window.executePiholeAction) window.executePiholeAction('pihole_update_gravity');
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

    speakComputerVoice(`Tactical status report, Sensei! CPU is at ${cpu}, memory utilization ${mem}, core temperature is ${temp}. Pi-hole defense shield is ${pihole}! All systems green and ready for deployment!`);
}

function speakVerbalWeatherReport() {
    const temp = document.getElementById('wx-temp') ? document.getElementById('wx-temp').innerText : '31 degrees';
    const desc = document.getElementById('wx-desc') ? document.getElementById('wx-desc').innerText : 'partly cloudy';
    const hum = document.getElementById('wx-humidity') ? document.getElementById('wx-humidity').innerText : '75 percent';
    const wind = document.getElementById('wx-wind') ? document.getElementById('wx-wind').innerText : '12 km/h';

    speakComputerVoice(`Atmospheric report for Terra base, Sensei! Currently ${temp} Celsius with ${desc}. Relative humidity is ${hum} percent, surface wind is ${wind}. Perfect weather for a mission!`);
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
window.setMeenaVoiceByName = setMeenaVoiceByName;
window.testMeenaVoice = testMeenaVoice;
window.populateVoiceSelector = populateVoiceSelector;
window.setMeenaPitch = setMeenaPitch;
window.setMeenaRate = setMeenaRate;
