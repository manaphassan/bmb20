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
 * LCARS Computer Voice Synthesizer (Web Speech API)
 * Modeled after Starfleet Computer Voice cadence
 */
function speakComputerVoice(text) {
    if (!audioActive || !voiceEnabled || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel(); // Stop overlapping speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
        utterance.volume = 0.95;

        // Attempt to find smooth English female voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha') || v.lang.startsWith('en')));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("Computer speech synthesis skipped:", e);
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

        speakComputerVoice("Warp engines engaged.");
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
    speakComputerVoice("Red alert. Shields up. Tactical battle stations.");

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
    speakComputerVoice("Condition yellow. Stand by.");
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
            speakComputerVoice("Computer audio interface online.");
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

// Window Global Exports
window.playSound = playSound;
window.toggleAudio = toggleAudio;
window.startRedAlertKlaxon = startRedAlertKlaxon;
window.stopRedAlertKlaxon = stopRedAlertKlaxon;
window.playYellowAlertChirp = playYellowAlertChirp;
window.playDoorChime = playDoorChime;
window.playWarpSequence = playWarpSequence;
window.playTransporterChime = playTransporterChime;
window.speakComputerVoice = speakComputerVoice;
