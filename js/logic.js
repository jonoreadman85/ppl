// Pure business logic — loaded by index.html via <script src> and by tests via require()

function parseRepRange(repsStr) {
  const enDash = repsStr.match(/(\d+)[–\-](\d+)/);
  if (enDash) return { min: parseInt(enDash[1]), max: parseInt(enDash[2]) };
  const num = repsStr.match(/^(\d+)/);
  const n = num ? parseInt(num[1]) : 10;
  return { min: n, max: n };
}

function getOverloadRecommendation(exerciseName, repsStr, _getSessions) {
  const { min, max } = parseRepRange(repsStr);
  const sessions = _getSessions().filter(s => s.reps && s.reps[exerciseName]);
  if (sessions.length === 0) return null;

  const lastSession = sessions[sessions.length - 1];
  const sw = lastSession.setWeights && lastSession.setWeights[exerciseName];
  if (sw) {
    for (let i = 1; i < sw.length; i++) {
      if (sw[i] !== null && sw[i - 1] !== null && sw[i] < sw[i - 1]) {
        return { action: 'hold', label: 'HOLD — DROPPED WEIGHT', color: '#3a7be8' };
      }
    }
  }

  const last = lastSession.reps[exerciseName];
  const belowMin = last.filter(r => r !== null && r < min).length;
  if (belowMin >= 2) return { action: 'hold', label: 'HOLD — FOCUS ON FORM', color: '#3a7be8' };

  const allAtMax = sets => sets.every(r => r !== null && r >= max);
  if (allAtMax(last)) {
    if (sessions.length >= 2 && allAtMax(sessions[sessions.length - 2].reps[exerciseName])) {
      return { action: 'increase', label: '↑ ADD 2.5KG', color: '#3ab87a' };
    }
    return { action: 'increase', label: '↑ CONSIDER +2.5KG', color: '#b07a2a' };
  }

  return null;
}

function calcStreak(loggedDateSet, today) {
  const logged = loggedDateSet;
  if (logged.size === 0) return 0;

  const _dateStr = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  const startCursor = new Date(today);
  startCursor.setHours(0, 0, 0, 0);
  if (!logged.has(_dateStr(startCursor))) {
    startCursor.setDate(startCursor.getDate() - 1);
  }

  let streak = 0;
  let weekGaps = 0;
  let weekDays = 0;
  const cursor = new Date(startCursor);

  while (true) {
    const ds = _dateStr(cursor);
    if (logged.has(ds)) {
      streak++;
    } else {
      weekGaps++;
      if (weekGaps > 1) break;
    }
    weekDays++;
    if (weekDays === 7) { weekGaps = 0; weekDays = 0; }
    cursor.setDate(cursor.getDate() - 1);
    if (Math.round((startCursor - cursor) / 86400000) > 365) break;
  }

  return streak;
}

function initSessionReps(exercises) {
  const reps = {};
  const completedSets = {};
  exercises.forEach(ex => {
    reps[ex.name] = Array(parseInt(ex.sets)).fill(null);
    completedSets[ex.name] = Array(parseInt(ex.sets)).fill(false);
  });
  return { reps, completedSets };
}

// Returns the index of the exercise after which the rest timer should be rendered.
// That's the last exercise that has at least one completed set.
// Returns -1 if no sets have been completed yet (timer goes at the end as fallback).
function findTimerExerciseIndex(exercises, completedSets) {
  let lastIdx = -1;
  exercises.forEach((ex, i) => {
    const done = completedSets[ex.name] || [];
    if (done.some(Boolean)) lastIdx = i;
  });
  return lastIdx;
}

function formatDuration(seconds) {
  if (seconds < 60) return '< 1 min';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  return `${h}h ${m}m`;
}

function getSupersetPartner(exercises, exerciseName) {
  const ex = exercises.find(e => e.name === exerciseName);
  if (!ex || !ex.superset || ex.supersetOrder !== 1) return null;
  const partner = exercises.find(e => e.superset === ex.superset && e.supersetOrder === 2);
  return partner ? partner.name : null;
}

if (typeof module !== 'undefined') {
  module.exports = { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps, findTimerExerciseIndex, formatDuration, getSupersetPartner };
}
