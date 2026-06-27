# Phase 3: Upper/Lower Split with Supersets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-day Upper/Lower Phase 3 programme with superset UI, consecutive-upper warning, shoulder reminder, persistent phase tab, and default-phase memory.

**Architecture:** All programme data lives in the `phases` array in `index.html`. Pure logic goes in `js/logic.js` (tested via Node's built-in test runner). UI changes are inline JS/HTML in `index.html`. Each task is independently committable and leaves the app in a working state.

**Tech Stack:** Vanilla JS, single `index.html`, Node test runner (`node --test`), no build step.

---

### Task 1: Add `getSupersetPartner` to logic.js (TDD)

**Files:**
- Modify: `js/logic.js`
- Modify: `tests/logic.test.js`

This pure function is the key superset primitive. Given the exercises array for a session and an exercise name, it returns the name of its superset partner if the exercise is first in the pair (`supersetOrder: 1`), or `null` if it's second, a singleton, or not found.

- [ ] **Step 1: Write failing tests in `tests/logic.test.js`**

Add these tests at the bottom of the file. The `exercises` fixture uses the new `superset` and `supersetOrder` fields:

```js
// ---------------------------------------------------------------------------
// getSupersetPartner
// ---------------------------------------------------------------------------

const supersetExercises = [
  { name: 'Incline DB Press', sets: '3', reps: '8–10', superset: 1, supersetOrder: 1 },
  { name: 'Bent-Over Row',    sets: '3', reps: '8–10', superset: 1, supersetOrder: 2 },
  { name: 'Lateral Raise',   sets: '3', reps: '10–12', superset: 2, supersetOrder: 1 },
  { name: 'Rear Delt Fly',   sets: '3', reps: '10–12', superset: 2, supersetOrder: 2 },
  { name: 'Calf Raise',      sets: '3', reps: '15–20', superset: 3, supersetOrder: 1 },
];

const { getSupersetPartner } = require('../js/logic.js');

test('getSupersetPartner: returns partner name when exercise is first in pair', () => {
  assert.equal(getSupersetPartner(supersetExercises, 'Incline DB Press'), 'Bent-Over Row');
});

test('getSupersetPartner: returns null when exercise is second in pair', () => {
  assert.equal(getSupersetPartner(supersetExercises, 'Bent-Over Row'), null);
});

test('getSupersetPartner: returns null for singleton (no supersetOrder 2 in group)', () => {
  assert.equal(getSupersetPartner(supersetExercises, 'Calf Raise'), null);
});

test('getSupersetPartner: returns null for unknown exercise name', () => {
  assert.equal(getSupersetPartner(supersetExercises, 'Unknown Exercise'), null);
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm test
```

Expected: 4 new failures — `getSupersetPartner is not a function`.

- [ ] **Step 3: Implement `getSupersetPartner` in `js/logic.js`**

Add before the `if (typeof module !== 'undefined')` block:

```js
function getSupersetPartner(exercises, exerciseName) {
  const ex = exercises.find(e => e.name === exerciseName);
  if (!ex || !ex.superset || ex.supersetOrder !== 1) return null;
  const partner = exercises.find(e => e.superset === ex.superset && e.supersetOrder === 2);
  return partner ? partner.name : null;
}
```

Update the `module.exports` line:

```js
if (typeof module !== 'undefined') {
  module.exports = { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps, findTimerExerciseIndex, formatDuration, getSupersetPartner };
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test
```

Expected: all tests pass including the 4 new ones.

- [ ] **Step 5: Commit**

```bash
git add js/logic.js tests/logic.test.js
git commit -m "feat: add getSupersetPartner to logic.js with tests"
```

---

### Task 2: Add Phase 3 programme data

**Files:**
- Modify: `index.html` — `phases` array and `typeColors` object

- [ ] **Step 1: Add UPPER/LOWER type colours**

Find this line in `index.html`:

```js
const typeColors = { PUSH: "#e85d3a", PULL: "#3a7be8", LEGS: "#3ab87a", REST: "#555" };
```

Replace with:

```js
const typeColors = { PUSH: "#e85d3a", PULL: "#3a7be8", LEGS: "#3ab87a", REST: "#555", UPPER_A: "#9b59b6", UPPER_B: "#9b59b6", LOWER_A: "#3ab87a", LOWER_B: "#3ab87a" };
```

- [ ] **Step 2: Add Phase 3 entry to the `phases` array**

Find the closing `];` of the `phases` array (after Phase 2's closing `}`). Add Phase 3 before it:

```js
  ,
  {
    label: "Phase 3", weeks: "Week 7+", duration: "45 min",
    note: "4-day Upper/Lower split. Antagonist supersets. 3 supersets × 3 sets. 60s rest after each pair. No warm-up — handle independently.",
    days: [
      { day: "Upper A", type: "UPPER_A", exercises: [
        { name: "Incline DB Press",  sets: "3", reps: "8–10",  cue: "Primary mover. Controlled descent. Protect right shoulder.", superset: 1, supersetOrder: 1 },
        { name: "Bent-Over Row",     sets: "3", reps: "8–10",  cue: "Chest up. Pull to hip. Squeeze at top.", superset: 1, supersetOrder: 2 },
        { name: "Lateral Raise",     sets: "3", reps: "10–12", cue: "Lead with elbows. Stop at shoulder height.", superset: 2, supersetOrder: 1 },
        { name: "Rear Delt Fly",     sets: "3", reps: "10–12", cue: "Hinge forward. Arms wide. Shoulder health.", superset: 2, supersetOrder: 2 },
        { name: "Bicep Curl",        sets: "3", reps: "10–12", cue: "No swinging. Full supination at top.", superset: 3, supersetOrder: 1 },
        { name: "Tricep Extension",  sets: "3", reps: "10–12", cue: "Long head emphasis. Monitor shoulder.", superset: 3, supersetOrder: 2 },
      ]},
      { day: "Upper B", type: "UPPER_B", exercises: [
        { name: "Overhead Press",   sets: "3", reps: "10–12", cue: "Assess shoulder comfort each session.", superset: 1, supersetOrder: 1 },
        { name: "Rear Delt Fly",    sets: "3", reps: "10–12", cue: "Shoulder health. Non-negotiable.", superset: 1, supersetOrder: 2 },
        { name: "Lateral Raise",    sets: "3", reps: "10–12", cue: "Lead with elbows. Stop at shoulder height.", superset: 2, supersetOrder: 1 },
        { name: "Hammer Curl",      sets: "3", reps: "10–12", cue: "Neutral grip. Builds brachialis.", superset: 2, supersetOrder: 2 },
        { name: "Bent-Over Row",    sets: "3", reps: "8–10",  cue: "Chest up. Pull to hip. Squeeze at top.", superset: 3, supersetOrder: 1 },
        { name: "Tricep Kickback",  sets: "3", reps: "10–12", cue: "Upper arm parallel to floor. Full extension.", superset: 3, supersetOrder: 2 },
      ]},
      { day: "Lower A", type: "LOWER_A", exercises: [
        { name: "Goblet Squat",      sets: "3", reps: "8–10",  cue: "Hold one dumbbell at chest. Knees track toes. Full depth.", superset: 1, supersetOrder: 1 },
        { name: "Romanian Deadlift", sets: "3", reps: "8–10",  cue: "Hinge at hips. Soft knees. Feel hamstring stretch.", superset: 1, supersetOrder: 2 },
        { name: "Walking Lunge",     sets: "3", reps: "10–12", cue: "Step forward. Knee just above floor. Drive through front heel.", superset: 2, supersetOrder: 1 },
        { name: "Sumo Squat",        sets: "3", reps: "10–12", cue: "Wide stance. Toes out. Targets inner quad and adductors.", superset: 2, supersetOrder: 2 },
        { name: "Calf Raise",        sets: "3", reps: "15–20", cue: "Full range. Pause at top. Use a step if available.", superset: 3, supersetOrder: 1 },
      ]},
      { day: "Lower B", type: "LOWER_B", exercises: [
        { name: "Romanian Deadlift", sets: "3", reps: "8–10",  cue: "Hinge at hips. Posterior chain anchor.", superset: 1, supersetOrder: 1 },
        { name: "Hip Thrust",        sets: "3", reps: "8–10",  cue: "Drive through heels. Squeeze glutes at top.", superset: 1, supersetOrder: 2 },
        { name: "Single-Leg RDL",    sets: "3", reps: "10–12", cue: "Hinge on one leg. Keep hips square.", superset: 2, supersetOrder: 1 },
        { name: "Reverse Lunge",     sets: "3", reps: "10–12", cue: "Step back. Knee just above floor. Drive through front heel.", superset: 2, supersetOrder: 2 },
        { name: "Calf Raise",        sets: "3", reps: "15–20", cue: "Full range. Pause at top. Use a step if available.", superset: 3, supersetOrder: 1 },
      ]},
    ]
  }
```

- [ ] **Step 3: Verify tests still pass**

```bash
npm test
```

Expected: all pass (no logic changes).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Phase 3 Upper/Lower programme data"
```

---

### Task 3: PHASE 3 tab, CSS classes, type label helper, header sub-line, localStorage phase

**Files:**
- Modify: `index.html` — CSS, HTML header tabs, JS state init, `setView`, `getTypeLabel`

- [ ] **Step 1: Add CSS for new type border colours**

Find this block in the `<style>` section:

```css
  .day-card.type-PUSH { border-left-color: #e85d3a; }
  .day-card.type-PULL { border-left-color: #3a7be8; }
  .day-card.type-LEGS { border-left-color: #3ab87a; }
```

Replace with:

```css
  .day-card.type-PUSH   { border-left-color: #e85d3a; }
  .day-card.type-PULL   { border-left-color: #3a7be8; }
  .day-card.type-LEGS   { border-left-color: #3ab87a; }
  .day-card.type-UPPER_A { border-left-color: #9b59b6; }
  .day-card.type-UPPER_B { border-left-color: #9b59b6; }
  .day-card.type-LOWER_A { border-left-color: #3ab87a; }
  .day-card.type-LOWER_B { border-left-color: #3ab87a; }
```

- [ ] **Step 2: Add `id="header-sub"` to the header sub-line div**

Find:

```html
  <div class="header-sub">6-DAY SPLIT &nbsp;·&nbsp; DUMBBELL ONLY</div>
```

Replace with:

```html
  <div class="header-sub" id="header-sub">6-DAY SPLIT &nbsp;·&nbsp; DUMBBELL ONLY</div>
```

- [ ] **Step 3: Add PHASE 3 tab button in the HTML header**

Find:

```html
    <button class="phase-tab" onclick="setView('phase',1)" id="tab1">PHASE 2</button>
    <button class="phase-tab" onclick="setView('history')" id="tabH">HISTORY</button>
```

Replace with:

```html
    <button class="phase-tab" onclick="setView('phase',1)" id="tab1">PHASE 2</button>
    <button class="phase-tab" onclick="setView('phase',2)" id="tab2">PHASE 3</button>
    <button class="phase-tab" onclick="setView('history')" id="tabH">HISTORY</button>
```

- [ ] **Step 4: Restore `currentPhase` from localStorage on init**

Find:

```js
let currentPhase = 0;
```

Replace with:

```js
let currentPhase = parseInt(localStorage.getItem('ppl_phase') || '0');
```

- [ ] **Step 5: Add `getTypeLabel` helper and update `setView`**

Add this function near the other helpers (e.g. after `dateStr`):

```js
function getTypeLabel(type) {
  return type.replace('_', ' ');
}
```

Find the `setView` function body and replace the tab active-state block and eyebrow update:

```js
function setView(view, phaseIdx) {
  currentView = view;
  if (view === 'phase' && phaseIdx !== undefined) {
    currentPhase = phaseIdx;
    localStorage.setItem('ppl_phase', phaseIdx);
    openDay = null;
  }
  document.getElementById('tab0').classList.toggle('active', view === 'phase' && currentPhase === 0);
  document.getElementById('tab1').classList.toggle('active', view === 'phase' && currentPhase === 1);
  document.getElementById('tab2').classList.toggle('active', view === 'phase' && currentPhase === 2);
  document.getElementById('tabH').classList.toggle('active', view === 'history');
  const eyebrow = document.querySelector('.header-eyebrow');
  if (eyebrow) {
    if (view === 'history') eyebrow.textContent = 'PROGRAMME / HISTORY';
    else eyebrow.textContent = `PROGRAMME / PHASE ${currentPhase + 1}`;
  }
  const subLine = document.getElementById('header-sub');
  if (subLine) {
    subLine.textContent = currentPhase === 2 ? '4-DAY UPPER/LOWER · DUMBBELL ONLY' : '6-DAY SPLIT · DUMBBELL ONLY';
  }
  render();
}
```

- [ ] **Step 6: Update day type display to use `getTypeLabel`**

In `renderPhase`, find:

```js
          <div class="day-type" style="color:${color}">${day.type}</div>
```

Replace with:

```js
          <div class="day-type" style="color:${color}">${getTypeLabel(day.type)}</div>
```

- [ ] **Step 7: Open app in browser and verify**

Open `index.html` in a browser. Confirm:
- Four tabs: PHASE 1 / PHASE 2 / PHASE 3 / HISTORY
- PHASE 3 tab shows 4 session cards: UPPER A (purple), UPPER B (purple), LOWER A (green), LOWER B (green)
- Header sub-line changes to "4-DAY UPPER/LOWER · DUMBBELL ONLY" when on PHASE 3
- Reload page — it returns to PHASE 3 (not PHASE 1)

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add Phase 3 tab, type colours, localStorage phase persistence"
```

---

### Task 4: Superset labels in reference mode (before session starts)

**Files:**
- Modify: `index.html` — `renderPhase` reference mode block

- [ ] **Step 1: Group exercises by superset in reference mode**

In `renderPhase`, find the reference mode block that renders exercises (inside the `} else {` branch, after `// Reference mode`):

```js
        // Reference mode
        html += `<div class="sets-header" style="border-top-color:${color}22">
          <span>EXERCISE</span><span>SETS</span><span>REPS</span>
        </div>`;
        day.exercises.forEach(ex => {
          const last = getLastWeight(ex.name);
          const rec = getOverloadRecommendation(ex.name, ex.reps, getSessions);
          html += `<div class="exercise-item">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-sets" style="color:${color}">${ex.sets}</div>
            <div class="exercise-reps">${ex.reps}</div>
            ${ex.cue ? `<div class="exercise-cue">${ex.cue}</div>` : ''}
            ${last !== null ? `<div class="exercise-cue" style="color:#555;margin-top:2px">Last logged: <span style="color:#888">${last}kg</span></div>` : ''}
            ${rec ? `<div class="exercise-cue" style="color:${rec.color};margin-top:2px">${rec.label}</div>` : ''}
          </div>`;
        });
        html += `<div class="rest-reminder">— REST 60–90 SEC BETWEEN SETS</div>`;
```

Replace with:

```js
        // Reference mode
        html += `<div class="sets-header" style="border-top-color:${color}22">
          <span>EXERCISE</span><span>SETS</span><span>REPS</span>
        </div>`;

        const isPhase3Day = day.exercises.some(ex => ex.superset !== undefined);
        if (isPhase3Day) {
          // Group by superset number
          const groups = {};
          day.exercises.forEach(ex => {
            if (!groups[ex.superset]) groups[ex.superset] = [];
            groups[ex.superset].push(ex);
          });
          Object.keys(groups).sort().forEach(supersetNum => {
            html += `<div style="padding:6px 16px 3px;font-size:8px;letter-spacing:3px;color:#3a3a40;border-top:1px solid rgba(255,255,255,0.03)">SUPERSET ${supersetNum}</div>`;
            groups[supersetNum].forEach(ex => {
              const last = getLastWeight(ex.name);
              const rec = getOverloadRecommendation(ex.name, ex.reps, getSessions);
              html += `<div class="exercise-item">
                <div class="exercise-name">${ex.name}</div>
                <div class="exercise-sets" style="color:${color}">${ex.sets}</div>
                <div class="exercise-reps">${ex.reps}</div>
                ${ex.cue ? `<div class="exercise-cue">${ex.cue}</div>` : ''}
                ${last !== null ? `<div class="exercise-cue" style="color:#555;margin-top:2px">Last logged: <span style="color:#888">${last}kg</span></div>` : ''}
                ${rec ? `<div class="exercise-cue" style="color:${rec.color};margin-top:2px">${rec.label}</div>` : ''}
              </div>`;
            });
          });
          html += `<div class="rest-reminder">— REST 60 SEC AFTER EACH SUPERSET PAIR</div>`;
        } else {
          day.exercises.forEach(ex => {
            const last = getLastWeight(ex.name);
            const rec = getOverloadRecommendation(ex.name, ex.reps, getSessions);
            html += `<div class="exercise-item">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-sets" style="color:${color}">${ex.sets}</div>
              <div class="exercise-reps">${ex.reps}</div>
              ${ex.cue ? `<div class="exercise-cue">${ex.cue}</div>` : ''}
              ${last !== null ? `<div class="exercise-cue" style="color:#555;margin-top:2px">Last logged: <span style="color:#888">${last}kg</span></div>` : ''}
              ${rec ? `<div class="exercise-cue" style="color:${rec.color};margin-top:2px">${rec.label}</div>` : ''}
            </div>`;
          });
          html += `<div class="rest-reminder">— REST 60–90 SEC BETWEEN SETS</div>`;
        }
```

- [ ] **Step 2: Verify in browser**

Open a Phase 3 session card (e.g. Upper A). Before starting, you should see:
- `SUPERSET 1` label above Incline DB Press + Bent-Over Row
- `SUPERSET 2` label above Lateral Raise + Rear Delt Fly
- `SUPERSET 3` label above Bicep Curl + Tricep Extension
- Rest reminder reads "REST 60 SEC AFTER EACH SUPERSET PAIR"
- Phase 1/2 cards unchanged

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add superset group labels in reference mode"
```

---

### Task 5: Superset-aware rest timer in active session

**Files:**
- Modify: `index.html` — `completeSetRow` function

- [ ] **Step 1: Update `completeSetRow` to use superset-aware rest logic**

Find the end of `completeSetRow` — specifically these two lines:

```js
  render();
  startRestTimer(90);
}
```

Replace with:

```js
  render();

  const _day = phases[activeSession.phaseIndex].days[activeSession.dayIndex];
  const _isPhase3 = activeSession.phaseIndex === 2;

  if (_isPhase3) {
    const partner = getSupersetPartner(_day.exercises, exerciseName);
    if (partner) {
      cancelRestTimer();
      const timerEl = document.getElementById('rest-timer-display');
      if (timerEl) timerEl.innerHTML = `<div style="font-family:'Fragment Mono',monospace;font-size:10px;letter-spacing:3px;color:#9b59b6;padding:14px 0;text-align:center;width:100%">→ ${partner.toUpperCase()}</div>`;
    } else {
      startRestTimer(60);
    }
  } else {
    startRestTimer(90);
  }
}
```

- [ ] **Step 2: Verify in browser — superset flow**

Start an Upper A session. Complete Set 1 of Incline DB Press:
- Timer slot should show `→ BENT-OVER ROW` (purple text, no countdown)

Complete Set 1 of Bent-Over Row:
- 60s rest timer should start counting down

Wait for or skip the timer. Complete Set 1 of Lateral Raise:
- Timer slot should show `→ REAR DELT FLY`

Complete Set 1 of Rear Delt Fly:
- 60s rest timer starts again

Start a Lower A session. Complete a set of Calf Raise (singleton):
- 60s rest timer starts immediately (no nudge)

Start a Phase 1 or Phase 2 session. Complete any set:
- 90s rest timer starts as before

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: superset-aware rest timer — nudge for ex1, 60s rest after ex2"
```

---

### Task 6: Consecutive upper warning

**Files:**
- Modify: `index.html` — new state variable, new helpers, `renderPhase` session-actions area

- [ ] **Step 1: Add state variable and helper functions**

Add these near the other state variables (e.g. after `let installDismissed = false;`):

```js
let upperWarningDismissed = false;
```

Add these helper functions near `cancelSession`:

```js
function isConsecutiveUpperWarning(phaseIndex, dayIndex) {
  const day = phases[phaseIndex].days[dayIndex];
  if (day.type !== 'UPPER_A' && day.type !== 'UPPER_B') return false;
  const sessions = getSessions();
  if (sessions.length === 0) return false;
  const last = sessions[sessions.length - 1];
  if (last.type !== 'UPPER_A' && last.type !== 'UPPER_B') return false;
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); })();
  return last.date === todayStr() || last.date === yesterday;
}

function dismissUpperWarning() {
  upperWarningDismissed = true;
  render();
}
```

- [ ] **Step 2: Reset `upperWarningDismissed` when toggling a day**

Find `toggleDay`:

```js
function toggleDay(i) {
  openDay = openDay === i ? null : i;
  render();
}
```

Replace with:

```js
function toggleDay(i) {
  openDay = openDay === i ? null : i;
  upperWarningDismissed = false;
  render();
}
```

- [ ] **Step 3: Render warning in place of START SESSION button**

In `renderPhase`, find the session-actions block in reference mode:

```js
        html += `<div class="session-actions">
          <button class="btn-start" onclick="startSession(${currentPhase}, ${i})">START SESSION</button>
        </div>`;
```

Replace with:

```js
        if (!upperWarningDismissed && isConsecutiveUpperWarning(currentPhase, i)) {
          html += `<div class="session-actions" style="flex-direction:column;gap:8px">
            <div style="font-size:9px;letter-spacing:2px;color:#b07a2a;padding:4px 0">⚠ UPPER SESSION YESTERDAY — CONSIDER LOWER TODAY</div>
            <div style="display:flex;gap:10px;width:100%">
              <button class="btn-start" style="flex:1" onclick="startSession(${currentPhase}, ${i})">START ANYWAY</button>
              <button class="btn-cancel" onclick="dismissUpperWarning()">DISMISS</button>
            </div>
          </div>`;
        } else {
          html += `<div class="session-actions">
            <button class="btn-start" onclick="startSession(${currentPhase}, ${i})">START SESSION</button>
          </div>`;
        }
```

- [ ] **Step 4: Verify in browser**

To test without waiting for a real day gap, temporarily call `completeSession()` with a fake Upper A session already in history. Or: open browser console, run:

```js
const s = JSON.parse(localStorage.getItem('ppl_sessions') || '[]');
const d = new Date(); d.setDate(d.getDate()-1);
const yest = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
s.push({ date: yest, phase: 2, dayIndex: 0, type: 'UPPER_A', weights: {}, setWeights: {}, reps: {} });
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

Then open Upper A or Upper B card on Phase 3 — should show the warning with START ANYWAY and DISMISS. DISMISS restores the normal button. START ANYWAY begins the session. Opening a Lower session should show the normal button.

Clean up test data from console after verifying:

```js
const s = JSON.parse(localStorage.getItem('ppl_sessions'));
s.pop();
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: consecutive upper warning with dismiss and start-anyway"
```

---

### Task 7: Overhead Press shoulder reminder

**Files:**
- Modify: `index.html` — `renderPhase` active session block

- [ ] **Step 1: Add shoulder reminder banner in active Upper B session**

In `renderPhase`, find the active session logging block — it starts with:

```js
      if (isActive) {
        // Logging mode
        if (loggedToday) {
          html += `<div class="session-complete-banner">Session already logged today.</div>`;
        }
        const timerExIdx = findTimerExerciseIndex(day.exercises, activeSession.completedSets);
```

Add the reminder check immediately after the `if (loggedToday)` block:

```js
        const upperBSessionCount = getSessions().filter(s => s.type === 'UPPER_B').length;
        if (day.type === 'UPPER_B' && upperBSessionCount < 2) {
          html += `<div style="margin:10px 16px 0;padding:10px 12px;border-left:2px solid #b07a2a;background:rgba(176,122,42,0.05);font-size:10px;color:#b07a2a;letter-spacing:0.5px;line-height:1.7">SHOULDER CHECK — Assess comfort on Overhead Press before increasing load</div>`;
        }
```

- [ ] **Step 2: Verify in browser**

Open browser console and add fake Upper B session history to simulate fewer than 2 logged:

```js
// Ensure no UPPER_B sessions exist yet (fresh state) — check:
JSON.parse(localStorage.getItem('ppl_sessions') || '[]').filter(s => s.type === 'UPPER_B').length
```

Start an Upper B session — banner should appear above the exercise blocks.

Then add 2 fake UPPER_B sessions to history:

```js
const s = JSON.parse(localStorage.getItem('ppl_sessions') || '[]');
s.push({ date: '2026-06-20', phase: 2, dayIndex: 1, type: 'UPPER_B', weights: {}, setWeights: {}, reps: {} });
s.push({ date: '2026-06-23', phase: 2, dayIndex: 1, type: 'UPPER_B', weights: {}, setWeights: {}, reps: {} });
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

Start Upper B again — banner should be gone.

Clean up:

```js
const s = JSON.parse(localStorage.getItem('ppl_sessions'));
s.splice(-2, 2);
localStorage.setItem('ppl_sessions', JSON.stringify(s));
location.reload();
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: overhead press shoulder reminder for first 2 Upper B sessions"
```

---

### Task 8: Push to production

**Files:** none (deploy only)

- [ ] **Step 1: Confirm all tests pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

GitHub Pages redeploys automatically within ~60 seconds. Verify at https://jonoreadman85.github.io/ppl.

- [ ] **Step 3: Smoke test on device**

On your phone, open the live URL. Confirm:
- PHASE 3 tab visible and navigable
- Upper A card shows superset groups in reference mode
- Starting Upper A session: sets show nudge → rest timer flow
- Header sub-line updates correctly
- Reloading the page returns to Phase 3
