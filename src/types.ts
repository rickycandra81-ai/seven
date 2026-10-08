export interface ProgEntry {
  sets?: number;
  kg?: number; // legacy: load used to live on the slot
  sub?: string | null;
  reps?: number[]; // reps logged per set
  kgs?: number[]; // load logged per set, so a drop set keeps its real numbers
  secs?: number[]; // held seconds per timed set, for the skill rows
  lv?: number; // which ladder step a skill row's logged sets belong to
}

export type Tab = 'today' | 'progress' | 'lock';
export type WeightUnit = 'kg' | 'lb';

export interface HistEntry {
  t: number; // Date.now() of the finished session
  day: number;
  vol: number; // kg x reps across the day
  sets: number;
  mus?: Record<string, number>; // muscle -> set-equivalents, for the weekly body map
}

export interface KgSeries {
  n: string; // display name of the move
  pts: ([number, number] | [number, number, number])[]; // [timestamp, top-set kg, est. 1RM?]
}

// what a move did the last time it was finished — drives the LAST line and the
// progressive-overload suggestion.
export interface LastLog {
  t: number;
  kg: number;
  reps: number[];
  kgs?: number[]; // per-set load, when it was logged that way
}

export interface PR {
  kg: number;
  reps: number;
  t: number;
}

export interface Toast {
  name: string;
  line: string;
}

export interface AppState {
  tab: Tab;
  day: number; // 1..7
  open: string | null; // "day-idx"
  altsOpen: string | null; // "day-idx"
  fours: Record<number, number[]> | null; // day -> indices holding the two 4-set slots
  lockIdx: number | null;
  prog: Record<string, ProgEntry>;
  loads: Record<string, number>; // CanonicalMoveName -> kg, shared across days, persisted
  hist: HistEntry[]; // one row per finished day, persisted
  kgHist: Record<string, KgSeries>; // per-move weight trend, persisted
  chartEx: string | null; // which move the weight chart is showing
  chartMode: 'kg' | '1rm'; // top set or estimated 1RM
  curId: string | null; // the exercise card on screen, "day-idx"
  skillLv: Record<string, number>; // ladder -> current step index, persisted
  holdBest: Record<string, number>; // ladder step name -> best seconds, persisted
  lastLog: Record<string, LastLog>; // canonical move -> last finished session, persisted
  pr: Record<string, PR>; // canonical move -> best set, persisted
  sessionStart: number | null; // when the first set of the day was logged, persisted
  repsSel: Record<string, number>; // reps picked for the next set, not persisted
  timerId: string | null; // the skill row whose timed set is running
  timerStartAt: number | null;
  elapsed: number; // seconds on the running timer
  toast: Toast | null; // the PR banner
  pressingId: string | null; // "day-idx-set" being held down
  pressLabel: string; // what the hold-to-undo banner says
  doneDays: Record<number, boolean>;
  streak: number;
  celebrate: boolean;
  unit: WeightUnit | null; // null = follow SETTINGS.weightUnit; not persisted
  loadText: Record<string, string>; // in-progress load input text, not persisted
  restId: string | null; // exercise id currently resting
  restEndAt: number | null; // Date.now()-based deadline — survives backgrounding without drift
  restExpired: boolean;
  restBetween: boolean; // true = the longer rest before the NEXT exercise
}

export const INITIAL_STATE: AppState = {
  tab: 'today',
  day: 1,
  open: null,
  altsOpen: null,
  fours: null,
  lockIdx: null,
  prog: {},
  loads: {},
  hist: [],
  kgHist: {},
  chartEx: null,
  chartMode: 'kg',
  curId: null,
  skillLv: {},
  holdBest: {},
  lastLog: {},
  pr: {},
  sessionStart: null,
  repsSel: {},
  timerId: null,
  timerStartAt: null,
  elapsed: 0,
  toast: null,
  pressingId: null,
  pressLabel: '',
  doneDays: {},
  streak: 0,
  celebrate: false,
  unit: null,
  loadText: {},
  restId: null,
  restEndAt: null,
  restExpired: false,
  restBetween: false,
};

// user-tunable behavior, exposed as a settings panel in the Claude Design
// source; hardcoded here at their documented defaults.
export const SETTINGS = {
  autoAdvanceDay: true,
  weightUnit: 'kg' as WeightUnit,
  restSeconds: 30,
  betweenRestSeconds: 60,
  sessionMinutes: 60,
  repTarget: 15,
};

export const STORAGE_KEY = 'seven.v4';
