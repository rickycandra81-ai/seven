// The two hold rows are progression ladders now — steps, cues and target holds
// straight from the design canvas (illustrations by @trainwithkale, bundled).

export type Breakdown = [string, number][];

// step: [name, target seconds, cue, image id]
export type SkillStep = [string, number, string, string];

export interface Skill {
  label: string;
  bd: Breakdown;
  steps: SkillStep[];
}

export const SK: Record<string, Skill> = {
  PLANCHE: { label: 'PLANCHE', bd: [['Front Delts', 50], ['Core', 25], ['Wrists', 25]], steps: [
    ['Frog Stand', 20, 'Squat down, knees resting on the backs of the elbows, lean forward until the feet lift.', 'pl1'],
    ['Advanced Frog Stand', 15, 'Like the frog stand, but knees off the elbows and pulled to the chest, arms straight.', 'pl2'],
    ['Tuck Swings', 20, 'From a tuck support, swing the knees back and forth under you. Keep swinging for the full time.', 'pl3'],
    ['Tuck Planche', 10, 'Arms straight, shoulders past the fingers, knees tucked, hips level with the shoulders.', 'pl4'],
    ['Advanced Tuck Planche', 10, 'Tuck with a flat back, hips pushed back so the thighs open to about 90°.', 'pl5'],
    ['Tuck Planche Push Ups', 20, 'On parallettes in a tuck planche, bend and press the arms slowly. Keep going for the full time.', 'pl6'],
    ['One Leg Planche', 8, 'Advanced tuck with one leg extended straight behind. Switch legs each set.', 'pl7'],
    ['Straddle Planche', 6, 'Both legs straight and wide, body parallel to the floor.', 'pl8'],
    ['Full Planche', 5, 'Legs together, body one straight line parallel to the floor.', 'pl9'],
  ]},
  HANDSTAND: { label: 'HANDSTAND', bd: [['Front Delts', 45], ['Core', 30], ['Wrists', 25]], steps: [
    ['Wall Plank', 30, 'Hands on the floor, feet up on the wall at hip height, body straight, arms locked.', 'hs1'],
    ['Wall Handstand Hold', 30, 'Walk the feet up the wall, chest facing it, hands close to the wall, body straight.', 'hs2'],
    ['Wall Heel Taps', 30, 'Chest-to-wall handstand, take one heel off the wall at a time and tap it back.', 'hs3'],
    ['Wall Freestanding Hold', 20, 'From the wall, take both feet off and balance. Tap back to the wall when you tip.', 'hs4'],
    ['Freestanding Hold (with spot)', 20, 'Kick up in open space with a partner holding your legs, then let them ease off.', 'hs5'],
    ['Kick Up Practice', 30, 'Kick up from a lunge to a handstand and come back down. Repeat for the full time.', 'hs6'],
    ['Full Handstand', 15, 'Freestanding, body stacked in one line, balance with fingertip pressure.', 'hs7'],
  ]},
};

// the canvas resolves these through its bundler; here they ship as app assets
const IMG: Record<string, number> = {
  pl1: require('../assets/skill/pl1.png'),
  pl2: require('../assets/skill/pl2.png'),
  pl3: require('../assets/skill/pl3.png'),
  pl4: require('../assets/skill/pl4.png'),
  pl5: require('../assets/skill/pl5.png'),
  pl6: require('../assets/skill/pl6.png'),
  pl7: require('../assets/skill/pl7.png'),
  pl8: require('../assets/skill/pl8.png'),
  pl9: require('../assets/skill/pl9.png'),
  hs1: require('../assets/skill/hs1.png'),
  hs2: require('../assets/skill/hs2.png'),
  hs3: require('../assets/skill/hs3.png'),
  hs4: require('../assets/skill/hs4.png'),
  hs5: require('../assets/skill/hs5.png'),
  hs6: require('../assets/skill/hs6.png'),
  hs7: require('../assets/skill/hs7.png'),
};

export const SK_IMG = (id: string): number => IMG[id];
