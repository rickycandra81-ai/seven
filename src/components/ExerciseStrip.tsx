import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAYS } from '../data';
import { doneOf, id as exId, P } from '../logic';
import { COLORS, FONT } from '../theme';
import { AppState } from '../types';

// One chip per exercise, sticky under the header: tap to jump, with a gap where
// the day changes block (warm-up / lifts / skills).
export function ExerciseStrip({
  state,
  day,
  cur,
  onPick,
}: {
  state: AppState;
  day: number;
  cur: number;
  onPick: (i: number) => void;
}) {
  const exs = DAYS[day - 1].exs;
  const group = (j: number) => (j === 0 ? 0 : exs[j].k === 'hold' ? 2 : 1);

  return (
    <View style={styles.wrap}>
      {exs.map((_, i) => {
        const done = doneOf(state, day, i);
        const on = i === cur;
        const sets = P(state, exId(day, i)).sets || 0;
        const part = sets > 0 && !done;
        return (
          <Pressable
            key={i}
            onPress={() => onPick(i)}
            style={[
              styles.chip,
              i > 0 && group(i) !== group(i - 1) && { marginLeft: 6 },
              {
                backgroundColor: on ? COLORS.accent : done ? 'transparent' : COLORS.inner,
                borderColor: on ? COLORS.accent : part ? COLORS.accent : COLORS.borderSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.num,
                { color: on ? COLORS.accentInk : done ? COLORS.paperFainter : COLORS.paper },
              ]}
            >
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text
              style={[
                styles.mark,
                { color: on ? COLORS.accentInk : done ? 'rgba(242,244,247,0.4)' : COLORS.accent },
              ]}
            >
              {done ? '✓' : part ? '●' : ' '}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4 },
  chip: { flex: 1, minWidth: 0, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  num: { fontFamily: FONT.condensed700, fontSize: 14 },
  mark: { fontFamily: FONT.condensed800, fontSize: 8, lineHeight: 8 },
});
