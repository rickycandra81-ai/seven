import AsyncStorage from '@react-native-async-storage/async-storage';
import { readBackup, writeBackup } from './backup';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { breakdownFor } from './content';
import { CANON, DAYS } from './data';
import {
  autoHeavy,
  busyOther,
  clampIdx,
  clampLevel,
  clearDay,
  clampReps,
  curIdx,
  E1RM,
  countDone,
  doneOf,
  getLoad,
  id,
  loadKey,
  lockFocusIndex,
  migrateLoads,
  nextFours,
  nextPending,
  P,
  pace,
  repsVal,
  setsFor,
} from './logic';
import { SK } from './skills';
import {
  armRest,
  disarmRest,
  notifyHydrate,
  notifyPR,
  notifyRestDone,
  onNotificationTap,
  requestNotificationPermission,
} from './notifications';
import { AppState, INITIAL_STATE, SETTINGS, STORAGE_KEY, Tab, WeightUnit } from './types';

interface Actions {
  setTab: (tab: Tab) => void;
  goToDay: (day: number) => void;
  swipeDay: (dir: 1 | -1) => void;
  jumpToRest: () => void;
  toggleOpen: (exId: string) => void;
  toggleAlts: (exId: string) => void;
  setHeavy: (day: number, i: number, want: boolean) => void;
  tapSet: (exId: string, j: number) => void;
  forceSet: (exId: string, j: number) => void;
  bumpLoad: (name: string, d: number) => void;
  toggleUnit: () => void;
  onLoadText: (key: string, valStr: string) => void;
  onLoadBlur: (name: string, valStr: string) => void;
  pick: (exId: string, planned: string, name: string) => void;
  finish: () => void;
  dismiss: () => void;
  resetDay: () => void;
  setChartEx: (key: string) => void;
  setChartMode: (mode: 'kg' | '1rm') => void;
  goEx: (i: number) => void;
  goExRel: (d: 1 | -1) => void;
  setReps: (exId: string, v: number) => void;
  setLevel: (L: string, j: number) => void;
  tapIso: (exId: string) => void;
  applySuggest: (name: string, kg: number) => void;
  clearToast: () => void;
  pressStart: (exId: string, j: number) => void;
  pressCancel: () => void;
  exportBackup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
  lockGoToDay: (day: number) => void;
  lockSkip: () => void;
  lockOpen: (exId: string | null) => void;
}

interface Ctx {
  state: AppState;
  actions: Actions;
}

const StoreContext = createContext<Ctx | null>(null);

// live countdown text for a rest, derived from a fixed deadline rather than
// a decrementing counter — stays correct across a throttled/backgrounded app.
export function restRemaining(state: AppState): number {
  if (!state.restId) return 0;
  return Math.max(0, Math.ceil(((state.restEndAt || 0) - Date.now()) / 1000));
}
export function restDone(state: AppState): boolean {
  return !!state.restId && Date.now() >= (state.restEndAt || 0);
}

// exactly what gets persisted — and what a backup file carries
export function saveBlob(state: AppState) {
  const { day, prog, holdBest, doneDays, streak, fours, loads, hist, kgHist, skillLv, sessionStart, lastLog, pr } =
    state;
  return { day, prog, holdBest, doneDays, streak, fours, loads, hist, kgHist, skillLv, sessionStart, lastLog, pr };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  // the backup actions read the live state without re-creating every action
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          setState((cur) => ({
            ...cur,
            day: s.day || 1,
            prog: s.prog || {},
            doneDays: s.doneDays || {},
            streak: s.streak || 0,
            fours: s.fours || null,
            loads: migrateLoads(s.loads || {}),
            hist: s.hist || [],
            kgHist: s.kgHist || {},
            skillLv: s.skillLv || {},
            holdBest: s.holdBest || {},
            lastLog: s.lastLog || {},
            pr: s.pr || {},
            sessionStart: s.sessionStart || null,
          }));
        }
      } catch (e) {
        // ignore — start fresh
      } finally {
        setHydrated(true);
      }
    })();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saveBlob(state))).catch(() => {});
  }, [
    hydrated,
    state.day,
    state.prog,
    state.doneDays,
    state.streak,
    state.fours,
    state.loads,
    state.hist,
    state.kgHist,
    state.skillLv,
    state.holdBest,
    state.lastLog,
    state.pr,
    state.sessionStart,
  ]);

  // the running timed set ticks the same way the rest countdown does
  useEffect(() => {
    if (!state.timerId) return;
    const tick = () =>
      setState((s) =>
        s.timerId && s.timerStartAt
          ? { ...s, elapsed: Math.floor((Date.now() - s.timerStartAt) / 1000) }
          : s
      );
    const iv = setInterval(tick, 1000);
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [state.timerId]);

  // a session clock left running overnight means nothing — drop it
  useEffect(() => {
    if (!hydrated) return;
    if (state.sessionStart && pace(state, state.day).stale) setState((s) => ({ ...s, sessionStart: null }));
  }, [hydrated, state.sessionStart, state.day]);

  // the session clock has nothing else re-rendering it between sets, so it gets
  // its own tick (the rest and timed-set ticks already cover it while they run)
  useEffect(() => {
    if (!state.sessionStart || (state.restId && !state.restExpired) || state.timerId) return;
    const tick = () => setState((s) => (s.sessionStart && pace(s, s.day).stale ? { ...s, sessionStart: null } : { ...s }));
    const iv = setInterval(tick, 1000);
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [state.sessionStart, state.restId, state.restExpired, state.timerId]);

  // a PR banner clears itself
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => setState((s) => ({ ...s, toast: null })), 3500);
    return () => clearTimeout(t);
  }, [state.toast]);

  // rest countdown: a deadline timestamp, not a tick counter, so a
  // throttled/backgrounded app still reports the right remaining time (and
  // fires the catch-up notification) the moment it resumes.
  useEffect(() => {
    if (!state.restId || state.restExpired) return;
    const tick = () => {
      setState((s) => {
        if (!s.restId || s.restExpired) return s;
        if (Date.now() >= (s.restEndAt || 0)) {
          notifyRestDone();
          return { ...s, restExpired: true };
        }
        return { ...s }; // force a re-render so the live countdown text updates
      });
    };
    const iv = setInterval(tick, 1000);
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [state.restId, state.restExpired]);

  useEffect(() => {
    return onNotificationTap((tag) => {
      if (tag === 'seven-rest') actions.jumpToRest();
      else if (tag === 'seven-hydrate') actions.setTab('today');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // runs on every set change: session clock, reps per set, PRs, last-session record
  const afterSet = (s: AppState, exId: string, day: number, i: number, next: number, cur: number, need: number): AppState => {
    const e = DAYS[day - 1].exs[i];
    let out = s;
    if (!out.sessionStart && next > cur) out = { ...out, sessionStart: Date.now() };
    if (e.k) return out; // the skill rows log seconds, not reps
    const p = P(out, exId);
    const name = p.sub || e.n;
    const c = CANON(name);
    const reps = (p.reps || []).slice(0, Math.min(cur, next));
    const kgs = (p.kgs || []).slice(0, Math.min(cur, next));
    const kg = getLoad(out, name);
    if (next > cur) {
      const r = repsVal(out, exId);
      // each set keeps the load it was actually done with
      for (let j = cur; j < next; j++) {
        reps[j] = r;
        kgs[j] = kg;
      }
      const pr = out.pr[c];
      if (!pr || kg > pr.kg || (kg === pr.kg && r > pr.reps)) {
        out = { ...out, pr: { ...out.pr, [c]: { kg, reps: r, t: Date.now() } } };
        // only an improvement on a PR you already had is worth announcing
        if (pr) {
          const line = (kg ? kg + ' kg × ' : '') + r + ' reps';
          out = { ...out, toast: { name, line } };
          notifyPR(name, line);
        }
      }
    }
    out = { ...out, prog: { ...out.prog, [exId]: { ...(out.prog[exId] || {}), reps, kgs } } };
    if (next >= need && next > cur) {
      out = {
        ...out,
        lastLog: { ...out.lastLog, [c]: { t: Date.now(), kg, reps: reps.slice(0, need), kgs: kgs.slice(0, need) } },
      };
    }
    return out;
  };

  // shared by a short tap (advance one) and a long-press force (jump or rewind)
  const commitSet = (s0: AppState, exId: string, next: number, cur: number): AppState => {
    const [dayStr, iStr] = exId.split('-');
    const day = +dayStr;
    const i = +iStr;
    const need = setsFor(s0, day, i);
    if (cur < need && next >= need) {
      const dcAfter = countDone(s0, day) + 1;
      if (dcAfter % 2 === 0) notifyHydrate(dcAfter);
    }
    const withSets: AppState = { ...s0, prog: { ...s0.prog, [exId]: { ...(s0.prog[exId] || {}), sets: next } } };
    const s = afterSet(withSets, exId, day, i, next, cur, need);
    const s2: AppState = s;
    if (next >= need) {
      const base = {
        ...s2,
        open: s2.open === exId ? null : s2.open,
        altsOpen: s2.altsOpen === exId ? null : s2.altsOpen,
      };
      // exercise finished — the rest now belongs to the next exercise, and it is longer
      const nj = nextPending(s2, day, i);
      if (nj >= 0) {
        const endAt = Date.now() + SETTINGS.betweenRestSeconds * 1000;
        armRest(endAt, true);
        return { ...base, restId: id(day, nj), restEndAt: endAt, restExpired: false, restBetween: true };
      }
      if (s2.restId === exId) {
        disarmRest();
        return { ...base, restId: null, restEndAt: null, restExpired: false, restBetween: false };
      }
      return base;
    }
    if (next > cur) {
      const endAt = Date.now() + SETTINGS.restSeconds * 1000;
      armRest(endAt, false);
      return {
        ...s2,
        altsOpen: s2.altsOpen === exId ? null : s2.altsOpen,
        restId: exId,
        restEndAt: endAt,
        restExpired: false,
        restBetween: false,
      };
    }
    if (s2.restId === exId) {
      disarmRest();
      return { ...s2, restId: null, restEndAt: null, restExpired: false, restBetween: false };
    }
    return s2;
  };

  const actions: Actions = useMemo(
    () => ({
      setTab: (tab) => setState((s) => ({ ...s, tab })),
      goToDay: (day) => setState((s) => ({ ...s, tab: 'today', day, open: null, altsOpen: null, curId: null })),
      swipeDay: (dir) =>
        setState((s) => ({ ...s, curId: id(s.day, clampIdx(s.day, curIdx(s) + dir)), altsOpen: null })),
      // jump back to the resting exercise's row, from anywhere in the app
      jumpToRest: () =>
        setState((s) => {
          if (!s.restId) return s;
          const [dayStr] = s.restId.split('-');
          return { ...s, tab: 'today', day: +dayStr, open: s.restId, altsOpen: null };
        }),
      toggleOpen: (exId) => setState((s) => ({ ...s, open: s.open === exId ? null : exId })),
      toggleAlts: (exId) => setState((s) => ({ ...s, altsOpen: s.altsOpen === exId ? null : exId })),
      setHeavy: (day, i, want) =>
        setState((s) => {
          if (autoHeavy(day)) return s;
          const s2: AppState = { ...s, fours: { ...(s.fours || {}), [day]: nextFours(s, day, i, want) } };
          if (want) return s2;
          // giving up the heavy slot drops the need to 3 — a logged 4th set would
          // otherwise be stranded above the row's own target.
          const exId = id(day, i);
          const rec = s.prog[exId];
          if (rec && (rec.sets || 0) > 3) s2.prog = { ...s.prog, [exId]: { ...rec, sets: 3 } };
          return s2;
        }),
      // a started exercise only moves forward on tap: no skipping ahead, no tapping
      // back. Long-press is the single escape hatch — it skips the rest gate going
      // forward and rewinds logged sets going back (wrong exercise picked by mistake).
      tapSet: (exId, j) =>
        setState((s) => {
          const cur = P(s, exId).sets || 0;
          if (j !== cur) return s;
          const [d0, i0] = exId.split('-').map(Number);
          if (cur === 0 && busyOther(s, d0, i0)) return s;
          if (s.restId === exId && !restDone(s)) return s;
          return commitSet(s, exId, j + 1, cur);
        }),
      forceSet: (exId, j) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        setState((s) => {
          const cur = P(s, exId).sets || 0;
          const [d0, i0] = exId.split('-').map(Number);
          if (cur === 0 && busyOther(s, d0, i0)) return { ...s, pressingId: null };
          return { ...commitSet(s, exId, j < cur ? j : j + 1, cur), pressingId: null };
        });
      },
      // load lives on the move, so it follows a swap and carries across days
      bumpLoad: (name, d) =>
        setState((s) => {
          const k = loadKey(name);
          const v = Math.max(0, Math.round((getLoad(s, name) + d) * 10) / 10);
          return { ...s, loads: { ...s.loads, [k]: v } };
        }),
      toggleUnit: () =>
        setState((s) => ({ ...s, unit: ((s.unit || SETTINGS.weightUnit) === 'kg' ? 'lb' : 'kg') as WeightUnit })),
      onLoadText: (key, valStr) => setState((s) => ({ ...s, loadText: { ...s.loadText, [key]: valStr } })),
      onLoadBlur: (name, valStr) =>
        setState((s) => {
          const loadText = { ...s.loadText };
          delete loadText[loadKey(name)];
          if (valStr === '') return { ...s, loadText };
          const v = parseFloat(valStr);
          if (isNaN(v) || v < 0) return { ...s, loadText };
          const unit = s.unit || SETTINGS.weightUnit;
          const kg = Math.max(0, Math.round((unit === 'kg' ? v : v / 2.20462) * 10) / 10);
          return { ...s, loadText, loads: { ...s.loads, [loadKey(name)]: kg } };
        }),
      // once a set is logged the planned move is locked in — no more swapping
      pick: (exId, planned, name) =>
        setState((s) => {
          if ((P(s, exId).sets || 0) > 0) return s;
          const s2 = { ...s, prog: { ...s.prog, [exId]: { ...(s.prog[exId] || {}), sub: name === planned ? null : name } } };
          return { ...s2, altsOpen: s2.altsOpen === exId ? null : s2.altsOpen, open: exId };
        }),
      // finishing a day records the session for the charts, then wipes the day it
      // is about to advance into so the next cycle starts from a clean sheet.
      finish: () =>
        setState((s) => {
          const d = s.day;
          if (countDone(s, d) < DAYS[d - 1].exs.length) return s;
          const nx = (d % 7) + 1;
          const t = Date.now();
          let vol = 0;
          let sets = 0;
          const kgAdd: [string, number, number][] = [];
          const mus: Record<string, number> = {};
          DAYS[d - 1].exs.forEach((e, i) => {
            const p = P(s, id(d, i));
            const n = p.sub || e.n;
            const kg = getLoad(s, n);
            const k = p.sets || 0;
            const rs = (p.reps || []).slice(0, k);
            const ks = p.kgs || [];
            // volume is the real per-set load x reps, falling back to the row's load
            let v = 0;
            for (let j = 0; j < k; j++) v += (ks[j] != null ? ks[j] : kg) * (rs[j] != null ? rs[j] : 1);
            const top = Math.max(kg, ...ks.slice(0, k).filter((x) => x != null));
            let e1 = 0;
            for (let j = 0; j < k; j++) {
              const k2 = ks[j] != null ? ks[j] : kg;
              const r2 = rs[j];
              if (k2 > 0 && r2) e1 = Math.max(e1, E1RM(k2, r2));
            }
            // set-equivalents per muscle, so the weekly body map has something to show
            breakdownFor(n, e.g).forEach(([m, pc]) => {
              mus[m] = Math.round(((mus[m] || 0) + (k * pc) / 100) * 100) / 100;
            });
            sets += k;
            vol += v;
            if (top > 0) kgAdd.push([n, top, e1]);
          });
          const hist = (s.hist || []).concat([{ t, day: d, vol, sets, mus }]).slice(-60);
          const kgHist = { ...s.kgHist };
          kgAdd.forEach(([n, kg, e1]) => {
            const key = CANON(n);
            const o = kgHist[key] || { n, pts: [] };
            kgHist[key] = {
              n,
              pts: o.pts.concat([(e1 ? [t, kg, e1] : [t, kg]) as [number, number, number]]).slice(-40),
            };
          });
          const prog = clearDay(s.prog, nx);
          const doneDays = { ...s.doneDays, [d]: true };
          delete doneDays[nx];
          const fours = { ...(s.fours || {}) };
          fours[nx] = [];
          return {
            ...s,
            celebrate: true,
            hist,
            kgHist,
            prog,
            doneDays,
            fours,
            streak: s.streak + 1,
            sessionStart: null,
            repsSel: {},
            curId: null,
          };
        }),
      dismiss: () =>
        setState((s) => ({
          ...s,
          celebrate: false,
          open: null,
          altsOpen: null,
          day: SETTINGS.autoAdvanceDay ? (s.day % 7) + 1 : s.day,
        })),
      resetDay: () =>
        setState((s) => {
          const d = s.day;
          const prog = clearDay(s.prog, d);
          const doneDays = { ...s.doneDays };
          delete doneDays[d];
          const fours = { ...(s.fours || {}) };
          fours[d] = []; // heavy slots come back EMPTY, to be picked by hand
          disarmRest();
          return {
            ...s,
            prog,
            doneDays,
            fours,
            open: null,
            altsOpen: null,
            restId: null,
            restEndAt: null,
            restExpired: false,
            restBetween: false,
            timerId: null,
            timerStartAt: null,
            elapsed: 0,
            sessionStart: null,
            repsSel: {},
            curId: null,
          };
        }),
      setChartEx: (key) => setState((s) => ({ ...s, chartEx: key })),
      setChartMode: (mode) => setState((s) => ({ ...s, chartMode: mode })),
      // park the card on one exercise; the strip, swipe and prev/next all land here
      goEx: (i) => setState((s) => ({ ...s, curId: id(s.day, clampIdx(s.day, i)), altsOpen: null })),
      goExRel: (d) =>
        setState((s) => ({ ...s, curId: id(s.day, clampIdx(s.day, curIdx(s) + d)), altsOpen: null })),
      setReps: (exId, v) =>
        setState((s) => ({ ...s, repsSel: { ...s.repsSel, [exId]: clampReps(v) } })),
      // changing a ladder step mid-hold would log the seconds against the wrong move
      setLevel: (L, j) =>
        setState((s) => (s.timerId ? s : { ...s, skillLv: { ...s.skillLv, [L]: clampLevel(L, j) } })),
      // a timed set: first tap starts the clock, second tap logs the held seconds
      tapIso: (exId) =>
        setState((s) => {
          const [dayStr, iStr] = exId.split('-');
          const day = +dayStr;
          const i = +iStr;
          const e = DAYS[day - 1].exs[i];
          if (!e.k || !e.L) return s;
          const p = P(s, exId);
          const cur = p.sets || 0;
          const need = setsFor(s, day, i);
          if (s.timerId === exId) {
            const secs = Math.max(1, Math.floor((Date.now() - (s.timerStartAt || 0)) / 1000));
            const lvI = Math.min(s.skillLv[e.L] || 0, SK[e.L].steps.length - 1);
            const stepName = SK[e.L].steps[lvI][0];
            const prevBest = s.holdBest[stepName] || 0;
            let out: AppState = {
              ...s,
              timerId: null,
              timerStartAt: null,
              elapsed: 0,
              holdBest: secs > prevBest ? { ...s.holdBest, [stepName]: secs } : s.holdBest,
              prog: {
                ...s.prog,
                [exId]: {
                  ...(s.prog[exId] || {}),
                  secs: (p.secs || []).concat([secs]),
                  lv: p.lv != null ? p.lv : lvI,
                },
              },
            };
            if (prevBest && secs > prevBest) {
              out = { ...out, toast: { name: stepName, line: secs + 's hold' } };
              notifyPR(stepName, secs + 's hold');
            }
            return commitSet(out, exId, cur + 1, cur);
          }
          // one clock at a time, and the same gates a tapped set has to pass
          if (cur >= need || s.timerId) return s;
          if (cur === 0 && busyOther(s, day, i)) return s;
          if (s.restId === exId && !restDone(s)) return s;
          return { ...s, timerId: exId, timerStartAt: Date.now(), elapsed: 0 };
        }),
      applySuggest: (name, kg) =>
        setState((s) => ({ ...s, loads: { ...s.loads, [loadKey(name)]: Math.max(0, Math.round(kg * 10) / 10) } })),
      clearToast: () => setState((s) => ({ ...s, toast: null })),
      // holding a set button shows a banner the whole time, with a tick of haptic
      // feedback so the gesture is obvious without looking
      pressStart: (exId, j) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setState((s) => ({ ...s, pressingId: exId + '-' + j, pressLabel: 'KEEP HOLDING · SET ' + (j + 1) }));
      },
      pressCancel: () => setState((s) => (s.pressingId ? { ...s, pressingId: null } : s)),
      exportBackup: async () => {
        try {
          const name = await writeBackup(saveBlob(stateRef.current));
          setState((s) => ({ ...s, toast: { name: 'Backup saved', line: name.toUpperCase() } }));
        } catch (e) {
          setState((s) => ({ ...s, toast: { name: 'Backup failed', line: 'COULD NOT WRITE THE FILE' } }));
        }
      },
      restoreBackup: async () => {
        const loaded = (await readBackup()) as Partial<AppState> | null;
        if (!loaded) return;
        setState((s) => ({
          ...s,
          ...loaded,
          loads: migrateLoads(loaded.loads || {}),
          open: null,
          altsOpen: null,
          timerId: null,
          timerStartAt: null,
          elapsed: 0,
          toast: { name: 'Restored', line: 'FROM YOUR BACKUP FILE' },
        }));
      },
      lockGoToDay: (day) => setState((s) => ({ ...s, day, open: null, altsOpen: null, lockIdx: null })),
      lockSkip: () =>
        setState((s) => {
          const day = s.day;
          const D = DAYS[day - 1];
          const n = D.exs.length;
          const li = lockFocusIndex(s, day);
          for (let k = 1; k <= n; k++) {
            const j = ((li === -1 ? 0 : li) + k) % n;
            if (!doneOf(s, day, j)) return { ...s, lockIdx: j };
          }
          return s;
        }),
      lockOpen: (exId) => setState((s) => ({ ...s, tab: 'today', open: exId, lockIdx: null })),
    }),
    []
  );

  return <StoreContext.Provider value={{ state, actions }}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
