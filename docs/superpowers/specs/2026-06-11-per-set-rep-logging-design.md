# Per-Set Rep Logging & Progressive Overload

**Date:** 2026-06-11  
**Status:** Approved

---

## Overview

Add per-set rep tracking to session logging. Each set gets logged individually with a +/- rep counter. Completing a set auto-starts a 90s rest timer. Rep data drives proper progressive overload recommendations — surfaced at session completion and in reference mode.

---

## Feature 1: Session Logging UI

### Exercise layout in logging mode

Each exercise block is restructured:

1. **Header row:** exercise name + `sets × reps` target
2. **Weight picker:** single dropdown applying to all sets (moved above set rows)
3. **Set rows:** one row per set, each containing:
   - Set label (e.g. `SET 1`)
   - +/- rep counter defaulting to the **bottom** of the target range (e.g. `10` for `10–12`, `15` for `15`)
   - `DONE` button
4. Tapping `DONE` on a set row:
   - Locks the row (static display of logged reps)
   - Automatically starts the 90s rest timer
5. Once all sets are done, the exercise collapses to a summary line: `15kg · 12 / 11 / 12`

### Fixed-rep exercises

Exercises with a single target (e.g. `"15"` or `"20"`) use `{ min: N, max: N }`. Hitting ≥ target counts as "top of range" for overload purposes.

### Rest timer change

The manual 60S/90S picker is removed. Completing a set always fires 90s automatically. The rest timer UI and underlying functions remain; `startRestTimer(60)` / `startRestTimer(90)` buttons are replaced by the set DONE button triggering `startRestTimer(90)`.

---

## Feature 2: Data Model

### Session object

```js
{
  date: "YYYY-MM-DD",
  phase: 0 | 1,
  dayIndex: 0–5,
  type: "PUSH" | "PULL" | "LEGS",
  weights: { [exerciseName]: kg },
  reps: { [exerciseName]: [set1Reps, set2Reps, ...] }  // new field
}
```

### Active session state

```js
activeSession = {
  phaseIndex,
  dayIndex,
  weights: { [exerciseName]: kg },
  reps: { [exerciseName]: [null, null, null] }  // null = not yet logged
}
```

### Backwards compatibility

Old sessions without a `reps` field:
- Still used for weight pre-fill via `getLastWeight()` — unchanged
- Ignored entirely by overload recommendation logic (treated as no rep data)

---

## Feature 3: Overload Recommendations

### Rep range parsing

New helper `parseRepRange(repsStr)`:
- `"10–12"` → `{ min: 10, max: 12 }`
- `"12–15"` → `{ min: 12, max: 15 }`
- `"15"` → `{ min: 15, max: 15 }`
- `"20"` → `{ min: 20, max: 20 }`
- `"10 each leg"` → `{ min: 10, max: 10 }`

### Overload logic

New function `getOverloadRecommendation(exerciseName, repsStr)`:

Finds the last sessions (newest first) that have a `reps` entry for this exercise. Evaluates in priority order:

1. **HOLD** — most recent session had 2+ sets below `min`: return `{ action: 'hold', label: 'HOLD — FOCUS ON FORM' }`
2. **STRONG PROGRESS** — last 2 sessions both had all sets ≥ `max`: return `{ action: 'increase', label: '↑ ADD 2.5KG', strong: true }`
3. **MILD PROGRESS** — most recent session had all sets ≥ `max`: return `{ action: 'increase', label: '↑ CONSIDER +2.5KG', strong: false }`
4. **NONE** — return `null`

If fewer than 1 session with rep data exists, returns `null`.

### Colours

- Hold: `#3a7be8` (PULL blue — calm, informational)
- Mild progress: `#b07a2a` (amber — same as warm-up accent)
- Strong progress: `#3ab87a` (LEGS green — positive action)

### Session completion summary

After `completeSession()` saves the session, before the toast fires, a summary panel is shown if any exercise has a recommendation. The panel lists each exercise with its recommendation label and colour. A single `DISMISS` button closes it and triggers the existing green toast.

The summary panel is a fixed overlay (like the toast) — not a new view/route. It only appears if at least one exercise has a non-null recommendation. Dismissing it does not re-show it; the recommendations persist in reference mode for the next visit.

### Reference mode nudge

In reference mode, each exercise row shows the recommendation from `getOverloadRecommendation()` inline, below the "Last logged" weight line. This replaces the old `getStaleWeight()` amber nudge entirely — `getStaleWeight()` is removed.

---

## Constraints

- Single `index.html`, no build step, no new dependencies
- Mobile-first, large touch targets (DONE button and +/- buttons min 44px)
- Old sessions continue to work for weight pre-fill
- Overload logic only evaluates sessions with `reps` data
