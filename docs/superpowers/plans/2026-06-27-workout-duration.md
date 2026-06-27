# Workout Duration Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record how long a live workout session takes and display it in the session history log.

**Architecture:** A pure `formatDuration(seconds)` function is added to `js/logic.js` and tested independently. `startSession()` stamps `activeSession.startTime`; `completeSession()` computes the elapsed seconds and persists them. `renderHistory()` reads the saved `duration` field and renders it. Retro sessions never receive a `duration` field — guarded by checking `!retroDate`.

**Tech Stack:** Vanilla JS, Node.js built-in test runner (`node --test`)

---

### Task 1: Add and test `formatDuration` in logic.js

**Files:**
- Modify: `tests/logic.test.js`
- Modify: `js/logic.js`

- [ ] **Step 1: Write failing tests for `formatDuration`**

Open `tests/logic.test.js`. Add at the top, update the `require` line to include `formatDuration`:

```js
const { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps, findTimerExerciseIndex, formatDuration } = require('../js/logic.js');
```

Then append these tests at the bottom of the file:

```js
// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

test('formatDuration: 0 seconds returns "< 1 min"', () => {
  assert.equal(formatDuration(0), '< 1 min');
});

test('formatDuration: 45 seconds returns "< 1 min"', () => {
  assert.equal(formatDuration(45), '< 1 min');
});

test('formatDuration: exactly 60 seconds returns "1 min"', () => {
  assert.equal(formatDuration(60), '1 min');
});

test('formatDuration: 2820 seconds returns "47 min"', () => {
  assert.equal(formatDuration(2820), '47 min');
});

test('formatDuration: 3599 seconds returns "59 min"', () => {
  assert.equal(formatDuration(3599), '59 min');
});

test('formatDuration: exactly 3600 seconds returns "1h 00m"', () => {
  assert.equal(formatDuration(3600), '1h 00m');
});

test('formatDuration: 3720 seconds returns "1h 02m"', () => {
  assert.equal(formatDuration(3720), '1h 02m');
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: 7 failures mentioning `formatDuration is not a function` or similar.

- [ ] **Step 3: Implement `formatDuration` in `js/logic.js`**

Add this function before the `module.exports` line at the bottom of `js/logic.js`:

```js
function formatDuration(seconds) {
  if (seconds < 60) return '< 1 min';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  return `${h}h ${m}m`;
}
```

Then update the `module.exports` line to include `formatDuration`:

```js
if (typeof module !== 'undefined') {
  module.exports = { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps, findTimerExerciseIndex, formatDuration };
}
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npm test
```

Expected: all tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add js/logic.js tests/logic.test.js
git commit -m "feat: add formatDuration to logic.js with tests"
```

---

### Task 2: Record start time on session start

**Files:**
- Modify: `index.html` — `startSession()` function (~line 702)

- [ ] **Step 1: Add `startTime` to `activeSession`**

In `index.html`, find the `startSession` function. After the line `activeSession = { phaseIndex, dayIndex, weights, setWeights, reps, completedSets };`, add:

```js
activeSession.startTime = Date.now();
```

The function should look like this after the change:

```js
function startSession(phaseIndex, dayIndex) {
  const day = phases[phaseIndex].days[dayIndex];
  const weights = {};
  day.exercises.forEach(ex => {
    const last = getLastWeight(ex.name);
    weights[ex.name] = last !== null ? last : 5;
  });
  const { reps, completedSets } = initSessionReps(day.exercises);
  const setWeights = {};
  day.exercises.forEach(ex => { setWeights[ex.name] = Array(parseInt(ex.sets)).fill(null); });
  activeSession = { phaseIndex, dayIndex, weights, setWeights, reps, completedSets };
  activeSession.startTime = Date.now();
  render();
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: stamp startTime on activeSession when workout begins"
```

---

### Task 3: Save duration on session complete

**Files:**
- Modify: `index.html` — `completeSession()` function (~line 828)

- [ ] **Step 1: Compute and save duration**

In `index.html`, find `completeSession()`. Before the `sessions.push({...})` call, add the duration calculation:

```js
const duration = (!retroDate && activeSession.startTime)
  ? Math.round((Date.now() - activeSession.startTime) / 1000)
  : undefined;
```

Then add `duration` to the object passed to `sessions.push`. The push call should become:

```js
sessions.push({
  date: retroDate || todayStr(),
  phase: activeSession.phaseIndex,
  dayIndex: activeSession.dayIndex,
  type: day.type,
  weights: { ...activeSession.weights },
  setWeights: activeSession.setWeights ? { ...activeSession.setWeights } : {},
  reps: activeSession.reps ? { ...activeSession.reps } : {},
  duration
});
```

(`duration` will be `undefined` for retro sessions and JSON serialization drops `undefined` keys, so retro entries will simply have no `duration` property in localStorage.)

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: compute and persist workout duration on session complete"
```

---

### Task 4: Display duration in history

**Files:**
- Modify: `index.html` — CSS block (~line 268) and `renderHistory()` (~line 1182)

- [ ] **Step 1: Add CSS for duration label**

In the `<style>` block, find the line:

```css
  .session-entry-type { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 1px; }
```

Add immediately after it:

```css
  .session-entry-duration { font-size: 10px; color: #888; }
```

- [ ] **Step 2: Render duration in session entry header**

In `renderHistory()`, find the session entry header HTML block:

```js
      html += `<div class="session-entry">
        <div class="session-entry-header">
          <div class="session-entry-date">${dateLabel}</div>
          <div class="session-entry-type" style="color:${color}">${s.type}</div>
        </div>
```

Replace it with:

```js
      const durationHtml = s.duration != null
        ? `<div class="session-entry-duration">${formatDuration(s.duration)}</div>`
        : '';
      html += `<div class="session-entry">
        <div class="session-entry-header">
          <div class="session-entry-date">${dateLabel}</div>
          <div class="session-entry-type" style="color:${color}">${s.type}</div>
          ${durationHtml}
        </div>
```

- [ ] **Step 3: Make `formatDuration` available in `index.html`**

`formatDuration` lives in `js/logic.js`. In `index.html`, find the existing `<script src="js/logic.js">` tag and verify it is loaded before the inline `<script>` block that contains `renderHistory`. It should already be — confirm and move on. The function will be in global scope when the inline script runs.

Check that `logic.js` does NOT gate `formatDuration` behind `module.exports` only — the `if (typeof module !== 'undefined')` guard already means the function is declared at the top level and available globally in the browser. No change needed.

- [ ] **Step 4: Run tests to confirm nothing regressed**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: display workout duration in session history log"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Open the app in a browser**

Open `index.html` directly in a browser (file:// is fine — no server needed).

- [ ] **Step 2: Start and complete a live session**

  1. Pick any day card and press **Start Workout**.
  2. Complete at least one set to unlock the **Complete Session** button.
  3. Press **Complete Session**.
  4. Navigate to **History**.
  5. The most recent session entry should show the workout type AND a duration (e.g. `"< 1 min"` since it was brief).

- [ ] **Step 3: Verify cancel discards duration**

  1. Press **Start Workout** on any day card.
  2. Press the cancel/back control to call `cancelSession()`.
  3. Confirm no new entry appears in History.

- [ ] **Step 4: Verify retro sessions show no duration**

  1. Tap a past unmarked day in the calendar.
  2. Complete the retro session.
  3. The new history entry should show date + type but no duration.
