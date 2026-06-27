# Phase 3: Upper/Lower Split with Supersets — Design Spec

**Date:** 2026-06-27  
**Status:** Approved

---

## Overview

Replace the 6-day PPL split with a 4-day Upper/Lower programme using antagonist supersets. Goal: same 45-minute sessions, higher intensity, better strength and hypertrophy stimulus.

Equipment: 40kg adjustable dumbbells + bench. Flexible scheduling — no fixed days, just enforce no consecutive upper days.

---

## 1. Programme Data

Phase 3 is added as a third entry in the `phases` array in `index.html`.

**Session types:** `UPPER_A`, `UPPER_B`, `LOWER_A`, `LOWER_B` — 4 sessions, no rest day (user schedules flexibly).

**Session format:** 3 supersets × 3 sets each. 60s rest after each superset pair. No rest between the two exercises within a superset.

Each exercise object gains two new fields:
- `superset`: number 1–3 (which superset group it belongs to)
- `supersetOrder`: 1 or 2 (position within the pair; 1 = do first, 2 = do second)
- Singleton exercises (Calf Raise) have `supersetOrder: 1` and no partner — treated as a regular exercise with rest after each set

**Rep ranges:**
- Compounds: `8–10`
- Isolations: `10–12`
- Overhead Press: `10–12` (no change; user manages progression themselves)

**Warm-up:** No `warmups` entry for Phase 3 types. The warm-up section is not rendered for Phase 3 sessions.

### Session exercise lists

**Upper A — Horizontal press dominant**
| Superset | Ex 1 | Ex 2 |
|---|---|---|
| 1 | Incline DB Press (8–10) | Bent-Over Row (8–10) |
| 2 | Lateral Raise (10–12) | Rear Delt Fly (10–12) |
| 3 | Bicep Curl (10–12) | Tricep Extension (10–12) |

**Upper B — Shoulder dominant**
| Superset | Ex 1 | Ex 2 |
|---|---|---|
| 1 | Overhead Press (10–12) | Rear Delt Fly (10–12) |
| 2 | Lateral Raise (10–12) | Hammer Curl (10–12) |
| 3 | Bent-Over Row (8–10) | Tricep Kickback (10–12) |

**Lower A — Quad dominant**
| Superset | Ex 1 | Ex 2 |
|---|---|---|
| 1 | Goblet Squat (8–10) | RDL (8–10) |
| 2 | Walking Lunge (10–12) | Sumo Squat (10–12) |
| 3 | Calf Raise (15–20) | — singleton |

**Lower B — Posterior chain dominant**
| Superset | Ex 1 | Ex 2 |
|---|---|---|
| 1 | RDL (8–10) | Hip Thrust (8–10) |
| 2 | Single-Leg RDL (10–12) | Reverse Lunge (10–12) |
| 3 | Calf Raise (15–20) | — singleton |

---

## 2. Superset Session UI

Existing per-exercise block layout is preserved. Phase 3 sessions add superset grouping on top.

**Reference mode (before starting):** A `SUPERSET N` label appears above each pair of exercises. Exercises within a pair are visually grouped with a subtle divider.

**Active session mode:**

Rest timer logic is conditional on phase:
- **Ex 1 of a pair completes a set** → no rest timer. Show a static nudge in the timer slot: `→ [Ex 2 name]`
- **Ex 2 of a pair completes a set** → fire 60s rest timer as normal
- **Singleton exercise** (Calf Raise) → fire rest timer after each set as normal
- **Phases 1 & 2** → existing 90s rest timer behaviour unchanged

**New pure function in `logic.js`:**
```
getSupersetPartner(exercises, exerciseName) → string | null
```
Returns the name of the partner exercise in the same superset group, or `null` if the exercise is a singleton or is Ex 2 (i.e. should trigger rest).

`completeSetRow` checks this: if partner exists and current exercise is Ex 1, skip `startRestTimer` and show the nudge; otherwise call `startRestTimer(60)` for Phase 3 or `startRestTimer(90)` for Phases 1–2.

---

## 3. Tabs, Header & Default Phase

**Tabs:** `PHASE 1 | PHASE 2 | PHASE 3 | HISTORY` (four tabs)

**Header sub-line:** Updates dynamically:
- Phases 1–2: `6-DAY SPLIT · DUMBBELL ONLY`
- Phase 3: `4-DAY UPPER/LOWER · DUMBBELL ONLY`

**Default phase persistence:**
- `currentPhase` is saved to `localStorage` key `ppl_phase` on every tab change
- Restored on page load — user always returns to where they left off
- Falls back to `0` if no value stored

**Type colours:**
- `UPPER_A` and `UPPER_B`: `#9b59b6` (purple)
- `LOWER_A` and `LOWER_B`: `#3ab87a` (green — reuses legs colour)

**Day card labels:** Display as `UPPER A`, `UPPER B`, `LOWER A`, `LOWER B` in the card heading.

---

## 4. Consecutive Upper Warning

Triggered when user taps `START SESSION` on an Upper A or Upper B session.

**Check:** Look at the most recent logged session in `getSessions()`. If its type is `UPPER_A` or `UPPER_B` and its date is today or yesterday, show the warning.

**UI:** Inline within the day card body (no modal/overlay). Replaces the start button:

```
⚠ UPPER SESSION YESTERDAY — CONSIDER LOWER TODAY
[START ANYWAY]  [DISMISS]
```

- `START ANYWAY` → proceeds to start the session normally
- `DISMISS` → collapses the warning, restores the `START SESSION` button

The warning is stateless — it re-evaluates each time the card is opened.

---

## 5. Overhead Press Shoulder Reminder

Shown during active Upper B sessions only, until 2 Upper B sessions have been logged.

**Check:** Count sessions in `getSessions()` where `type === 'UPPER_B'`. If count < 2, show the banner.

**UI:** Amber (`#b07a2a`) styled div above the exercise blocks:

```
SHOULDER CHECK — Assess comfort on Overhead Press before increasing load
```

Disappears automatically once 2 Upper B sessions are in history. No user dismissal needed.

---

## Out of Scope

- No fixed scheduling / calendar enforcement beyond the consecutive upper warning
- No changes to overload logic (tracks per exercise independently as before)
- Phases 1 & 2 are untouched
