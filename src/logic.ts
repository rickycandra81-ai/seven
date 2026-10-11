// Pure derivations ported from the `Component` class methods in the current
// Seven.dc.html Claude Design canvas. No React here — state in, values out.

import { BODY_FRONT, BODY_MUSCLES, BODY_BACK, BodyRegion, MUS_REGION } from './body';
import { breakdownFor } from './content';
import { CANON, DAYS, LIB, MAX_KG, POOL } from './data';
import { SK } from './skills';
import { AppState, HistEntry, KgSeries, ProgEntry, SETTINGS } from './types';

export const id = (day: number, i: number) => `${day}-${i}`;

export function P(state: AppState, exId: string): ProgEntry {
  return state.prog[exId] || {};
}

// full-body days 5-7 are led by one muscle group
const LEAD_GROUP: Record<number, string> = { 5: 'SHOULDER', 6: 'BACK', 7: 'CHEST' };

// leg, core, bicep and tricep work is always 3 sets, on any day; pull-up never takes a slot.
export function isMain(day: number, i: number): boolean {
  const e = DAYS[day - 1].exs[i];
  return !!e && !e.k && e.g !== 'LEGS' && e.g !== 'CORE' && e.g !== 'BICEP' && e.g !== 'TRICEP' && e.n !== 'Pull up';
}

// on full-body days 5-7, only the day's lead-group rows can take a heavy slot
export function eligibleHeavy(day: number, i: number): boolean {
  if (!isMain(day, i)) return false;
  const lead = LEAD_GROUP[day];
  return !lead || DAYS[day - 1].exs[i].g === lead;
}

export function defaultFours(day: number): number[] {
  const out: number[] = [];
  DAYS[day - 1].exs.forEach((e, i) => {
    if (e.h && eligibleHeavy(day, i)) out.push(i);
  });
  return out;
}

// days 5-7: the two lead-group rows are always the heavy pair, no manual pick
export function autoHeavy(day: number): boolean {
  return day >= 5;
}

export function fours(state: AppState, day: number): number[] {
  if (autoHeavy(day)) {
    const out: number[] = [];
    DAYS[day - 1].exs.forEach((_, i) => {
      if (eligibleHeavy(day, i)) out.push(i);
    });
    return out.slice(0, 2);
  }
  const saved = state.fours && state.fours[day];
  return (saved || defaultFours(day)).filter((i) => eligibleHeavy(day, i));
}

export function heavyCount(day: number): number {
  let c = 0;
  DAYS[day - 1].exs.forEach((_, i) => {
    if (isMain(day, i)) c++;
  });
  return c;
}

// every 4-set slot is a choice on days 1-4 — nothing is forced to 4
export function setsFor(state: AppState, day: number, i: number): number {
  return isMain(day, i) && fours(state, day).indexOf(i) !== -1 ? 4 : 3;
}

// exactly two heavy slots per day: free to pick while fewer than two are taken,
// whether or not an existing one is already finished.
export function nextFours(state: AppState, day: number, i: number, want: boolean): number[] {
  const cur = fours(state, day);
  if (!want) return cur.filter((x) => x !== i);
  if (cur.indexOf(i) !== -1 || !eligibleHeavy(day, i) || cur.length >= 2) return cur;
  return cur.concat([i]);
}

// dims/disables the "4 HEAVY SLOT" pill once both slots for the day are taken
export function isHeavyBlocked(state: AppState, day: number, i: number): boolean {
  if (setsFor(state, day, i) === 4) return false;
  return fours(state, day).length >= 2;
}

// load is stored against the MOVE, not the slot and not the day: Face pull
// logged on Day 1 shows up again on Day 2/5/6/7. A move never loaded starts at 0.
export function loadKey(name: string): string {
  return CANON(name);
}

export function getLoad(state: AppState, name: string, legacyKg = 0): number {
  const v = state.loads[loadKey(name)];
  return v === undefined ? legacyKg : v;
}

// weights persisted under the older "day|Move" shape collapse onto the canonical
// move; when several days carried the same move, the heaviest one wins.
export function migrateLoads(L: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  Object.keys(L).forEach((k) => {
    const m = k.match(/^\d+\|(.+)$/);
    const c = CANON(m ? m[1] : k);
    if (out[c] === undefined || L[k] > out[c]) out[c] = L[k];
  });
  return out;
}

export interface RankedRow {
  n: string;
  p: number;
  base?: boolean;
}

// ranked list: the planned move plus every free alternative from its
// training-type pool, highest emphasis first.
export function ranked(state: AppState, day: number, idx: number, name: string): RankedRow[] {
  const k = LIB[name].g;
  const taken: Record<string, 1> = {};
  DAYS[day - 1].exs.forEach((x, j) => {
    if (j === idx || x.k === 'hold') return;
    // a slot only reserves the move it is ACTUALLY doing — swap a move out and
    // it returns to the pool for every other slot in that group.
    const sub = P(state, id(day, j)).sub;
    taken[CANON(sub || x.n)] = 1;
  });
  const cur = CANON(name);
  const pool = POOL[k] || {};
  const rows: RankedRow[] = [{ n: name, p: LIB[name].p, base: true }];
  Object.keys(pool).forEach((n) => {
    if (n === cur || taken[n]) return;
    rows.push({ n, p: pool[n] });
  });
  return rows.sort((x, y) => y.p - x.p);
}

// holds are tracked the same way as any lift — ticked sets, not a timer.
export function doneOf(state: AppState, day: number, i: number): boolean {
  return (P(state, id(day, i)).sets || 0) >= setsFor(state, day, i);
}

export function countDone(state: AppState, day: number): number {
  let c = 0;
  const t = DAYS[day - 1].exs.length;
  for (let i = 0; i < t; i++) if (doneOf(state, day, i)) c++;
  return c;
}

// Epley: what one rep would weigh at the same effort. Ignores single-rep sets,
// where the lift already IS the max.
export const E1RM = (kg: number, r: number): number => (r <= 1 ? kg : Math.round(kg * (1 + r / 30)));

// ---- which exercise the card shows ----------------------------------------

// the first exercise that is started but unfinished — the one the app insists on
export function midIdx(state: AppState, day: number): number {
  const n = DAYS[day - 1].exs.length;
  for (let i = 0; i < n; i++) {
    const k = P(state, id(day, i)).sets || 0;
    if (k > 0 && k < setsFor(state, day, i)) return i;
  }
  return -1;
}

// the parked card if it belongs to this day, else whatever is mid-way, else the
// first thing left to do.
export function curIdx(state: AppState): number {
  const d = state.day;
  const n = DAYS[d - 1].exs.length;
  if (state.curId && +state.curId.split('-')[0] === d) {
    const k = +state.curId.split('-')[1];
    if (k < n) return k;
  }
  const mid = midIdx(state, d);
  if (mid >= 0) return mid;
  for (let i = 0; i < n; i++) if (!doneOf(state, d, i)) return i;
  return 0;
}

export function clampIdx(day: number, i: number): number {
  return Math.max(0, Math.min(DAYS[day - 1].exs.length - 1, i));
}

// ---- skill ladders ---------------------------------------------------------

// the step a ladder currently sits on, clamped to the steps that exist
export function lv(state: AppState, L: string): number {
  return Math.min((state.skillLv || {})[L] || 0, SK[L].steps.length - 1);
}

export function clampLevel(L: string, j: number): number {
  return Math.max(0, Math.min(SK[L].steps.length - 1, j));
}

// a ladder step is cleared once every set of the day hit its target hold
export function canLevelUp(state: AppState, day: number, i: number): boolean {
  const e = DAYS[day - 1].exs[i];
  if (!e.k || !e.L) return false;
  const lvI = lv(state, e.L);
  if (lvI >= SK[e.L].steps.length - 1) return false;
  const p = P(state, id(day, i));
  if (!doneOf(state, day, i) || p.lv !== lvI) return false;
  const secs = p.secs || [];
  const target = SK[e.L].steps[lvI][1];
  return secs.length >= setsFor(state, day, i) && secs.every((v) => v >= target);
}

// ---- reps ------------------------------------------------------------------

// what the next set should be done for: the pick the user made, else the plan's
// own rep target.
export function repsVal(state: AppState, exId: string): number {
  const sel = state.repsSel[exId];
  return sel != null ? sel : SETTINGS.repTarget;
}

export const clampReps = (v: number): number => Math.max(1, Math.min(50, v));

// ---- progressive overload --------------------------------------------------

export interface Suggestion {
  show: boolean;
  kg: number;
}

// the gym's weights move in 5 kg steps, and some machines top out (MAX_KG)
export const LOAD_STEP = 5;
export function fitLoad(name: string, kg: number): number {
  const v = Math.max(0, Math.round(kg / LOAD_STEP) * LOAD_STEP);
  const max = MAX_KG[CANON(name)];
  return max === undefined ? v : Math.min(max, v);
}

// one step up or down from any load, landing on the next real 5 kg mark
export function stepLoad(name: string, kg: number, dir: 1 | -1): number {
  return fitLoad(name, dir > 0 ? Math.floor(kg / LOAD_STEP + 1e-9) * LOAD_STEP + LOAD_STEP : Math.ceil(kg / LOAD_STEP - 1e-9) * LOAD_STEP - LOAD_STEP);
}

// every set of the last session hit the rep target at a weight you have not beaten
// yet — time for the next 5 kg step, unless the machine is already maxed out.
export function suggestion(state: AppState, canon: string, need: number, loadKg: number, sets: number): Suggestion {
  const last = state.lastLog[canon];
  const hit =
    !!last && last.kg > 0 && !!last.reps && last.reps.length >= need && last.reps.every((r) => r >= SETTINGS.repTarget);
  const kg = hit ? stepLoad(canon, (last as { kg: number }).kg, 1) : 0;
  return { show: hit && kg > (last as { kg: number }).kg && sets === 0 && loadKg <= (last as { kg: number }).kg, kg };
}

const conv = (kg: number, unit: 'kg' | 'lb') => (unit === 'kg' ? kg : Math.round(kg * 2.20462 * 10) / 10);

export function lastLine(state: AppState, canon: string, unit: 'kg' | 'lb'): string {
  const last = state.lastLog[canon];
  if (!last) return '';
  const U = unit.toUpperCase();
  const ago = Math.floor((Date.now() - last.t) / 86400000);
  const bits: string[] = [];
  if (last.kgs && last.kgs.length && last.reps) {
    // per-set shape: "40×15 · 40×12 · 35×12 KG"
    bits.push(
      last.reps.map((r, j) => ((last.kgs as number[])[j] ? conv((last.kgs as number[])[j], unit) + '×' : '') + r).join(' · ') +
        ((last.kgs as number[]).some((x) => x) ? ' ' + U : ' REPS')
    );
  } else {
    if (last.kg) bits.push(conv(last.kg, unit) + ' ' + U);
    if (last.reps && last.reps.length) bits.push('× ' + last.reps.join(' · '));
  }
  return 'LAST  ' + bits.join(' ') + '  ·  ' + (ago === 0 ? 'TODAY' : ago === 1 ? 'YESTERDAY' : ago + ' DAYS AGO');
}

// best estimated 1RM from last session, plus what the set about to be logged
// would come out at.
export function e1rmLine(state: AppState, canon: string, loadKg: number, reps: number, unit: 'kg' | 'lb'): string {
  const last = state.lastLog[canon];
  let best = 0;
  if (last && last.reps) {
    last.reps.forEach((r, j) => {
      const k = (last.kgs && last.kgs[j]) || last.kg;
      if (k > 0 && r) best = Math.max(best, E1RM(k, r));
    });
  }
  if (!best) return '';
  const U = unit.toUpperCase();
  const next = loadKg > 0 ? E1RM(loadKg, reps) : 0;
  return 'EST. 1RM  ' + conv(best, unit) + ' ' + U + (next > 0 ? '  ·  THIS SET ≈ ' + conv(next, unit) + ' ' + U : '');
}

// ---- session pace ----------------------------------------------------------

export interface Pace {
  show: boolean;
  clock: string; // just the elapsed time, for the header chip
  short: string; // ON PACE / BEHIND / OVER
  label: string; // elapsed / budget
  text: string; // the full sentence
  state: 'on' | 'behind' | 'over';
  frac: number;
  stale: boolean; // a session left running overnight; the store clears it
}

export function pace(state: AppState, day: number): Pace {
  const ss = state.sessionStart;
  const total = DAYS[day - 1].exs.length;
  const off = (stale: boolean): Pace => ({
    show: false,
    clock: '',
    short: '',
    label: '',
    text: '',
    state: 'on',
    frac: 0,
    stale,
  });
  if (!ss) return off(false);
  // a clock left running overnight means nothing — drop it
  if (Date.now() - ss > 3 * 3600e3 || new Date(ss).toDateString() !== new Date().toDateString()) return off(true);
  const el = Math.max(0, Math.floor((Date.now() - ss) / 1000));
  const bud = SETTINGS.sessionMinutes * 60;
  const diff = countDone(state, day) - el / (bud / total);
  const over = el > bud;
  const behind = !over && diff < -1;
  return {
    show: true,
    clock: fmt(el),
    short: over ? 'OVER' : behind ? 'BEHIND' : 'ON PACE',
    label: fmt(el) + ' / ' + Math.round(bud / 60) + ':00',
    text: over
      ? 'OVER TIME'
      : behind
        ? 'BEHIND · SHOULD BE ' + Math.floor(el / (bud / total)) + '/' + total + ' BY NOW'
        : 'ON PACE',
    state: over ? 'over' : behind ? 'behind' : 'on',
    frac: Math.min(1, el / bud),
    stale: false,
  };
}

const fmt = (x: number): string => Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0');

// another exercise mid-way (started, not finished) blocks starting this one;
// browsing the rows stays free either way.
export function busyOther(state: AppState, day: number, i: number): boolean {
  return DAYS[day - 1].exs.some((_, j) => {
    if (j === i) return false;
    const n = P(state, id(day, j)).sets || 0;
    return n > 0 && n < setsFor(state, day, j);
  });
}

// first unfinished exercise after i — the one the between-exercise rest belongs to
export function nextPending(state: AppState, day: number, i: number): number {
  const exs = DAYS[day - 1].exs;
  for (let j = i + 1; j < exs.length; j++) {
    if (exs[j].k === 'hold') continue;
    if ((P(state, id(day, j)).sets || 0) < setsFor(state, day, j)) return j;
  }
  return -1;
}

// lock screen focuses one item: the manually parked one, else the first
// unticked exercise of the day.
export function lockFocusIndex(state: AppState, day: number): number {
  let li = state.lockIdx;
  const D = DAYS[day - 1];
  if (li == null || li >= D.exs.length || doneOf(state, day, li)) {
    li = -1;
    for (let i = 0; i < D.exs.length; i++) {
      if (!doneOf(state, day, i)) {
        li = i;
        break;
      }
    }
  }
  return li;
}

// ---- progress charts -------------------------------------------------------

export interface VolBar {
  frac: number; // 0..1 of the tallest bar in the window
  label: string;
  val: string;
  current: boolean;
}

export function volBars(state: AppState): VolBar[] {
  const H: HistEntry[] = (state.hist || []).slice(-10);
  const maxV = Math.max(1, ...H.map((x) => x.vol));
  return H.map((x, i) => ({
    frac: Math.max(0.04, x.vol / maxV),
    label: 'D' + x.day,
    val: x.vol >= 1000 ? (x.vol / 1000).toFixed(1) + 't' : String(Math.round(x.vol)),
    current: i === H.length - 1,
  }));
}

// moves ordered by their most recent logged weight, heaviest first
export function kgKeys(state: AppState): string[] {
  const kh = state.kgHist || {};
  return Object.keys(kh).sort((a, b) => {
    const pa = kh[a].pts;
    const pb = kh[b].pts;
    return pb[pb.length - 1][0] - pa[pa.length - 1][0];
  });
}

export interface KgChart {
  name: string;
  pts: [number, number][];
  xy: [number, number][]; // laid out in the design's 300x100 viewBox
  first: string;
  last: string;
  delta: string;
  rising: 0 | 1 | -1;
  max: string;
  min: string;
  sessions: string;
}

export const CHART_W = 300;
export const CHART_H = 100;

export function kgChart(state: AppState, key: string): KgChart | null {
  const series: KgSeries | undefined = (state.kgHist || {})[key];
  if (!series || !series.pts.length) return null;
  // 1RM mode only plots sessions that logged reps, so early history can be empty
  const pts: [number, number][] =
    state.chartMode === '1rm'
      ? series.pts.filter((p) => p[2]).map((p) => [p[0], p[2] as number])
      : series.pts.map((p) => [p[0], p[1]]);
  if (!pts.length) return null;
  const ks = pts.map((p) => p[1]);
  const lo = Math.min(...ks);
  const hi = Math.max(...ks);
  const span = hi - lo || 1;
  const xy = pts.map((p, i) => [
    pts.length === 1 ? 150 : 8 + i * (284 / (pts.length - 1)),
    hi === lo ? 50 : 88 - ((p[1] - lo) / span) * 76,
  ]) as [number, number][];
  const dl = ks[ks.length - 1] - ks[0];
  return {
    name: series.n,
    pts,
    xy,
    first: ks[0] + ' kg',
    last: ks[ks.length - 1] + ' kg',
    delta: (dl > 0 ? '+' : '') + dl + ' kg',
    rising: dl > 0 ? 1 : dl < 0 ? -1 : 0,
    max: String(hi),
    min: String(lo),
    sessions: pts.length + ' SESSIONS',
  };
}

export interface SubRow {
  day: number;
  line: string;
  delta: string;
  better: boolean;
}

export function substitutions(state: AppState): SubRow[] {
  const out: SubRow[] = [];
  Object.keys(state.prog).forEach((k) => {
    const sub = state.prog[k].sub;
    if (!sub) return;
    const [dStr, iStr] = k.split('-');
    const d = +dStr;
    const i = +iStr;
    const planned = DAYS[d - 1] && DAYS[d - 1].exs[i];
    if (!planned || planned.k === 'hold') return;
    const dp = LIB[planned.n].p;
    const sp = (LIB[planned.n].a.filter((x) => x[0] === sub)[0] || [null, dp])[1] as number;
    out.push({
      day: d,
      line: planned.n + ' → ' + sub,
      delta: (sp - dp >= 0 ? '+' : '') + (sp - dp) + '%',
      better: sp >= dp,
    });
  });
  return out.sort((a, b) => a.day - b.day);
}

export interface HoldStat {
  name: string;
  best: string;
  frac: number;
  goal: string;
}

// one row per ladder: the step you are on, your best hold on it, and how far
// through the whole ladder that puts you.
export function holdStats(state: AppState): HoldStat[] {
  return Object.keys(SK).map((k) => {
    const L = SK[k];
    const v = lv(state, k);
    const step = L.steps[v];
    const best = state.holdBest[step[0]] || 0;
    return {
      name: step[0],
      best: best ? best + 's' : '—',
      frac: (v + Math.min(1, best / step[1])) / L.steps.length,
      goal: L.label + ' · LEVEL ' + (v + 1) + ' OF ' + L.steps.length + ' · TARGET 3 × ' + step[1] + 'S',
    };
  });
}

// ---- weekly muscle coverage ------------------------------------------------

export interface BodyPoly {
  pts: string;
  level: 0 | 1 | 2 | 3 | -1; // -1 = scenery, 0 = untouched, 1..3 = volume bands
}

export interface BodyView {
  front: BodyPoly[];
  back: BodyPoly[];
  top: { name: string; value: string }[];
  missing: string[];
}

// set-equivalents per muscle over the last 7 days: finished sessions carry their
// own tally, and today's in-progress sets are folded in live.
function weeklyMuscles(state: AppState): Record<string, number> {
  const since = Date.now() - 7 * 86400000;
  const tot: Record<string, number> = {};
  const add = (m: string, v: number) => {
    const k = MUS_REGION[m] || m;
    tot[k] = (tot[k] || 0) + v;
  };
  (state.hist || []).forEach((h) => {
    if (h.t >= since && h.mus) Object.keys(h.mus).forEach((m) => add(m, (h.mus as Record<string, number>)[m]));
  });
  const d = state.day;
  if (!(state.doneDays || {})[d]) {
    DAYS[d - 1].exs.forEach((e, i) => {
      const p = P(state, id(d, i));
      const k = p.sets || 0;
      if (k) breakdownFor(p.sub || e.n, e.g).forEach(([m, pc]) => add(m, (k * pc) / 100));
    });
  }
  return tot;
}

export function bodyView(state: AppState): BodyView {
  const tot = weeklyMuscles(state);
  const sum = (key: string) => key.split('|').reduce((a, m) => a + (tot[m] || 0), 0);
  const band = (v: number): 0 | 1 | 2 | 3 => (!v ? 0 : v < 4 ? 1 : v < 9 ? 2 : 3);
  const map = (arr: BodyRegion[]): BodyPoly[] => {
    const out: BodyPoly[] = [];
    arr.forEach(([key, polys]) =>
      polys.forEach((pts) => out.push({ pts, level: key ? band(sum(key)) : -1 }))
    );
    return out;
  };
  const trained = BODY_MUSCLES.filter((m) => (tot[m] || 0) >= 1);
  return {
    front: map(BODY_FRONT),
    back: map(BODY_BACK),
    top: trained
      .sort((a, b) => tot[b] - tot[a])
      .slice(0, 4)
      .map((m) => ({ name: m.toUpperCase(), value: Math.round(tot[m] * 10) / 10 + ' SETS' })),
    missing: BODY_MUSCLES.filter((m) => !((tot[m] || 0) >= 1)),
  };
}

export function setsTotal(state: AppState): number {
  let t = 0;
  Object.keys(state.prog).forEach((k) => {
    t += state.prog[k].sets || 0;
  });
  return t;
}

// Wiping a day keeps the exercise you swapped in: the swap lives on prog[id].sub,
// so clearing the whole entry would send the row back to the planned move. Sets,
// reps and logged load go; the choice of exercise stays.
export function clearDay(prog: AppState['prog'], day: number): AppState['prog'] {
  const out = { ...prog };
  for (let i = 0; i < DAYS[day - 1].exs.length; i++) {
    const k = id(day, i);
    const sub = out[k] && out[k].sub;
    if (sub) out[k] = { sub };
    else delete out[k];
  }
  return out;
}
