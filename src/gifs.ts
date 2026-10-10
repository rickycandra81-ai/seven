// Demo media. Known moves map to a hand-checked ExerciseDB id (or an
// 'fdb:' free-exercise-db photo pair); anything else is fuzzy-matched against the
// ExerciseDB name index bundled with the app, exactly as the design canvas does.

import { CANON } from './data';

const EDB_NAMES: [string, string][] = require('../assets/edb-names.json');

const GIF_ID: Record<string, string> = {"Face pull":"wqNPGCg","45 roman chair":"zhMwOwE","Chest-supported row":"7vG5o25","Seal row":"dmgMp3n","Landmine row":"aaXr7ld","Chest-supported machine row":"7I6LNUG","Lat pulldown":"qdRxqCj","Neutral-grip pulldown":"4c9BhzB","Single-arm pulldown":"U5INZY6","Machine pull-up":"kiJ4Z2K","Pulley":"fUBheHs","Wide lat pull":"qdRxqCj","Close lat pull":"xBYcQHj","Lat pull":"qdRxqCj","Machine pullover":"4U7iLb5","Reverse pec deck":"myfUsKf","Bent-over dumbbell fly":"EAs3xL9","Band pull-apart":"sTfvVsG","Leaning cable raise":"wEulIzp","Machine lateral raise":"dRTfGZT","Plate side raise":"hxyTtWj","Shoulder press":"kTbSH9h","Machine shoulder press":"vqsbmL0","Smith machine press":"903mzG8","Seated dumbbell press":"znQUdHY","Landmine press":"67n3r98","Bench press":"EIeI8Vf","Smith machine bench":"trqKQv2","High-to-low cable fly":"Pr9Rhf4","Low-to-high cable fly":"j7XMAyn","Cross-body cable fly":"UKWTJWR","Pec deck":"v3xmPAR","Pec fly":"v3xmPAR","Incline machine press":"o17Jfkt","Dip machine":"D5yqP2p","Bodyweight dip":"9WTm7dq","Push-up to failure":"I4hDWkc","Band push-up":"ufaxB52","Calves raises":"ykUOVze","Smith machine calf raise":"6MaEjVA","Leg press calf raise":"ykHcWme","Dumbbell single-leg calf raise":"1kB3Wmk","Hack squat single-leg calf raise":"AxFoqAD","Dumbell squat":"HsvHqgf","Back squat":"Gnfo4FM","Belt squat":"","Leg press":"2Qh2J1e","Single-leg RDL":"gKozT8X","Hip thrust":"qKBpF7I","Triceps":"dU605di","Tricep":"dU605di","Tricep rope pushdown":"dU605di","Biceps":"NbVPDMW","Dumbbell curl":"NbVPDMW","Cable curl":"G08RZcQ","Ab wheel":"NAgVB3t","Plank":"VBAWRPG","Handstand hold":"XooAdhl","Frogstand hold":"rQhGcin","Dragon flag":"./demos/dragon-flag.gif","Abductor":"CHpahtl","Adductor":"oHsrypV","Machine curl":"q6y3OhV","Dumbbell row":"BJ0Hz5L","Barbell row":"eZyBC3j","Pull up":"lBDjFxJ","Plate front raise":"e4aFmFY","Front raise":"3eGE2JC","Incline bench front raise":"nxW6BkN","Front squat":"zG0zs85","Step-up":"aXtJhlg","Close-grip bench press":"J6Dx1Mu","Cable hammer curl":"HPlPoQA","Rope hammer curl":"HPlPoQA","Band fly":"FVmZVhk","Pike push-up":"https://wger.de/media/exercise-images/454/447f3c17-405f-46e0-b138-65c2a8caaab0.png","Floor press":"vtusOWT","Dumbbell floor press":"7w6i0vE","Bulgarian split squat":"qx4fgX7","Pistol squat":"nqs5HGV","Pistol Squat":"nqs5HGV","Box pistol squat":"H6ybluc","Assisted pistol squat":"nqs5HGV","Weighted dip":"Ff18ItA","Cable reverse fly":"P5p0j8B","Walking lunge":"ecl28tP","Weighted push-up":"PSlvNMs","Standing cable row":"4f8RXP8","Straight-arm pulldown":"x69MAlq","Overhead cable extension":"1xHyxys","Overhead rope extension":"2IxROQ1","Cable crunch":"WW95auq","Abdominal":"WW95auq","Tricep dip":"X6C6i5Y","Barbell curl":"25GPyDY","Hammer curl":"slDvUAU","Deficit push-up":"vptOQ4N","Overhead press":"Kyd9Rz5","Cable fly":"xLYSdtg","Standing calf raise":"8ozhUIZ","T-bar row":"FVM1AUZ","Reverse fly":"8DiFDVA","Leg curl":"C5jncD2"};

// Moves that used to show a free-exercise-db photo pair now play an ExerciseDB
// GIF of the same motion (band pull-apart = "band reverse fly", plank = "weighted
// front plank", ...). Distinct moves get distinct GIFs even when ALIAS folds
// them together for load tracking (tricep dip vs pushdown, hammer vs DB curl). The photos stay as the fallback if the GIF will not load.
const PHOTO_FALLBACK: Record<string, string> = {
  'Band pull-apart': 'Band_Pull_Apart',
  'Band fly': 'Cross_Over_-_With_Bands',
  'Floor press': 'Floor_Press',
  'Dumbbell floor press': 'Dumbbell_Floor_Press',
  'Incline bench front raise': 'Front_Incline_Dumbbell_Raise',
  Plank: 'Plank',
};
const FDB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function photoFallback(name: string): { a: string; b: string } | null {
  const k = PHOTO_FALLBACK[name] ?? PHOTO_FALLBACK[CANON(name)];
  return k ? { a: FDB + k + '/0.jpg', b: FDB + k + '/1.jpg' } : null;
}

const GIF_NORM = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\bpull ?ups?\b/g, 'pull up')
    .replace(/s\b/g, '')
    .split(/\s+/)
    .filter(Boolean);

// the one demo that ships with the app instead of coming off a CDN
const DRAGON_FLAG = require('../assets/skill/dragon-flag.gif');

const memo: Record<string, string> = {};

export type Demo =
  | { kind: 'none' }
  | { kind: 'gif'; uri: string; source: string }
  | { kind: 'pair'; a: string; b: string }
  | { kind: 'bundled'; module: number };

// '' = this move has no demo. Everything else is a URL ready for <Image>.
// A url ending in '/' is a free-exercise-db pair: append 0.jpg / 1.jpg.
export function gifFor(name: string): string {
  if (name in memo) return memo[name];
  let id: string | undefined = GIF_ID[name] ?? GIF_ID[CANON(name)];
  if (id === undefined) {
    const a = GIF_NORM(name);
    let best = 0.5;
    id = '';
    for (const [xid, xn] of EDB_NAMES) {
      const b = GIF_NORM(xn);
      const hit = a.filter((t) => b.indexOf(t) !== -1).length;
      const sc = hit / a.length - (b.length - hit) * 0.04;
      if (sc > best) {
        best = sc;
        id = xid;
      }
    }
  }
  const url = !id
    ? ''
    : id.startsWith('http')
      ? id
      : id === './demos/dragon-flag.gif'
        ? 'bundled:dragonFlag'
        : id.startsWith('fdb:')
          ? 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/' + id.slice(4) + '/'
          : 'https://static.exercisedb.dev/media/' + id + '.gif';
  memo[name] = url;
  return url;
}

export function gifSourceLabel(url: string): string {
  if (url.includes('wger.de')) return 'WGER.DE';
  if (url.includes('githubusercontent')) return 'FREE-EXERCISE-DB';
  return 'EXERCISEDB.DEV';
}


// One call per card: what to actually render, so the screen never has to guess
// from a string shape. `key` changes whenever the media changes, which is what
// forces the native image view to drop the previous exercise's frame.
export function demoFor(name: string): Demo & { key: string } {
  const url = gifFor(name);
  if (!url) return { kind: 'none', key: 'none:' + name };
  if (url === 'bundled:dragonFlag') return { kind: 'bundled', module: DRAGON_FLAG, key: url };
  if (url.endsWith('/')) return { kind: 'pair', a: url + '0.jpg', b: url + '1.jpg', key: url };
  return { kind: 'gif', uri: url, source: gifSourceLabel(url), key: url };
}
