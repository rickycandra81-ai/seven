import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DayPips } from '../components/DayPips';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseStrip } from '../components/ExerciseStrip';
import { DAYS } from '../data';
import { countDone, curIdx, fours, heavyCount, id as exId, pace } from '../logic';
import { useStore } from '../store';
import { COLORS, FONT } from '../theme';

const SWIPE_LOCK_PX = 8;
const SWIPE_LOCK_RATIO = 1.3;
const SWIPE_RELEASE_PX = 40;
const SWIPE_CLAMP = 120;
const SWIPE_FOLLOW = 0.6;

export function TodayScreen() {
  const { state, actions } = useStore();
  const day = state.day;
  const D = DAYS[day - 1];
  const total = D.exs.length;
  const doneCount = countDone(state, day);
  const cur = curIdx(state);
  const heavyIdxs = fours(state, day);
  const hasHeavy = heavyCount(day) > 0 && heavyIdxs.length > 0;
  const heavyNames = heavyIdxs
    .slice()
    .sort((a, b) => a - b)
    .map((i) => state.prog[exId(day, i)]?.sub || D.exs[i].n)
    .join('  ·  ');
  const finishReady = doneCount === total;

  // every row ticked: a pulsing FINISH floats mid-screen wherever you've
  // scrolled, so the day doesn't go unlogged
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!finishReady) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [finishReady, pulse]);
  const sess = pace(state, day);
  const paceColor = sess.state === 'over' ? COLORS.danger : sess.state === 'behind' ? COLORS.warn : COLORS.paperDim;

  const scrollRef = useRef<ScrollView>(null);
  const cardRef = useRef<View>(null);
  const contentRef = useRef<View>(null);

  // bring the card under the sticky strip whenever it changes
  const prevCur = useRef(cur);
  useEffect(() => {
    if (prevCur.current === cur) return;
    prevCur.current = cur;
    requestAnimationFrame(() => {
      const node = cardRef.current;
      const content = contentRef.current;
      if (!node || !content) return;
      // Fabric's measureLayout only accepts a ref to the ancestor host component
      // @ts-ignore measureLayout exists on native view instances
      node.measureLayout(
        content,
        (_x: number, y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 58), animated: true }),
        () => {}
      );
    });
  }, [cur]);

  // swipe left/right now steps between exercises, not days
  const swipeX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > SWIPE_LOCK_PX && Math.abs(g.dx) > Math.abs(g.dy) * SWIPE_LOCK_RATIO,
      onPanResponderGrant: () => setSwiping(true),
      onPanResponderMove: (_evt, g) => {
        swipeX.setValue(Math.max(-SWIPE_CLAMP, Math.min(SWIPE_CLAMP, g.dx)));
      },
      onPanResponderRelease: (_evt, g) => {
        setSwiping(false);
        if (Math.abs(g.dx) > SWIPE_RELEASE_PX) actions.goExRel(g.dx < 0 ? 1 : -1);
        Animated.timing(swipeX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        setSwiping(false);
        Animated.timing(swipeX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{ flex: 1, transform: [{ translateX: Animated.multiply(swipeX, SWIPE_FOLLOW) }] }}
      {...panResponder.panHandlers}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18 }}
        scrollEnabled={!swiping}
        stickyHeaderIndices={[4]}
      >
        <View ref={contentRef} />

        <View style={{ marginTop: 14 }}>
          <DayPips state={state} currentDay={day} onPick={actions.goToDay} />
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayNum}>Day {day}</Text>
            <Text style={styles.focus}>{D.focus}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.doneCount}>
              {doneCount}
              <Text style={styles.doneTotal}>/{total}</Text>
            </Text>
            <Text style={styles.doneLabel}>DONE</Text>
          </View>
        </View>

        <View style={{ gap: 8, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: total }, (_, j) => (
              <View
                key={j}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 100,
                  backgroundColor: j < doneCount ? COLORS.accent : COLORS.borderSoft,
                }}
              />
            ))}
          </View>
          {sess.show && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text style={styles.sessLabel}>SESSION {sess.label}</Text>
              <Text style={[styles.sessPace, { color: paceColor }]}>{sess.text}</Text>
            </View>
          )}
          {hasHeavy && (
            <View style={styles.heavyBanner}>
              <Text style={styles.heavyChip}>4 SETS</Text>
              <Text style={styles.heavyNames} numberOfLines={1}>
                {heavyNames}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.strip}>
          <ExerciseStrip state={state} day={day} cur={cur} onPick={actions.goEx} />
        </View>

        <View ref={cardRef} style={{ marginTop: 14 }}>
          <ExerciseCard day={day} idx={cur} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {cur > 0 && (
            <Pressable onPress={() => actions.goExRel(-1)} style={styles.prevBtn}>
              <Text style={styles.prevText}>←</Text>
            </Pressable>
          )}
          {cur < total - 1 && (
            <Pressable onPress={() => actions.goExRel(1)} style={styles.nextBtn}>
              <View style={{ minWidth: 0, gap: 4 }}>
                <Text style={styles.nextLabel}>NEXT</Text>
                <Text style={styles.nextName} numberOfLines={1}>
                  {state.prog[exId(day, cur + 1)]?.sub || D.exs[cur + 1].n}
                </Text>
              </View>
              <Text style={styles.nextArrow}>→</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={actions.finish}
          style={[
            styles.finishBtn,
            {
              backgroundColor: finishReady ? COLORS.accent : COLORS.card,
              borderColor: finishReady ? COLORS.accent : COLORS.hairline,
            },
          ]}
        >
          <Text style={[styles.finishLabel, { color: finishReady ? COLORS.accentInk : 'rgba(242,244,247,0.45)' }]}>
            {finishReady ? `FINISH DAY ${day}` : `${total - doneCount} LEFT TO GO`}
          </Text>
        </Pressable>
      </ScrollView>

      {finishReady && (
        <View pointerEvents="box-none" style={styles.floatWrap}>
          <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }}>
            {/* the blink is a halo behind a solid button: fading the button itself
                lets Android's elevation shadow show through as a box */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatHalo,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.6] }),
                  transform: [{ scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }, { scaleY: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
                },
              ]}
            />
            <Pressable onPress={actions.finish} style={styles.floatBtn} accessibilityRole="button">
              <Text style={styles.floatLabel}>{`FINISH DAY ${day}`}</Text>
              <Text style={styles.floatSub}>TAP TO LOG THE SESSION</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20 },
  dayNum: { fontFamily: FONT.condensed800, fontSize: 44, lineHeight: 40, color: COLORS.paper },
  focus: { fontFamily: FONT.condensed700, fontSize: 13, letterSpacing: 2.1, color: COLORS.paperDim, marginTop: 8 },
  doneCount: { fontFamily: FONT.condensed800, fontSize: 30, color: COLORS.paper },
  doneTotal: { color: 'rgba(242,244,247,0.3)' },
  doneLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint, marginTop: 4 },
  sessLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.3, color: COLORS.paperFaint },
  sessPace: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.3 },
  heavyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  heavyChip: {
    fontFamily: FONT.condensed700,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.accentInk,
    backgroundColor: COLORS.accent,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 5,
    overflow: 'hidden',
  },
  heavyNames: { flex: 1, minWidth: 0, fontFamily: FONT.body500, fontSize: 13, color: COLORS.paperDim },
  strip: {
    marginTop: 14,
    marginHorizontal: -18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.fillSoft,
  },
  prevBtn: {
    width: 56,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: { fontFamily: FONT.body500, fontSize: 20, color: COLORS.paperDim },
  nextBtn: {
    flex: 1,
    minWidth: 0,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nextLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  nextName: { fontFamily: FONT.body600, fontSize: 15, color: COLORS.paper },
  nextArrow: { fontFamily: FONT.body500, fontSize: 20, color: COLORS.accent },
  finishBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 24,
  },
  finishLabel: { fontFamily: FONT.condensed700, fontSize: 15, letterSpacing: 2.4 },
  floatWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  floatHalo: { ...StyleSheet.absoluteFillObject, borderRadius: 18, backgroundColor: COLORS.accent },
  floatBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 18,
    paddingHorizontal: 34,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  floatLabel: { fontFamily: FONT.condensed800, fontSize: 22, letterSpacing: 2.6, color: COLORS.accentInk },
  floatSub: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1.6, color: COLORS.accentInk, opacity: 0.7 },
});
