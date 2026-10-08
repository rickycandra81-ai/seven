import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { breakdownFor, cnFor, cueFor } from '../content';
import { CANON, DAYS } from '../data';
import { DemoImage, prefetchDemos } from './DemoImage';
import {
  autoHeavy,
  busyOther,
  canLevelUp,
  doneOf,
  e1rmLine,
  eligibleHeavy,
  getLoad,
  id as exId,
  isHeavyBlocked,
  lastLine,
  loadKey,
  lv,
  midIdx,
  ranked,
  repsVal,
  setsFor,
  suggestion,
} from '../logic';
import { SK, SK_IMG } from '../skills';
import { restDone, restRemaining, useStore } from '../store';
import { COLORS, FONT, GROUP_HUE, fmtTime } from '../theme';
import { SETTINGS } from '../types';
import { RestPill } from './RestPill';
import { SetRow } from './SetRow';

// The whole screen is one exercise now: demo, name, cues, then either a set table
// (lifts) or a timed-hold block with its progression ladder (skills).
export function ExerciseCard({ day, idx }: { day: number; idx: number }) {
  const { state, actions } = useStore();
  const e = DAYS[day - 1].exs[idx];
  const id = exId(day, idx);
  const p = state.prog[id] || {};
  const hold = e.k === 'hold';
  const L = e.L as string | undefined;
  const skill = hold && L ? SK[L] : null;
  const lvI = skill && L ? lv(state, L) : 0;
  const step = skill ? skill.steps[lvI] : null;
  const target = step ? step[1] : 0;

  const sets = p.sets || 0;
  const need = setsFor(state, day, idx);
  const done = doneOf(state, day, idx);
  const total = DAYS[day - 1].exs.length;
  const shownName = step ? step[0] : p.sub || e.n;
  const fixed = e.n === 'Pull up' || hold;
  const rows = fixed ? [] : ranked(state, day, idx, e.n);
  const unit = state.unit || SETTINGS.weightUnit;
  const conv = (kg: number) => (unit === 'kg' ? kg : Math.round(kg * 2.20462 * 10) / 10);

  const lk = loadKey(shownName);
  const legacyKg = !p.sub && p.kg !== undefined ? p.kg : 0;
  const loadKg = getLoad(state, shownName, legacyKg);
  const loadDisp = conv(loadKg);
  const loadText = lk in state.loadText ? state.loadText[lk] : String(loadDisp);

  const canHeavy = eligibleHeavy(day, idx) && !autoHeavy(day);
  const heavy = need === 4;
  const heavyBlocked = isHeavyBlocked(state, day, idx);
  const hasAlts = !fixed && sets === 0;
  const altsOpen = state.altsOpen === id;
  const lockedOut = sets === 0 && busyOther(state, day, idx);
  const restActive = state.restId === id;
  const resting = restActive && !restDone(state);
  const restIsDone = restActive && restDone(state);
  const running = state.timerId === id;

  const breakdown = skill ? skill.bd : breakdownFor(shownName, e.g);
  const cn = cnFor(shownName);
  const canon = CANON(shownName);
  const reps = repsVal(state, id);
  const last = hold ? '' : lastLine(state, canon, unit);
  const e1 = hold ? '' : e1rmLine(state, canon, loadKg, reps, unit);
  const sug = hold ? { show: false, kg: 0 } : suggestion(state, canon, need, loadKg, sets);
  const showAdjust = !hold && sets > 0 && sets < need;

  // another exercise is mid-way and this one has not started — point back at it
  const mid = midIdx(state, day);
  const blockShow = mid >= 0 && mid !== idx && !done && sets === 0;

  // warm the demos either side so stepping between cards lands on a decoded image
  useEffect(() => {
    const exs = DAYS[day - 1].exs;
    const around = [idx - 1, idx + 1]
      .filter((j) => j >= 0 && j < exs.length && !exs[j].k)
      .map((j) => state.prog[exId(day, j)]?.sub || exs[j].n);
    prefetchDemos(around);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, idx]);

  const secs = p.secs || [];
  const best = step ? state.holdBest[step[0]] || 0 : 0;
  const levelUp = canLevelUp(state, day, idx);
  const nextStep = skill && lvI < skill.steps.length - 1 ? skill.steps[lvI + 1][0] : '';
  const isoDisabled = !running && (done || lockedOut || resting || !!state.timerId);

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.pos}>
          {`EXERCISE ${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
        </Text>
        {!hold && !!p.sub && (
          <View style={styles.swapTag}>
            <Text style={styles.swapTagText}>SWAPPED</Text>
          </View>
        )}
      </View>

      {hold && step ? (
        // a ladder step is a bundled illustration; key it so the step swap is instant
        <Image
          key={step[3]}
          recyclingKey={step[3]}
          source={SK_IMG(step[3])}
          style={styles.stepImg}
          contentFit="contain"
          transition={0}
          accessibilityLabel={shownName}
        />
      ) : (
        <DemoImage name={shownName} />
      )}

      <View style={{ gap: 7 }}>
        <Text style={styles.name}>{shownName}</Text>
        {!!cn && <Text style={styles.mandarin}>{`${cn[0]} · ${cn[1]}`}</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <Text style={[styles.groupChip, { color: GROUP_HUE[hold ? 'BALANCE' : e.g] || COLORS.paper }]}>
            {skill
              ? `SKILL · ${skill.label} · LEVEL ${lvI + 1}/${skill.steps.length}`
              : `${e.g} · ${breakdown[0][0].toUpperCase()} ${breakdown[0][1]}%`}
          </Text>
        </View>
        {!hold && (
          <Text style={styles.muscleLine}>
            {breakdown.map((m) => `${m[0].toUpperCase()} ${m[1]}%`).join('  ·  ')}
          </Text>
        )}
      </View>

      <Text style={styles.howto}>
        {step ? `${step[2]} Roll the wrists for a minute first.` : cueFor(shownName, e.g)}
      </Text>

      {levelUp && (
        <Pressable onPress={() => actions.setLevel(L as string, lvI + 1)} style={styles.levelUp}>
          <Text style={styles.levelUpText}>{`MOVE UP → ${nextStep.toUpperCase()}`}</Text>
        </Pressable>
      )}

      {!hold && (
        <View style={{ gap: 12 }}>
          {!!last && (
            <View style={styles.lastBox}>
              <Text style={styles.lastLine}>{last}</Text>
              {!!e1 && <Text style={styles.e1Line}>{e1}</Text>}
            </View>
          )}

          {sug.show && (
            <Pressable onPress={() => actions.applySuggest(shownName, sug.kg)} style={styles.suggest}>
              <Text style={styles.suggestText}>
                {`ALL SETS HIT ${SETTINGS.repTarget} REPS LAST TIME · TRY ${conv(sug.kg)} ${unit.toUpperCase()}`}
              </Text>
              <Text style={styles.suggestApply}>APPLY</Text>
            </Pressable>
          )}

          {blockShow && (
            <Pressable onPress={() => actions.goEx(mid)} style={styles.block}>
              <Text style={styles.blockText}>
                {`FINISH ${String(mid + 1).padStart(2, '0')} ${(
                  state.prog[exId(day, mid)]?.sub || DAYS[day - 1].exs[mid].n
                ).toUpperCase()} FIRST`}
              </Text>
              <Text style={styles.blockGo}>GO</Text>
            </Pressable>
          )}

          <View style={{ gap: 6 }}>
            <View style={styles.headRow}>
              <Text style={styles.headSet}>SET</Text>
              <View style={styles.headLoad}>
                <Text style={[styles.headLabel, { color: COLORS.load }]}>LOAD</Text>
                <Pressable onPress={actions.toggleUnit} style={styles.unitChip}>
                  <Text style={styles.unitChipText}>{unit.toUpperCase()}</Text>
                </Pressable>
              </View>
              <Text style={[styles.headLabel, { color: COLORS.accent, flex: 1, textAlign: 'center' }]}>REPS</Text>
              <View style={{ width: 42 }} />
            </View>

            {Array.from({ length: need }, (_, j) => {
              const logged = j < sets;
              const now = j === sets && !done;
              const kv = logged && (p.kgs || [])[j] != null ? (p.kgs as number[])[j] : loadKg;
              return (
                <SetRow
                  key={j}
                  n={j + 1}
                  stage={logged ? 'logged' : now ? 'now' : 'later'}
                  kg={conv(kv)}
                  reps={logged ? ((p.reps || [])[j] != null ? (p.reps as number[])[j] : 0) : reps}
                  loadText={loadText}
                  blocked={lockedOut || resting}
                  resting={resting}
                  onLoadText={(v) => actions.onLoadText(lk, v)}
                  onLoadBlur={() => actions.onLoadBlur(shownName, loadText)}
                  onLoadStep={(d) => actions.bumpLoad(shownName, d)}
                  onRepsStep={(d) => actions.setReps(id, reps + d)}
                  onTap={() => actions.tapSet(id, j)}
                  onForce={() => actions.forceSet(id, j)}
                  onPressStart={() => actions.pressStart(id, j)}
                  onPressCancel={actions.pressCancel}
                />
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.hint}>TAP ✓ TO LOG · HOLD A LOGGED ✓ TO UNDO</Text>
            {showAdjust && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={() => actions.bumpLoad(shownName, unit === 'kg' ? -5 : -5 / 2.20462)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustText}>−5</Text>
                </Pressable>
                <Pressable
                  onPress={() => actions.bumpLoad(shownName, unit === 'kg' ? 5 : 5 / 2.20462)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustText}>+5</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}

      {hold && skill && step && (
        <View style={{ gap: 12 }}>
          <Text style={styles.isoTarget}>
            {`TARGET ${need} × ${target}S${best ? `  ·  BEST ${best}S` : ''}`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: need }, (_, j) => {
              const v = secs[j];
              const hit = v != null && v >= target;
              return (
                <View
                  key={j}
                  style={[
                    styles.isoSet,
                    { backgroundColor: v == null ? COLORS.fillSoft : hit ? COLORS.paper : 'rgba(242,244,247,0.35)' },
                  ]}
                >
                  <Text style={[styles.isoSetText, { color: v == null ? COLORS.paperFaint : COLORS.ink }]}>
                    {v != null ? `${v}s` : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
          <Pressable
            disabled={isoDisabled}
            onPress={() => actions.tapIso(id)}
            style={[
              styles.isoBtn,
              {
                backgroundColor: running ? COLORS.accent : 'rgba(56,189,248,0.1)',
                borderColor: running ? COLORS.accent : 'rgba(56,189,248,0.5)',
                opacity: isoDisabled ? 0.35 : 1,
              },
            ]}
          >
            <Text style={[styles.isoBtnText, { color: running ? COLORS.accentInk : COLORS.accent }]}>
              {running ? `STOP · ${fmtTime(state.elapsed)}` : done ? 'DONE' : `START SET ${sets + 1}`}
            </Text>
          </Pressable>
        </View>
      )}

      {restActive && (
        <RestPill
          kind={state.restBetween ? 'NEXT UP' : 'REST'}
          expired={restIsDone}
          label={restIsDone ? 'GO' : fmtTime(restRemaining(state))}
        />
      )}

      {hold && skill && (
        <View style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>PROGRESSION · TAP A STEP TO SET YOUR LEVEL</Text>
          {skill.steps.map((s2, j) => {
            const on = j === lvI;
            const b2 = state.holdBest[s2[0]];
            const sub = on ? 'rgba(12,11,10,0.55)' : COLORS.paperFaint;
            return (
              <Pressable
                key={s2[0]}
                onPress={() => actions.setLevel(L as string, j)}
                style={[
                  styles.ladderRow,
                  { backgroundColor: on ? COLORS.paper : 'transparent', borderColor: on ? COLORS.paper : COLORS.borderSoft },
                ]}
              >
                <Text style={[styles.ladderNum, { color: sub }]}>{String(j + 1).padStart(2, '0')}</Text>
                <Text
                  style={[
                    styles.ladderName,
                    { color: on ? COLORS.ink : j < lvI ? 'rgba(242,244,247,0.4)' : COLORS.paper },
                  ]}
                >
                  {s2[0]}
                </Text>
                <Text style={[styles.ladderBest, { color: sub }]}>{b2 ? `BEST ${b2}S` : ''}</Text>
                <Text style={[styles.ladderTarget, { color: sub }]}>{`${s2[1]}S`}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {canHeavy && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.sectionLabel}>SETS</Text>
          <View style={{ flexDirection: 'row', gap: 3, flex: 1 }}>
            <Pressable
              onPress={() => actions.setHeavy(day, idx, false)}
              style={[styles.pill, styles.pillLeft, { backgroundColor: heavy ? COLORS.fillSoft : COLORS.paper }]}
            >
              <Text style={[styles.pillNum, { color: heavy ? COLORS.paper : COLORS.ink }]}>3</Text>
              <Text style={[styles.pillWord, { color: heavy ? COLORS.paper : COLORS.ink }]}>STANDARD</Text>
            </Pressable>
            <Pressable
              disabled={heavyBlocked}
              onPress={() => actions.setHeavy(day, idx, true)}
              style={[
                styles.pill,
                styles.pillRight,
                { backgroundColor: heavy ? COLORS.paper : COLORS.fillSoft, opacity: heavyBlocked ? 0.35 : 1 },
              ]}
            >
              <Text style={[styles.pillNum, { color: heavy ? COLORS.ink : COLORS.paper }]}>4</Text>
              <Text style={[styles.pillWord, { color: heavy ? COLORS.ink : COLORS.paper }]}>HEAVY SLOT</Text>
            </Pressable>
          </View>
        </View>
      )}

      {hasAlts && (
        <View style={{ gap: 4 }}>
          <Pressable onPress={() => actions.toggleAlts(id)} style={styles.altsToggle}>
            <Text style={styles.altsLabel}>
              {altsOpen ? 'CLOSE ALTERNATIVES' : `MACHINE TAKEN? ${rows.length} OPTIONS`}
            </Text>
            <Text style={styles.altsCaret}>{altsOpen ? '×' : '+'}</Text>
          </Pressable>
          {altsOpen && (
            <View style={{ gap: 4 }}>
              <Text style={styles.altsHint}>{`RANKED BY ${e.g} EMPHASIS · PICK THE HIGHEST FREE ONE`}</Text>
              {rows.map((r, j) => {
                const sel = r.n === shownName;
                return (
                  <Pressable
                    key={r.n}
                    onPress={() => actions.pick(id, e.n, r.n)}
                    style={[
                      styles.altRow,
                      {
                        backgroundColor: sel ? COLORS.paper : 'rgba(255,255,255,0.035)',
                        borderColor: sel ? COLORS.paper : COLORS.borderSoft,
                      },
                    ]}
                  >
                    <Text style={[styles.altRank, { color: sel ? COLORS.ink : 'rgba(242,244,247,0.35)' }]}>
                      P{j + 1}
                    </Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.altName, { color: sel ? COLORS.ink : COLORS.paper }]}>
                        {r.n}
                      </Text>
                      <View style={styles.altTrack}>
                        <View
                          style={[
                            styles.altFill,
                            {
                              width: `${r.p}%`,
                              backgroundColor: sel ? 'rgba(12,11,10,0.35)' : GROUP_HUE[e.g] || COLORS.paperDim,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.altPct, { color: sel ? COLORS.ink : GROUP_HUE[e.g] || COLORS.paperDim }]}>
                      {r.p}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 20,
    padding: 14,
    gap: 14,
  },
  pos: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  swapTag: { backgroundColor: COLORS.paperDim, borderRadius: 5, paddingVertical: 4, paddingHorizontal: 6 },
  swapTagText: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1.2, color: COLORS.accentInk },
  stepImg: { width: '100%', aspectRatio: 2, borderRadius: 14, backgroundColor: '#E8DFF5' },
  name: { fontFamily: FONT.condensed700, fontSize: 30, color: COLORS.paper },
  mandarin: { fontFamily: FONT.body400, fontSize: 13, color: COLORS.paperFaint },
  groupChip: {
    fontFamily: FONT.condensed700,
    fontSize: 11,
    letterSpacing: 1.1,
    backgroundColor: COLORS.fillMed,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
    overflow: 'hidden',
  },
  muscleLine: { fontFamily: FONT.condensed600, fontSize: 12, lineHeight: 17, letterSpacing: 0.7, color: COLORS.paperFaint },
  howto: { fontFamily: FONT.body400, fontSize: 14, lineHeight: 20, color: COLORS.paperDim },
  levelUp: { alignSelf: 'flex-start', backgroundColor: COLORS.accent, borderRadius: 100, paddingVertical: 9, paddingHorizontal: 12 },
  levelUpText: { fontFamily: FONT.condensed700, fontSize: 12, letterSpacing: 1.2, color: COLORS.accentInk },
  lastBox: { gap: 6, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: COLORS.inner },
  lastLine: { fontFamily: FONT.condensed700, fontSize: 12, lineHeight: 16, letterSpacing: 0.9, color: COLORS.paperDim },
  e1Line: { fontFamily: FONT.condensed700, fontSize: 12, lineHeight: 16, letterSpacing: 0.9, color: COLORS.paperFaint },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
  },
  suggestText: { flex: 1, fontFamily: FONT.condensed700, fontSize: 12, lineHeight: 16, letterSpacing: 0.7, color: COLORS.good },
  suggestApply: {
    fontFamily: FONT.condensed700,
    fontSize: 11,
    letterSpacing: 1.3,
    color: COLORS.goodInk,
    backgroundColor: COLORS.good,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 100,
    overflow: 'hidden',
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  blockText: { flex: 1, fontFamily: FONT.condensed700, fontSize: 12, lineHeight: 16, letterSpacing: 0.7, color: COLORS.warn },
  blockGo: {
    fontFamily: FONT.condensed700,
    fontSize: 11,
    letterSpacing: 1.3,
    color: COLORS.warnInk,
    backgroundColor: COLORS.warn,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 100,
    overflow: 'hidden',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headSet: { width: 30, fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  headLoad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  headLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8 },
  unitChip: { backgroundColor: COLORS.load, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 5 },
  unitChipText: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 0.9, color: COLORS.ink },
  hint: { flex: 1, minWidth: 140, fontFamily: FONT.condensed600, fontSize: 11, lineHeight: 15, letterSpacing: 0.9, color: COLORS.paperFaint },
  adjustBtn: { borderWidth: 1, borderColor: COLORS.loadLine, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 12 },
  adjustText: { fontFamily: FONT.condensed700, fontSize: 13, color: COLORS.load },
  isoTarget: { fontFamily: FONT.condensed700, fontSize: 12, lineHeight: 17, letterSpacing: 0.9, color: COLORS.paperDim },
  isoSet: { flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  isoSetText: { fontFamily: FONT.condensed700, fontSize: 16 },
  isoBtn: { height: 56, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  isoBtnText: { fontFamily: FONT.condensed700, fontSize: 17, letterSpacing: 2.4 },
  sectionLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1 },
  ladderNum: { width: 18, fontFamily: FONT.condensed700, fontSize: 12 },
  ladderName: { flex: 1, minWidth: 0, fontFamily: FONT.body500, fontSize: 14, lineHeight: 16 },
  ladderBest: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 0.9 },
  ladderTarget: { width: 30, textAlign: 'right', fontFamily: FONT.condensed700, fontSize: 13 },
  pill: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pillLeft: { borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  pillRight: { borderTopRightRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  pillNum: { fontFamily: FONT.condensed700, fontSize: 16 },
  pillWord: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1, opacity: 0.7 },
  altsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  altsLabel: { fontFamily: FONT.condensed700, fontSize: 12, letterSpacing: 1.2, color: COLORS.paperDim },
  altsCaret: { fontFamily: FONT.condensed700, fontSize: 16, color: COLORS.paperDim },
  altsHint: { fontFamily: FONT.condensed600, fontSize: 11, lineHeight: 15, letterSpacing: 1.1, color: COLORS.paperFaint, paddingTop: 2, paddingBottom: 6 },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1 },
  altRank: { width: 20, fontFamily: FONT.condensed700, fontSize: 12 },
  altName: { fontFamily: FONT.body500, fontSize: 14, lineHeight: 16 },
  altTrack: { height: 3, backgroundColor: COLORS.borderSoft, marginTop: 7, borderRadius: 100, overflow: 'hidden' },
  altFill: { height: '100%', borderRadius: 100 },
  altPct: { fontFamily: FONT.condensed700, fontSize: 15 },
});
