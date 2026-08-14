/**
 * ==========================================================================
 * MEENA™ MULTI-CALENDAR & CHRONO AGENDA ENGINE (assets/js/calendar.js)
 * Supports multiple Google Calendar iCal feeds with custom color tags & names
 * ==========================================================================
 */

let calendarState = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedDate: new Date(),
    eventsToday: [],
    eventsUpcoming: [],
    allEvents: [],
    calendars: [],
    isSynced: false,
    lastSyncTime: null
};

/**
 * Fetch calendar events and configured feeds from backend api.php
 */
async function loadCalendarFeed(forceRefresh = false) {
    try {
        const res = await fetch('api.php?action=get_calendar_events');
        if (!res.ok) throw new Error('API network error');
        
        const data = await res.json();
        if (data.status === 'success') {
            calendarState.eventsToday = data.events_today || [];
            calendarState.eventsUpcoming = data.events_upcoming || [];
            calendarState.calendars = data.calendars || [];
            calendarState.isSynced = true;
            calendarState.lastSyncTime = data.last_sync || new Date().toLocaleTimeString();
            calendarState.allEvents = [...calendarState.eventsToday, ...calendarState.eventsUpcoming];
        } else if (data.status === 'unconfigured') {
            calendarState.isSynced = false;
            calendarState.eventsToday = [];
            calendarState.eventsUpcoming = [];
            calendarState.calendars = [];
        }
        
        renderCalendarUI();
        renderCalendarFeedsList();
        return data;
    } catch (e) {
        console.warn('[Calendar] Failed to load calendar feed:', e);
        return null;
    }
}

/**
 * Add a new Google Calendar Feed
 */
async function addGoogleCalendarFeed(name, url, color = '#c2c1ff') {
    if (!url) return alert('Please enter a valid Google Calendar Secret iCal URL (.ics)');
    if (!name) name = 'Calendar ' + (calendarState.calendars.length + 1);

    const newCal = {
        id: 'cal_' + Date.now(),
        name: name.trim(),
        url: url.trim(),
        color: color,
        enabled: true
    };

    calendarState.calendars.push(newCal);
    await saveAllCalendarConfigs();
}

/**
 * Remove a Google Calendar Feed
 */
async function removeGoogleCalendarFeed(calId) {
    if (!confirm('Are you sure you want to remove this calendar feed?')) return;
    calendarState.calendars = calendarState.calendars.filter(c => c.id !== calId);
    await saveAllCalendarConfigs();
}

/**
 * Toggle a Calendar Feed Enabled / Disabled
 */
async function toggleGoogleCalendarFeed(calId) {
    const cal = calendarState.calendars.find(c => c.id === calId);
    if (cal) {
        cal.enabled = !cal.enabled;
        await saveAllCalendarConfigs();
    }
}

/**
 * Save all configured calendars to backend api.php
 */
async function saveAllCalendarConfigs() {
    try {
        const payload = {
            calendars: calendarState.calendars,
            updated_at: new Date().toISOString()
        };
        const res = await fetch('api.php?action=save_calendar_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            await loadCalendarFeed(true);
        }
    } catch (e) {
        alert('Failed to save calendar configuration: ' + e.message);
    }
}

/**
 * Render complete Calendar UI (Monthly grid & Daily timeline)
 */
function renderCalendarUI() {
    renderMonthGrid(calendarState.currentYear, calendarState.currentMonth);
    renderAgendaTimeline();
    updateSyncStatusBadge();
}

/**
 * Render Active Calendar Feeds Strip (Multi-Calendar Tags)
 */
function renderCalendarFeedsList() {
    const listElem = document.getElementById('chrono-feeds-list');
    if (!listElem) return;

    if (calendarState.calendars.length === 0) {
        listElem.innerHTML = `<span class="text-secondary text-[9px] italic">No active Google Calendar feeds. Add your first private iCal link below.</span>`;
        return;
    }

    listElem.innerHTML = calendarState.calendars.map(cal => `
        <div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high border text-[9px] font-bold font-mono transition-all ${cal.enabled ? 'border-outline-variant/40 text-on-surface' : 'opacity-40 border-outline-variant/20 line-through'}">
            <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${cal.color}; box-shadow: 0 0 6px ${cal.color};"></span>
            <span class="truncate max-w-[120px]">${cal.name}</span>
            <button onclick="toggleGoogleCalendarFeed('${cal.id}')" class="text-secondary hover:text-primary ml-1" title="Toggle On/Off">
                <span class="material-symbols-outlined text-[11px]">${cal.enabled ? 'check_circle' : 'cancel'}</span>
            </button>
            <button onclick="removeGoogleCalendarFeed('${cal.id}')" class="text-secondary hover:text-error ml-0.5" title="Remove Feed">
                <span class="material-symbols-outlined text-[11px]">delete</span>
            </button>
        </div>
    `).join('');
}

/**
 * Render Interactive Monthly Grid
 */
function renderMonthGrid(year, month) {
    const gridElem = document.getElementById('calendar-month-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    if (!gridElem) return;

    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    if (monthLabel) monthLabel.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    gridElem.innerHTML = '';

    // Day header labels
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    daysOfWeek.forEach(d => {
        const h = document.createElement('div');
        h.className = "text-[9px] text-secondary font-bold text-center py-0.5 border-b border-outline-variant/30";
        h.innerText = d;
        gridElem.appendChild(h);
    });

    // Blank cells before month start
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = "p-1.5 opacity-20 min-h-[44px]";
        gridElem.appendChild(blank);
    }

    // Active month days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);
        
        cell.className = `p-1 min-h-[44px] rounded border transition-all cursor-pointer flex flex-col justify-between ${
            isToday 
                ? 'bg-primary/15 border-primary shadow-[0_0_8px_rgba(194,193,255,0.3)]' 
                : 'bg-surface-container-high border-outline-variant/20 hover:border-tertiary/50'
        }`;

        cell.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-xs font-mono font-bold ${isToday ? 'text-primary' : 'text-on-surface'}">${day}</span>
                ${isToday ? '<span class="text-[7px] bg-primary text-black font-bold px-1 rounded">TODAY</span>' : ''}
            </div>
            <div class="day-events-container flex flex-col gap-0.5 mt-0.5"></div>
        `;

        if (calendarState.eventsToday.length > 0 && isToday) {
            const evBox = cell.querySelector('.day-events-container');
            if (evBox) {
                evBox.innerHTML = `<span class="text-[7.5px] bg-primary/20 text-primary px-1 rounded truncate block">📅 ${calendarState.eventsToday.length} event(s)</span>`;
            }
        }

        cell.onclick = () => {
            calendarState.selectedDate = new Date(year, month, day);
            if (window.playSound) window.playSound('beep2');
        };

        gridElem.appendChild(cell);
    }
}

/**
 * Render Daily Agenda List
 */
function renderAgendaTimeline() {
    const todayList = document.getElementById('chrono-today-events');
    const upcomingList = document.getElementById('chrono-upcoming-events');
    const todayCount = document.getElementById('chrono-today-count');

    if (todayCount) {
        todayCount.innerText = `${calendarState.eventsToday.length} EVENTS`;
    }

    if (todayList) {
        if (!calendarState.isSynced) {
            todayList.innerHTML = `
                <div class="p-3 rounded-lg bg-surface-container-high border border-lcars-gold/40 text-lcars-gold text-xs leading-relaxed flex flex-col gap-1.5">
                    <span class="font-bold flex items-center gap-1"><span class="material-symbols-outlined text-sm">info</span><span>NO GOOGLE CALENDARS SYNCED</span></span>
                    <span class="text-[10px]">Add your Google Calendar secret iCal (.ics) addresses in the panel below to aggregate your schedule.</span>
                </div>
            `;
        } else if (calendarState.eventsToday.length === 0) {
            todayList.innerHTML = `
                <div class="p-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-secondary text-xs italic flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-base">event_available</span>
                    <span>Your schedule is completely clear today across all calendars!</span>
                </div>
            `;
        } else {
            todayList.innerHTML = calendarState.eventsToday.map(ev => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high border-l-4 hover:bg-surface-bright transition-all" style="border-left-color: ${ev.color || '#c2c1ff'};">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[8px] px-1 rounded font-bold font-mono text-black" style="background-color: ${ev.color || '#c2c1ff'};">${ev.calendar || 'Main'}</span>
                            <span class="text-xs font-bold text-on-surface">${ev.summary}</span>
                        </div>
                        ${ev.location ? `<span class="text-[8.5px] text-tertiary flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">location_on</span><span>${ev.location}</span></span>` : ''}
                    </div>
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border" style="color: ${ev.color || '#c2c1ff'}; border-color: ${ev.color || '#c2c1ff'}40; background-color: ${ev.color || '#c2c1ff'}15;">${ev.time}</span>
                </div>
            `).join('');
        }
    }

    if (upcomingList) {
        if (calendarState.eventsUpcoming.length === 0) {
            upcomingList.innerHTML = `<div class="text-secondary text-xs italic p-3">No upcoming events this week.</div>`;
        } else {
            upcomingList.innerHTML = calendarState.eventsUpcoming.map(ev => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-surface-container-high border-l-2 text-xs hover:border-tertiary transition-all" style="border-left-color: ${ev.color || '#78e4a5'};">
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1">
                            <span class="text-[7.5px] px-1 rounded font-bold font-mono text-black" style="background-color: ${ev.color || '#78e4a5'};">${ev.calendar || 'Main'}</span>
                            <span class="text-on-surface font-semibold text-[11px]">${ev.summary}</span>
                        </div>
                        ${ev.location ? `<span class="text-[8px] text-tertiary">${ev.location}</span>` : ''}
                    </div>
                    <span class="text-secondary font-mono text-[9.5px]">${ev.date} @ ${ev.time}</span>
                </div>
            `).join('');
        }
    }
}

function updateSyncStatusBadge() {
    const badge = document.getElementById('chrono-sync-status');
    if (badge) {
        const count = calendarState.calendars.length;
        if (calendarState.isSynced) {
            badge.innerText = `${count} CALENDAR${count === 1 ? '' : 'S'} SYNCED (${calendarState.lastSyncTime})`;
            badge.className = "text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/40";
        } else {
            badge.innerText = `OFFLINE / UNCONFIGURED`;
            badge.className = "text-[9px] bg-lcars-gold/20 text-lcars-gold px-1.5 py-0.5 rounded font-bold border border-lcars-gold/40";
        }
    }
}

function prevCalendarMonth() {
    calendarState.currentMonth--;
    if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.currentYear--;
    }
    renderMonthGrid(calendarState.currentYear, calendarState.currentMonth);
}

function nextCalendarMonth() {
    calendarState.currentMonth++;
    if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.currentYear++;
    }
    renderMonthGrid(calendarState.currentYear, calendarState.currentMonth);
}

function speakCalendarSpokenSummary() {
    let msg = "";
    if (!calendarState.isSynced || calendarState.eventsToday.length === 0) {
        msg = "Sensei, your calendar schedule is completely clear for today across all calendars. All operational pathways are ready.";
    } else {
        const count = calendarState.eventsToday.length;
        const summaries = calendarState.eventsToday.map(e => `${e.summary} from ${e.calendar} at ${e.time}`).join(", and ");
        msg = `Sensei, you have ${count} ${count === 1 ? 'event' : 'events'} scheduled for today: ${summaries}.`;
    }

    if (window.speakComputerVoice) {
        window.speakComputerVoice(msg);
    } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(msg);
        u.rate = 1.14;
        u.pitch = 1.10;
        window.speechSynthesis.speak(u);
    }
}

// Window Exports
window.loadCalendarFeed = loadCalendarFeed;
window.addGoogleCalendarFeed = addGoogleCalendarFeed;
window.removeGoogleCalendarFeed = removeGoogleCalendarFeed;
window.toggleGoogleCalendarFeed = toggleGoogleCalendarFeed;
window.renderCalendarUI = renderCalendarUI;
window.prevCalendarMonth = prevCalendarMonth;
window.nextCalendarMonth = nextCalendarMonth;
window.speakCalendarSpokenSummary = speakCalendarSpokenSummary;
window.calendarState = calendarState;

// Auto-initialize if DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCalendarFeed();
    });
}
