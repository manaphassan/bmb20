/**
 * ==============================================================================
 * MEENA // TAKAHARA ACADEMY (高原学園) - AUTONOMOUS ROUTINE & WAKTU SOLAT MATRIX
 * Malaysian Prayer Time Engine, Hourly Stardate Chime, & Daily Automation Routines
 * ==============================================================================
 */

const PRAYER_ZONES = [
    { code: "WLY01", name: "Kuala Lumpur, Putrajaya" },
    { code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor" },
    { code: "SGR02", name: "Klang, Kuala Langat" },
    { code: "SGR03", name: "Kuala Selangor, Sabak Bernam" },
    { code: "JHR02", name: "Johor Bahru, Kulai, Kota Tinggi" },
    { code: "PNG01", name: "Pulau Pinang" },
    { code: "PRK02", name: "Ipoh, Batu Gajah, Kampar" },
    { code: "MLK01", name: "Melaka" },
    { code: "NSN01", name: "Seremban, Port Dickson" },
    { code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" },
    { code: "KTN01", name: "Kota Bharu, Bachok, Pasir Puteh, Tumpat" },
    { code: "TRG01", name: "Kuala Terengganu, Marang, Kuala Nerus" },
    { code: "SBH01", name: "Kota Kinabalu, Penampang, Tuaran" },
    { code: "SWK08", name: "Kuching, Bau, Lundu, Samarahan" }
];

let activePrayerZone = localStorage.getItem('meena_prayer_zone') || 'WLY01';
let prayerTimesToday = null;
let lastNotifiedPrayer = null;
let lastBriefingDate = localStorage.getItem('meena_last_briefing_date') || '';
let isNightModeActive = false;

// Hourly ping debounce
let lastHourlyChimeHour = -1;

/**
 * Fetch and sync Waktu Solat schedule
 */
async function fetchWaktuSolat(zone = activePrayerZone) {
    try {
        const url = `https://api.waktusolat.app/v2/solat/${zone}`;
        const res = await fetch(url, { cache: 'default' });
        if (res.ok) {
            const data = await res.json();
            if (data && data.prayers && data.prayers.length > 0) {
                // Find today's prayer times
                const todayTimestamp = Math.floor(Date.now() / 1000);
                const todayPrayers = data.prayers.find(p => {
                    const d = new Date(p.fajr * 1000);
                    const now = new Date();
                    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }) || data.prayers[0];

                if (todayPrayers) {
                    prayerTimesToday = {
                        subuh: formatUnixToTimeStr(todayPrayers.fajr),
                        syuruk: formatUnixToTimeStr(todayPrayers.syuruk),
                        zohor: formatUnixToTimeStr(todayPrayers.dhuhr),
                        asar: formatUnixToTimeStr(todayPrayers.asr),
                        maghrib: formatUnixToTimeStr(todayPrayers.maghrib),
                        isyak: formatUnixToTimeStr(todayPrayers.isha),
                        raw: todayPrayers
                    };
                    localStorage.setItem('meena_cached_prayers', JSON.stringify({ date: new Date().toDateString(), zone, data: prayerTimesToday }));
                    updatePrayerBadgeUI();
                    return;
                }
            }
        }
    } catch(e) {
        console.warn("[RoutineScheduler] Online prayer fetch error, using local fallback:", e);
    }

    // Fallback: Use cached or calculated approximations for Malaysia (WLY01 default)
    const cached = localStorage.getItem('meena_cached_prayers');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.data) {
                prayerTimesToday = parsed.data;
                updatePrayerBadgeUI();
                return;
            }
        } catch(err) {}
    }

    // Static default astronomical baseline for Kuala Lumpur
    prayerTimesToday = {
        subuh: "05:58",
        syuruk: "07:10",
        zohor: "13:22",
        asar: "16:40",
        maghrib: "19:28",
        isyak: "20:39"
    };
    updatePrayerBadgeUI();
}

function formatUnixToTimeStr(unixSec) {
    if (!unixSec) return "--:--";
    const d = new Date(unixSec * 1000);
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
}

/**
 * Calculates current prayer or countdown to next prayer
 */
function getNextPrayerInfo() {
    if (!prayerTimesToday) return null;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const prayers = [
        { name: "SUBUH", key: "subuh", time: prayerTimesToday.subuh },
        { name: "SYURUK", key: "syuruk", time: prayerTimesToday.syuruk },
        { name: "ZOHOR", key: "zohor", time: prayerTimesToday.zohor },
        { name: "ASAR", key: "asar", time: prayerTimesToday.asar },
        { name: "MAGHRIB", key: "maghrib", time: prayerTimesToday.maghrib },
        { name: "ISYAK", key: "isyak", time: prayerTimesToday.isyak }
    ];

    for (let i = 0; i < prayers.length; i++) {
        const [pHours, pMins] = prayers[i].time.split(':').map(Number);
        const prayerTotalMins = pHours * 60 + pMins;
        const diff = prayerTotalMins - currentMins;

        if (diff > 0) {
            const hoursLeft = Math.floor(diff / 60);
            const minsLeft = diff % 60;
            const timeDiffStr = hoursLeft > 0 ? `-${hoursLeft}h ${minsLeft}m` : `-${minsLeft}m`;
            return {
                next: prayers[i].name,
                time: prayers[i].time,
                diffMins: diff,
                diffStr: timeDiffStr,
                current: i > 0 ? prayers[i-1].name : "ISYAK"
            };
        }
    }

    // After Isyak, next is tomorrow's Subuh
    return {
        next: "SUBUH (ESOK)",
        time: prayerTimesToday.subuh,
        diffMins: 480,
        diffStr: "ESOK",
        current: "ISYAK"
    };
}

/**
 * Update Header Prayer Badge UI
 */
function updatePrayerBadgeUI() {
    const badge = document.getElementById('header-prayer-badge');
    const label = document.getElementById('header-prayer-text');
    if (!badge || !label) return;

    const info = getNextPrayerInfo();
    if (!info) {
        label.innerText = "SOLAT: SYNCING";
        return;
    }

    label.innerText = `SOLAT: ${info.next} ${info.time} (${info.diffStr})`;
    badge.title = `Zon: ${activePrayerZone} | Waktu Semasa: ${info.current} | Seterusnya: ${info.next} pada ${info.time}`;
}

/**
 * Check Prayer Times & Trigger Announcements
 */
function evaluatePrayerTimeTriggers() {
    if (!prayerTimesToday) return;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const prayers = [
        { name: "Subuh", time: prayerTimesToday.subuh },
        { name: "Zohor", time: prayerTimesToday.zohor },
        { name: "Asar", time: prayerTimesToday.asar },
        { name: "Maghrib", time: prayerTimesToday.maghrib },
        { name: "Isyak", time: prayerTimesToday.isyak }
    ];

    const prayerNotifEnabled = localStorage.getItem('meena_prayer_notif') !== 'false';
    if (!prayerNotifEnabled) return;

    prayers.forEach(p => {
        const [pHours, pMins] = p.time.split(':').map(Number);
        const prayerTotalMins = pHours * 60 + pMins;

        // Exact minute match (diff === 0)
        if (currentMins === prayerTotalMins && lastNotifiedPrayer !== `${p.name}_${now.toDateString()}`) {
            lastNotifiedPrayer = `${p.name}_${now.toDateString()}`;
            
            const zoneObj = PRAYER_ZONES.find(z => z.code === activePrayerZone) || { name: "Kuala Lumpur" };
            const title = `MASUK WAKTU SOLAT ${p.name.toUpperCase()}`;
            const message = `Telah masuk waktu solat fardhu ${p.name} (${p.time}) bagi kawasan ${zoneObj.name}.`;

            if (window.showNotificationAlert) {
                window.showNotificationAlert(title, message, "task", { speak: true, forceOsNotify: true });
            } else if (window.speakComputerVoice) {
                window.speakComputerVoice(`Telah masuk waktu solat ${p.name} bagi kawasan ${zoneObj.name}.`);
            }
        }
    });
}

/**
 * Evaluate Autonomous Daily Routines (Morning Briefing, Night Mode, Hourly Chime)
 */
function evaluateDailyRoutines() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const todayStr = now.toDateString();

    // 1. Automated Morning Briefing (Default 07:30 AM)
    const morningBriefingEnabled = localStorage.getItem('meena_auto_briefing') !== 'false';
    const briefingTargetHour = parseInt(localStorage.getItem('meena_briefing_hour') || '7', 10);
    const briefingTargetMin = parseInt(localStorage.getItem('meena_briefing_min') || '30', 10);

    if (morningBriefingEnabled && hour === briefingTargetHour && minute === briefingTargetMin && lastBriefingDate !== todayStr) {
        lastBriefingDate = todayStr;
        localStorage.setItem('meena_last_briefing_date', todayStr);
        if (window.triggerMorningBriefing) {
            window.triggerMorningBriefing();
        }
    }

    // 2. Night Low-Power Sentinel Mode (23:00 PM)
    const nightModeEnabled = localStorage.getItem('meena_auto_night_mode') !== 'false';
    if (nightModeEnabled) {
        if ((hour >= 23 || hour < 6) && !isNightModeActive) {
            isNightModeActive = true;
            document.body.classList.add('night-ambient-mode');
        } else if (hour >= 6 && hour < 23 && isNightModeActive) {
            isNightModeActive = false;
            document.body.classList.remove('night-ambient-mode');
        }
    }

    // 3. Hourly Tactical Stardate Chime
    const hourlyChimeEnabled = localStorage.getItem('meena_hourly_chime') !== 'false';
    if (hourlyChimeEnabled && minute === 0 && lastHourlyChimeHour !== hour) {
        lastHourlyChimeHour = hour;
        // Only chime during awake hours (08:00 to 22:00)
        if (hour >= 8 && hour <= 22) {
            if (window.playSound) window.playSound('ping');
            if (window.showNotificationAlert) {
                const hourFormatted = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
                window.showNotificationAlert("CHRONOMETER PING", `Tactical stardate chronometer: ${hourFormatted}. All deck stations nominal.`, "info", { silent: true });
            }
        }
    }
}

/**
 * Render Visual Waktu Solat Sun & Moon Timeline Arc (Deck 3)
 */
function renderSolatTimelineArc() {
    if (!prayerTimesToday) return;

    const sunDot = document.getElementById('solat-arc-sun-dot');
    const statusLabel = document.getElementById('solat-arc-status-label');

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Map 24-hour day to 0-100% position on the arc
    const pct = Math.min(100, Math.max(0, (currentMins / 1440) * 100));

    if (sunDot) {
        sunDot.style.left = `${pct}%`;
        const isDaytime = currentMins >= (6 * 60 + 30) && currentMins <= (19 * 60 + 20);
        sunDot.style.background = isDaytime ? '#ffe253' : '#c2c1ff';
        sunDot.style.boxShadow = isDaytime 
            ? '0 0 12px #ffe253, 0 0 24px rgba(255, 226, 83, 0.6)' 
            : '0 0 12px #c2c1ff, 0 0 24px rgba(194, 193, 255, 0.6)';
    }

    const info = getNextPrayerInfo();
    if (statusLabel && info) {
        statusLabel.innerHTML = `Waktu Semasa: <strong class="text-tertiary font-bold">${info.current}</strong> &bull; Seterusnya: <strong class="text-lcars-gold font-bold">${info.next} (${info.time})</strong> berbaki <strong class="text-primary font-bold">${info.diffStr}</strong>`;
    }

    // Highlight active checkpoint node
    const prayerKeys = ['subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak'];
    prayerKeys.forEach(k => {
        const elem = document.getElementById(`solat-node-${k}`);
        const timeElem = document.getElementById(`solat-time-${k}`);
        if (elem && prayerTimesToday[k]) {
            if (timeElem) timeElem.innerText = prayerTimesToday[k];
            if (info && (info.current.toLowerCase() === k || info.next.toLowerCase().startsWith(k))) {
                elem.className = "flex flex-col items-center p-2 rounded-lg bg-tertiary/20 border border-tertiary/60 shadow-[0_0_10px_rgba(255,226,83,0.3)] scale-105 transition-all";
            } else {
                elem.className = "flex flex-col items-center p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 transition-all";
            }
        }
    });
}

/**
 * Set and persist active prayer zone
 */
function setPrayerZone(zoneCode) {
    if (!zoneCode) return;
    activePrayerZone = zoneCode;
    localStorage.setItem('meena_prayer_zone', zoneCode);
    fetchWaktuSolat(zoneCode);
}

/**
 * Initialization lifecycle
 */
function initRoutineScheduler() {
    fetchWaktuSolat(activePrayerZone);

    // Evaluate triggers every 15 seconds
    setInterval(() => {
        evaluatePrayerTimeTriggers();
        evaluateDailyRoutines();
        updatePrayerBadgeUI();
        renderSolatTimelineArc();
    }, 15000);

    // Re-fetch prayer schedule every 6 hours
    setInterval(() => fetchWaktuSolat(activePrayerZone), 6 * 3600 * 1000);
}

// Window global bindings
window.initRoutineScheduler = initRoutineScheduler;
window.setPrayerZone = setPrayerZone;
window.fetchWaktuSolat = fetchWaktuSolat;
window.PRAYER_ZONES = PRAYER_ZONES;
window.getNextPrayerInfo = getNextPrayerInfo;
window.renderSolatTimelineArc = renderSolatTimelineArc;
