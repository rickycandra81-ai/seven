// Exercise library, aliases, plan and derived pool — sliced verbatim from the
// Seven.dc.html Claude Design canvas so the two stay in step.

export interface LibEntry {
  g: string;
  kg: number;
  p: number;
  a: [string, number][];
}

export interface PlanEx {
  n: string;
  h?: boolean;
  k?: 'hold';
  L?: string; // which skill ladder a hold row runs
  g: string;
  kg?: number;
}

export interface PlanDay {
  focus: string;
  exs: PlanEx[];
}

// Each entry: group, default load, target-emphasis % of the primary move,
// then alternatives with their own emphasis % (shown sorted, highest first).
export const LIB: Record<string, LibEntry> = {
  'Pull-up': { g: 'BACK', kg: 0, p: 88, a: [['Chin-up', 86], ['Lat pulldown', 85], ['Neutral-grip pulldown', 84], ['Single-arm pulldown', 82], ['Assisted pull-up', 80], ['Machine pull-up', 78], ['Inverted row', 70]] },
  'Pull up': { g: 'BACK', kg: 0, p: 88, a: [] },
  'Reverse fly': { g: 'SHOULDER', kg: 8, p: 86, a: [] },
  'Shoulder press': { g: 'SHOULDER', kg: 40, p: 84, a: [] },
  'Standing cable row': { g: 'BACK', kg: 45, p: 84, a: [] },
  'Pulley': { g: 'BACK', kg: 45, p: 82, a: [] },
  'Wide lat pull': { g: 'BACK', kg: 55, p: 85, a: [] },
  'Close lat pull': { g: 'BACK', kg: 50, p: 83, a: [] },
  'Lat pull': { g: 'BACK', kg: 55, p: 85, a: [] },
  '45 roman chair': { g: 'BACK', kg: 0, p: 72, a: [] },
  'Chest press': { g: 'CHEST', kg: 50, p: 82, a: [] },
  'Dumbell Bench press': { g: 'CHEST', kg: 24, p: 85, a: [] },
  'Incline bench press': { g: 'CHEST', kg: 40, p: 82, a: [] },
  'Pec fly': { g: 'CHEST', kg: 15, p: 88, a: [] },
  'Chest dip': { g: 'CHEST', kg: 0, p: 76, a: [] },
  'Abductor': { g: 'LEGS', kg: 35, p: 70, a: [] },
  'Adductor': { g: 'LEGS', kg: 35, p: 70, a: [] },
  'Calves raises': { g: 'LEGS', kg: 40, p: 88, a: [] },
  'Dumbell squat': { g: 'LEGS', kg: 24, p: 80, a: [] },
  'Front squat': { g: 'LEGS', kg: 60, p: 86, a: [['Dumbell squat', 80]] },
  'Leg extension': { g: 'LEGS', kg: 45, p: 80, a: [['Abductor', 70], ['Adductor', 70]] },
  'Pistol Squat': { g: 'LEGS', kg: 0, p: 85, a: [] },
  'Leg curl': { g: 'LEGS', kg: 40, p: 86, a: [] },
  'Triceps': { g: 'TRICEP', kg: 20, p: 82, a: [] },
  'Tricep': { g: 'TRICEP', kg: 20, p: 82, a: [] },
  'Biceps': { g: 'BICEP', kg: 20, p: 82, a: [] },
  'Cable crunch': { g: 'CORE', kg: 0, p: 88, a: [['Dragon flag', 94], ['Hanging leg raise', 90], ['Ab wheel', 86], ['Decline sit-up', 82], ['Plank', 74]] },
  'Overhead press': { g: 'SHOULDER', kg: 40, p: 85, a: [['Machine shoulder press', 80], ['Seated dumbbell press', 78], ['Smith machine press', 76], ['Push press', 72], ['Cable shoulder press', 74], ['Landmine press', 68], ['Pike push-up', 64]] },
  'Dumbbell lateral raise': { g: 'SHOULDER', kg: 10, p: 90, a: [['Cable lateral raise', 92], ['Leaning cable raise', 90], ['Machine lateral raise', 88], ['Band lateral raise', 74], ['Plate side raise', 72]] },
  'Arnold press': { g: 'SHOULDER', kg: 14, p: 80, a: [['Seated dumbbell press', 78], ['Standing dumbbell press', 77], ['Machine shoulder press', 76], ['Cable shoulder press', 74], ['Landmine press', 68]] },
  'Front raise': { g: 'SHOULDER', kg: 8, p: 80, a: [['Cable front raise', 82], ['Plate front raise', 76], ['Landmine raise', 74], ['Incline bench front raise', 72], ['Band front raise', 70]] },
  'Rear delt fly': { g: 'SHOULDER', kg: 8, p: 85, a: [['Reverse pec deck', 88], ['Cable reverse fly', 86], ['Bent-over dumbbell fly', 84], ['Face pull', 66], ['Band pull-apart', 62]] },
  'Lat pulldown': { g: 'BACK', kg: 55, p: 85, a: [['Chin-up', 84], ['Neutral-grip pulldown', 84], ['Single-arm pulldown', 82], ['Assisted pull-up', 80], ['Machine pullover', 74], ['Band pulldown', 62]] },
  'Barbell row': { g: 'BACK', kg: 50, p: 80, a: [['Chest-supported row', 85], ['Seal row', 84], ['Dumbbell row', 82], ['T-bar row', 80], ['Landmine row', 79], ['Smith machine row', 78]] },
  'Seated cable row': { g: 'BACK', kg: 45, p: 80, a: [['Chest-supported machine row', 84], ['Dumbbell row', 82], ['Single-arm cable row', 81], ['Wide-grip cable row', 78], ['Inverted row', 72]] },
  'Face pull': { g: 'SHOULDER', kg: 20, p: 70, a: [['Reverse pec deck', 74], ['Cable reverse fly', 72], ['Bent-over dumbbell fly', 70], ['Rope upright row', 66], ['Band pull-apart', 64]] },
  'Straight-arm pulldown': { g: 'BACK', kg: 25, p: 84, a: [['Standing cable row', 80], ['Cable pullover', 76], ['Machine pullover', 74], ['Dumbbell pullover', 70], ['Band pulldown', 60]] },
  'Bench press': { g: 'CHEST', kg: 60, p: 80, a: [['Dumbbell bench press', 85], ['Machine chest press', 82], ['Smith machine bench', 78], ['Floor press', 76], ['Cable chest press', 74], ['Weighted push-up', 70]] },
  'Incline dumbbell press': { g: 'CHEST', kg: 22, p: 82, a: [['Incline machine press', 80], ['Incline cable press', 79], ['Incline barbell press', 78], ['Low-to-high cable fly', 76], ['Incline push-up', 64]] },
  'Cable fly': { g: 'CHEST', kg: 15, p: 90, a: [['High-to-low cable fly', 89], ['Low-to-high cable fly', 88], ['Cross-body cable fly', 89], ['Pec deck', 88], ['Dumbbell fly', 85], ['Incline dumbbell fly', 84], ['Band fly', 74]] },
  'Weighted dip': { g: 'CHEST', kg: 10, p: 75, a: [['Machine chest press', 82], ['Decline bench press', 78], ['Dip machine', 72], ['Bodyweight dip', 70], ['Decline push-up', 66]] },
  'Push-up to failure': { g: 'CHEST', kg: 0, p: 70, a: [['Machine chest press', 82], ['Dumbbell floor press', 78], ['Deficit push-up', 74], ['Cable chest press', 74], ['Band push-up', 68]] },
  'Pistol squat': { g: 'LEGS', kg: 0, p: 85, a: [['Bulgarian split squat', 88], ['Box pistol squat', 84], ['Assisted pistol squat', 82], ['Walking lunge', 80], ['Step-up', 78]] },
  'Back squat': { g: 'LEGS', kg: 80, p: 88, a: [['Hack squat', 90], ['Front squat', 86], ['Smith machine squat', 85], ['Belt squat', 84], ['Leg press', 82], ['Goblet squat', 76]] },
  'Romanian deadlift': { g: 'LEGS', kg: 70, p: 85, a: [['Seated leg curl', 88], ['Lying leg curl', 86], ['Single-leg RDL', 82], ['Good morning', 80], ['Cable pull-through', 76], ['Hip thrust', 70]] },
  'Leg press': { g: 'LEGS', kg: 100, p: 82, a: [['Hack squat', 90], ['Bulgarian split squat', 86], ['Smith machine squat', 85], ['Leg extension', 80], ['Goblet squat', 74]] },
  'Standing calf raise': { g: 'LEGS', kg: 40, p: 92, a: [['Single-leg calf raise', 90], ['Seated calf raise', 88], ['Smith machine calf raise', 88], ['Donkey calf raise', 87], ['Leg press calf raise', 86]] },
  'Tricep dip': { g: 'TRICEP', kg: 0, p: 80, a: [['Overhead cable extension', 88], ['Skull crusher', 85], ['Rope pushdown', 85], ['Single-arm cable extension', 82], ['Close-grip bench press', 74], ['Bench dip', 72]] },
  'Tricep rope pushdown': { g: 'TRICEP', kg: 20, p: 85, a: [['Overhead rope extension', 88], ['Skull crusher', 85], ['Single-arm cable extension', 84], ['Bar pushdown', 82], ['Close-grip bench press', 74], ['Dumbbell kickback', 72]] },
  'Barbell curl': { g: 'BICEP', kg: 25, p: 85, a: [['Cable curl', 88], ['Preacher curl', 87], ['EZ-bar curl', 86], ['Dumbbell curl', 84], ['Machine curl', 83], ['Incline dumbbell curl', 82]] },
  'Hammer curl': { g: 'BICEP', kg: 14, p: 80, a: [['Cable hammer curl', 84], ['Rope hammer curl', 83], ['Incline dumbbell curl', 82], ['Zottman curl', 76], ['Reverse curl', 68]] },
};

// movement pattern per planned move — extras only join a list of the same pattern
export const PAT: Record<string, string> = {
  'Pull-up': 'vpull', 'Lat pulldown': 'vpull',
  'Barbell row': 'hpull', 'Seated cable row': 'hpull',
  'Face pull': 'reardelt', 'Rear delt fly': 'reardelt',
  'Straight-arm pulldown': 'pullover',
  'Overhead press': 'vpress', 'Arnold press': 'vpress',
  'Dumbbell lateral raise': 'latraise', 'Front raise': 'frontraise',
  'Bench press': 'hpress', 'Incline dumbbell press': 'hpress',
  'Weighted dip': 'hpress', 'Push-up to failure': 'hpress',
  'Cable fly': 'fly',
  'Pistol squat': 'squat', 'Back squat': 'squat', 'Leg press': 'squat',
  'Romanian deadlift': 'hinge', 'Standing calf raise': 'calf',
  'Tricep dip': 'tri', 'Tricep rope pushdown': 'tri',
  'Barbell curl': 'bi', 'Hammer curl': 'bi',
};

// moves from the user's own gym list, scoped to the pattern they belong to
export const EXTRA: Record<string, [string, number][]> = {
  vpull: [['Wide lat pull', 85], ['Close lat pull', 83], ['45 roman chair', 72]],
  hpull: [['Standing cable row', 84], ['Pulley', 82], ['45 roman chair', 72]],
  pullover: [['45 roman chair', 72]],
  reardelt: [['Reverse fly', 86]],
  vpress: [['Shoulder press', 84]],
  latraise: [],
  hpress: [['Chest press', 82], ['Chest dip', 76]],
  fly: [['Pec fly', 88]],
  squat: [['Front squat', 86], ['Dumbell squat', 80]],
  hinge: [],
  calf: [['Calves raises', 88]],
  tri: [],
  bi: [],
};

// different names for the same movement — collapsed before the duplicate check
export const ALIAS: Record<string, string> = {
  'Abdominal': 'Cable crunch',
  'Cable back': 'Straight-arm pulldown',
  'Lat pulldown': 'Lat pull', 'Lateral raise': 'Dumbbell lateral raise',
  'Overhead press': 'Shoulder press', 'Rear delt fly': 'Reverse fly',
  'Standing calf raise': 'Calves raises', 'Weighted dip': 'Chest dip',
  'Cable fly': 'Pec fly', 'Machine chest press': 'Chest press',
  'Wide lat pull': 'Wide lat pull', 'Pull-up': 'Pull up',
  'Pistol squat': 'Pistol Squat', 'Tricep rope pushdown': 'Triceps',
  'Tricep dip': 'Triceps', 'Barbell curl': 'Biceps', 'Hammer curl': 'Biceps',
  'Tricep': 'Triceps',
  'Bodyweight dip': 'Weighted dip', 'Rope pushdown': 'Tricep rope pushdown',
  'Leg curl': 'Seated leg curl',
};

// different names for the same movement — collapsed before the duplicate check
export const CANON = (n: string): string => ALIAS[n] || n;

// the two hold rows are progression ladders now (steps from @trainwithkale), timed sets
export const HOLD1: PlanEx = { n: 'skill:HANDSTAND', k: 'hold', L: 'HANDSTAND', g: 'BALANCE' };
export const HOLD2: PlanEx = { n: 'skill:PLANCHE', k: 'hold', L: 'PLANCHE', g: 'BALANCE' };

// One shared pool per training type, unioned across every exercise of that
// type: highest emphasis wins when the same move appears under several.
export const POOL: Record<string, Record<string, number>> = (() => {
  const out: Record<string, Record<string, number>> = {};
  const add = (k: string, n: string, p: number) => {
    const c = CANON(n);
    if (!out[k]) out[k] = {};
    if (!out[k][c] || p > out[k][c]) out[k][c] = p;
  };
  Object.keys(LIB).forEach((n) => {
    const e = LIB[n];
    const k = e.g;
    add(k, n, e.p);
    e.a.forEach(([an, ap]) => add(k, an, ap));
  });
  Object.keys(EXTRA).forEach((pat) =>
    EXTRA[pat].forEach(([n, p]) => {
      const owner = Object.keys(PAT).filter((x) => PAT[x] === pat)[0];
      if (owner && LIB[owner]) add(LIB[owner].g, n, p);
    })
  );
  // Face pull's home category is shoulder (day 1's main lift group), but it still
  // bridges into back work — keep it available as an alternative there too.
  add('BACK', 'Face pull', 70);
  return out;
})();

export const PAT_LABEL: Record<string, string> = {
  vpull: 'VERTICAL PULL', hpull: 'ROW', reardelt: 'REAR DELT', pullover: 'PULLOVER',
  vpress: 'OVERHEAD PRESS', latraise: 'LATERAL RAISE', frontraise: 'FRONT RAISE',
  hpress: 'HORIZONTAL PRESS', fly: 'CHEST FLY', squat: 'SQUAT', hinge: 'HINGE',
  calf: 'CALF', tri: 'TRICEP', bi: 'BICEP',
};

// The user's own seven-day plan. A [name, 1] pair marks a slot the plan wants
// heavy; both holds close out every day.
type RawEx = string | [string, number];
const RAW_DAYS: { focus: string; exs: RawEx[] }[] = [
  { focus: 'SHOULDERS', exs: ['Pull up', 'Dumbbell lateral raise', 'Front raise', 'Reverse fly', ['Shoulder press', 1], ['Face pull', 1], 'Triceps', 'Cable crunch'] },
  { focus: 'BACK', exs: ['Pull up', ['Straight-arm pulldown', 1], 'Pulley', ['Wide lat pull', 1], '45 roman chair', 'Close lat pull', 'Biceps', 'Cable crunch'] },
  { focus: 'CHEST', exs: ['Pull up', 'Chest press', 'Dumbell Bench press', 'Incline bench press', ['Pec fly', 1], ['Chest dip', 1], 'Triceps', 'Cable crunch'] },
  { focus: 'LEGS', exs: ['Pull up', 'Calves raises', 'Front squat', 'Leg extension', 'Pistol Squat', 'Leg curl', 'Biceps', 'Cable crunch'] },
  { focus: 'FULL · SHOULDER LED', exs: ['Pull up', 'Face pull', ['Shoulder press', 1], 'Abductor', ['Straight-arm pulldown', 1], 'Pec fly', 'Triceps', 'Cable crunch'] },
  { focus: 'FULL · BACK LED', exs: ['Pull up', ['Barbell row', 1], 'Dumbbell lateral raise', ['45 roman chair', 1], 'Bench press', 'Pistol Squat', 'Biceps', 'Cable crunch'] },
  { focus: 'FULL · CHEST LED', exs: ['Pull up', 'Lat pull', 'Front squat', ['Chest dip', 1], ['Bench press', 1], 'Dumbbell lateral raise', 'Cable crunch', 'Triceps'] },
];

export const DAYS: PlanDay[] = RAW_DAYS.map((d) => ({
  focus: d.focus,
  exs: (d.exs.map((x) => {
    const n = (Array.isArray(x) ? x[0] : x) as string;
    const h = Array.isArray(x);
    return { n, h, g: LIB[n].g, kg: LIB[n].kg };
  }) as PlanEx[]).concat([HOLD2, HOLD1]),
}));
