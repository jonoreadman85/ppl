'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseRepRange, getOverloadRecommendation, calcStreak, initSessionReps, findTimerExerciseIndex, formatDuration } = require('../js/logic.js');

// ---------------------------------------------------------------------------
// parseRepRange
// ---------------------------------------------------------------------------

test('parseRepRange: en-dash range', () => {
  assert.deepEqual(parseRepRange('10–12'), { min: 10, max: 12 });
});

test('parseRepRange: hyphen range', () => {
  assert.deepEqual(parseRepRange('12-15'), { min: 12, max: 15 });
});

test('parseRepRange: single number', () => {
  assert.deepEqual(parseRepRange('15'), { min: 15, max: 15 });
});

test('parseRepRange: single number with suffix (each leg)', () => {
  assert.deepEqual(parseRepRange('10 each leg'), { min: 10, max: 10 });
});

test('parseRepRange: single number with suffix (each side)', () => {
  assert.deepEqual(parseRepRange('12 each side'), { min: 12, max: 12 });
});

// ---------------------------------------------------------------------------
// initSessionReps
// ---------------------------------------------------------------------------

test('initSessionReps: creates correct number of null slots when sets is a string', () => {
  const exercises = [
    { name: 'Bench Press', sets: '3', reps: '10–12' },
    { name: 'Squat', sets: '4', reps: '8–10' },
  ];
  const { reps, completedSets } = initSessionReps(exercises);

  assert.equal(reps['Bench Press'].length, 3);
  assert.equal(reps['Squat'].length, 4);
  assert.deepEqual(reps['Bench Press'], [null, null, null]);
  assert.deepEqual(reps['Squat'], [null, null, null, null]);

  assert.deepEqual(completedSets['Bench Press'], [false, false, false]);
  assert.deepEqual(completedSets['Squat'], [false, false, false, false]);
});

test('initSessionReps: all sets start as not completed', () => {
  const exercises = [{ name: 'Curl', sets: '3', reps: '12–15' }];
  const { completedSets } = initSessionReps(exercises);
  assert.ok(completedSets['Curl'].every(v => v === false));
});

test('initSessionReps: adjusting rep value does not mark set as done', () => {
  const exercises = [{ name: 'Curl', sets: '3', reps: '12–15' }];
  const { reps, completedSets } = initSessionReps(exercises);
  // Simulate updateReps setting a non-null value
  reps['Curl'][0] = 13;
  // completedSets should still be false — DONE button must set it explicitly
  assert.equal(completedSets['Curl'][0], false);
});

// ---------------------------------------------------------------------------
// getOverloadRecommendation
// ---------------------------------------------------------------------------

function mockGetSessions(sessions) {
  return () => sessions;
}

function session(exerciseName, repsArr) {
  return { reps: { [exerciseName]: repsArr }, weights: { [exerciseName]: 15 } };
}

function sessionWithSetWeights(exerciseName, repsArr, setWeightsArr) {
  return {
    reps: { [exerciseName]: repsArr },
    weights: { [exerciseName]: setWeightsArr[setWeightsArr.length - 1] },
    setWeights: { [exerciseName]: setWeightsArr },
  };
}

test('getOverloadRecommendation: returns null with no session data', () => {
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions([]));
  assert.equal(rec, null);
});

test('getOverloadRecommendation: returns null for sessions without reps field', () => {
  const sessions = [{ weights: { 'Bench Press': 15 } }];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec, null);
});

test('getOverloadRecommendation: HOLD when 2+ sets below min', () => {
  const sessions = [session('Bench Press', [8, 8, 12])]; // 2 sets below min of 10
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'hold');
  assert.equal(rec.label, 'HOLD — FOCUS ON FORM');
  assert.equal(rec.color, '#3a7be8');
});

test('getOverloadRecommendation: no HOLD when only 1 set below min', () => {
  const sessions = [session('Bench Press', [9, 11, 12])]; // only 1 below min
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.notEqual(rec && rec.action, 'hold');
});

test('getOverloadRecommendation: MILD PROGRESS when last session all sets at max', () => {
  const sessions = [session('Bench Press', [12, 12, 12])]; // all at max of 12
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'increase');
  assert.equal(rec.label, '↑ CONSIDER +2.5KG');
  assert.equal(rec.color, '#b07a2a');
});

test('getOverloadRecommendation: STRONG PROGRESS when last 2 sessions all sets at max', () => {
  const sessions = [
    session('Bench Press', [12, 12, 12]),
    session('Bench Press', [12, 12, 12]),
  ];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'increase');
  assert.equal(rec.label, '↑ ADD 2.5KG');
  assert.equal(rec.color, '#3ab87a');
});

test('getOverloadRecommendation: MILD not STRONG when only last 1 session at max', () => {
  const sessions = [
    session('Bench Press', [10, 11, 11]), // first session not all at max
    session('Bench Press', [12, 12, 12]), // last session all at max
  ];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.label, '↑ CONSIDER +2.5KG');
});

test('getOverloadRecommendation: null when last session is mid-range', () => {
  const sessions = [session('Bench Press', [11, 11, 11])]; // above min, below max
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec, null);
});

test('getOverloadRecommendation: HOLD takes priority over max check', () => {
  // 2 sets below min AND 1 set above max — HOLD wins
  const sessions = [session('Bench Press', [8, 8, 13])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'hold');
});

test('getOverloadRecommendation: works for single fixed-rep exercise', () => {
  const sessions = [session('Calf Raise', [20, 20, 20])];
  const rec = getOverloadRecommendation('Calf Raise', '20', mockGetSessions(sessions));
  assert.equal(rec.action, 'increase');
});

test('getOverloadRecommendation: HOLD when weight dropped mid-session', () => {
  // Started at 15kg, had to drop to 12.5kg for last 2 sets
  const sessions = [sessionWithSetWeights('Bench Press', [10, 10, 10], [15, 12.5, 12.5])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'hold');
  assert.ok(rec.label.includes('HOLD'), `Expected label to include HOLD, got: ${rec.label}`);
});

test('getOverloadRecommendation: HOLD when weight drops on last set only', () => {
  const sessions = [sessionWithSetWeights('Bench Press', [12, 12, 10], [15, 15, 12.5])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'hold');
});

test('getOverloadRecommendation: normal reps logic when all sets same weight', () => {
  // All at max reps and same weight — should suggest increase
  const sessions = [sessionWithSetWeights('Bench Press', [12, 12, 12], [12.5, 12.5, 12.5])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'increase');
});

test('getOverloadRecommendation: normal reps logic for old sessions without setWeights', () => {
  // Old session format — no setWeights field, should use reps as before
  const sessions = [session('Bench Press', [12, 12, 12])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.equal(rec.action, 'increase');
});

test('getOverloadRecommendation: no HOLD when weight increases across sets', () => {
  // Pyramid up — not a drop, normal logic applies
  const sessions = [sessionWithSetWeights('Bench Press', [12, 11, 10], [10, 12.5, 15])];
  const rec = getOverloadRecommendation('Bench Press', '10–12', mockGetSessions(sessions));
  assert.notEqual(rec && rec.action, 'hold');
});

// ---------------------------------------------------------------------------
// calcStreak
// ---------------------------------------------------------------------------

function dateSet(...daysAgo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const set = new Set();
  daysAgo.forEach(n => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    set.add(fmt(d));
  });
  return { set, today };
}

test('calcStreak: 0 when no sessions', () => {
  const { today } = dateSet();
  assert.equal(calcStreak(new Set(), today), 0);
});

test('calcStreak: 1 when only today logged', () => {
  const { set, today } = dateSet(0);
  assert.equal(calcStreak(set, today), 1);
});

test('calcStreak: counts consecutive days including today', () => {
  const { set, today } = dateSet(0, 1, 2, 3);
  assert.equal(calcStreak(set, today), 4);
});

test('calcStreak: counts from yesterday when today not logged', () => {
  const { set, today } = dateSet(1, 2, 3);
  assert.equal(calcStreak(set, today), 3);
});

test('calcStreak: allows one gap per 7-day window', () => {
  // 6 out of 7 days — one gap allowed
  const { set, today } = dateSet(0, 1, 2, 4, 5, 6); // skip day 3
  assert.equal(calcStreak(set, today), 6);
});

test('calcStreak: breaks on second gap in same 7-day window', () => {
  // days 0-6 with 2 gaps — streak should break
  const { set, today } = dateSet(0, 1, 3, 5, 6); // gaps at 2 and 4
  const streak = calcStreak(set, today);
  assert.ok(streak < 6, `Expected streak < 6, got ${streak}`);
});

test('calcStreak: 0 for sessions more than 2 days ago with no recent activity', () => {
  const { set, today } = dateSet(5, 6, 7);
  assert.equal(calcStreak(set, today), 0);
});

// ---------------------------------------------------------------------------
// findTimerExerciseIndex
// ---------------------------------------------------------------------------

const exercises = [
  { name: 'Press', sets: '3', reps: '10–12' },
  { name: 'Row', sets: '3', reps: '10–12' },
  { name: 'Curl', sets: '3', reps: '12–15' },
];

test('findTimerExerciseIndex: -1 when no sets completed', () => {
  const completedSets = { Press: [false, false, false], Row: [false, false, false], Curl: [false, false, false] };
  assert.equal(findTimerExerciseIndex(exercises, completedSets), -1);
});

test('findTimerExerciseIndex: 0 when only first exercise has completed sets', () => {
  const completedSets = { Press: [true, false, false], Row: [false, false, false], Curl: [false, false, false] };
  assert.equal(findTimerExerciseIndex(exercises, completedSets), 0);
});

test('findTimerExerciseIndex: follows last exercise with any done set', () => {
  const completedSets = { Press: [true, true, true], Row: [true, false, false], Curl: [false, false, false] };
  assert.equal(findTimerExerciseIndex(exercises, completedSets), 1);
});

test('findTimerExerciseIndex: moves to third exercise once second is started', () => {
  const completedSets = { Press: [true, true, true], Row: [true, true, true], Curl: [true, false, false] };
  assert.equal(findTimerExerciseIndex(exercises, completedSets), 2);
});

test('findTimerExerciseIndex: last exercise index when all exercises fully done', () => {
  const completedSets = { Press: [true, true, true], Row: [true, true, true], Curl: [true, true, true] };
  assert.equal(findTimerExerciseIndex(exercises, completedSets), 2);
});

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
