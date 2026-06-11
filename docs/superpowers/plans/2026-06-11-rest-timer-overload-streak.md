# Rest Timer, Overload Nudges & Streak Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline rest timer, progressive overload nudges, and a streak counter to the PPL workout app.

**Architecture:** All changes are in `index.html` (single file, no build step). Three independent features: (1) rest timer state + DOM patch loop added to session logging mode, (2) `getStaleWeight()` helper surfaced in reference mode exercise rows, (3) `calcStreak()` helper rendered in the sticky header on every view.

**Tech Stack:** Vanilla JS, HTML/CSS in `index.html`. No dependencies. localStorage for session data.

---

## File Structure

One file modified: `index.html`

- CSS: three new rule blocks (timer display, nudge style, streak style in header)
- JS state: three new variables (`restDuration`, `restStart`, `restInterval`)
- JS helpers: `getStaleWeight(exerciseName)`, `calcStreak()`, `startRestTimer(seconds)`, `cancelRestTimer()`, `updateRestDisplay()`
- `renderPhase()`: replace static rest reminder text with timer UI in logging mode; add stale nudge in reference mode
- `renderHeader()` (new thin helper): renders streak line into the header DOM after every `render()` call
- `cancelSession()`: clear rest timer on cancel

---

### Task 1: Add rest timer state, helpers, and CSS

**Files:**
- Modify: `index.html` — state block (~line 473), CSS block (~line 282), session actions area (~line 671)

- [ ] **Step 1: Add three state variables after `retroDate` (~line 478)**

Find:
```js
let retroDate = null; // null = use today, otherwise 'YYYY-MM-DD'
let installDismissed = false;
```

Replace with:
```js
let retroDate = null; // null = use today, otherwise 'YYYY-MM-DD'
let restDuration = null; // null | 60 | 90
let restStart = null;    // Date.now() when timer started
let restInterval = null; // setInterval handle
let installDismissed = false;
```

- [ ] **Step 2: Add `startRestTimer()`, `cancelRestTimer()`, and `updateRestDisplay()` functions**

Add these three functions after `updateWeight()` (around line 532):

```js
function startRestTimer(seconds) {
  if (restInterval) clearInterval(restInterval);
  restDuration = seconds;
  restStart = Date.now();
  restInterval = setInterval(updateRestDisplay, 500);
  updateRestDisplay();
}

function cancelRestTimer() {
  if (restInterval) clearInterval(restInterval);
  restDuration = null;
  restStart = null;
  restInterval = null;
  const el = document.getElementById('rest-timer-display');
  if (el) el.innerHTML = restTimerPickerHTML();
}

function updateRestDisplay() {
  const el = document.getElementById('rest-timer-display');
  if (!el || !restStart) return;
  const elapsed = Math.floor((Date.now() - restStart) / 1000);
  const remaining = restDuration - elapsed;
  if (remaining <= 0) {
    cancelRestTimer();
    if (el) el.classList.add('rest-timer-pulse');
    setTimeout(() => { if (el) el.classList.remove('rest-timer-pulse'); }, 600);
    return;
  }
  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, '0');
  const pct = Math.max(0, remaining / restDuration) * 100;
  el.innerHTML = `
    <div class="rest-timer-countdown" onclick="cancelRestTimer()">${mins}:${secs}</div>
    <div class="rest-timer-bar"><div class="rest-timer-fill" style="width:${pct}%"></div></div>
  `;
}

function restTimerPickerHTML() {
  return `
    <button class="rest-timer-btn" onclick="startRestTimer(60)">60S</button>
    <button class="rest-timer-btn" onclick="startRestTimer(90)">90S</button>
  `;
}
```

- [ ] **Step 3: Clear rest timer in `cancelSession()`**

Find:
```js
function cancelSession() {
  activeSession = null;
  retroDate = null;
  render();
}
```

Replace with:
```js
function cancelSession() {
  cancelRestTimer();
  activeSession = null;
  retroDate = null;
  render();
}
```

Also clear in `completeSession()` — find the line `activeSession = null;` inside `completeSession()` and add `cancelRestTimer();` immediately before it:

```js
  cancelRestTimer();
  activeSession = null;
```

- [ ] **Step 4: Add CSS for the rest timer**

Find the line `/* Retro date picker */` (around line 282) and add this block just before it:

```css
/* Rest timer */
.rest-timer-row {
  padding: 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.04);
  display: flex;
  gap: 10px;
  align-items: center;
}
.rest-timer-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: 1px solid #2a2a2e;
  color: #555;
  font-family: 'Fragment Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.rest-timer-btn:active { color: #e8e6e0; border-color: rgba(255,255,255,0.2); }
.rest-timer-countdown {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #e8e6e0;
  letter-spacing: 2px;
  line-height: 1;
  cursor: pointer;
  text-align: center;
  width: 100%;
}
.rest-timer-bar {
  height: 2px;
  background: #1e1e22;
  margin-top: 6px;
  width: 100%;
}
.rest-timer-fill {
  height: 100%;
  background: #e85d3a;
  transition: width 0.5s linear;
}
@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.rest-timer-pulse { animation: timerPulse 0.3s ease 2; }
```

- [ ] **Step 5: Replace static rest reminder in logging mode with timer UI**

Find in `renderPhase()` (around line 671):
```js
        html += `<div class="rest-reminder">— REST 60–90 SEC BETWEEN SETS</div>`;
        html += `<div class="session-date-row">
```

Replace with:
```js
        const timerInner = restDuration && restStart
          ? `<div class="rest-timer-countdown" onclick="cancelRestTimer()">${(() => { const r = Math.max(0, restDuration - Math.floor((Date.now()-restStart)/1000)); return Math.floor(r/60)+':'+String(r%60).padStart(2,'0'); })()}</div><div class="rest-timer-bar"><div class="rest-timer-fill" style="width:${Math.max(0,(restDuration-Math.floor((Date.now()-restStart)/1000))/restDuration)*100}%"></div></div>`
          : restTimerPickerHTML();
        html += `<div class="rest-timer-row" id="rest-timer-display">${timerInner}</div>`;
        html += `<div class="session-date-row">
```

- [ ] **Step 6: Manual test**

Open `index.html` in a browser. Start any session. Confirm:
- The static rest text is gone; two buttons `60S` and `90S` appear
- Tapping `60S` starts a countdown from `1:00` with a red progress bar
- The bar depletes smoothly
- Tapping the countdown cancels it and shows the two buttons again
- At zero, the timer briefly pulses then resets
- Tapping `90S` counts from `1:30`
- Cancelling the session clears the timer

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "add inline rest timer: 60s and 90s with countdown and progress bar"
```

---

### Task 2: Add `getStaleWeight()` and overload nudges in reference mode

**Files:**
- Modify: `index.html` — localStorage helpers section (~line 481), reference mode exercise rows (~line 688)

- [ ] **Step 1: Add `getStaleWeight()` after `getLastWeight()`**

Find `getLastWeight()` (around line 488) and add this function immediately after its closing brace:

```js
function getStaleWeight(exerciseName) {
  const sessions = getSessions().filter(s => s.weights[exerciseName] !== undefined);
  if (sessions.length < 6) return false;
  const last6 = sessions.slice(-6);
  const w = last6[0].weights[exerciseName];
  return last6.every(s => s.weights[exerciseName] === w);
}
```

- [ ] **Step 2: Surface the nudge in reference mode exercise rows**

Find in `renderPhase()` (around line 694):
```js
            ${last !== null ? `<div class="exercise-cue" style="color:#555;margin-top:2px">Last logged: <span style="color:#888">${last}kg</span></div>` : ''}
          </div>`;
```

Replace with:
```js
            ${last !== null ? `<div class="exercise-cue" style="color:#555;margin-top:2px">Last logged: <span style="color:#888">${last}kg</span></div>` : ''}
            ${getStaleWeight(ex.name) ? `<div class="exercise-cue" style="color:#b07a2a;margin-top:2px">↑ CONSIDER PROGRESSING</div>` : ''}
          </div>`;
```

- [ ] **Step 3: Manual test**

The easiest way to test: open browser console and manually inject 6 sessions with the same weight for one exercise:

```js
const s = JSON.parse(localStorage.getItem('ppl_sessions') || '[]');
for (let i = 0; i < 6; i++) {
  s.push({ date: `2026-05-0${i+1}`, phase: 0, dayIndex: 0, type: 'PUSH', weights: { 'Incline Dumbbell Press': 15 } });
}
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

Open Phase 1, Day 1 (PUSH). Confirm "↑ CONSIDER PROGRESSING" appears in amber under "Last logged: 15kg" for Incline Dumbbell Press. Confirm it does NOT appear in logging mode (only reference mode).

Also confirm: change one of the 6 sessions to a different weight — the nudge should disappear.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "add progressive overload nudge: amber indicator after 6 sessions at same weight"
```

---

### Task 3: Add `calcStreak()` and streak display in the header

**Files:**
- Modify: `index.html` — localStorage helpers section, `render()` function, header HTML (~line 340)

- [ ] **Step 1: Add `calcStreak()` after `loggedDates()`**

Find `loggedDates()` (around line 503) and add this function immediately after it:

```js
function calcStreak() {
  const logged = loggedDates();
  if (logged.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let gapsInWindow = 0;
  let windowStart = new Date(today);

  const cursor = new Date(today);

  // If today has a session, include it
  if (!logged.has(dateStr(today))) {
    // Today not logged — start from yesterday
    cursor.setDate(cursor.getDate() - 1);
    gapsInWindow = 1; // today counts as a gap
  }

  while (true) {
    const ds = dateStr(cursor);
    const daysSinceWindowStart = Math.round((windowStart - cursor) / 86400000);

    // Reset gap counter every 7 days
    if (daysSinceWindowStart >= 7) {
      if (gapsInWindow > 1) break;
      gapsInWindow = 0;
      windowStart = new Date(cursor);
    }

    if (logged.has(ds)) {
      streak++;
    } else {
      gapsInWindow++;
      if (gapsInWindow > 1) break;
    }

    cursor.setDate(cursor.getDate() - 1);

    // Safety: don't walk back more than 365 days
    const daysBack = Math.round((today - cursor) / 86400000);
    if (daysBack > 365) break;
  }

  return streak;
}
```

- [ ] **Step 2: Add streak rendering to `render()`**

Find `render()`:
```js
function render() {
  if (currentView === 'history') {
    renderHistory();
  } else if (currentView === 'retro') {
    renderRetroSelector();
  } else {
    renderPhase();
  }
}
```

Replace with:
```js
function render() {
  if (currentView === 'history') {
    renderHistory();
  } else if (currentView === 'retro') {
    renderRetroSelector();
  } else {
    renderPhase();
  }
  renderStreakInHeader();
}

function renderStreakInHeader() {
  const el = document.getElementById('header-streak');
  if (!el) return;
  const streak = calcStreak();
  el.textContent = streak >= 2 ? `— ${streak} DAY STREAK —` : '';
}
```

- [ ] **Step 3: Add the streak element to the header HTML**

Find the header in the HTML (around line 340 — look for `<div class="header">`). It contains `.header-eyebrow`, `.header-title`, `.header-sub`, and `.phase-tabs`. Add the streak line after `.header-sub`:

Find:
```html
  <div class="header-sub">6-DAY SPLIT &nbsp;·&nbsp; DUMBBELL ONLY</div>
```

Replace with:
```html
  <div class="header-sub">6-DAY SPLIT &nbsp;·&nbsp; DUMBBELL ONLY</div>
  <div id="header-streak" style="font-size:9px;letter-spacing:3px;color:#e85d3a;margin-top:4px;margin-bottom:2px;min-height:14px"></div>
```

- [ ] **Step 4: Manual test**

In browser console, inject sessions on consecutive days:

```js
const s = [];
for (let i = 14; i >= 1; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  s.push({ date: d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'), phase: 0, dayIndex: 0, type: 'PUSH', weights: {} });
}
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

Confirm "— 14 DAY STREAK —" (or similar) appears in red in the header on all tabs. Switch between Phase 1, Phase 2, and History — streak should persist on all.

Test gap tolerance: remove all sessions from one day in the last 7. Streak should still continue (one gap allowed per 7 days). Remove two days in the same 7-day window — streak should break.

Test suppression: clear all sessions (`localStorage.removeItem('ppl_sessions'); location.reload()`). Confirm no streak text appears.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "add streak counter: consecutive day streak with one rest day allowed per 7 days"
```

---

### Task 4: Push to GitHub Pages

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Verify on device**

Wait ~60 seconds, then open https://jonoreadman85.github.io/ppl on your phone. Check:
1. Start a session → rest timer shows `60S` / `90S` buttons → tap one → countdown appears with depleting bar → reaches zero → pulses → resets
2. Any exercise with 6+ sessions at the same weight shows the amber nudge in reference mode (not in logging mode)
3. Header shows streak count on all tabs if streak ≥ 2 days
