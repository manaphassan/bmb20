/**
 * ==========================================================================
 * MEENA™ SETTINGS & HARDWARE MAINTENANCE CONTROLLER (js/settings.js)
 * Centralized settings manager for AI personas, voice, Gemini API, and DietPi
 * ==========================================================================
 */

function switchTab(tabId) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.settings-nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-l-4', 'border-primary');
        b.classList.add('text-secondary', 'hover:bg-surface-container-high');
    });

    const panel = document.getElementById(`panel-${tabId}`);
    const btn = document.getElementById(`tab-btn-${tabId}`);
    if (panel) panel.classList.remove('hidden');
    if (btn) {
        btn.classList.add('active', 'bg-primary/20', 'text-primary', 'border-l-4', 'border-primary');
        btn.classList.remove('text-secondary', 'hover:bg-surface-container-high');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('ai-voice');
    loadAllSettings();
});

function loadAllSettings() {
    // 1. Persona
    const persona = localStorage.getItem('meena_persona') || 'ALEX';
    const alexRadio = document.getElementById('persona-alex');
    const takaharaRadio = document.getElementById('persona-takahara');
    if (alexRadio && takaharaRadio) {
        if (persona === 'ALEX') {
            alexRadio.checked = true;
        } else {
            takaharaRadio.checked = true;
        }
    }

    // 2. Sliders
    const rate = localStorage.getItem('meena_speech_rate') || '1.14';
    const pitch = localStorage.getItem('meena_speech_pitch') || '1.10';
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const rateTxt = document.getElementById('rate-val-txt');
    const pitchTxt = document.getElementById('pitch-val-txt');

    if (rateSlider && rateTxt) {
        rateSlider.value = rate;
        rateTxt.innerText = `${parseFloat(rate).toFixed(2)}x`;
    }
    if (pitchSlider && pitchTxt) {
        pitchSlider.value = pitch;
        pitchTxt.innerText = `${parseFloat(pitch).toFixed(2)}x`;
    }

    // 3. Gemini Key
    const key = localStorage.getItem('gemini_api_key') || '';
    const keyInput = document.getElementById('gemini-key-input');
    const keyStatus = document.getElementById('gemini-status-label');
    if (keyInput && key) {
        keyInput.value = key;
    }
    if (keyStatus) {
        if (key) {
            keyStatus.innerText = 'Status: Gemini 1.5 Flash Active 🟢';
            keyStatus.className = 'font-bold text-tertiary';
        } else {
            keyStatus.innerText = 'Status: Offline Local Brain (0 Tokens)';
            keyStatus.className = 'font-bold text-primary';
        }
    }

    // 4. Token Metrics
    const tokens = localStorage.getItem('meena_daily_tokens') || '0';
    const cost = localStorage.getItem('meena_daily_cost') || '0.00';
    const tokElem = document.getElementById('stat-tokens-today');
    const costElem = document.getElementById('stat-cost-today');
    if (tokElem) tokElem.innerText = parseInt(tokens, 10).toLocaleString();
    if (costElem) costElem.innerText = `$${cost}`;

    // 5. Calendar Config
    fetch('api.php?action=get_calendar_config')
        .then(r => r.json())
        .then(d => {
            const calInput = document.getElementById('settings-ical-input');
            if (calInput && d.ical_url) {
                calInput.value = d.ical_url;
            }
        })
        .catch(() => {});

    // 6. Speech Voices
    populateVoices();
}

function populateVoices() {
    if (!('speechSynthesis' in window)) return;
    const select = document.getElementById('voice-select');
    if (!select) return;
    
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
        return;
    }

    const current = localStorage.getItem('meena_voice_name') || '';
    select.innerHTML = '';
    voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.innerText = `${v.name} (${v.lang})`;
        if (v.name === current) opt.selected = true;
        select.appendChild(opt);
    });
}

function savePersonaSetting(p) {
    localStorage.setItem('meena_persona', p);
}

function changeVoiceSetting(name) {
    localStorage.setItem('meena_voice_name', name);
}

function updateRateSlider(v) {
    const txt = document.getElementById('rate-val-txt');
    if (txt) txt.innerText = `${parseFloat(v).toFixed(2)}x`;
    localStorage.setItem('meena_speech_rate', v);
}

function updatePitchSlider(v) {
    const txt = document.getElementById('pitch-val-txt');
    if (txt) txt.innerText = `${parseFloat(v).toFixed(2)}x`;
    localStorage.setItem('meena_speech_pitch', v);
}

function testVoicePreview() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = "All Takahara Academy settings verified, Sensei. Systems operational.";
    const u = new SpeechSynthesisUtterance(text);
    const vName = localStorage.getItem('meena_voice_name');
    const rate = parseFloat(localStorage.getItem('meena_speech_rate') || '1.14');
    const pitch = parseFloat(localStorage.getItem('meena_speech_pitch') || '1.10');
    
    if (vName) {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find(v => v.name === vName);
        if (matched) u.voice = matched;
    }
    u.rate = rate;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
}

function saveGeminiKey() {
    const input = document.getElementById('gemini-key-input');
    const k = input ? input.value.trim() : '';
    if (!k) return;
    localStorage.setItem('gemini_api_key', k);
    
    const keyStatus = document.getElementById('gemini-status-label');
    if (keyStatus) {
        keyStatus.innerText = 'Status: Gemini 1.5 Flash Active 🟢';
        keyStatus.className = 'font-bold text-tertiary';
    }
    alert('Gemini API key saved successfully!');
}

function clearGeminiKey() {
    localStorage.removeItem('gemini_api_key');
    const input = document.getElementById('gemini-key-input');
    if (input) input.value = '';
    
    const keyStatus = document.getElementById('gemini-status-label');
    if (keyStatus) {
        keyStatus.innerText = 'Status: Offline Local Brain (0 Tokens)';
        keyStatus.className = 'font-bold text-primary';
    }
    alert('Gemini key removed. Meena is now operating in 100% Offline Local Brain mode.');
}

function resetTokenQuota() {
    localStorage.setItem('meena_daily_tokens', '0');
    localStorage.setItem('meena_daily_cost', '0.00');
    const tokElem = document.getElementById('stat-tokens-today');
    const costElem = document.getElementById('stat-cost-today');
    if (tokElem) tokElem.innerText = '0';
    if (costElem) costElem.innerText = '$0.00';
}

async function saveCalendarSetting() {
    const input = document.getElementById('settings-ical-input');
    const url = input ? input.value.trim() : '';
    if (!url) {
        alert('Please enter a valid Google Calendar Secret iCal address (.ics)');
        return;
    }
    const res = await fetch('api.php?action=save_calendar_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: url, enabled: true, updated_at: new Date().toISOString() })
    });
    if (res.ok) {
        alert('Google Calendar synchronization URL saved successfully!');
    }
}

function exportKnowledgeJSON() {
    const data = localStorage.getItem('meena_knowledge_bank') || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takahara_meena_knowledge_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
}

function importKnowledgeJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (Array.isArray(parsed)) {
                localStorage.setItem('meena_knowledge_bank', JSON.stringify(parsed));
                alert(`Successfully imported ${parsed.length} knowledge nodes!`);
            }
        } catch(err) {
            alert('Invalid JSON file format.');
        }
    };
    reader.readAsText(file);
}

async function executeMaintenanceAction(action) {
    if (!confirm(`Are you sure you want to execute ${action}?`)) return;
    try {
        const res = await fetch(`api.php?action=${action}`);
        if (res.ok) {
            const d = await res.json();
            alert(`Result: ${d.result || 'Executed successfully.'}`);
        }
    } catch(e) {
        alert('Action execution failed');
    }
}
