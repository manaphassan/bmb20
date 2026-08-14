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
 * Meena™ - Takahara Academy (高原学園)
 * Master Electronic Executive Neural Assistant
 * Strictly filters to verified young female voice profiles
 */
let meenaVoice = null;

const MALE_VOICE_IDENTIFIERS = [
    'david', 'george', 'mark', 'richard', 'guy', 'keita', 'ichiro', 'osman',
    'james', 'ryan', 'steffan', 'stefan', 'claude', 'paul', 'thomas', 'otoya',
    'takumi', 'naoki', ' male', '(male)', 'cosimo', 'florian', 'alain', 'kurt', 'stefano'
];

function isFemaleVoice(v) {
    if (!v || !v.name) return false;
    const name = v.name.toLowerCase();
    for (const m of MALE_VOICE_IDENTIFIERS) {
        if (name.includes(m)) return false;
    }
    return true;
}

function loadMeenaVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Filter strictly to female voices
    const femaleVoices = voices.filter(isFemaleVoice);
    const candidateList = femaleVoices.length > 0 ? femaleVoices : voices;

    // Check if user has saved a preference AND verify it is strictly female
    const savedVoiceName = localStorage.getItem('lcars_meena_voice');
    if (savedVoiceName) {
        const saved = candidateList.find(v => v.name === savedVoiceName && isFemaleVoice(v));
        if (saved) {
            meenaVoice = saved;
            populateVoiceSelector();
            return;
        } else {
            localStorage.removeItem('lcars_meena_voice'); // Purge any previously saved male voice
        }
    }

    // Priority 1: Verified Female Multilingual & Japanese / Asian English Voices
    const match = candidateList.find(v => v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Nanami') || v.name.includes('Aoi') || v.name.includes('Keiko'))
        || candidateList.find(v => v.name.includes('Yasmin') || v.name.includes('Luna') || v.name.includes('HiuMaan') || v.name.includes('Xiaoxiao') || v.name.includes('Shiori') || v.name.includes('Mayu'))
        || candidateList.find(v => v.name.includes('Kyoko') || v.name.includes('Ayumi') || v.name.includes('Haruka') || v.name.includes('Sayaka') || v.name.includes('Google 日本語'))
        || candidateList.find(v => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Google US English'))
        || candidateList.find(v => isFemaleVoice(v) && (v.lang.startsWith('en') || v.lang.startsWith('ja') || v.lang.startsWith('ms')))
        || candidateList[0];

    if (match) meenaVoice = match;
    populateVoiceSelector();
}

function appendMeenaChat(sender, message, isMeena = true) {
    const feed = document.getElementById('meena-chat-feed');
    if (!feed) return;
    const row = document.createElement('div');
    row.className = isMeena ? 'flex items-start gap-1.5 text-primary' : 'flex items-start gap-1.5 text-lcars-gold';
    row.innerHTML = `<span class="${isMeena ? 'text-tertiary' : 'text-secondary'} font-bold">[${sender}]:</span><span>${message}</span>`;
    feed.appendChild(row);
    feed.scrollTop = feed.scrollHeight;
    
    // Keep max 30 messages in feed
    while (feed.children.length > 30) {
        feed.removeChild(feed.firstChild);
    }
}

function populateVoiceSelector() {
    const select = document.getElementById('meena-voice-select');
    if (!select || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    select.innerHTML = '';
    
    // Filter to female voices and sort best multilingual voices first
    const femaleOnly = voices.filter(isFemaleVoice);
    const displayList = femaleOnly.length > 0 ? femaleOnly : voices;

    const sorted = [...displayList].sort((a, b) => {
        const aScore = (a.name.includes('Jenny') || a.name.includes('Aria') || a.name.includes('Nanami') || a.name.includes('Aoi') || a.name.includes('Keiko') || a.name.includes('Yasmin') || a.name.includes('Luna')) ? 3 : (a.lang.startsWith('en') ? 1 : 0);
        const bScore = (b.name.includes('Jenny') || b.name.includes('Aria') || b.name.includes('Nanami') || b.name.includes('Aoi') || b.name.includes('Keiko') || b.name.includes('Yasmin') || b.name.includes('Luna')) ? 3 : (b.lang.startsWith('en') ? 1 : 0);
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
    const found = voices.find(v => v.name === voiceName && isFemaleVoice(v));
    if (found) {
        meenaVoice = found;
        localStorage.setItem('lcars_meena_voice', voiceName);
        testMeenaVoice();
    }
}

function testMeenaVoice() {
    speakComputerVoice("All systems green, Sensei! Takahara Academy tactical operations center online and ready for deployment!");
}

function getMeenaTimeGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Ohayou, Sensei! Good morning! Takahara Academy tactical operations center is online and all systems nominal!";
    } else if (hour >= 12 && hour < 18) {
        return "Konnichiwa, Sensei! Good afternoon! All facility telemetry is running at peak performance!";
    } else if (hour >= 18 && hour < 22) {
        return "Konbanwa, Sensei! Good evening! Operations center is fully secured and standing by for orders!";
    } else {
        return "Otsukare, Sensei! Working late tonight? Please don't push yourself too much! Meena is watching your six!";
    }
}

let meenaPitch = parseFloat(localStorage.getItem('lcars_meena_pitch') || '1.24');
let meenaRate = parseFloat(localStorage.getItem('lcars_meena_rate') || '1.08');

function setMeenaPitch(val) {
    meenaPitch = parseFloat(val) || 1.24;
    localStorage.setItem('lcars_meena_pitch', meenaPitch);
    const label = document.getElementById('pitch-val-label');
    if (label) label.innerText = meenaPitch.toFixed(2);
}

function setMeenaRate(val) {
    meenaRate = parseFloat(val) || 1.08;
    localStorage.setItem('lcars_meena_rate', meenaRate);
    const label = document.getElementById('rate-val-label');
    if (label) label.innerText = meenaRate.toFixed(2);
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadMeenaVoice;
    loadMeenaVoice();
}

function speakComputerVoice(text) {
    appendMeenaChat('MEENA', text, true);
    const status = document.getElementById('meena-status-indicator');
    if (status) status.innerText = 'TRANSMITTING VOICE';

    if (!audioActive || !voiceEnabled || !('speechSynthesis' in window)) {
        if (status) setTimeout(() => { status.innerText = 'STANDBY [LISTENING]'; }, 1500);
        return;
    }

    try {
        window.speechSynthesis.cancel(); // Stop overlapping speech
        if (!meenaVoice) loadMeenaVoice();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = meenaRate;   // Natural anime conversational tempo
        utterance.pitch = meenaPitch; // Natural teenage girl pitch
        utterance.volume = 1.0;
        utterance.lang = (meenaVoice && meenaVoice.lang) ? meenaVoice.lang : 'en-US';

        if (meenaVoice) {
            utterance.voice = meenaVoice;
        }

        utterance.onend = () => {
            if (status) status.innerText = 'STANDBY [LISTENING]';
        };
        utterance.onerror = () => {
            if (status) status.innerText = 'STANDBY [LISTENING]';
        };

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("M.E.E.N.A. speech synthesis skipped:", e);
        if (status) status.innerText = 'STANDBY [LISTENING]';
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
    if (!rawCmd || !rawCmd.trim()) return;
    const cmd = rawCmd.trim().toLowerCase();

    // Log to Meena live dashboard feed
    appendMeenaChat('SENSEI', rawCmd.trim(), false);
    const status = document.getElementById('meena-status-indicator');
    if (status) status.innerText = 'PROCESSING...';

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
        addMeenaEXP(10, 'Wake word interaction');
        setMeenaMood('CHEERFUL');
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
        addMeenaEXP(15, 'Code Red engagement');
        setMeenaMood('TACTICAL');
        if (window.setAlertCondition) window.setAlertCondition('red', true);
    } else if (cmd.includes('yellow') || cmd.includes('code yellow') || cmd.includes('caution')) {
        addMeenaEXP(10, 'Yellow alert caution');
        setMeenaMood('TACTICAL');
        if (window.setAlertCondition) window.setAlertCondition('yellow', true);
    } else if (cmd.includes('green') || cmd.includes('code green') || cmd.includes('nominal') || cmd.includes('all clear') || cmd.includes('stand down')) {
        addMeenaEXP(10, 'Code Green nominal');
        setMeenaMood('CHEERFUL');
        if (window.setAlertCondition) window.setAlertCondition('green', true);
    } else if (cmd.includes('warp') || cmd.includes('engage') || cmd.includes('accelerate')) {
        addMeenaEXP(20, 'Warp speed sequence');
        setMeenaMood('PROUD');
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
        addMeenaEXP(15, 'Pi-hole shield paused');
        if (window.executePiholeAction) window.executePiholeAction('pihole_disable', 300);
    } else if (cmd.includes('enable pi') || cmd.includes('resume pi') || cmd.includes('enable shield') || cmd.includes('shield on') || cmd.includes('start pihole')) {
        addMeenaEXP(15, 'Pi-hole shield activated');
        if (window.executePiholeAction) window.executePiholeAction('pihole_enable');
    } else if (cmd.includes('update gravity') || cmd.includes('update blocklist') || cmd.includes('reload gravity')) {
        addMeenaEXP(25, 'Pi-hole Gravity reload');
        if (window.executePiholeAction) window.executePiholeAction('pihole_update_gravity');
    } else if (cmd.includes('weather') || cmd.includes('forecast') || cmd.includes('atmospheric') || cmd.includes('meteo')) {
        addMeenaEXP(10, 'Weather inquiry');
        speakVerbalWeatherReport();
    } else if (cmd.includes('status') || cmd.includes('report') || cmd.includes('diagnostics')) {
        addMeenaEXP(15, 'System status report');
        speakVerbalStatusReport();
    } else if (cmd.startsWith('remember ') || cmd.includes('remember that ')) {
        const fact = rawCmd.replace(/^(meena\s*,?\s*|hey meena\s*,?\s*)?remember\s*(that\s*)?/i, '').trim();
        if (fact) rememberCategorizedFact('facility', fact);
    } else if (cmd.includes('recall') || cmd.includes('what did you learn') || cmd.includes('read memory') || cmd.includes('show memory')) {
        recallMemories();
    } else if (cmd.includes('clear memory') || cmd.includes('forget all') || cmd.includes('reset memory')) {
        clearMemories();
    } else if (cmd.includes('clarity') || cmd.includes('scanline') || cmd.includes('crt')) {
        if (window.toggleScanlines) window.toggleScanlines();
    } else if (cmd.includes('audio off') || cmd.includes('mute') || cmd.includes('silence')) {
        if (window.toggleAudio) window.toggleAudio();
    } else {
        // Conversational AI Brain Fallback for Natural Questions & Learning
        addMeenaEXP(10, 'Conversational query');
        askMeenaAI(rawCmd);
    }
}

/**
 * ==========================================================================
 * MEENA NEURAL GROWTH & EXP ENGINE (LEVEL 1 -> 99)
 * ==========================================================================
 */
function getMeenaEXP() {
    return parseInt(localStorage.getItem('meena_sync_exp') || '840', 10);
}

function getMeenaGrowthStatus() {
    const totalExp = getMeenaEXP();
    // Level curve: 100 EXP per level
    const level = Math.max(1, Math.floor(totalExp / 100) + 1);
    const expInLevel = totalExp % 100;
    
    let rank = 'RANK E: CADET AI';
    if (level >= 50) {
        rank = 'RANK EX: SOULBOUND GUARDIAN';
    } else if (level >= 26) {
        rank = 'RANK A: TACTICAL DIRECTOR';
    } else if (level >= 11) {
        rank = 'RANK C: OPERATOR';
    }

    return { totalExp, level, expInLevel, rank };
}

function addMeenaEXP(points, reason = '') {
    const oldStatus = getMeenaGrowthStatus();
    const newTotal = oldStatus.totalExp + points;
    localStorage.setItem('meena_sync_exp', newTotal.toString());
    const newStatus = getMeenaGrowthStatus();

    updateGrowthUI();

    // Check for Level Up!
    if (newStatus.level > oldStatus.level) {
        setMeenaMood('PROUD');
        if (window.playSound) window.playSound('beep2');
        speakComputerVoice(`Sugoi, Sensei! My neural sync level has increased to Level ${newStatus.level}! Rank: ${newStatus.rank}!`);
    }
}

function updateGrowthUI() {
    const status = getMeenaGrowthStatus();
    const lvlElem = document.getElementById('meena-sync-level');
    const rankElem = document.getElementById('meena-rank-badge');
    const barElem = document.getElementById('meena-exp-bar');
    const textElem = document.getElementById('meena-exp-text');

    if (lvlElem) lvlElem.innerText = `Lv. ${status.level}`;
    if (rankElem) rankElem.innerText = status.rank;
    if (barElem) barElem.style.width = `${status.expInLevel}%`;
    if (textElem) textElem.innerText = `${status.expInLevel} / 100 EXP`;
}

/**
 * ==========================================================================
 * MOOD & AFFECTION MATRIX
 * ==========================================================================
 */
let meenaCurrentMood = 'CHEERFUL';

function setMeenaMood(mood) {
    meenaCurrentMood = mood;
    const badge = document.getElementById('meena-mood-badge');
    if (!badge) return;

    if (mood === 'CHEERFUL') {
        badge.className = 'text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/40';
        badge.innerText = 'CHEERFUL';
    } else if (mood === 'TACTICAL') {
        badge.className = 'text-[9px] bg-error/20 text-error px-1.5 py-0.5 rounded font-bold border border-error/40 animate-pulse';
        badge.innerText = 'TACTICAL DEFENSE';
    } else if (mood === 'CARING') {
        badge.className = 'text-[9px] bg-tertiary/20 text-tertiary px-1.5 py-0.5 rounded font-bold border border-tertiary/40';
        badge.innerText = 'CARING';
    } else if (mood === 'PROUD') {
        badge.className = 'text-[9px] bg-lcars-purple/20 text-lcars-purple px-1.5 py-0.5 rounded font-bold border border-lcars-purple/40';
        badge.innerText = 'PROUD';
    }
}

/**
 * ==========================================================================
 * STRUCTURED 4-CATEGORY TACTICAL KNOWLEDGE BANK
 * ==========================================================================
 */
let currentKnowledgeFilter = 'all';

function getKnowledgeBank() {
    try {
        const stored = localStorage.getItem('meena_knowledge_bank');
        if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Default Seed Data
    const defaults = [
        { id: '1', category: 'facility', fact: 'Workstation IP: 192.168.0.105', desc: 'Takahara Host Node', timestamp: new Date().toISOString() },
        { id: '2', category: 'facility', fact: 'Pi-hole Port: 8089 on DietPi', desc: 'DNS Defense Shield', timestamp: new Date().toISOString() },
        { id: '3', category: 'profile', fact: 'Sensei prefers English voice with Japanese flair', desc: 'Audio Preference', timestamp: new Date().toISOString() },
        { id: '4', category: 'routines', fact: 'Daily morning mission briefing at 08:00 AM', desc: 'Scheduled Operation', timestamp: new Date().toISOString() },
        { id: '5', category: 'missions', fact: 'Keep DietPi and Pi-hole blocklists updated', desc: 'Active Defense Task', timestamp: new Date().toISOString() }
    ];
    localStorage.setItem('meena_knowledge_bank', JSON.stringify(defaults));
    return defaults;
}

function rememberCategorizedFact(category, fact) {
    if (!fact || !fact.trim()) return;
    const bank = getKnowledgeBank();
    const item = {
        id: Date.now().toString(),
        category: category || 'facility',
        fact: fact.trim(),
        desc: `Learned from Sensei`,
        timestamp: new Date().toISOString()
    };
    bank.push(item);
    if (bank.length > 50) bank.shift();
    localStorage.setItem('meena_knowledge_bank', JSON.stringify(bank));

    addMeenaEXP(25, 'Taught new fact');
    setMeenaMood('CHEERFUL');
    renderKnowledgeBank(currentKnowledgeFilter);

    if (window.playSound) window.playSound('beep2');
    speakComputerVoice(`Understood, Sensei! I have memorized that under ${category.toUpperCase()} category!`);
}

function deleteKnowledgeItem(id) {
    let bank = getKnowledgeBank();
    bank = bank.filter(item => item.id !== id);
    localStorage.setItem('meena_knowledge_bank', JSON.stringify(bank));
    renderKnowledgeBank(currentKnowledgeFilter);
    if (window.playSound) window.playSound('beep1');
}

function filterKnowledgeCategory(category) {
    currentKnowledgeFilter = category;
    
    // Update Filter Pill Styles
    ['all', 'facility', 'profile', 'routines', 'missions'].forEach(cat => {
        const btn = document.getElementById(`kb-filter-${cat}`);
        if (btn) {
            if (cat === category) {
                btn.className = 'px-2 py-0.5 rounded bg-primary text-black font-bold';
            } else {
                btn.className = 'px-2 py-0.5 rounded bg-surface-bright text-on-surface-variant hover:text-tertiary font-bold';
            }
        }
    });

    renderKnowledgeBank(category);
}

function renderKnowledgeBank(category = 'all') {
    const container = document.getElementById('knowledge-cards-container');
    if (!container) return;

    const bank = getKnowledgeBank();
    const filtered = (category === 'all') ? bank : bank.filter(item => item.category === category);

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-2 bg-surface-container-lowest p-2 rounded border border-outline-variant/30 text-center text-secondary text-[9px]">No knowledge entries recorded. Type below to teach Meena!</div>`;
        return;
    }

    const catIcons = {
        facility: 'FACILITY',
        profile: 'SENSEI',
        routines: 'ROUTINES',
        missions: 'MISSIONS'
    };

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-surface-container-lowest p-2 rounded border border-outline-variant/30 flex flex-col justify-between text-[9px] hover:border-primary/50 transition-all';
        card.innerHTML = `
            <div class="flex justify-between items-center text-tertiary font-bold">
                <span>${catIcons[item.category] || item.category.toUpperCase()}</span>
                <button onclick="deleteKnowledgeItem('${item.id}')" class="text-on-surface-variant hover:text-error text-[10px] font-bold px-1" title="Delete note">X</button>
            </div>
            <div class="text-on-surface my-1 font-mono break-words">${item.fact}</div>
            <div class="text-[8px] text-secondary font-mono">${item.desc}</div>
        `;
        container.appendChild(card);
    });
}

function executeTeachNote() {
    const catSelect = document.getElementById('teach-category');
    const input = document.getElementById('teach-note-input');
    if (!input || !input.value.trim()) return;

    const cat = catSelect ? catSelect.value : 'facility';
    rememberCategorizedFact(cat, input.value.trim());
    input.value = '';
}

function recallMemories() {
    const bank = getKnowledgeBank();
    if (bank.length === 0) {
        speakComputerVoice("My tactical knowledge bank is currently clear, Sensei! You can teach me with the Teach Meena bar below.");
        return;
    }
    const count = bank.length;
    const latest = bank.slice(-3).map((m, i) => `${i + 1}: ${m.fact}`).join(". ");
    speakComputerVoice(`Takahara knowledge bank has ${count} records, Sensei. Here are the latest notes: ${latest}`);
}

function clearMemories() {
    localStorage.removeItem('meena_knowledge_bank');
    if (window.playSound) window.playSound('beep1');
    renderKnowledgeBank('all');
    speakComputerVoice("Takahara tactical memory registers have been reset, Sensei.");
}

/**
 * ==========================================================================
 * 3D HOLOGRAPHIC DOT-MATRIX NEURAL BRAIN (AI CORE)
 * Procedural 3D Point-Cloud Brain with Synaptic Pulses & Audio Excitation
 * ==========================================================================
 */
let avatarCanvas = null;
let avatarCtx = null;
let avatarAngle = 0;
let brainNodes = [];
let brainEdges = [];
let neuralSparks = [];

function generateBrainModel() {
    brainNodes = [];
    brainEdges = [];
    neuralSparks = [];

    // Generate ~110 point-cloud nodes in left/right cerebral hemispheres & cerebellum
    const hemisphereCount = 45;
    
    // 1. Left & Right Cerebral Hemispheres
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < hemisphereCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * v - 1);
            
            // Brain ellipsoid proportions
            const rx = 16 * (0.7 + Math.sin(phi * 3) * 0.15);
            const ry = 13 * (0.8 + Math.cos(theta * 2) * 0.12);
            const rz = 20 * (0.8 + Math.sin(theta * 2) * 0.1);

            const x = (side * 8) + (rx * Math.sin(phi) * Math.cos(theta) * 0.65);
            const y = (ry * Math.sin(phi) * Math.sin(theta) * 0.8) - 2;
            const z = rz * Math.cos(phi) * 0.85;

            brainNodes.push({ x, y, z, baseRadius: Math.random() * 1.2 + 1.0, side });
        }
    }

    // 2. Cerebellum & Brain Stem (Bottom Rear)
    for (let i = 0; i < 18; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * 8 + 2;
        const x = Math.cos(theta) * r * 0.7;
        const y = -10 - (Math.random() * 6);
        const z = -6 - (Math.random() * 8);
        brainNodes.push({ x, y, z, baseRadius: 1.0, side: 0 });
    }

    // 3. Generate Synaptic Connective Edges (Nearest Neighbor Mesh)
    for (let i = 0; i < brainNodes.length; i++) {
        for (let j = i + 1; j < brainNodes.length; j++) {
            const dx = brainNodes[i].x - brainNodes[j].x;
            const dy = brainNodes[i].y - brainNodes[j].y;
            const dz = brainNodes[i].z - brainNodes[j].z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Connect close nodes in same hemisphere or across corpus callosum bridge
            if (dist < 8.5) {
                brainEdges.push({ from: i, to: j, dist });
            }
        }
    }

    // 4. Initialize Active Synaptic Sparks
    for (let s = 0; s < 12; s++) {
        const edgeIdx = Math.floor(Math.random() * brainEdges.length);
        neuralSparks.push({
            edgeIdx,
            progress: Math.random(),
            speed: Math.random() * 0.03 + 0.015
        });
    }
}

function initMeenaAvatarCanvas() {
    avatarCanvas = document.getElementById('meena-avatar-canvas');
    if (!avatarCanvas) return;
    avatarCtx = avatarCanvas.getContext('2d');
    generateBrainModel();
    animateAvatar();
}

function animateAvatar() {
    if (!avatarCtx || !avatarCanvas) return;
    const ctx = avatarCtx;
    const w = avatarCanvas.width;
    const h = avatarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const isSpeaking = ('speechSynthesis' in window && window.speechSynthesis.speaking);
    avatarAngle += isSpeaking ? 0.035 : 0.018;
    const pitch = Math.sin(avatarAngle * 0.6) * 0.15 + 0.1;

    // Mood-specific color palette
    let primaryColor = '#66ccff';
    let sparkColor = '#ffe253';
    if (meenaCurrentMood === 'TACTICAL') {
        primaryColor = '#ff4d4d';
        sparkColor = '#ffffff';
    } else if (meenaCurrentMood === 'CARING') {
        primaryColor = '#ffe253';
        sparkColor = '#adc6ff';
    } else if (meenaCurrentMood === 'PROUD') {
        primaryColor = '#d946ef';
        sparkColor = '#66ccff';
    }

    const cosY = Math.cos(avatarAngle);
    const sinY = Math.sin(avatarAngle);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);

    const fov = 110;
    const distance = 55;

    // Excitation multiplier during vocal speech
    const pulseFactor = isSpeaking ? (1 + Math.sin(avatarAngle * 8) * 0.14) : 1.0;

    // 1. Transform & Project 3D Nodes
    const projected = brainNodes.map((n, idx) => {
        // Yaw Rotation (Around Y)
        const x1 = (n.x * cosY - n.z * sinY) * pulseFactor;
        const z1 = (n.x * sinY + n.z * cosY) * pulseFactor;
        const y1 = n.y * pulseFactor;

        // Pitch Rotation (Around X)
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        const scale = fov / (z2 + distance);
        const px = cx + x1 * scale;
        const py = cy - y2 * scale; // Invert Y for canvas
        const depthAlpha = Math.max(0.15, Math.min(1.0, (z2 + 25) / 50));

        return { px, py, z: z2, scale, depthAlpha, idx };
    });

    // 2. Draw Synaptic Connective Lines
    ctx.lineWidth = 0.7;
    brainEdges.forEach(edge => {
        const p1 = projected[edge.from];
        const p2 = projected[edge.to];
        if (!p1 || !p2) return;

        const avgAlpha = (p1.depthAlpha + p2.depthAlpha) * 0.5 * 0.35;
        ctx.strokeStyle = primaryColor;
        ctx.globalAlpha = isSpeaking ? avgAlpha * 1.8 : avgAlpha;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
    });

    // 3. Draw Traveling Neural Synapse Sparks
    neuralSparks.forEach(sp => {
        sp.progress += isSpeaking ? sp.speed * 2.2 : sp.speed;
        if (sp.progress > 1.0) {
            sp.progress = 0;
            sp.edgeIdx = Math.floor(Math.random() * brainEdges.length);
        }
        const edge = brainEdges[sp.edgeIdx];
        if (!edge) return;
        const p1 = projected[edge.from];
        const p2 = projected[edge.to];
        if (!p1 || !p2) return;

        const sx = p1.px + (p2.px - p1.px) * sp.progress;
        const sy = p1.py + (p2.py - p1.py) * sp.progress;

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = sparkColor;
        ctx.shadowColor = sparkColor;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 4. Draw Dot-Matrix Neural Nodes (Sorted Back-to-Front)
    projected.sort((a, b) => a.z - b.z);
    projected.forEach(p => {
        ctx.globalAlpha = p.depthAlpha;
        ctx.fillStyle = primaryColor;
        const rad = Math.max(0.6, (p.scale * 0.9));
        
        ctx.beginPath();
        ctx.arc(p.px, p.py, rad, 0, Math.PI * 2);
        ctx.fill();
    });

    // 5. Draw Sci-Fi HUD Framing Brackets
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1;
    // Left bracket [
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(3, 6);
    ctx.lineTo(3, h - 6);
    ctx.lineTo(8, h - 6);
    ctx.stroke();
    // Right bracket ]
    ctx.beginPath();
    ctx.moveTo(w - 8, 6);
    ctx.lineTo(w - 3, 6);
    ctx.lineTo(w - 3, h - 6);
    ctx.lineTo(w - 8, h - 6);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(animateAvatar);
}

/**
 * ==========================================================================
 * MEENA CONVERSATIONAL AI BRAIN (Gemini Flash + Japanese Accent Heuristics)
 * ==========================================================================
 */
async function askMeenaAI(question) {
    const bank = getKnowledgeBank();
    const memoryContext = bank.length > 0 ? ("\nThings Sensei taught you: " + bank.map(m => `[${m.category}] ${m.fact}`).join("; ")) : "";
    
    const prompt = `You are Meena™ (高原学園), an energetic, cheerful young female AI personal assistant for home base Takahara Academy. Always reply in fluent, natural English with Japanese honorifics and expressions (Sensei, Ohayou, Konnichiwa, Hai, Otsukare, Arigato). Address the user respectfully as Sensei.${memoryContext}\n\nSensei asks: "${question}".\nRespond in 1-2 concise, cheerful spoken sentences in English with Japanese flair:`;
    
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            if (res.ok) {
                const data = await res.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) {
                    speakComputerVoice(reply.replace(/[*_#]/g, ''));
                    return;
                }
            }
        } catch (e) {
            console.warn("Gemini AI fetch error:", e);
        }
    }
    
    // Offline intelligent anime companion responses in English with Japanese accent
    const q = question.toLowerCase();
    if (q.includes('who are you') || q.includes('introduce') || q.includes('siapa')) {
        speakComputerVoice("I am M.E.E.N.A., your personal AI tactical assistant for Takahara Academy! I manage all our home systems, defense shields, and telemetry for you, Sensei!");
    } else if (q.includes('takahara') || q.includes('home base') || q.includes('markas')) {
        speakComputerVoice("Takahara Academy is our home operations center! All perimeter barriers and telemetry nodes are secure and nominal, Sensei!");
    } else if (q.includes('how are you') || q.includes('apa khabar') || q.includes('genki')) {
        speakComputerVoice("All neural pathways are running at maximum performance, Sensei! Standing by and ready for your orders!");
    } else if (q.includes('thank you') || q.includes('terima kasih') || q.includes('arigato')) {
        setMeenaMood('CARING');
        speakComputerVoice("Douitashimashite, Sensei! It is always my pleasure to assist you!");
    } else {
        speakComputerVoice(`Acknowledged, Sensei! Meena is standing by at Takahara Academy.`);
    }
}

function speakVerbalStatusReport() {
    const cpu = document.getElementById('cpu-val') ? document.getElementById('cpu-val').innerText : '24%';
    const mem = document.getElementById('mem-val') ? document.getElementById('mem-val').innerText : '26%';
    const temp = document.getElementById('temp-val') ? document.getElementById('temp-val').innerText : '52°C';
    const pihole = document.getElementById('header-pihole-pct') ? document.getElementById('header-pihole-pct').innerText : 'active';

    speakComputerVoice(`Tactical status report, Sensei! CPU load is at ${cpu}, memory utilization ${mem}, core temperature ${temp}. Pi-hole defense shield is ${pihole}! All systems green and ready for action!`);
}

function speakVerbalWeatherReport() {
    const temp = document.getElementById('wx-temp') ? document.getElementById('wx-temp').innerText : '31';
    const desc = document.getElementById('wx-desc') ? document.getElementById('wx-desc').innerText : 'partly cloudy';
    const hum = document.getElementById('wx-humidity') ? document.getElementById('wx-humidity').innerText : '75%';
    const wind = document.getElementById('wx-wind') ? document.getElementById('wx-wind').innerText : '12 km/h';

    speakComputerVoice(`Atmospheric report for Terra base, Sensei! Current temperature is ${temp} degrees Celsius with ${desc}. Relative humidity is ${hum}, surface wind is ${wind}. Perfect weather for our mission!`);
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
window.rememberCategorizedFact = rememberCategorizedFact;
window.recallMemories = recallMemories;
window.clearMemories = clearMemories;
window.askMeenaAI = askMeenaAI;
window.addMeenaEXP = addMeenaEXP;
window.getMeenaGrowthStatus = getMeenaGrowthStatus;
window.updateGrowthUI = updateGrowthUI;
window.setMeenaMood = setMeenaMood;
window.filterKnowledgeCategory = filterKnowledgeCategory;
window.renderKnowledgeBank = renderKnowledgeBank;
window.deleteKnowledgeItem = deleteKnowledgeItem;
window.executeTeachNote = executeTeachNote;
window.initMeenaAvatarCanvas = initMeenaAvatarCanvas;

