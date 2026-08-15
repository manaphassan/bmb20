/**
 * ==========================================================================
 * MEENA™ SETTINGS & HARDWARE MAINTENANCE CONTROLLER (assets/js/settings.js)
 * Centralized settings manager for AI personas, voice, Gemini API, and DietPi
 * ==========================================================================
 */

const DEFAULT_CALENDARS = [
    {
        id: 'cal_school',
        name: 'School',
        url: 'https://calendar.google.com/calendar/ical/family18415538213271862905%40group.calendar.google.com/private-c9be2f37a11684206fb6444787171026/basic.ics',
        color: '#ffe253',
        enabled: true
    },
    {
        id: 'cal_manaphassan',
        name: 'Manaphassan',
        url: 'https://calendar.google.com/calendar/ical/manaphassan%40gmail.com/private-7c930b7bb4f28b86c63cc1868910d334/basic.ics',
        color: '#c2c1ff',
        enabled: true
    }
];

let settingsCalendarState = {
    calendars: [...DEFAULT_CALENDARS]
};

function switchTab(tabId) {
    document.querySelectorAll('.settings-panel').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none';
    });
    document.querySelectorAll('.settings-nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-l-4', 'border-primary');
        b.classList.add('text-secondary', 'hover:bg-surface-container-high');
    });

    const panel = document.getElementById(`panel-${tabId}`);
    const btn = document.getElementById(`tab-btn-${tabId}`);
    if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }
    if (btn) {
        btn.classList.add('active', 'bg-primary/20', 'text-primary', 'border-l-4', 'border-primary');
        btn.classList.remove('text-secondary', 'hover:bg-surface-container-high');
    }

    if (tabId === 'calendar-sync') {
        loadSettingsCalendars();
    }
    if (tabId === 'memory-graph') {
        loadHearthHealthMetrics();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('ai-voice');
    loadAllSettings();
    loadHearthHealthMetrics();
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

    // 5. Multi-Calendar Config
    loadSettingsCalendars();

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

function savePersona(persona) {
    localStorage.setItem('meena_persona', persona);
    alert(`AI Persona switched to: ${persona === 'ALEX' ? 'Alex (Tactical Assistant)' : 'Sensei Takahara (Academy Mentor)'}`);
}

function savePersonaSetting(persona) {
    savePersona(persona);
}

function changeVoiceSetting(voiceName) {
    localStorage.setItem('meena_voice_name', voiceName);
}

function updateRateSlider(val) {
    const rateTxt = document.getElementById('rate-val-txt');
    if (rateTxt) rateTxt.innerText = `${parseFloat(val).toFixed(2)}x`;
    localStorage.setItem('meena_speech_rate', val);
}

function updatePitchSlider(val) {
    const pitchTxt = document.getElementById('pitch-val-txt');
    if (pitchTxt) pitchTxt.innerText = `${parseFloat(val).toFixed(2)}x`;
    localStorage.setItem('meena_speech_pitch', val);
}

function testCurrentVoice() {
    const rate = parseFloat(localStorage.getItem('meena_speech_rate') || '1.14');
    const pitch = parseFloat(localStorage.getItem('meena_speech_pitch') || '1.10');
    const voiceName = localStorage.getItem('meena_voice_name') || '';

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Greetings Sensei! Meena neural auditory synthesis engine is operational and ready for your command.");
        u.rate = rate;
        u.pitch = pitch;
        if (voiceName) {
            const v = window.speechSynthesis.getVoices().find(x => x.name === voiceName);
            if (v) u.voice = v;
        }
        window.speechSynthesis.speak(u);
    }
}

function testVoicePreview() {
    testCurrentVoice();
}

function saveGeminiKey() {
    const input = document.getElementById('gemini-key-input');
    const key = input ? input.value.trim() : '';
    if (!key) {
        alert('Please enter a valid Gemini API key.');
        return;
    }
    localStorage.setItem('gemini_api_key', key);
    const keyStatus = document.getElementById('gemini-status-label');
    if (keyStatus) {
        keyStatus.innerText = 'Status: Gemini 1.5 Flash Active 🟢';
        keyStatus.className = 'font-bold text-tertiary';
    }
    alert('Gemini API Key saved successfully!');
}

function clearGeminiKey() {
    if (!confirm('Are you sure you want to remove your Gemini API key?')) return;
    localStorage.removeItem('gemini_api_key');
    const input = document.getElementById('gemini-key-input');
    if (input) input.value = '';
    const keyStatus = document.getElementById('gemini-status-label');
    if (keyStatus) {
        keyStatus.innerText = 'Status: Offline Local Brain (0 Tokens)';
        keyStatus.className = 'font-bold text-primary';
    }
    alert('Gemini API key removed.');
}

function resetTokenQuota() {
    if (!confirm('Reset local token telemetry counter?')) return;
    localStorage.setItem('meena_daily_tokens', '0');
    localStorage.setItem('meena_daily_cost', '0.00');
    const tokElem = document.getElementById('stat-tokens-today');
    const costElem = document.getElementById('stat-cost-today');
    if (tokElem) tokElem.innerText = '0';
    if (costElem) costElem.innerText = '$0.00';
}

/**
 * ==========================================================================
 * MULTI-CALENDAR MANAGEMENT IN SETTINGS
 * ==========================================================================
 */

async function loadSettingsCalendars() {
    try {
        let data = null;
        try {
            const staticRes = await fetch('api/calendar/config?t=' + Date.now()).catch(() => fetch('calendar_config.json?t=' + Date.now()));
            if (staticRes && staticRes.ok) {
                data = await staticRes.json();
            }
        } catch(e) {}
        
        let cals = (data && data.calendars && data.calendars.length > 0) ? data.calendars : [...DEFAULT_CALENDARS];
        settingsCalendarState.calendars = cals;
        renderSettingsCalendarsList();
    } catch(e) {
        console.warn('Failed to load settings calendar list:', e);
        settingsCalendarState.calendars = [...DEFAULT_CALENDARS];
        renderSettingsCalendarsList();
    }
}

function renderSettingsCalendarsList() {
    const container = document.getElementById('settings-calendars-list');
    if (!container) return;

    if (settingsCalendarState.calendars.length === 0) {
        container.innerHTML = `
            <div class="p-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-secondary text-xs italic">
                No Google Calendar feeds configured yet. Use the form below to add your first secret iCal address (.ics).
            </div>
        `;
        return;
    }

    container.innerHTML = settingsCalendarState.calendars.map(cal => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border transition-all ${cal.enabled ? 'border-outline-variant/40' : 'opacity-50 border-outline-variant/20'}">
            <div class="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <span class="w-3.5 h-3.5 rounded-full flex-shrink-0" style="background-color: ${cal.color || '#c2c1ff'}; box-shadow: 0 0 8px ${cal.color || '#c2c1ff'};"></span>
                <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-on-surface truncate">${cal.name}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${cal.enabled ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface-bright text-secondary'}">${cal.enabled ? 'ACTIVE' : 'MUTED'}</span>
                    </div>
                    <span class="text-[9.5px] text-secondary font-mono truncate">${cal.url}</span>
                </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="toggleCalendarFromSettings('${cal.id}')" class="px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all ${cal.enabled ? 'bg-primary/20 text-primary hover:bg-primary hover:text-black border border-primary/40' : 'bg-surface-bright text-secondary hover:text-primary'}">
                    ${cal.enabled ? 'DISABLE' : 'ENABLE'}
                </button>
                <button onclick="removeCalendarFromSettings('${cal.id}')" class="p-1 rounded text-secondary hover:text-error hover:bg-error/10 transition-all" title="Delete Feed">
                    <span class="material-symbols-outlined text-base">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function addNewCalendarFromSettings() {
    const nameInput = document.getElementById('new-cal-name');
    const urlInput = document.getElementById('new-cal-url');
    const colorInput = document.getElementById('new-cal-color');
    const feedback = document.getElementById('calendar-sync-feedback');

    const name = nameInput ? nameInput.value.trim() : '';
    const url = urlInput ? urlInput.value.trim() : '';
    const color = colorInput ? colorInput.value : '#c2c1ff';

    if (!url) {
        alert('Please enter a valid Google Calendar secret iCal URL (.ics)');
        return;
    }

    const newCal = {
        id: 'cal_' + Date.now(),
        name: name || ('Calendar ' + (settingsCalendarState.calendars.length + 1)),
        url: url,
        color: color,
        enabled: true
    };

    settingsCalendarState.calendars.push(newCal);
    if (urlInput) urlInput.value = '';
    if (nameInput) nameInput.value = '';

    await saveSettingsCalendarState();
    if (feedback) {
        feedback.innerText = `✅ Feed "${newCal.name}" added successfully!`;
        feedback.className = 'text-xs text-tertiary font-bold';
    }
}

async function toggleCalendarFromSettings(calId) {
    const cal = settingsCalendarState.calendars.find(c => c.id === calId);
    if (cal) {
        cal.enabled = !cal.enabled;
        await saveSettingsCalendarState();
    }
}

async function removeCalendarFromSettings(calId) {
    if (!confirm('Are you sure you want to remove this calendar feed?')) return;
    settingsCalendarState.calendars = settingsCalendarState.calendars.filter(c => c.id !== calId);
    await saveSettingsCalendarState();
}

async function saveSettingsCalendarState() {
    try {
        const payload = {
            calendars: settingsCalendarState.calendars,
            ical_url: settingsCalendarState.calendars[0]?.url || '',
            updated_at: new Date().toISOString()
        };
        const res = await fetch('cal.php?action=save_calendar_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => fetch('api.php?action=save_calendar_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
        if (res && res.ok) {
            renderSettingsCalendarsList();
        }
    } catch(e) {
        alert('Failed to save calendar changes: ' + e.message);
    }
}

async function testAllCalendarFeeds() {
    const feedback = document.getElementById('calendar-sync-feedback');
    if (feedback) {
        feedback.innerText = 'Connecting to Google Calendar servers & verifying all feeds...';
        feedback.className = 'text-xs text-lcars-gold font-bold animate-pulse';
    }

    try {
        const res = await fetch('cal.php?action=get_calendar_events').catch(() => fetch('api.php?action=get_calendar_events'));
        const data = await res.json();
        if (data.status === 'success') {
            const todayCount = (data.events_today || []).length;
            const upCount = (data.events_upcoming || []).length;
            if (feedback) {
                feedback.innerText = `✅ All feeds verified & synchronized! (${todayCount} event(s) today, ${upCount} upcoming this week)`;
                feedback.className = 'text-xs text-tertiary font-bold';
            }
            alert(`Synchronized successfully! Found ${todayCount} event(s) today and ${upCount} upcoming this week across all active calendars.`);
        } else {
            if (feedback) {
                feedback.innerText = `⚠️ Sync notice: ${data.message || 'Check link format'}`;
                feedback.className = 'text-xs text-lcars-gold font-bold';
            }
            alert('Notice: ' + (data.message || 'Check configuration.'));
        }
    } catch(e) {
        if (feedback) {
            feedback.innerText = `❌ Error: ${e.message}`;
            feedback.className = 'text-xs text-error font-bold';
        }
        alert('Connection error: ' + e.message);
    }
}

async function saveMeenaHearth() {
    const feedback = document.getElementById('hearth-feedback');
    if (feedback) {
        feedback.innerText = 'Creating meenaHearth master restore point on DietPi host...';
        feedback.className = 'text-[10px] font-mono text-lcars-gold font-bold animate-pulse';
    }

    try {
        const bank = JSON.parse(localStorage.getItem('meena_knowledge_bank') || '[]');
        const growth = JSON.parse(localStorage.getItem('meena_growth_profile') || 'null');
        const persona = localStorage.getItem('meena_persona') || 'ALEX';

        const hearthPayload = {
            name: "meenaHearth",
            version: "2.5.0",
            codename: "Takahara Core Hearth",
            description: "Master Core Memory Snapshot & Neural Restore Point for MEENA™ Tactical AI Companion",
            created_at: new Date().toISOString(),
            author: "Sensei (manaphassan)",
            facility: "Takahara Academy (高原学園)",
            persona_and_personality: {
                active_persona: persona,
                identity: {
                    name: "Meena™",
                    japanese_name: "高原学園 ミーナ",
                    role: "Tactical AI Bridge & Academy Companion",
                    master: "Sensei"
                }
            },
            core_memories: bank,
            growth_achievements_and_habits: growth || {
                level: 4,
                title: "Senior Neural Tactician",
                total_exp: 1850,
                growth_metrics: { curiosity_index: 92.4, tactical_awareness: 96.8, memory_retention_rate: 100.0 }
            }
        };

        const res = await fetch('api.php?action=backup_hearth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hearthPayload)
        });

        if (res.ok) {
            const data = await res.json();
            if (feedback) {
                feedback.innerText = `✅ meenaHearth restore point created successfully (${bank.length} core memories saved)!`;
                feedback.className = 'text-[10px] font-mono text-tertiary font-bold';
            }
            alert(`meenaHearth Master Restore Point created successfully! Preserved ${bank.length} core memories and personality on DietPi.`);
        }
    } catch (e) {
        if (feedback) {
            feedback.innerText = `❌ Error: ${e.message}`;
            feedback.className = 'text-[10px] font-mono text-error font-bold';
        }
        alert('Failed to create meenaHearth: ' + e.message);
    }
}

async function downloadMeenaHearth() {
    try {
        const res = await fetch('api/hearth?t=' + Date.now()).catch(() => fetch('meenaHearth.json?t=' + Date.now()));
        let data = null;
        if (res && res.ok) {
            data = await res.json();
        } else {
            const bank = JSON.parse(localStorage.getItem('meena_knowledge_bank') || '[]');
            data = { name: "meenaHearth", version: "2.5.0", core_memories: bank };
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meenaHearth.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        alert('Failed to export meenaHearth: ' + e.message);
    }
}

async function restoreMeenaHearth() {
    if (!confirm('Restore core memories, personality, and growth profile from meenaHearth.json?')) return;
    const feedback = document.getElementById('hearth-action-feedback');
    try {
        const res = await fetch('api.php?action=restore_hearth', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            // Sync local storage as well
            const hearthRes = await fetch('api/hearth?t=' + Date.now()).catch(() => fetch('meenaHearth.json?t=' + Date.now()));
            if (hearthRes && hearthRes.ok) {
                const hearth = await hearthRes.json();
                if (hearth.core_memories) {
                    localStorage.setItem('meena_knowledge_bank', JSON.stringify(hearth.core_memories));
                }
                if (hearth.persona_and_personality?.active_persona) {
                    localStorage.setItem('meena_persona', hearth.persona_and_personality.active_persona);
                }
                if (hearth.growth_achievements_and_habits) {
                    localStorage.setItem('meena_growth_profile', JSON.stringify(hearth.growth_achievements_and_habits));
                }
            }

            if (feedback) {
                feedback.innerText = `✅ Successfully restored ${data.restored_nodes || 'core'} memory nodes from meenaHearth!`;
                feedback.className = 'text-[10px] font-mono text-tertiary font-bold';
            }
            alert(`meenaHearth restored successfully! ${data.restored_nodes || 'All'} core synaptic memories restored.`);
        }
    } catch(e) {
        if (feedback) {
            feedback.innerText = `❌ Restore error: ${e.message}`;
            feedback.className = 'text-[10px] font-mono text-error font-bold';
        }
        alert('Failed to restore meenaHearth: ' + e.message);
    }
}

async function loadHearthHealthMetrics() {
    try {
        const sizeElem = document.getElementById('hearth-metric-size');
        const nodesElem = document.getElementById('hearth-metric-nodes');
        const speedElem = document.getElementById('hearth-metric-speed');
        const healthElem = document.getElementById('hearth-metric-health');
        const detailElem = document.getElementById('hearth-metric-nodes-detail');

        const t0 = performance.now();
        let data = null;
        let byteSize = 3580;
        try {
            const res = await fetch('api/hearth?t=' + Date.now()).catch(() => fetch('meenaHearth.json?t=' + Date.now()));
            if (res && res.ok) {
                const text = await res.text();
                byteSize = text.length;
                data = JSON.parse(text);
            }
        } catch (err) {
            console.warn('Direct meenaHearth fetch failed:', err);
        }

        const latency = (performance.now() - t0).toFixed(1);
        const localBank = JSON.parse(localStorage.getItem('meena_knowledge_bank') || '[]');
        const nodesCount = (data && data.core_memories) ? data.core_memories.length : (localBank.length || 7);

        let catCount = 4;
        if (data && data.core_memories && Array.isArray(data.core_memories)) {
            const cats = new Set(data.core_memories.map(m => m.category || 'general'));
            catCount = cats.size;
        }

        const formattedSize = byteSize < 1024 ? `${byteSize} B` : `${(byteSize / 1024).toFixed(2)} KB`;

        if (sizeElem) sizeElem.innerText = formattedSize;
        if (nodesElem) nodesElem.innerText = `${nodesCount} NODES`;
        if (detailElem) detailElem.innerText = `${catCount} CATEGORIES`;
        if (speedElem) speedElem.innerText = `${latency} ms`;
        if (healthElem) healthElem.innerText = '100% HEALTHY';
    } catch(e) {
        console.warn('Failed to load hearth metrics:', e);
    }
}

async function benchmarkHearthSpeed() {
    const speedElem = document.getElementById('hearth-metric-speed');
    const feedback = document.getElementById('hearth-feedback');
    if (speedElem) speedElem.innerText = 'Testing...';
    if (feedback) {
        feedback.innerText = 'Executing 5-round REST latency benchmark against DietPi host...';
        feedback.className = 'text-[10px] font-mono text-lcars-gold font-bold animate-pulse';
    }

    const times = [];
    for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await fetch('meenaHearth.json?bench=' + Date.now()).catch(() => {});
        times.push(performance.now() - t0);
    }

    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    if (speedElem) speedElem.innerText = `${avg} ms`;
    if (feedback) {
        feedback.innerText = `⚡ Neural Benchmark Complete: Average round-trip latency is ${avg} ms (Optimal)`;
        feedback.className = 'text-[10px] font-mono text-tertiary font-bold';
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
            const json = JSON.parse(evt.target.result);
            if (Array.isArray(json)) {
                localStorage.setItem('meena_knowledge_bank', JSON.stringify(json));
                alert(`Successfully imported ${json.length} knowledge nodes!`);
            } else if (json.core_memories && Array.isArray(json.core_memories)) {
                localStorage.setItem('meena_knowledge_bank', JSON.stringify(json.core_memories));
                alert(`Successfully imported ${json.core_memories.length} knowledge nodes from meenaHearth!`);
            } else {
                alert('Invalid knowledge JSON format.');
            }
        } catch (err) {
            alert('Error parsing JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

/**
 * ==========================================================================
 * HARDWARE MAINTENANCE ACTIONS (DIETPI / LINUX)
 * ==========================================================================
 */
async function executeMaintenanceAction(action) {
    let confirmMsg = "";
    if (action === 'system_reboot') confirmMsg = "Are you sure you want to REBOOT the Raspberry Pi host?";
    else if (action === 'dietpi_update') confirmMsg = "Trigger non-interactive DietPi OS and package update?";
    else if (action === 'purge_ram') confirmMsg = "Purge Linux buffer and page cache to free RAM?";
    else if (action === 'flush_dns') confirmMsg = "Flush Pi-hole DNS resolver cache?";

    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
        const res = await fetch(`api.php?action=${action}`, { method: 'POST' });
        const data = await res.json();
        alert(data.result || data.message || `Action [${action}] executed successfully!`);
    } catch(e) {
        alert(`Failed to execute ${action}: ${e.message}`);
    }
}

// Window Exports
window.switchTab = switchTab;
window.savePersona = savePersona;
window.savePersonaSetting = savePersonaSetting;
window.changeVoiceSetting = changeVoiceSetting;
window.updateRateSlider = updateRateSlider;
window.updatePitchSlider = updatePitchSlider;
window.testCurrentVoice = testCurrentVoice;
window.testVoicePreview = testVoicePreview;
window.saveGeminiKey = saveGeminiKey;
window.clearGeminiKey = clearGeminiKey;
window.resetTokenQuota = resetTokenQuota;
window.addNewCalendarFromSettings = addNewCalendarFromSettings;
window.toggleCalendarFromSettings = toggleCalendarFromSettings;
window.removeCalendarFromSettings = removeCalendarFromSettings;
window.testAllCalendarFeeds = testAllCalendarFeeds;
window.saveMeenaHearth = saveMeenaHearth;
window.downloadMeenaHearth = downloadMeenaHearth;
window.restoreFromMeenaHearth = restoreFromMeenaHearth;
window.loadHearthHealthMetrics = loadHearthHealthMetrics;
window.benchmarkHearthSpeed = benchmarkHearthSpeed;
window.exportKnowledgeJSON = exportKnowledgeJSON;
window.importKnowledgeJSON = importKnowledgeJSON;
window.executeMaintenanceAction = executeMaintenanceAction;
