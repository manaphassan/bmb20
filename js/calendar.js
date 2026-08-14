/**
 * ==========================================================================
 * MEENA™ CHRONO CALENDAR & AGENDA ENGINE (js/calendar.js)
 * Standalone modular Google Calendar / iCal parser and timeline renderer
 * ==========================================================================
 */

let calendarState = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedDate: new Date(),
    eventsToday: [],
    eventsUpcoming: [],
    allEvents: [],
    isSynced: false,
    lastSyncTime: null
};

/**
 * Fetch calendar events from backend api.php
 */
async function loadCalendarFeed(forceRefresh = false) {
    try {
        const res = await fetch('api.php?action=get_calendar_events');
        if (!res.ok) throw new Error('API network error');
        
        const data = await res.json();
        if (data.status === 'success') {
            calendarState.eventsToday = data.events_today || [];
            calendarState.eventsUpcoming = data.events_upcoming || [];
            calendarState.isSynced = true;
            calendarState.lastSyncTime = data.last_sync || new Date().toLocaleTimeString();
            
            // Combine all events for date lookups
            calendarState.allEvents = [...calendarState.eventsToday, ...calendarState.eventsUpcoming];
        } else if (data.status === 'unconfigured') {
            calendarState.isSynced = false;
            calendarState.eventsToday = [];
            calendarState.eventsUpcoming = [];
        }
        
        renderCalendarUI();
        return data;
    } catch (e) {
        console.warn('[Calendar] Failed to load calendar feed:', e);
        return null;
    }
}

/**
 * Save Google Calendar iCal configuration
 */
async function saveGoogleCalendarUrl(url) {
    if (!url) return { status: 'error', message: 'URL cannot be empty' };
    
    try {
        const res = await fetch('api.php?action=save_calendar_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ical_url: url, enabled: true, updated_at: new Date().toISOString() })
        });
        if (res.ok) {
            await loadCalendarFeed(true);
            return { status: 'success' };
        }
        return { status: 'error', message: 'Server failed to save calendar configuration' };
    } catch (e) {
        return { status: 'error', message: e.message };
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
        h.className = "text-[9px] text-secondary font-bold text-center py-1 border-b border-outline-variant/30";
        h.innerText = d;
        gridElem.appendChild(h);
    });

    // Blank cells before month start
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = "p-2 opacity-20 min-h-[48px]";
        gridElem.appendChild(blank);
    }

    // Active month days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);
        
        cell.className = `p-1.5 min-h-[48px] rounded border transition-all cursor-pointer flex flex-col justify-between ${
            isToday 
                ? 'bg-primary/15 border-primary shadow-[0_0_8px_rgba(194,193,255,0.3)]' 
                : 'bg-surface-container-high border-outline-variant/20 hover:border-tertiary/50'
        }`;

        cell.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-xs font-mono font-bold ${isToday ? 'text-primary' : 'text-on-surface'}">${day}</span>
                ${isToday ? '<span class="text-[7px] bg-primary text-black font-bold px-1 rounded">TODAY</span>' : ''}
            </div>
            <div class="day-events-container flex flex-col gap-0.5 mt-1"></div>
        `;

        // Check if any events fall on this day
        if (calendarState.eventsToday.length > 0 && isToday) {
            const evBox = cell.querySelector('.day-events-container');
            if (evBox) {
                evBox.innerHTML = `<span class="text-[8px] bg-primary/20 text-primary px-1 rounded truncate block">📅 ${calendarState.eventsToday.length} event(s)</span>`;
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
                <div class="p-4 rounded-lg bg-surface-container-high border border-lcars-gold/40 text-lcars-gold text-xs leading-relaxed flex flex-col gap-2">
                    <span class="font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-base">info</span><span>GOOGLE CALENDAR NOT SYNCED</span></span>
                    <span>To view your live schedule, paste your Google Calendar private iCal address (.ics) in the sync panel below.</span>
                </div>
            `;
        } else if (calendarState.eventsToday.length === 0) {
            todayList.innerHTML = `
                <div class="p-4 rounded-lg bg-surface-container-high border border-outline-variant/30 text-secondary text-xs italic flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-base">event_available</span>
                    <span>Your schedule is completely clear today! No scheduled appointments.</span>
                </div>
            `;
        } else {
            todayList.innerHTML = calendarState.eventsToday.map(ev => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border-l-4 border-primary hover:bg-surface-bright transition-all">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs font-bold text-on-surface">${ev.summary}</span>
                        ${ev.location ? `<span class="text-[9px] text-tertiary flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">location_on</span><span>${ev.location}</span></span>` : ''}
                    </div>
                    <span class="text-primary font-mono text-xs font-bold bg-primary/10 px-2.5 py-1 rounded border border-primary/30">${ev.time}</span>
                </div>
            `).join('');
        }
    }

    if (upcomingList) {
        if (calendarState.eventsUpcoming.length === 0) {
            upcomingList.innerHTML = `<div class="text-secondary text-xs italic p-3">No upcoming events this week.</div>`;
        } else {
            upcomingList.innerHTML = calendarState.eventsUpcoming.map(ev => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high border-l-2 border-secondary/60 text-xs hover:border-tertiary transition-all">
                    <div class="flex flex-col">
                        <span class="text-on-surface font-semibold text-[11px]">${ev.summary}</span>
                        ${ev.location ? `<span class="text-[8px] text-tertiary">${ev.location}</span>` : ''}
                    </div>
                    <span class="text-secondary font-mono text-[10px]">${ev.date} @ ${ev.time}</span>
                </div>
            `).join('');
        }
    }
}

function updateSyncStatusBadge() {
    const badge = document.getElementById('chrono-sync-status');
    if (badge) {
        if (calendarState.isSynced) {
            badge.innerText = `SYNCED (${calendarState.lastSyncTime})`;
            badge.className = "text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold border border-primary/40";
        } else {
            badge.innerText = `OFFLINE / UNCONFIGURED`;
            badge.className = "text-[10px] bg-lcars-gold/20 text-lcars-gold px-2 py-0.5 rounded font-bold border border-lcars-gold/40";
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
    if (!calendarState.isSynced || calendarState.eventsToday.length === 0) {
        if (window.speakComputerVoice) {
            window.speakComputerVoice("Sensei, your calendar schedule is completely clear for today. All operational pathways are ready.");
        }
        return;
    }

    const count = calendarState.eventsToday.length;
    const summaries = calendarState.eventsToday.map(e => `${e.summary} at ${e.time}`).join(", and ");
    if (window.speakComputerVoice) {
        window.speakComputerVoice(`Sensei, you have ${count} ${count === 1 ? 'event' : 'events'} scheduled for today: ${summaries}.`);
    }
}

// Window Exports
window.loadCalendarFeed = loadCalendarFeed;
window.saveGoogleCalendarUrl = saveGoogleCalendarUrl;
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
