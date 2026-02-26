const STORAGE_KEY = 'autowakeup_android_v4';
const isAndroid = typeof window.AndroidBridge !== 'undefined';

const ui = {
  heroClock: document.getElementById('heroClock'),
  bedtimeInput: document.getElementById('bedtimeInput'),
  cyclesInput: document.getElementById('cyclesInput'),
  windowStartInput: document.getElementById('windowStartInput'),
  windowEndInput: document.getElementById('windowEndInput'),
  windowStartSlider: document.getElementById('windowStartSlider'),
  windowEndSlider: document.getElementById('windowEndSlider'),
  windowLabel: document.getElementById('windowLabel'),
  calculatedWake: document.getElementById('calculatedWake'),
  saveScheduleBtn: document.getElementById('saveScheduleBtn'),
  clearScheduleBtn: document.getElementById('clearScheduleBtn'),
  testModeToggle: document.getElementById('testModeToggle'),
  runFastCheckBtn: document.getElementById('runFastCheckBtn'),
  lastScreenOff: document.getElementById('lastScreenOff'),
  lastMeaningfulUse: document.getElementById('lastMeaningfulUse'),
  briefCheckCount: document.getElementById('briefCheckCount'),
  sleepState: document.getElementById('sleepState'),
  alarmState: document.getElementById('alarmState'),
  eventFeed: document.getElementById('eventFeed'),
  alarmModal: document.getElementById('alarmModal'),
  alarmMessage: document.getElementById('alarmMessage'),
  dismissAlarmBtn: document.getElementById('dismissAlarmBtn')
};

const state = {
  bedtime: null,
  sleepCycles: 6,
  windowStart: '06:30',
  windowEnd: '07:30',
  adaptiveWake: null,
  testMode: false,
  testArmedUntil: null,
  lastScreenOff: null,
  lastMeaningfulUse: null,
  briefNightChecks: [],
  appVisibleSince: null,
  testTimerId: null,
  nativeScheduleSummary: null
};

function now() { return new Date(); }

function feed(message) {
  const li = document.createElement('li');
  li.textContent = `[${now().toLocaleTimeString()}] ${message}`;
  ui.eventFeed.prepend(li);
  while (ui.eventFeed.children.length > 30) ui.eventFeed.lastChild.remove();
}

function toDisplay(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
}

function persist() {
  const serializable = { ...state, testTimerId: null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    Object.assign(state, JSON.parse(raw));
  } catch {
    feed('Saved data invalid; defaults restored.');
  }
}

function toHHmmFromMinutes(totalMinutes) {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toMinutes(timeValue) {
  const [h, m] = timeValue.split(':').map(Number);
  return (h * 60) + m;
}

function parseTimeToToday(timeValue) {
  if (!timeValue) return null;
  const [h, m] = timeValue.split(':').map(Number);
  const d = now();
  d.setHours(h, m, 0, 0);
  return d;
}

function minutesDiff(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function isNightHour(date) {
  const h = date.getHours();
  return h >= 22 || h < 7;
}

function pruneBriefChecks() {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  state.briefNightChecks = (state.briefNightChecks || []).filter((iso) => {
    const ts = new Date(iso).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function setClock() {
  ui.heroClock.textContent = now().toLocaleTimeString();
}

function syncRangeLabel() {
  ui.windowLabel.textContent = `${ui.windowStartInput.value || '--:--'} to ${ui.windowEndInput.value || '--:--'}`;
}

function syncSlidersFromTimeInputs() {
  if (!ui.windowStartInput.value || !ui.windowEndInput.value) return;
  ui.windowStartSlider.value = String(toMinutes(ui.windowStartInput.value));
  ui.windowEndSlider.value = String(toMinutes(ui.windowEndInput.value));
  syncRangeLabel();
}

function syncTimeInputsFromSliders() {
  ui.windowStartInput.value = toHHmmFromMinutes(Number(ui.windowStartSlider.value));
  ui.windowEndInput.value = toHHmmFromMinutes(Number(ui.windowEndSlider.value));
  syncRangeLabel();
}

function calcCycleWake(bedtime, cycles) {
  const base = parseTimeToToday(bedtime);
  if (!base || !Number.isFinite(cycles)) return null;
  base.setMinutes(base.getMinutes() + cycles * 90);
  return base;
}

function timeToHHmm(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function normalizeWindow(start, end) {
  const s = parseTimeToToday(start);
  const e = parseTimeToToday(end);
  if (!s || !e) return null;
  if (e <= s) e.setDate(e.getDate() + 1);
  return { s, e };
}

function sleepConfidence() {
  pruneBriefChecks();
  const meaningful = state.lastMeaningfulUse ? new Date(state.lastMeaningfulUse) : null;
  const inactiveHours = meaningful ? (Date.now() - meaningful.getTime()) / 3600000 : 0;
  const checks = state.briefNightChecks.length;
  if (!meaningful) return 'Analyzing';
  if (inactiveHours >= 2 && checks <= 4) return 'High (sleeping)';
  if (inactiveHours >= 1 && checks <= 8) return 'Medium (likely sleeping)';
  return 'Low (awake activity)';
}

function pickAdaptiveWake() {
  const bedtime = ui.bedtimeInput.value;
  const cycles = Number(ui.cyclesInput.value);
  const windowObj = normalizeWindow(ui.windowStartInput.value, ui.windowEndInput.value);
  if (!bedtime || !Number.isInteger(cycles) || cycles < 1 || cycles > 8 || !windowObj) return null;

  const cycleWake = calcCycleWake(bedtime, cycles);
  const candidates = [];

  for (let offset = -1; offset <= 1; offset += 1) {
    const d = new Date(cycleWake);
    d.setMinutes(d.getMinutes() + offset * 90);
    if (d >= windowObj.s && d <= windowObj.e) candidates.push(d);
  }

  if (!candidates.length) return new Date(windowObj.s.getTime() + (windowObj.e.getTime() - windowObj.s.getTime()) / 2);

  const confidence = sleepConfidence();
  const biasMinutes = confidence.startsWith('High') ? -10 : confidence.startsWith('Medium') ? 0 : 10;
  return candidates
    .map((d) => ({ d, score: Math.abs(minutesDiff(d, cycleWake)) + Math.abs(biasMinutes) }))
    .sort((a, b) => a.score - b.score)[0].d;
}

function refreshPreview() {
  syncRangeLabel();
  const adaptive = pickAdaptiveWake();
  ui.calculatedWake.textContent = adaptive ? timeToHHmm(adaptive) : '--:--';
}

function updateStatus() {
  ui.lastScreenOff.textContent = toDisplay(state.lastScreenOff);
  ui.lastMeaningfulUse.textContent = toDisplay(state.lastMeaningfulUse);
  ui.briefCheckCount.textContent = String((state.briefNightChecks || []).length);
  ui.sleepState.textContent = sleepConfidence();

  if (state.nativeScheduleSummary) {
    ui.alarmState.textContent = state.nativeScheduleSummary;
  } else if (state.adaptiveWake) {
    ui.alarmState.textContent = `Planned ${new Date(state.adaptiveWake).toLocaleString()}`;
  } else {
    ui.alarmState.textContent = 'Not scheduled';
  }
}

function playTone() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 820;
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);
}

function ringAlarm(reason) {
  ui.alarmMessage.textContent = reason === 'test-screen-off'
    ? 'Test alarm fired: 5 seconds after screen-off (manual armed test only).'
    : 'Wake-up alarm fired.';
  ui.alarmModal.classList.add('active');
  ui.alarmModal.setAttribute('aria-hidden', 'false');
  if ('vibrate' in navigator) navigator.vibrate([300, 120, 300]);
  playTone();
  feed(`Alarm triggered (${reason}).`);
}

function clearTestTimer() {
  if (!state.testTimerId) return;
  clearTimeout(state.testTimerId);
  state.testTimerId = null;
}

function armTestScreenOffAlarm() {
  if (!state.testMode) {
    feed('Enable test mode before arming test.');
    return;
  }
  state.testArmedUntil = new Date(Date.now() + 60_000).toISOString();
  persist();
  feed('Test armed for next 60s. Now turn screen off; alarm should fire in 5s.');
}

function maybeFireScreenOffTest() {
  if (!state.testMode || !state.testArmedUntil) return;
  if (Date.now() > new Date(state.testArmedUntil).getTime()) {
    state.testArmedUntil = null;
    persist();
    return;
  }

  clearTestTimer();
  state.testTimerId = setTimeout(() => {
    state.testTimerId = null;
    state.testArmedUntil = null;
    persist();
    ringAlarm('test-screen-off');
  }, 5000);
  feed('Screen-off detected in armed window. Running 5s test timer.');
}

function scheduleNativeAlarm(targetDate, windowMinutes) {
  if (!isAndroid || !window.AndroidBridge?.scheduleNativeAlarm) {
    state.nativeScheduleSummary = `Web planned ${targetDate.toLocaleString()}`;
    return;
  }

  const label = `Wake window ±${windowMinutes}m`;
  const result = window.AndroidBridge.scheduleNativeAlarm(targetDate.getTime(), windowMinutes, label);
  state.nativeScheduleSummary = result || `Native alarm set for ${targetDate.toLocaleString()}`;
}

function clearNativeAlarm() {
  if (isAndroid && window.AndroidBridge?.cancelNativeAlarm) {
    window.AndroidBridge.cancelNativeAlarm();
  }
  state.nativeScheduleSummary = null;
}

function saveSchedule() {
  const bedtime = ui.bedtimeInput.value;
  const cycles = Number(ui.cyclesInput.value);
  const windowStart = ui.windowStartInput.value;
  const windowEnd = ui.windowEndInput.value;

  if (!bedtime || !windowStart || !windowEnd || !Number.isInteger(cycles) || cycles < 1 || cycles > 8) {
    feed('Fill bedtime, cycles (1-8), and wake window start/end.');
    return;
  }

  const normalized = normalizeWindow(windowStart, windowEnd);
  if (!normalized) {
    feed('Invalid wake window values.');
    return;
  }

  const adaptive = pickAdaptiveWake();
  const windowMinutes = Math.max(1, Math.round((normalized.e.getTime() - normalized.s.getTime()) / 60000 / 2));

  state.bedtime = bedtime;
  state.sleepCycles = cycles;
  state.windowStart = windowStart;
  state.windowEnd = windowEnd;
  state.adaptiveWake = adaptive.toISOString();

  scheduleNativeAlarm(adaptive, windowMinutes);
  persist();
  refreshPreview();
  updateStatus();
  feed(`Saved adaptive schedule: ${adaptive.toLocaleString()} in your wake window.`);
}

function clearSchedule() {
  state.bedtime = null;
  state.sleepCycles = 6;
  state.windowStart = '06:30';
  state.windowEnd = '07:30';
  state.adaptiveWake = null;
  state.testArmedUntil = null;
  clearNativeAlarm();
  clearTestTimer();

  ui.bedtimeInput.value = '';
  ui.cyclesInput.value = '6';
  ui.windowStartInput.value = state.windowStart;
  ui.windowEndInput.value = state.windowEnd;
  syncSlidersFromTimeInputs();
  ui.calculatedWake.textContent = '--:--';

  persist();
  updateStatus();
  feed('Schedule cleared.');
}

function handleHiddenEvent() {
  const hiddenAt = now();
  state.lastScreenOff = hiddenAt.toISOString();

  let sessionMs = 0;
  if (state.appVisibleSince) sessionMs = hiddenAt.getTime() - new Date(state.appVisibleSince).getTime();

  const briefNightCheck = isNightHour(hiddenAt) && sessionMs >= 1_000 && sessionMs <= 15_000;
  if (briefNightCheck) {
    state.briefNightChecks.push(hiddenAt.toISOString());
    pruneBriefChecks();
    feed(`Brief night check (${Math.max(1, Math.round(sessionMs / 1000))}s).`);
  } else if (sessionMs > 20_000) {
    state.lastMeaningfulUse = hiddenAt.toISOString();
    feed(`Meaningful usage tracked (${Math.round(sessionMs / 1000)}s).`);
  }

  state.appVisibleSince = null;
  maybeFireScreenOffTest();
  persist();
  refreshPreview();
  updateStatus();
}

ui.saveScheduleBtn.addEventListener('click', saveSchedule);
ui.clearScheduleBtn.addEventListener('click', clearSchedule);
ui.runFastCheckBtn.addEventListener('click', armTestScreenOffAlarm);
ui.dismissAlarmBtn.addEventListener('click', () => {
  ui.alarmModal.classList.remove('active');
  ui.alarmModal.setAttribute('aria-hidden', 'true');
});

ui.testModeToggle.addEventListener('change', (event) => {
  state.testMode = Boolean(event.target.checked);
  if (!state.testMode) {
    state.testArmedUntil = null;
    clearTestTimer();
  }
  persist();
  updateStatus();
  feed(`Test mode ${state.testMode ? 'enabled (manual arm only)' : 'disabled'}.`);
});

ui.bedtimeInput.addEventListener('input', refreshPreview);
ui.cyclesInput.addEventListener('input', refreshPreview);
ui.windowStartInput.addEventListener('input', () => { syncSlidersFromTimeInputs(); refreshPreview(); });
ui.windowEndInput.addEventListener('input', () => { syncSlidersFromTimeInputs(); refreshPreview(); });
ui.windowStartSlider.addEventListener('input', () => { syncTimeInputsFromSliders(); refreshPreview(); });
ui.windowEndSlider.addEventListener('input', () => { syncTimeInputsFromSliders(); refreshPreview(); });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    clearTestTimer();
    state.appVisibleSince = new Date().toISOString();
    refreshPreview();
    updateStatus();
    persist();
    return;
  }

  if (document.visibilityState === 'hidden') handleHiddenEvent();
});

window.addEventListener('beforeunload', () => {
  clearTestTimer();
  state.lastScreenOff = new Date().toISOString();
  persist();
});

function init() {
  load();

  if (state.bedtime) ui.bedtimeInput.value = state.bedtime;
  ui.cyclesInput.value = String(state.sleepCycles || 6);
  ui.windowStartInput.value = state.windowStart || '06:30';
  ui.windowEndInput.value = state.windowEnd || '07:30';
  syncSlidersFromTimeInputs();
  ui.testModeToggle.checked = Boolean(state.testMode);

  state.appVisibleSince = new Date().toISOString();
  if (!state.lastMeaningfulUse) state.lastMeaningfulUse = state.appVisibleSince;

  if (isAndroid && window.AndroidBridge?.getNativeAlarmState) {
    const nativeState = window.AndroidBridge.getNativeAlarmState();
    if (nativeState) state.nativeScheduleSummary = nativeState;
  }

  setClock();
  setInterval(setClock, 1000);
  refreshPreview();
  updateStatus();
  persist();
  feed(`Initialized (${isAndroid ? 'Android native alarm mode' : 'web fallback mode'}).`);
}

init();
