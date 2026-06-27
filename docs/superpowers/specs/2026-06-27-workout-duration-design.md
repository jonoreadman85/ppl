# Workout Duration Tracking

**Date:** 2026-06-27
**Status:** Approved

## Summary

Record how long each live workout session takes and display the duration in the session history log.

## Scope

- Live sessions only (user presses Start Workout, then Complete Session).
- Retro sessions (backdated via the calendar selector) are excluded — no duration is recorded or displayed for them.
- No live elapsed display during the workout; duration is only shown post-session in history.

## Data Layer

### `startSession()` — `index.html`

Add one line immediately after `activeSession` is initialised:

```js
activeSession.startTime = Date.now();
```

### `completeSession()` — `index.html`

Before pushing to the sessions array, compute duration and include it if this is a live session:

```js
const duration = (!retroDate && activeSession.startTime)
  ? Math.round((Date.now() - activeSession.startTime) / 1000)
  : undefined;

sessions.push({
  date: ...,
  ...,
  duration  // seconds; absent on retro sessions
});
```

### Cancel behaviour

No changes. `cancelSession()` already discards `activeSession` without saving — the `startTime` is lost with it.

## Formatting — `js/logic.js`

Export a pure function `formatDuration(seconds)`:

| Input | Output |
|-------|--------|
| `< 60` | `"< 1 min"` |
| `60–3599` | `"47 min"` |
| `≥ 3600` | `"1h 02m"` |

This lives in `logic.js` so it can be unit tested independently of the DOM.

## History Display — `renderHistory()` — `index.html`

In the session entry header, append duration if `s.duration` is defined:

```html
<div class="session-entry-header">
  <div class="session-entry-date">MON 23 JUN</div>
  <div class="session-entry-type" style="color:...">PUSH</div>
  <div class="session-entry-duration">47 min</div>  <!-- only if s.duration exists -->
</div>
```

Style `.session-entry-duration` to match `.session-entry-date` (muted, small) so it doesn't compete with the workout type label.

## Tests — `tests/logic.test.js`

Add unit tests for `formatDuration`:

- `0` → `"< 1 min"`
- `45` → `"< 1 min"`
- `60` → `"1 min"`
- `2820` → `"47 min"`
- `3600` → `"1h 00m"`
- `3720` → `"1h 02m"`

## GitHub Issue

This spec maps directly to a single GitHub issue:

> **Add workout duration to session history**
> Track time from Start Workout → Complete Session. Display formatted duration in the session log. Live sessions only; retro entries show no duration. Cancel discards without saving.
