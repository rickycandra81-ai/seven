import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONT } from '../theme';

const LONG_PRESS_MS = 2000;

export interface SetRowProps {
  n: number;
  stage: 'logged' | 'now' | 'later';
  kg: number; // display units
  reps: number;
  loadText: string; // what the input shows while being typed
  blocked: boolean; // waiting on a rest, or another exercise is mid-way
  resting: boolean;
  onLoadText: (v: string) => void;
  onLoadBlur: () => void;
  onLoadStep: (dir: 1 | -1) => void;
  onRepsStep: (d: number) => void;
  onTap: () => void;
  onForce: () => void;
  onPressStart: () => void;
  onPressCancel: () => void;
}

// One row per set. The set being done now gets steppers; the ones already logged
// show the numbers they were done with; later sets just preview the plan.
export function SetRow(p: SetRowProps) {
  const logged = p.stage === 'logged';
  const now = p.stage === 'now';
  const later = p.stage === 'later';

  const [pressing, setPressing] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    longPressed.current = false;
    setPressing(true);
    p.onPressStart();
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: LONG_PRESS_MS, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      longPressed.current = true;
      setPressing(false);
      p.onForce();
    }, LONG_PRESS_MS);
  };
  const end = () => {
    clear();
    setPressing(false);
    fill.stopAnimation();
    p.onPressCancel();
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    p.onTap();
  };
  useEffect(() => clear, []);

  const numFg = logged ? COLORS.accentInk : now ? COLORS.accent : 'rgba(242,244,247,0.45)';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: now ? 'rgba(56,189,248,0.07)' : COLORS.inner,
          borderColor: now ? 'rgba(56,189,248,0.5)' : COLORS.fillSoft,
        },
      ]}
    >
      <View
        style={[
          styles.numBox,
          { backgroundColor: logged ? COLORS.accent : now ? 'rgba(56,189,248,0.18)' : COLORS.fillMed },
        ]}
      >
        <Text style={[styles.numText, { color: numFg }]}>{p.n}</Text>
      </View>

      {now ? (
        <>
          <View style={styles.stepper}>
            <Pressable onPress={() => p.onLoadStep(-1)} style={[styles.stepBtn, styles.stepLeft, { backgroundColor: COLORS.loadSoft }]}>
              <Text style={[styles.stepSym, { color: COLORS.load }]}>−</Text>
            </Pressable>
            <TextInput
              value={p.loadText}
              onChangeText={p.onLoadText}
              onBlur={p.onLoadBlur}
              keyboardType="decimal-pad"
              style={[styles.field, { color: COLORS.load }]}
            />
            <Pressable onPress={() => p.onLoadStep(1)} style={[styles.stepBtn, styles.stepRight, { backgroundColor: COLORS.loadSoft }]}>
              <Text style={[styles.stepSym, { color: COLORS.load }]}>+</Text>
            </Pressable>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={() => p.onRepsStep(-1)} style={[styles.stepBtn, styles.stepLeft, { backgroundColor: COLORS.accentSoft }]}>
              <Text style={[styles.stepSym, { color: COLORS.accent }]}>−</Text>
            </Pressable>
            <View style={styles.field}>
              <Text style={[styles.fieldText, { color: COLORS.accent }]}>{p.reps}</Text>
            </View>
            <Pressable onPress={() => p.onRepsStep(1)} style={[styles.stepBtn, styles.stepRight, { backgroundColor: COLORS.accentSoft }]}>
              <Text style={[styles.stepSym, { color: COLORS.accent }]}>+</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.value, { color: later ? COLORS.paperFainter : COLORS.load }]}>{p.kg}</Text>
          <Text style={[styles.value, { color: later ? COLORS.paperFainter : COLORS.accent }]}>{p.reps}</Text>
        </>
      )}

      <Pressable
        onPressIn={start}
        onPressOut={end}
        style={[
          styles.check,
          {
            backgroundColor: logged ? COLORS.accent : 'transparent',
            borderColor: logged
              ? COLORS.accent
              : now
                ? p.blocked
                  ? COLORS.accentFaint
                  : COLORS.accent
                : COLORS.hairlineStrong,
            opacity: now && p.blocked ? 0.5 : 1,
          },
        ]}
      >
        {pressing && (
          <Animated.View
            style={[styles.checkFill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        )}
        <Text style={[styles.checkText, { color: logged ? COLORS.accentInk : COLORS.accent }]}>
          {logged ? '✓' : now && p.resting ? '…' : ''}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  numBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: FONT.condensed700, fontSize: 14 },
  stepper: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepBtn: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  stepRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 },
  stepSym: { fontFamily: FONT.body500, fontSize: 18 },
  field: {
    flex: 1,
    minWidth: 0,
    height: 36,
    padding: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT.condensed700,
    fontSize: 18,
  },
  fieldText: { fontFamily: FONT.condensed700, fontSize: 18 },
  value: { flex: 1, minWidth: 0, textAlign: 'center', fontFamily: FONT.condensed700, fontSize: 18 },
  check: {
    position: 'relative',
    overflow: 'hidden',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.45)' },
  checkText: { fontFamily: FONT.condensed800, fontSize: 18 },
});
