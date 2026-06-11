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

  const last = sessions[sessions.length - 1].reps[exerciseName];
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

if (typeof module !== 'undefined') {
  module.exports = { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps };
}
