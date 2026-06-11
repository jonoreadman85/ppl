# Rest Timer, Progressive Overload Nudges & Streak Counter

**Date:** 2026-06-11  
**Status:** Approved

---

## Overview

Three in-place features added to the single `index.html` workout app. All follow the existing minimal dark aesthetic — no modals, no overlays, no interruptions.

---

## Feature 1: Rest Timer

### Where
During an active session, the existing static "— REST 60–90 SEC BETWEEN SETS —" text is replaced with an interactive rest timer row.

### Behaviour
- Shows two buttons: `60S` and `90S`
- Tapping either starts a countdown
- Active state displays a large countdown number (e.g. `0:47`) and a thin progress bar that depletes left-to-right
- When the timer hits zero it pulses briefly (CSS animation) then resets to the two-button picker
- Tapping while counting down cancels and returns to the picker
- No sound — visual only

### Implementation
Three new JS variables:
- `restTimer` — null | 60 | 90 (selected duration)
- `restRemaining` — seconds left
- `restInterval` — setInterval handle

Countdown driven by `Date.now()` delta (stored as `restStart` timestamp) rather than a decrement counter, so it survives re-renders. A `setInterval` ticks every 500ms, recalculates remaining seconds, and calls a lightweight `updateRestDisplay()` function that patches the timer DOM directly (no full re-render).

`cancelSession()` clears the interval and resets all three variables.

---

## Feature 2: Progressive Overload Nudges

### Where
Reference mode only (the exercise list before starting a session). Appears beneath the existing "Last logged: Xkg" line on each exercise row.

### Behaviour
If the logged weight for an exercise is unchanged across the last 6 or more sessions that included that exercise, show an amber nudge: `↑ CONSIDER PROGRESSING`

Styled like the existing `.exercise-cue` text — 10px, muted, inline. Amber colour (`#b07a2a`) matching the warm-up block accent already in the app.

Shows nothing if fewer than 6 sessions exist for that exercise, or if weight has changed within the last 6.

### Implementation
New function `getStaleWeight(exerciseName)`:
- Reads all sessions from localStorage
- Filters to sessions that contain that exercise in their weights
- Takes the last 6
- Returns `true` if all 6 have identical weight values

No new data stored. Purely derived from existing session history.

Only rendered in reference mode (the `else` branch in `renderPhase()`), not during active logging.

---

## Feature 3: Streak Counter

### Where
The header — visible on all tabs (Phase 1, Phase 2, History). Sits as a small line below the existing `.header-sub` subtitle element.

### Behaviour
- Calculated on every render
- Style: `— 12 DAY STREAK —` in the same 9px letter-spaced small caps as `.header-sub`
- Colour: `#e85d3a` (PUSH red accent) to give it a little energy without being loud
- Hidden entirely if streak is fewer than 2 days (no "0 day streak" noise)

### Streak logic
Starting from today (if a session exists today) or yesterday, walk backwards through calendar days:

- A day is **covered** if it has at least one logged session
- A single gap (no session) per 7-day window is allowed — representing the built-in rest day
- The streak ends when there are 2+ consecutive missed days, or 2+ total gaps in any rolling 7-day window

New function `calcStreak()`:
- Gets all sessions, builds a Set of logged date strings
- Walks backwards from today
- Tracks gap count within each 7-day window
- Returns integer streak length in days

---

## Constraints

- Single `index.html`, no build step, no new dependencies
- Mobile-first, large touch targets (timer buttons min 44px height)
- Dark theme throughout
- No sound or vibration
