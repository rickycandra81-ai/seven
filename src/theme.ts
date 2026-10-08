// The canvas writes its group hues in oklch, which React Native cannot parse —
// these are the same colours converted to sRGB hex.
export const GROUP_HUE: Record<string, string> = {
  SHOULDER: '#DCC39B',
  BACK: '#9FC3E4',
  CHEST: '#F2B5A7',
  LEGS: '#9CCFAE',
  BICEP: '#D3B4E4',
  TRICEP: '#E8B2D4',
  BALANCE: '#9BCBD1',
  CORE: '#EFB1C4',
};

export const COLORS = {
  // ground and type
  ink: '#0B0D10',
  paper: '#F2F4F7',
  paperDim: 'rgba(242,244,247,0.6)',
  paperFaint: 'rgba(242,244,247,0.42)',
  paperFainter: 'rgba(242,244,247,0.32)',
  // surfaces
  card: '#15181D',
  inner: '#1B1F25',
  bodyOff: '#262B33',
  bodyScenery: '#1F2329',
  hairline: 'rgba(255,255,255,0.06)',
  hairlineStrong: 'rgba(255,255,255,0.12)',
  borderSoft: 'rgba(255,255,255,0.08)',
  fillSoft: 'rgba(255,255,255,0.05)',
  fillMed: 'rgba(255,255,255,0.06)',
  // accent: reps, progress, the app's own blue
  accent: '#38BDF8',
  accentInk: '#04131C',
  accentSoft: 'rgba(56,189,248,0.14)',
  accentFaint: 'rgba(56,189,248,0.3)',
  accentMid: 'rgba(56,189,248,0.62)',
  // load gets its own warm hue (oklch(0.84 0.11 70) in the canvas)
  load: '#E6B775',
  loadSoft: 'rgba(230,183,117,0.14)',
  loadLine: 'rgba(230,183,117,0.35)',
  // states
  danger: '#ff6b6b',
  warn: '#FBBF24',
  warnInk: '#1C1404',
  good: '#86EFAC',
  goodInk: '#052E16',
  up: '#9FD39A',
  down: '#E39A8C',
};

// Barlow / Barlow Condensed are loaded at startup; these are the family names
// Expo registers them under.
export const FONT = {
  body400: 'Barlow_400Regular',
  body500: 'Barlow_500Medium',
  body600: 'Barlow_600SemiBold',
  condensed600: 'BarlowCondensed_600SemiBold',
  condensed700: 'BarlowCondensed_700Bold',
  condensed800: 'BarlowCondensed_800ExtraBold',
};

export const fmtTime = (x: number): string =>
  Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0');
